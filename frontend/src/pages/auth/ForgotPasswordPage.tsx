import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Lock, CheckCircle2, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step state: 1: Email -> 2: OTP Verification -> 3: Set New Password -> 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 1: Send OTP to user's real email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendOTP(cleanEmail);
      setStep(2);
      startResendTimer();
      toast.success(`6-digit verification code sent to ${cleanEmail}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);

    if (val && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('').trim();
    if (fullOtp.length < 6) {
      toast.error('Please enter all 6 digits of the OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOTP(email.toLowerCase().trim(), fullOtp);
      toast.success('Security OTP verified successfully!');
      setStep(3);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    const fullOtp = otp.join('').trim();

    try {
      await authService.resetPassword({
        email: email.toLowerCase().trim(),
        otp: fullOtp,
        newPassword: newPassword.trim(),
      });
      setStep(4);
      toast.success('Password changed successfully! You can now log in.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await authService.sendOTP(email.toLowerCase().trim());
      startResendTimer();
      toast.success(`A fresh 6-digit OTP was dispatched to ${email}!`);
    } catch {
      toast.error('Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendCooldown(45);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center">Forgot Password?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">
              Enter your registered email address and we'll send a 6-digit verification code directly to your inbox.
            </p>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full shadow-glow">
                Send Verification Code
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: VERIFY OTP FROM USER EMAIL */}
        {step === 2 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center">Enter Verification Code</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">
              We sent a 6-digit security code to <strong className="text-slate-900 dark:text-white">{email}</strong>
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`forgot-otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                ))}
              </div>

              <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full shadow-glow">
                Verify Security Code
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <span>Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || isLoading}
                className="text-brand-500 font-semibold hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SET NEW PASSWORD */}
        {step === 3 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center">Set New Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">
              Create a secure new password for your DocuFlow account.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full shadow-glow">
                Save & Update Password
              </Button>
            </form>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Password Reset Complete!</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your password has been successfully updated. You can now sign in with your new credentials.
            </p>

            <Button
              variant="gradient"
              size="md"
              onClick={() => navigate('/login')}
              className="w-full shadow-glow mt-4"
            >
              Sign In to Your Account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
