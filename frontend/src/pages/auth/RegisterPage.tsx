import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User as UserIcon, Check, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { GoogleOAuthModal } from '../../components/auth/GoogleOAuthModal';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error('Please accept terms & conditions');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);

      addNotification({
        title: 'Welcome to DocuFlow AI!',
        message: `Your account (${email}) has been registered with 50 Free AI credits and 5GB cloud storage. A verification email has been dispatched.`,
        type: 'security',
        emailDispatched: true,
      });

      toast.success('Account created! Welcome to DocuFlow AI.');
      toast.info(`📧 Verification email dispatched to ${email}`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleData: { name: string; email: string; avatar: string }) => {
    setIsLoading(true);
    try {
      const res = await authService.googleLogin(googleData);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);

      addNotification({
        title: 'Google Sign-In Connected',
        message: `Account created via Google OAuth for ${googleData.email}.`,
        type: 'security',
        emailDispatched: true,
      });

      toast.success(`Welcome, ${googleData.name}! Account registered.`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-glow mb-3">
            <Sparkles className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-bold">Create Free Account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get 50 free AI credits and 5GB cloud storage</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Sankar Sri"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="sankar@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span>I agree to the Terms of Service & Privacy Policy</span>
          </div>

          <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full">
            Create Account
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] uppercase font-bold text-slate-400">Or register with</span>
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setIsGoogleModalOpen(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </Button>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Google OAuth Account & Permission Modal */}
      <GoogleOAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
};
