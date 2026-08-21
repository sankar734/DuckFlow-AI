import React, { useState } from 'react';
import {
  User as UserIcon,
  Moon,
  Sun,
  Bell,
  Lock,
  HardDrive,
  ShieldCheck,
  Save,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emailNotif, setEmailNotif] = useState(true);
  const [aiNotif, setAiNotif] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone });
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{name}</h3>
            <p className="text-xs text-slate-400">{email}</p>
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
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Appearance Section */}
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

      {/* 3. Notifications */}
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
