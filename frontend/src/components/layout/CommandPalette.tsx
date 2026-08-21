import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Table,
  Presentation,
  FileStack,
  Layers,
  Sparkles,
  Camera,
  Settings,
  Zap,
  FolderClosed,
  Clock,
  Trash2,
  X,
  Command,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { isCommandPaletteOpen, closeCommandPalette, toggleCommandPalette, openMobileScanner } = useUIStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        closeCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, toggleCommandPalette, closeCommandPalette]);

  const commandItems = [
    { title: 'New Word Document', desc: 'Create AI-assisted document', icon: FileText, color: 'text-blue-500', action: () => navigate('/word') },
    { title: 'New Excel Spreadsheet', desc: 'Create spreadsheet with formulas', icon: Table, color: 'text-emerald-500', action: () => navigate('/excel') },
    { title: 'New PowerPoint Presentation', desc: 'Generate slide outlines with AI', icon: Presentation, color: 'text-amber-500', action: () => navigate('/powerpoint') },
    { title: 'Open AI Studio', desc: 'Writer, PDF QA, Spreadsheet Analyst', icon: Sparkles, color: 'text-purple-500', action: () => navigate('/ai') },
    { title: 'PDF Tool Center', desc: 'Merge, split, compress, protect', icon: FileStack, color: 'text-rose-500', action: () => navigate('/pdf') },
    { title: 'Universal File Converter', desc: 'Convert Word, Excel, PPT, PDF, Image', icon: Layers, color: 'text-indigo-500', action: () => navigate('/conversions') },
    { title: 'Scan Document (Mobile Camera)', desc: 'Camera edge detect & OCR', icon: Camera, color: 'text-purple-500', action: () => { closeCommandPalette(); openMobileScanner(); } },
    { title: 'My Documents', desc: 'Browse and manage all files', icon: FolderClosed, color: 'text-slate-400', action: () => navigate('/documents') },
    { title: 'Recent Documents', desc: 'Jump back into recently edited files', icon: Clock, color: 'text-slate-400', action: () => navigate('/recent') },
    { title: 'Trash & Recovery', desc: 'Restore deleted documents', icon: Trash2, color: 'text-slate-400', action: () => navigate('/trash') },
    { title: 'Billing & AI Credits', desc: 'View subscription and credit breakdown', icon: Zap, color: 'text-amber-400', action: () => navigate('/billing') },
    { title: 'Platform Settings', desc: 'Profile, dark mode, notifications', icon: Settings, color: 'text-slate-400', action: () => navigate('/settings') },
  ];

  const filteredItems = commandItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCommandPalette}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search action..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={closeCommandPalette}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Command Results */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                Quick Actions
              </div>

              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No commands matching "{query}"
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      closeCommandPalette();
                      item.action();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 transition-colors">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      Jump →
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Footer Shortcut Helper */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>Navigation:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">↓</kbd>
              </div>
              <div className="flex items-center gap-1">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
