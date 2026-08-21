import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { GoogleOAuthModal } from '../../components/auth/GoogleOAuthModal';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const { login } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const performLogin = (userData: any, token: string, refresh: string) => {
    login(userData, token, refresh);

    addNotification({
      title: 'Sign-In Successful',
      message: `Signed in as ${userData.email}. Workspace session initialized.`,
      type: 'security',
      emailDispatched: true,
    });

    toast.success(`Welcome, ${userData.name}!`);
    navigate(from, { replace: true });
  };

  const handleGoogleSuccess = async (googleData: { name: string; email: string; avatar: string }) => {
    setIsLoading(true);
    try {
      const res = await authService.googleLogin(googleData);
      performLogin(res.data.user, res.data.accessToken, res.data.refreshToken);
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your Gmail / Email address');
      return;
    }
    setIsLoading(true);
    try {
      const derivedName = name.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const res = await authService.login({ name: derivedName, email: email.trim() });
      performLogin(res.data.user, res.data.accessToken, res.data.refreshToken);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
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
          <h2 className="text-xl font-bold">Sign In to DocuFlow AI</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Instant passwordless access with your Gmail and Name</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Your Name (e.g. Alex Smith)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
            autoFocus
          />

          <Input
            label="Gmail / Email Address"
            type="email"
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Password-free instant login with zero security friction</span>
          </div>

          <Button type="submit" variant="gradient" size="md" className="w-full shadow-glow font-bold mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Enter Workspace
          </Button>
        </form>

        <div className="relative my-6 text-center text-xs text-slate-500">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-3 bg-white dark:bg-slate-900">Or continue with</span>
        </div>

        {/* 1-Click Google OAuth Sign-in Button */}
        <button
          type="button"
          onClick={() => setIsGoogleModalOpen(true)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-xs font-semibold shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          New user? Simply enter your Name & Gmail above to start free!
        </p>
      </div>

      {/* Google OAuth Modal Window */}
      <GoogleOAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
};
