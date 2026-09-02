import React, { useState } from 'react';
import {
  User as UserIcon,
  Moon,
  Sun,
  Bell,
  Lock,
  ShieldCheck,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emailNotif, setEmailNotif] = useState(true);
  const [aiNotif, setAiNotif] = useState(true);

  // Password update form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // OTP state for password change
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone });
    toast.success('Profile updated successfully!');
  };

  // Send Email OTP for password change
  const handleSendOtp = async () => {
    const targetEmail = user?.email || email;
    if (!targetEmail) {
      toast.error('No email address associated with this account.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Please enter a new password (min 6 characters) before requesting OTP.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match. Please check.');
      return;
    }

    setIsSendingOtp(true);
    try {
      await authService.sendOTP(targetEmail.toLowerCase().trim());
      setIsOtpSent(true);
      startResendTimer();
      toast.success(`6-digit OTP verification code sent to ${targetEmail}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to dispatch verification OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);

    if (val && index < 5) {
      const nextInput = document.getElementById(`settings-otp-${index + 1}`);
      nextInput?.focus();
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

  // Submit Password Change with Email OTP
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    const fullOtp = otp.join('').trim();
    if (!fullOtp || fullOtp.length < 6) {
      toast.error('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const targetEmail = (user?.email || email).toLowerCase().trim();
      await authService.changePassword({
        email: targetEmail,
        otp: fullOtp,
        currentPassword: currentPassword.trim() || undefined,
        newPassword: newPassword.trim(),
      });

      toast.success('Your password has been changed successfully!');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp(['', '', '', '', '', '']);
      setIsOtpSent(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password. Please check your OTP code.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <Badge variant="slate" size="sm" className="mb-1">
          Preferences & Security
        </Badge>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-slate-400">Manage your profile, theme appearance, notifications, and security</p>
      </div>

      {/* 1. Profile Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-glow">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{name || 'User Profile'}</h3>
            <p className="text-xs text-slate-400">{email || user?.email}</p>
            <Badge variant="brand" size="sm" className="mt-1">
              {user?.planId?.toUpperCase() || 'PRO'} TIER
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Security & Password Update with Email OTP (NEW) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Password Management</h3>
              <p className="text-xs text-slate-400">Change your password securely with Email OTP Verification</p>
            </div>
          </div>
          <Badge variant="brand" size="sm">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> OTP Protected
          </Badge>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Optional / If set"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-200"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-200"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          </div>

          {/* Email OTP Security Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-purple-500" />
                  Email Verification Code Required
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  We'll send a 6-digit confirmation code to{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{user?.email || email}</strong>
                </div>
              </div>

              <Button
                type="button"
                variant={isOtpSent ? 'outline' : 'gradient'}
                size="sm"
                onClick={handleSendOtp}
                isLoading={isSendingOtp}
                disabled={resendCooldown > 0}
              >
                {isOtpSent
                  ? resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : 'Resend Code'
                  : 'Send Security OTP'}
              </Button>
            </div>

            {isOtpSent && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Enter 6-Digit Code:
                </div>
                <div className="flex gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`settings-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-9 h-10 text-center text-base font-bold font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              isLoading={isUpdatingPassword}
              disabled={!isOtpSent || otp.join('').trim().length < 6}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Update & Save Password
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Appearance Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme & Appearance</h3>
        <p className="text-xs text-slate-400">Select your preferred color theme for editor canvases and dashboards</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'dark', label: 'Dark Mode', icon: Moon },
            { id: 'light', label: 'Light Mode', icon: Sun },
            { id: 'system', label: 'System Sync', icon: ShieldCheck },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setTheme(mode.id as any);
                toast.success(`Switched to ${mode.label}`);
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === mode.id
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/40 ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <mode.icon className="w-5 h-5 text-brand-500 mb-2" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">{mode.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Notifications */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Document Shared Alerts</div>
              <div className="text-slate-400">Receive email notification when someone shares a document</div>
            </div>
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => setEmailNotif(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">AI Generation Complete</div>
              <div className="text-slate-400">Receive in-app toast when large presentations or OCR finish</div>
            </div>
            <input
              type="checkbox"
              checked={aiNotif}
              onChange={(e) => setAiNotif(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
