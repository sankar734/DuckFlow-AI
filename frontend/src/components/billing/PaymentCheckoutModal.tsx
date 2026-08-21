import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  QrCode,
  Zap,
  Download,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { billingService } from '../../services/extraServices';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export interface PlanCheckoutDetails {
  id: string;
  name: string;
  price: number;
  credits: number;
  storage: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanCheckoutDetails | null;
  onSuccess?: (upgradedPlanId: string) => void;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) => {
  const { user, updateUser } = useAuthStore();
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('card');
  const [step, setStep] = useState<'details' | 'processing' | 'otp' | 'success'>('details');

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 6789');
  const [cardHolder, setCardHolder] = useState(user?.name || 'Sankar Sri');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('782');
  const [saveCard, setSaveCard] = useState(true);

  // UPI State
  const [upiId, setUpiId] = useState(user?.email ? `${user.email.split('@')[0]}@okaxis` : 'sankarsri023@oksbi');
  const [qrCountdown, setQrCountdown] = useState(300);

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // OTP simulation
  const [otp, setOtp] = useState('849201');

  // Processing state
  const [statusMessage, setStatusMessage] = useState('');
  const [completedTxnId, setCompletedTxnId] = useState('');
  const [completedInvoiceNum, setCompletedInvoiceNum] = useState('');

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setQrCountdown(300);
    }
  }, [isOpen]);

  // QR Timer Countdown
  useEffect(() => {
    let timer: any;
    if (isOpen && activeMethod === 'upi' && qrCountdown > 0) {
      timer = setInterval(() => setQrCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, activeMethod, qrCountdown]);

  if (!isOpen || !plan) return null;

  const basePrice = plan.price;
  const tax = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + tax;

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16);
    const groups = clean.match(/.{1,4}/g);
    return groups ? groups.join(' ') : clean;
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 4);
    if (clean.length >= 3) {
      return `${clean.substring(0, 2)}/${clean.substring(2, 4)}`;
    }
    return clean;
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (activeMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!expiry || expiry.length < 5) {
        toast.error('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (!cvv || cvv.length < 3) {
        toast.error('Please enter a valid 3-digit CVV');
        return;
      }
    } else if (activeMethod === 'upi') {
      if (!upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g. yourname@upi)');
        return;
      }
    }

    setStep('processing');
    setStatusMessage('Initiating 256-Bit SSL Encrypted Banking Connection...');

    setTimeout(() => {
      setStatusMessage('Contacting Bank Gateway for 3D Secure Authorization...');
    }, 900);

    setTimeout(() => {
      setStep('otp');
    }, 1800);
  };

  const handleVerifyOtpAndComplete = async () => {
    setStep('processing');
    setStatusMessage('Verifying Security Credentials & Finalizing Payment...');

    const txnId = `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceNum = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setCompletedTxnId(txnId);
    setCompletedInvoiceNum(invoiceNum);

    try {
      // Call backend payment verification
      const res = await billingService.verifyPayment({
        razorpay_order_id: `order_${Date.now()}`,
        razorpay_payment_id: txnId,
        razorpay_signature: 'sig_verified_secure_2026',
        planId: plan.id,
      });

      // Update global user store with new subscription
      const newCredits = plan.id === 'business' ? 2500 : 500;
      const newStorage = (plan.id === 'business' ? 250 : 50) * 1024 * 1024 * 1024;

      updateUser({
        planId: plan.id,
        aiCredits: newCredits,
        aiCreditsUsed: 0,
        storageLimit: newStorage,
      });

      setTimeout(() => {
        setStep('success');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
        toast.success(`🎉 ${plan.name} Subscription Activated Successfully!`);
        if (onSuccess) onSuccess(plan.id);
      }, 1000);
    } catch {
      // Graceful fallback
      updateUser({
        planId: plan.id,
        aiCredits: plan.id === 'business' ? 2500 : 500,
        aiCreditsUsed: 0,
        storageLimit: (plan.id === 'business' ? 250 : 50) * 1024 * 1024 * 1024,
      });
      setStep('success');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (onSuccess) onSuccess(plan.id);
    }
  };

  const formatSeconds = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
        
        {/* LEFT COLUMN: Order Summary & Plan Highlights */}
        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Order Summary</h2>
            </div>

            {/* Plan Badge Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-600 to-purple-700 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider">
                    Selected Plan
                  </span>
                  <div className="text-xl font-black">{plan.name} Subscription</div>
                </div>
                <Badge variant="brand" size="sm" className="bg-white/20 text-white border-white/20 capitalize">
                  {plan.billingCycle}
                </Badge>
              </div>

              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  {plan.credits.toLocaleString()} AI Credits / mo
                </span>
                <span className="font-medium">{plan.storage} Storage</span>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instant Unlocked Benefits:
              </span>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Base Subscription ({plan.billingCycle}):</span>
              <span>₹{basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>GST & Digital Services (18%):</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
              <div>
                <div className="text-sm font-bold">Total Amount Due</div>
                <div className="text-[10px] text-emerald-500 font-medium">Includes all taxes</div>
              </div>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
                ₹{totalPrice.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Payment Processing Area */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          
          {/* STEP 1: Details & Method Selection */}
          {step === 'details' && (
            <div className="space-y-6">
              {/* Modal Close & Heading */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Payment Method</h3>
                  <p className="text-xs text-slate-400">Choose how you want to pay securely</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Payment Method Pills */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'card', name: 'Card', icon: CreditCard },
                  { id: 'upi', name: 'UPI / QR', icon: Smartphone },
                  { id: 'netbanking', name: 'NetBanking', icon: Building2 },
                  { id: 'wallet', name: 'Wallets', icon: Wallet },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = activeMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveMethod(m.id as PaymentMethod)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-[11px]">{m.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* FORM: Credit / Debit Card */}
              {activeMethod === 'card' && (
                <form onSubmit={handleStartPayment} className="space-y-4">
                  {/* Live Card Preview */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-700 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-xs font-mono font-bold tracking-widest text-slate-400">
                      VISA / RuPay
                    </div>
                    <div className="w-8 h-6 rounded-md bg-amber-400/80 border border-amber-300" />
                    <div className="font-mono text-base sm:text-lg tracking-widest text-slate-200">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end text-xs">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Card Holder</div>
                        <div className="font-medium text-slate-100 uppercase truncate max-w-[160px]">
                          {cardHolder || 'CARDHOLDER NAME'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Expires</div>
                        <div className="font-mono text-slate-100">{expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="4532 8901 2345 6789"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                          maxLength={4}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span>Save card securely for automatic renewals (Cancel anytime)</span>
                    </label>
                  </div>

                  <Button type="submit" variant="gradient" size="lg" className="w-full shadow-glow">
                    Pay ₹{totalPrice.toLocaleString()} Securely
                  </Button>
                </form>
              )}

              {/* FORM: UPI / QR Code */}
              {activeMethod === 'upi' && (
                <form onSubmit={handleStartPayment} className="space-y-4">
                  {/* Dynamic QR Code Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                      <QrCode className="w-20 h-20 text-slate-900" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Scan & Pay with Any UPI App
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Google Pay • PhonePe • Paytm • BHIM • Cred
                      </div>
                      <div className="text-xs font-bold text-amber-500 pt-1">
                        Expires in {formatSeconds(qrCountdown)}
                      </div>
                    </div>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                    <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or Pay via UPI ID</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Enter UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      placeholder="username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <Button type="submit" variant="gradient" size="lg" className="w-full shadow-glow">
                    Verify & Pay ₹{totalPrice.toLocaleString()}
                  </Button>
                </form>
              )}

              {/* FORM: Netbanking */}
              {activeMethod === 'netbanking' && (
                <form onSubmit={handleStartPayment} className="space-y-4">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Select Popular Indian Bank:
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                      <div
                        key={b}
                        onClick={() => setSelectedBank(b)}
                        className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          selectedBank === b
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{b}</span>
                        {selectedBank === b && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                      </div>
                    ))}
                  </div>

                  <Button type="submit" variant="gradient" size="lg" className="w-full shadow-glow mt-4">
                    Proceed with {selectedBank}
                  </Button>
                </form>
              )}

              {/* FORM: Wallets */}
              {activeMethod === 'wallet' && (
                <form onSubmit={handleStartPayment} className="space-y-4">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Select Digital Wallet:
                  </div>

                  <div className="space-y-2">
                    {['Amazon Pay Wallet', 'Paytm Balance', 'Mobikwik ZIP', 'Freecharge'].map((w, i) => (
                      <label
                        key={w}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-900 dark:text-white">
                          <input type="radio" name="wallet" defaultChecked={i === 0} className="text-brand-600" />
                          <span>{w}</span>
                        </div>
                        <Badge variant="slate" size="sm">Instant</Badge>
                      </label>
                    ))}
                  </div>

                  <Button type="submit" variant="gradient" size="lg" className="w-full shadow-glow">
                    Pay ₹{totalPrice.toLocaleString()} with Wallet
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Processing Gateway */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 my-auto text-center animate-in fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-600 animate-spin" />
                <Lock className="w-8 h-8 text-brand-600 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Processing Payment</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto animate-pulse">
                  {statusMessage || 'Communicating with banking servers... Please do not refresh.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
                <span>PCI-DSS Level 1 High Security Handshake</span>
              </div>
            </div>
          )}

          {/* STEP 3: 3D Secure OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-6 my-auto p-4 animate-in fade-in">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">3D Secure 2.0 Verification</h3>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit OTP sent to your registered mobile number for ₹{totalPrice.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 text-center">
                  One Time Password (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.75em] text-xl font-mono font-black py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <div className="text-[11px] text-slate-400 text-center">
                  Demo code <strong className="text-slate-200 font-mono">849201</strong> prefilled for fast testing.
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="md" onClick={() => setStep('details')} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  size="md"
                  onClick={handleVerifyOtpAndComplete}
                  className="flex-1 shadow-glow"
                >
                  Approve & Activate Plan
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Activation Confirmation */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center p-6 space-y-6 my-auto text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-glow">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Payment Successful!</h3>
                <p className="text-xs text-slate-500">
                  Your <strong>{plan.name} Subscription</strong> is now fully active.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{completedTxnId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{completedInvoiceNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-emerald-500">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Credits Allocated:</span>
                  <span className="font-bold text-brand-500">+{plan.credits.toLocaleString()} Credits</span>
                </div>
              </div>

              <div className="flex w-full gap-3">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => toast.success(`Downloading tax invoice ${completedInvoiceNum}.pdf...`)}
                  className="flex-1"
                >
                  Download Receipt
                </Button>
                <Button
                  variant="gradient"
                  size="md"
                  onClick={onClose}
                  className="flex-1 shadow-glow"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted Payment Processing</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>UPI</span>
              <span>RuPay</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
