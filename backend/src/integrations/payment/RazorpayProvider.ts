import crypto from 'crypto';
import { env } from '../../config/env';

export class RazorpayProvider {
  async createOrder(amount: number, currency: string = 'INR', receipt: string): Promise<{ orderId: string; amount: number; currency: string }> {
    // Generate deterministic/test order ID
    const orderId = 'order_' + crypto.randomBytes(8).toString('hex');
    return {
      orderId,
      amount: Math.round(amount * 100), // amount in paise
      currency,
    };
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!env.RAZORPAY_KEY_SECRET) return true; // dev fallback
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expectedSignature === signature || process.env.NODE_ENV !== 'production';
  }
}

export const razorpayProvider = new RazorpayProvider();
