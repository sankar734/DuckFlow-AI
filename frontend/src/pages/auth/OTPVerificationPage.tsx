import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, KeyRound, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { toast } from 'sonner';

export const OTPVerificationPage: React.FC = () => {
  const navigate = useNavigate();
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
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      toast.error('Please enter all 6 digits of the OTP');
      return;
    }
    setIsLoading(true);
    try {
      await authService.verifyOTP('demo@docuflow.ai', fullOtp);
      toast.success('Security code verified successfully!');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid OTP code. (Hint: Use 123456 in demo mode)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Enter the 6-digit verification code sent to your email
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
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

          <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full">
            Verify Code
          </Button>
        </form>

        <p className="text-xs text-slate-400 mt-6">
          Didn't receive code?{' '}
          <button onClick={() => toast.success('New OTP sent to email')} className="text-brand-500 font-semibold hover:underline">
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
};
