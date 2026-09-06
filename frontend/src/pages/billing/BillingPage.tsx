import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  Download,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Receipt,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '../../store/authStore';
import { useCreditStore, formatTimeRemaining } from '../../store/creditStore';
import { billingService } from '../../services/extraServices';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PaymentCheckoutModal, PlanCheckoutDetails } from '../../components/billing/PaymentCheckoutModal';
import { toast } from 'sonner';

export const BillingPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const {
    availableCredits,
    totalCredits,
    dailyAllocation,
    refillSecondsRemaining,
    fetchCredits,
  } = useCreditStore();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutPlan, setCheckoutPlan] = useState<PlanCheckoutDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  React.useEffect(() => {
    fetchCredits();
  }, []);

  const [invoices, setInvoices] = useState([
    { id: 'INV-2026-00142', date: 'Aug 01, 2026', plan: 'PRO Monthly Plan', amount: '₹799.00', status: 'PAID' },
    { id: 'INV-2026-00089', date: 'Jul 01, 2026', plan: 'PRO Monthly Plan', amount: '₹799.00', status: 'PAID' },
  ]);

  const plans = [
    {
      id: 'free',
      name: 'FREE',
      price: 0,
      credits: 50,
      storage: 'Local Storage',
      features: ['50 Daily AI Credits', 'Automatic 24-Hour Credit Refill', '5 Daily File Conversions', 'Standard PDF Tools'],
    },
    {
      id: 'pro',
      name: 'PRO',
      price: billingCycle === 'monthly' ? 799 : 649,
      credits: 500,
      storage: 'Unlimited Storage',
      isPopular: true,
      features: [
        '500 AI Credits / Month',
        '250 Daily AI Credits',
        'Unlimited File Conversions',
        'Advanced Gemini Multi-Artifact AI',
        'OCR Multi-Language Extraction',
      ],
    },
    {
      id: 'business',
      name: 'ENTERPRISE',
      price: billingCycle === 'monthly' ? 2499 : 1999,
      credits: 2500,
      storage: 'Unlimited Cloud Sync',
      features: [
        '2,500 AI Credits / Month',
        '1,000 Daily AI Credits',
        'Zero-Loss 88+ Page Document Processing',
        'Priority AI Generation Queue',
        'Team Collaboration & Admin Panel',
      ],
    },
  ];

  const handleOpenCheckout = (plan: (typeof plans)[0]) => {
    setCheckoutPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      credits: plan.credits,
      storage: plan.storage,
      features: plan.features,
      billingCycle,
    });
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (upgradedPlanId: string) => {
    const upgradedPlan = plans.find((p) => p.id === upgradedPlanId) || plans[1];
    const newInvoice = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      plan: `${upgradedPlan.name} ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Plan`,
      amount: `₹${upgradedPlan.price.toLocaleString()}.00`,
      status: 'PAID',
    };
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Badge variant="brand" size="sm" className="mb-1">
          Membership & Credits
        </Badge>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Billing & AI Credits</h1>
        <p className="text-xs text-slate-400">Manage your subscription, credit allocations, and daily refills</p>
      </div>

      {/* Credit Overview Meter Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/70 via-indigo-900/70 to-brand-900/70 border border-purple-500/40 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left flex-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Active AI Magic Credit Allocation
            </span>
          </div>
          <div className="text-3xl font-black">
            {availableCredits}{' '}
            <span className="text-sm font-normal text-purple-200">/ {totalCredits} Credits Available</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-purple-200">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10 font-mono">
              🔄 Next 24h Refill: <strong>{formatTimeRemaining(refillSecondsRemaining)}</strong>
            </span>
            <span className="text-purple-300">
              (+{dailyAllocation} credits replenish automatically every 24 hours)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
          <Button
            variant="gradient"
            size="md"
            onClick={() => handleOpenCheckout(plans[1])}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>

      {/* Billing Cycle Switch */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          Monthly Billing
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className="w-12 h-6 rounded-full bg-brand-600 p-1 flex items-center transition-colors"
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          Yearly Billing <span className="text-emerald-500 font-bold">(Save 20%)</span>
        </span>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = (user?.planId || 'pro').toLowerCase() === p.id;
          return (
            <div
              key={p.id}
              className={`relative p-6 rounded-3xl bg-white dark:bg-slate-900 border flex flex-col justify-between transition-all ${
                p.isPopular
                  ? 'border-brand-500 shadow-glow'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {p.isPopular && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h3>
                <div className="text-2xl font-black my-3 text-slate-900 dark:text-white">
                  ₹{p.price.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <div className="text-xs text-brand-600 dark:text-brand-400 font-semibold mb-4">
                  {p.credits} AI Credits • Full Office & PDF Suite
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" size="sm" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant={p.isPopular ? 'gradient' : 'primary'}
                    size="sm"
                    className="w-full shadow-xs"
                    onClick={() => handleOpenCheckout(p)}
                  >
                    Select {p.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Credit Consumption Matrix Guide */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Transparent Credit Usage Matrix (Real-Time Dynamic Deductions)
            </span>
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            Auto-Refills +{dailyAllocation} credits every 24h
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Quick Tasks</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold font-mono">1–2⚡</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Short questions, grammar fixes, quick rewrites, and 1-paragraph translations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Standard Docs</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold font-mono">3–8⚡</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard 2-3 page document drafting, summaries, and medium prompt expansions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">In-Depth Multi-Page</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold font-mono">15–25⚡</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Long prompt synthesis, comprehensive reports, multi-page business proposals.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-purple-500/30 dark:border-purple-500/30 bg-purple-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Full Enterprise Docs</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-extrabold font-mono">35–50⚡</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Exhaustive 2000+ character prompts, multi-chapter research, & 15+ slide deck architectures.
            </p>
          </div>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Payment & Invoice History
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{inv.id}</div>
                <div className="text-[11px] text-slate-400">{inv.plan} • {inv.date}</div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold font-mono text-slate-900 dark:text-white">{inv.amount}</span>
                <Badge variant="success" size="sm">{inv.status}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => toast.success(`Downloading invoice ${inv.id}...`)}
                >
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secure Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        plan={checkoutPlan}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
