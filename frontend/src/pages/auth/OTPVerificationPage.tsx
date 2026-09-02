import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { toast } from 'sonner';

export const OTPVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const initialEmail =
    searchParams.get('email') ||
    (location.state as any)?.email ||
    '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    const fullOtp = otp.join('').trim();
    if (fullOtp.length < 6) {
      toast.error('Please enter all 6 digits of the OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOTP(cleanEmail, fullOtp);
      toast.success('Security code verified successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      toast.error('Please enter your email to resend code.');
      return;
    }
    try {
      await authService.sendOTP(cleanEmail);
      toast.success(`New 6-digit OTP code sent to ${cleanEmail}!`);
    } catch {
      toast.error('Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-6 text-left w-full">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Enter the 6-digit verification code sent to your email
        </p>

        <form onSubmit={handleVerify} className="space-y-5">
          {!initialEmail && (
            <div className="text-left mb-2">
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Your Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
          )}

          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            ))}
          </div>

          <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full shadow-glow">
            Verify Code & Sign In
          </Button>
        </form>

        <p className="text-xs text-slate-400 mt-6">
          Didn't receive code?{' '}
          <button type="button" onClick={handleResend} className="text-brand-500 font-semibold hover:underline">
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
};
