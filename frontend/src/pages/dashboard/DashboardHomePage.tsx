import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Table,
  Presentation,
  FileStack,
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
  HardDrive,
  Zap,
  Grid,
  List as ListIcon,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { documentService } from '../../services/documentService';
import { DocumentItem } from '../../types/document';
import { DocumentCard } from '../../components/documents/DocumentCard';
import { ShareModal } from '../../components/documents/ShareModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export const DashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { openMobileScanner, activeShareDocId, openShareModal, closeShareModal } = useUIStore();

  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    documentService.getRecent().then(setRecentDocs);
  }, []);

  const handleFavoriteToggle = (id: string) => {
    setRecentDocs((prev) =>
      prev.map((d) => (d._id === id ? { ...d, isFavorite: !d.isFavorite } : d))
    );
    toast.success('Favorite status updated');
  };

  const handleDelete = (id: string) => {
    documentService.moveToTrash(id);
    setRecentDocs((prev) => prev.filter((d) => d._id !== id));
    toast.success('Document moved to trash');
  };

  const quickActions = [
    { title: 'Word Document', desc: 'Rich text & AI copilot', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10 hover:bg-blue-500/20', path: '/word' },
    { title: 'Excel Workspace', desc: 'Formulas & AI analysis', icon: Table, color: 'text-emerald-500', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', path: '/excel' },
    { title: 'PowerPoint Builder', desc: 'AI-generated slide decks', icon: Presentation, color: 'text-amber-500', bg: 'bg-amber-500/10 hover:bg-amber-500/20', path: '/powerpoint' },
    { title: 'PDF Tool Center', desc: 'Merge, split, compress', icon: FileStack, color: 'text-rose-500', bg: 'bg-rose-500/10 hover:bg-rose-500/20', path: '/pdf' },
    { title: 'Camera Scanner', desc: 'Auto edge crop & OCR', icon: Camera, color: 'text-purple-500', bg: 'bg-purple-500/10 hover:bg-purple-500/20', action: openMobileScanner },
    { title: 'Ask AI Copilot', desc: 'Instant doc generation', icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-500/10 hover:bg-brand-500/20', path: '/ai' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-purple-950 text-white shadow-2xl border border-brand-500/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold backdrop-blur-md mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>DocuFlow AI Workspace Active</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Good afternoon, {user?.name || user?.email?.split('@')[0] || 'there'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            What would you like to create or convert today? Choose an intelligent workspace or prompt the AI Copilot.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-purple-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Quick Action Grid Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
          Quick Workspaces
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => (action.action ? action.action() : navigate(action.path!))}
              className={`p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-white dark:bg-slate-900 flex flex-col justify-between h-32 group`}
            >
              <div className={`p-2.5 rounded-xl w-fit ${action.bg}`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                  {action.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{action.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Usage & Plan Overview Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">AI Credits & Smart Copilot Status</div>
            <div className="text-xs text-slate-400">Active Plan: 435 credits available (Full Word, Excel, PPT, PDF AI Tools unlocked)</div>
            <div className="w-64 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
              <div className="w-[87%] h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full" />
            </div>
          </div>
        </div>
        <Button variant="gradient" size="sm" onClick={() => navigate('/billing')}>
          Manage Plan
        </Button>
      </div>

      {/* Recent Documents Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Documents</h2>
            <p className="text-xs text-slate-400">Pick up where you left off</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-400'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-400'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/documents')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentDocs.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onFavoriteToggle={handleFavoriteToggle}
              onShare={openShareModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!activeShareDocId}
        onClose={closeShareModal}
        documentId={activeShareDocId || undefined}
      />
    </div>
  );
};
