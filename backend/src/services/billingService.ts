import mongoose from 'mongoose';
import { Plan, IPlan } from '../models/Plan';
import { Subscription, SubscriptionStatus } from '../models/Subscription';
import { Payment } from '../models/Payment';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';
import { razorpayProvider } from '../integrations/payment/RazorpayProvider';
import { AppError } from '../middleware/errorHandler';
import { emailService } from '../integrations/email/EmailService';

export class BillingService {
  async getPlans(): Promise<IPlan[]> {
    return Plan.find({ isActive: true }).sort({ priceMonthly: 1 });
  }

  async createOrder(userId: string, planSlug: string, cycle: 'monthly' | 'yearly') {
    const plan = await Plan.findOne({ slug: planSlug });
    if (!plan) throw new AppError('Selected plan does not exist', 404);

    const amount = cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const order = await razorpayProvider.createOrder(amount, 'INR', `plan_${planSlug}_${userId}`);

    await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      provider: 'razorpay',
      providerOrderId: order.orderId,
      amount,
      currency: 'INR',
      status: 'PENDING',
      planId: planSlug,
    });

    return {
      orderId: order.orderId,
      amount,
      currency: 'INR',
      planName: plan.name,
      cycle,
    };
  }

  async verifyPayment(userId: string, data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planId: string;
  }) {
    const isSignatureValid = razorpayProvider.verifySignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature
    );

    if (!isSignatureValid) {
      throw new AppError('Payment signature verification failed', 400, 'PAYMENT_VERIFICATION_FAILED');
    }

    const fallbackPlans: Record<string, any> = {
      pro: {
        name: 'PRO',
        slug: 'pro',
        priceMonthly: 799,
        priceYearly: 7990,
        storageLimit: 50 * 1024 * 1024 * 1024,
        aiCreditsMonthly: 500,
        conversionLimitDaily: 100,
      },
      business: {
        name: 'BUSINESS',
        slug: 'business',
        priceMonthly: 1999,
        priceYearly: 19990,
        storageLimit: 250 * 1024 * 1024 * 1024,
        aiCreditsMonthly: 2500,
        conversionLimitDaily: 500,
      },
    };

    let plan = await Plan.findOne({ slug: data.planId });
    if (!plan) {
      const planData = fallbackPlans[data.planId.toLowerCase()] || fallbackPlans.pro;
      try {
        plan = await Plan.create({
          ...planData,
          isActive: true,
          isPopular: data.planId.toLowerCase() === 'pro',
        });
      } catch {
        plan = planData as any;
      }
    }

    const activePlan: any = plan || fallbackPlans[data.planId.toLowerCase()] || fallbackPlans.pro;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update payment record if exists
    try {
      await Payment.findOneAndUpdate(
        { providerOrderId: data.razorpay_order_id },
        {
          providerPaymentId: data.razorpay_payment_id,
          providerSignature: data.razorpay_signature,
          status: 'SUCCESS',
        }
      );
    } catch {}

    // Update or create subscription
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    try {
      await Subscription.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          planId: data.planId,
          provider: 'razorpay',
          providerSubscriptionId: data.razorpay_payment_id,
          status: SubscriptionStatus.ACTIVE,
          amount: activePlan.priceMonthly,
          currency: 'INR',
          startDate: new Date(),
          endDate: nextMonth,
        },
        { upsert: true, new: true }
      );
    } catch {}

    // Upgrade user limits & credits
    user.planId = data.planId.toLowerCase();
    user.storageLimit = activePlan.storageLimit;
    user.aiCredits = activePlan.aiCreditsMonthly;
    user.aiCreditsUsed = 0; // reset
    await user.save();

    // Create formal invoice
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    let invoice: any = {
      invoiceNumber: invoiceNum,
      userId: user._id,
      planName: `${activePlan.name} Monthly Plan`,
      amount: activePlan.priceMonthly,
      tax: Math.round(activePlan.priceMonthly * 0.18),
      total: Math.round(activePlan.priceMonthly * 1.18),
      currency: 'INR',
      status: 'PAID',
      createdAt: new Date(),
    };

    try {
      invoice = await Invoice.create({
        ...invoice,
        billingDetails: {
          name: user.name,
          email: user.email,
        },
        downloadUrl: `/storage/invoices/${invoiceNum}.pdf`,
      });
    } catch {}

    // Dispatch real email receipt to user's Gmail
    try {
      await emailService.sendSubscriptionReceiptEmail(
        user.email,
        user.name,
        activePlan.name,
        activePlan.priceMonthly,
        invoiceNum,
        data.razorpay_payment_id || `TXN-${Date.now()}`
      );
    } catch {}

    return {
      success: true,
      message: `Payment successful! Upgraded to ${activePlan.name} plan.`,
      plan: activePlan.name,
      user,
      invoice,
    };
  }

  async getInvoices(userId: string) {
    return Invoice.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }
}

export const billingService = new BillingService();
