import React, { useState } from 'react';
import { Mail, Link2, Copy, Check, Shield, Users, Globe } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { toast } from 'sonner';

export const ShareModal: React.FC<{ isOpen: boolean; onClose: () => void; documentId?: string }> = ({
  isOpen,
  onClose,
  documentId,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'COMMENTER' | 'EDITOR'>('EDITOR');
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/share/doc_${documentId || 'shared'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success(`Invitation sent to ${email} as ${role}!`);
    setEmail('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Document" description="Invite team members or generate a shareable link">
      <div className="space-y-6">
        {/* Email Invite Form */}
        <form onSubmit={handleSendInvite} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="VIEWER">Viewer</option>
            <option value="COMMENTER">Commenter</option>
            <option value="EDITOR">Editor</option>
          </select>
          <Button type="submit" variant="primary" size="sm">
            Invite
          </Button>
        </form>

        {/* Access List */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            People with access
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  S
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">You (Sankar)</div>
                  <div className="text-[10px] text-slate-400">sankar@docuflow.ai</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Owner</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Anyone with the link</div>
                  <div className="text-[10px] text-slate-400">Can view & comment</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-brand-500">Public</span>
            </div>
          </div>
        </div>

        {/* Copy Share Link */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <Link2 className="w-4 h-4 shrink-0 text-brand-500" />
            <span className="truncate">{shareUrl}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
