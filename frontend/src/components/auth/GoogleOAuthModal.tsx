import React, { useState, useEffect } from 'react';
import { Minus, Square, X, SlidersHorizontal, EyeOff, Lock, User as UserIcon, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export interface GoogleAccount {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  badgeBg?: string;
}

const STORAGE_KEY = 'docuflow_saved_google_accounts';

const INITIAL_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    id: 'g_1',
    name: 'Sankar S',
    email: 'sankarsri023@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'g_2',
    name: 'SANKAR S',
    email: 'sankars583225621020@nprcolleges.org',
    badgeBg: '#388e3c',
  },
];

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; avatar: string }) => void;
}

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accounts, setAccounts] = useState<GoogleAccount[]>(INITIAL_GOOGLE_ACCOUNTS);
  const [view, setView] = useState<'chooser' | 'custom_email'>('chooser');
  const [customEmail, setCustomEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authenticatingEmail, setAuthenticatingEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
        }
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAccount = (acc: GoogleAccount) => {
    setIsLoading(true);
    setAuthenticatingEmail(acc.email);

    // Save into localStorage
    try {
      const remaining = accounts.filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase());
      const updated = [acc, ...remaining];
      setAccounts(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Simulated Google OAuth authorization pulse
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        name: acc.name,
        email: acc.email,
        avatar: acc.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`,
      });
      onClose();
    }, 700);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const email = customEmail.trim().toLowerCase();
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const newAcc: GoogleAccount = {
      id: `g_${Date.now()}`,
      name,
      email,
      badgeBg: '#1976d2',
    };

    handleSelectAccount(newAcc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      {/* Authentic Chrome Window Container */}
      <div className="w-full max-w-[440px] bg-[#131314] text-[#e8eaed] rounded-xl overflow-hidden shadow-2xl border border-[#3c4043] flex flex-col transition-all duration-200">
        
        {/* 1. Chrome Window Titlebar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#1f1f1f] border-b border-[#2d2e30] text-xs text-[#c4c7c5]">
          <div className="flex items-center gap-2 truncate">
            {/* Chrome G Icon */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="truncate font-normal text-[11px] text-[#e3e3e3]">
              Sign in - Google Accounts - Google Chrome
            </span>
          </div>

          {/* Window Buttons */}
          <div className="flex items-center gap-3 text-[#9aa0a6]">
            <button className="hover:text-white transition-colors" onClick={onClose}>
              <Minus className="w-3 h-3" />
            </button>
            <button className="hover:text-white transition-colors">
              <Square className="w-2.5 h-2.5" />
            </button>
            <button className="hover:text-rose-400 transition-colors" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Chrome URL Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#282a2d] border-b border-[#3c4043] text-[11px] text-[#9aa0a6]">
          <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
            <SlidersHorizontal className="w-3 h-3 text-[#8ab4f8] shrink-0" />
            <span className="truncate text-[#c4c7c5] font-mono text-[10.5px]">
              accounts.google.com/v3/signin/accountchooser?as=NzaWUVj7NL...
            </span>
          </div>
          <EyeOff className="w-3.5 h-3.5 text-[#9aa0a6] shrink-0" />
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="w-full h-1 bg-[#1f1f1f] overflow-hidden">
            <div className="w-full h-full bg-[#8ab4f8] animate-pulse" />
          </div>
        )}

        {/* 3. Main Google Account Chooser Viewport */}
        <div className="p-7 sm:p-9 flex-1 flex flex-col justify-between bg-[#131314]">
          {view === 'chooser' ? (
            <div>
              {/* Google Brand Header */}
              <div className="flex items-center gap-2.5 mb-6">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-medium text-[#e8eaed]">Sign in with Google</span>
              </div>

              {/* Title & App Redirection */}
              <div className="mb-7">
                <h1 className="text-[28px] sm:text-[32px] font-normal text-[#e8eaed] leading-tight tracking-tight">
                  Choose an account
                </h1>
                <p className="text-sm text-[#e8eaed] mt-2">
                  to continue to <span className="text-[#8ab4f8] font-medium hover:underline cursor-pointer">docuflow.ai</span>
                </p>
              </div>

              {/* Account Rows List */}
              <div className="border-t border-[#3c4043]/60 mb-6">
                {accounts.map((acc, index) => {
                  const isBeingSelected = authenticatingEmail === acc.email && isLoading;
                  return (
                    <div
                      key={acc.email || index}
                      onClick={() => !isLoading && handleSelectAccount(acc)}
                      className="flex items-center gap-3.5 py-3.5 px-2 hover:bg-[#202124] rounded-lg cursor-pointer border-b border-[#3c4043]/60 transition-colors group"
                    >
                      {/* Avatar / Circle Badge */}
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#3c4043]"
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: acc.badgeBg || '#2e7d32' }}
                          className="w-10 h-10 rounded-full text-white font-medium flex items-center justify-center text-base shrink-0 shadow-xs"
                        >
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name & Email */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[14.5px] font-medium text-[#e8eaed] group-hover:text-white truncate">
                          {acc.name}
                        </div>
                        <div className="text-[12.5px] text-[#9aa0a6] truncate">
                          {acc.email}
                        </div>
                      </div>

                      {isBeingSelected && (
                        <Loader2 className="w-4 h-4 text-[#8ab4f8] animate-spin shrink-0" />
                      )}
                    </div>
                  );
                })}

                {/* Use Another Account Row */}
                <div
                  onClick={() => setView('custom_email')}
                  className="flex items-center gap-3.5 py-3.5 px-2 hover:bg-[#202124] rounded-lg cursor-pointer border-b border-[#3c4043]/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full border border-[#5f6368] flex items-center justify-center text-[#e8eaed] shrink-0 group-hover:border-[#8ab4f8] group-hover:text-[#8ab4f8] transition-colors">
                    <UserIcon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div className="text-[14.5px] font-medium text-[#e8eaed] group-hover:text-white">
                    Use another account
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* "Use another account" (Google Sign in with Email input) */
            <div className="animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 mb-6">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-medium text-[#e8eaed]">Sign in with Google</span>
              </div>

              <div className="mb-6">
                <h1 className="text-[28px] sm:text-[32px] font-normal text-[#e8eaed] leading-tight tracking-tight">
                  Sign in
                </h1>
                <p className="text-sm text-[#e8eaed] mt-1.5">
                  to continue to <span className="text-[#8ab4f8] font-medium">docuflow.ai</span>
                </p>
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-4 mb-6">
                <div>
                  <div className="relative">
                    <input
                      type="email"
                      id="googleEmail"
                      placeholder=" "
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="block w-full px-3.5 pt-4 pb-2 text-sm text-[#e8eaed] bg-transparent rounded-md border border-[#5f6368] focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] focus:outline-none peer"
                      required
                      autoFocus
                    />
                    <label
                      htmlFor="googleEmail"
                      className="absolute text-xs text-[#9aa0a6] duration-150 transform -translate-y-2.5 scale-90 top-2 z-10 origin-[0] bg-[#131314] px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:text-sm peer-focus:scale-90 peer-focus:-translate-y-2.5 peer-focus:text-[#8ab4f8] peer-focus:text-xs left-3 pointer-events-none"
                    >
                      Email or phone
                    </label>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-[#8ab4f8] hover:underline cursor-pointer">
                      Forgot email?
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#9aa0a6] leading-relaxed pt-1">
                  Not your computer? Use Guest mode to sign in privately.{' '}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Learn more</span>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setView('chooser')}
                    className="text-xs font-medium text-[#8ab4f8] hover:bg-[#8ab4f8]/10 px-3 py-2 rounded-full transition-colors"
                  >
                    Back to accounts
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 rounded-full bg-[#8ab4f8] text-[#001d35] font-medium text-xs hover:bg-[#a8c7fa] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Next</span>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. Google Footer */}
          <div className="flex items-center justify-between text-[11px] text-[#9aa0a6] pt-4 mt-auto border-t border-[#3c4043]/30">
            <div className="flex items-center gap-1 hover:text-[#e8eaed] cursor-pointer">
              <span>English (United States)</span>
              <ChevronDown className="w-3 h-3" />
            </div>

            <div className="flex items-center gap-4">
              <span className="hover:text-[#e8eaed] cursor-pointer">Help</span>
              <span className="hover:text-[#e8eaed] cursor-pointer">Privacy</span>
              <span className="hover:text-[#e8eaed] cursor-pointer">Terms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
