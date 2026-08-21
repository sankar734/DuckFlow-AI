import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.sendOTP(email);
      setIsSent(true);
      toast.success('Password reset link sent to your email!');
    } catch {
      toast.error('Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <h2 className="text-xl font-bold">Reset Password</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Enter your email address and we'll send you a password recovery link
        </p>

        {isSent ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              We've dispatched recovery instructions to <strong>{email}</strong>.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/verify-otp')}>
              Enter Security OTP
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
