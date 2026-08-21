import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Lock, User as UserIcon, ArrowRight, Loader2, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface GoogleAccount {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  badgeBg?: string;
}

const STORAGE_KEY = 'docuflow_saved_google_accounts';

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
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [view, setView] = useState<'chooser' | 'custom_email'>('chooser');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authenticatingEmail, setAuthenticatingEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
          setView('chooser');
          return;
        }
      }
    } catch {}
    // If no accounts saved previously, show the email input view directly
    setView('custom_email');
    setAccounts([]);
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

    // Google OAuth authorization pulse
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        name: acc.name,
        email: acc.email,
        avatar: acc.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`,
      });
      onClose();
    }, 600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const email = customEmail.trim().toLowerCase();
    const derivedName = customName.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    
    const newAcc: GoogleAccount = {
      id: `g_${Date.now()}`,
      name: derivedName,
      email,
      badgeBg: '#1a73e8',
    };

    handleSelectAccount(newAcc);
  };

  const handleRemoveSavedAccount = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = accounts.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    setAccounts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    if (updated.length === 0) {
      setView('custom_email');
    }
    toast.info('Removed account from device');
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

          <div className="flex items-center gap-1">
            <button onClick={onClose} className="p-1 hover:bg-[#333538] rounded text-[#9aa0a6] hover:text-white" title="Minimize">
              <Minus className="w-3 h-3" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-[#333538] rounded text-[#9aa0a6] hover:text-white" title="Maximize">
              <Square className="w-2.5 h-2.5" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-[#c5221f] rounded text-[#9aa0a6] hover:text-white" title="Close">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. Chrome URL Bar */}
        <div className="px-3 py-1.5 bg-[#292a2d] border-b border-[#3c4043] flex items-center gap-2 text-[11px] text-[#9aa0a6]">
          <Lock className="w-3 h-3 text-[#8ab4f8]" />
          <span className="text-[#8ab4f8] font-mono truncate">
            https://accounts.google.com/v3/signin/identifier?continue=docuflow.ai
          </span>
        </div>

        {/* 3. Authentic Google Accounts Screen */}
        <div className="p-6 sm:p-8 flex flex-col items-center">
          {/* Official Google Brandmark */}
          <div className="mb-4">
            <svg className="w-12 h-12" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-normal text-[#e8eaed] text-center mb-1">
            {view === 'chooser' ? 'Choose an account' : 'Sign in with Google'}
          </h2>
          <p className="text-xs text-[#9aa0a6] text-center mb-6">
            to continue to <span className="text-[#8ab4f8] hover:underline cursor-pointer">docuflow.ai</span>
          </p>

          {/* VIEW A: Saved Accounts Chooser */}
          {view === 'chooser' && accounts.length > 0 && (
            <div className="w-full space-y-1">
              {accounts.map((acc, index) => {
                const isThisLoading = isLoading && authenticatingEmail === acc.email;
                return (
                  <div
                    key={acc.email || index}
                    onClick={() => !isLoading && handleSelectAccount(acc)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#202124] transition-colors cursor-pointer border-b border-[#2d2e30]/50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      {acc.avatar ? (
                        <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div
                          style={{ backgroundColor: acc.badgeBg || '#1a73e8' }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                        >
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Account Details */}
                      <div className="text-left min-w-0">
                        <div className="text-[13px] font-medium text-[#e8eaed] truncate">{acc.name}</div>
                        <div className="text-[11px] text-[#9aa0a6] truncate">{acc.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isThisLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#8ab4f8]" />
                      ) : (
                        <button
                          onClick={(e) => handleRemoveSavedAccount(e, acc.email)}
                          className="p-1 text-transparent group-hover:text-[#9aa0a6] hover:text-[#e8eaed] rounded"
                          title="Remove from device"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Use Another Account Button */}
              <div
                onClick={() => setView('custom_email')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#202124] transition-colors cursor-pointer text-[#e8eaed]"
              >
                <div className="w-8 h-8 rounded-full bg-[#303134] flex items-center justify-center text-[#9aa0a6] shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-[13px] font-medium text-left">Use another account</div>
              </div>
            </div>
          )}

          {/* VIEW B: Enter Real Google Account Email & Name */}
          {view === 'custom_email' && (
            <form onSubmit={handleCustomSubmit} className="w-full space-y-4">
              <div>
                <label className="text-xs text-[#9aa0a6] block mb-1">Email or phone</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Enter your Gmail address..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-md bg-transparent border border-[#5f6368] text-sm text-[#e8eaed] placeholder-[#5f6368] focus:border-[#8ab4f8] focus:outline-none focus:ring-1 focus:ring-[#8ab4f8]"
                />
              </div>

              <div>
                <label className="text-xs text-[#9aa0a6] block mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-md bg-transparent border border-[#5f6368] text-sm text-[#e8eaed] placeholder-[#5f6368] focus:border-[#8ab4f8] focus:outline-none focus:ring-1 focus:ring-[#8ab4f8]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {accounts.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setView('chooser')}
                    className="text-xs text-[#8ab4f8] hover:underline"
                  >
                    Back to account chooser
                  </button>
                ) : (
                  <span className="text-[11px] text-[#9aa0a6]">Sign in with your personal Google account</span>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded bg-[#8ab4f8] hover:bg-[#93bbf9] text-[#202124] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Next'}
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Safe Login Notice */}
          <div className="mt-8 pt-4 border-t border-[#2d2e30] w-full text-[11px] text-[#9aa0a6] text-left leading-relaxed">
            To continue, Google will share your name, email address, language preference, and profile picture with DocuFlow AI.
          </div>
        </div>

        {/* 4. Chrome Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#1f1f1f] border-t border-[#2d2e30] text-[11px] text-[#9aa0a6]">
          <div className="flex items-center gap-1 cursor-pointer hover:text-white">
            <span>English (United States)</span>
            <ChevronDown className="w-3 h-3" />
          </div>

          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Help</span>
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
