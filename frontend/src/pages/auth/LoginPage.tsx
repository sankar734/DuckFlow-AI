import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { toast } from 'sonner';

import { GoogleOAuthModal } from '../../components/auth/GoogleOAuthModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const { login } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [email, setEmail] = useState('sankar@docuflow.ai');
  const [password, setPassword] = useState('Demo@123456');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const performLogin = (userData: any, token: string, refresh: string) => {
    login(userData, token, refresh);

    // Record login security notification & send email notification
    addNotification({
      title: 'New Sign-In Detected',
      message: `Signed in as ${userData.email} from Chrome on Windows. Security verification confirmation dispatched.`,
      type: 'security',
      emailDispatched: true,
    });

    toast.success(`Welcome back, ${userData.name}!`);
    toast.info(`📧 Security confirmation email sent to ${userData.email}`);
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
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      performLogin(res.data.user, res.data.accessToken, res.data.refreshToken);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoUser = () => {
    const demoUser = {
      _id: 'usr_demo_123',
      name: 'Sankar',
      email: 'sankar@docuflow.ai',
      role: 'USER' as const,
      planId: 'pro',
      storageUsed: 14.2 * 1024 * 1024 * 1024,
      storageLimit: 50 * 1024 * 1024 * 1024,
      aiCredits: 500,
      aiCreditsUsed: 65,
      emailVerified: true,
      preferences: {
        theme: 'dark' as const,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        documentNotifications: true,
        aiNotifications: true,
      },
      createdAt: new Date().toISOString(),
    };
    performLogin(demoUser, 'jwt_token_demo_user', 'jwt_refresh_demo_user');
  };

  const handleQuickAdmin = () => {
    const adminUser = {
      _id: 'usr_admin_999',
      name: 'DocuFlow Admin',
      email: 'admin@docuflow.ai',
      role: 'ADMIN' as const,
      planId: 'business',
      storageUsed: 38.5 * 1024 * 1024 * 1024,
      storageLimit: 250 * 1024 * 1024 * 1024,
      aiCredits: 2500,
      aiCreditsUsed: 140,
      emailVerified: true,
      preferences: {
        theme: 'dark' as const,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        documentNotifications: true,
        aiNotifications: true,
      },
      createdAt: new Date().toISOString(),
    };
    performLogin(adminUser, 'jwt_token_admin', 'jwt_refresh_admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-glow mb-3">
            <Sparkles className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-bold">Sign In to DocuFlow AI</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Access your document creation & conversion platform</p>
        </div>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
            ⚡ Quick 1-Click Demo Login
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickDemoUser}
              className="px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Demo (Sankar)</span>
            </button>

            <button
              type="button"
              onClick={handleQuickAdmin}
              className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="sankar@docuflow.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-700 text-brand-600 focus:ring-brand-500" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-brand-500 hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="gradient" size="md" isLoading={isLoading} className="w-full">
            Sign In with Email
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] uppercase font-bold text-slate-400">Or</span>
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
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-500 font-semibold hover:underline">
            Create account
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
