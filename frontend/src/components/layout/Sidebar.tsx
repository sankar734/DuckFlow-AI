import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderClosed,
  FileText,
  Table,
  Presentation,
  FileStack,
  Sparkles,
  LayoutTemplate,
  Users,
  Clock,
  Trash2,
  Settings,
  HardDrive,
  Zap,
  ChevronRight,
  ShieldCheck,
  Camera,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCreditStore, formatTimeRemaining } from '../../store/creditStore';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { availableCredits, totalCredits, refillSecondsRemaining } = useCreditStore();

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Documents', path: '/documents', icon: FolderClosed },
    { name: 'Word Editor', path: '/word', icon: FileText, color: 'text-blue-500' },
    { name: 'Excel Workspace', path: '/excel', icon: Table, color: 'text-emerald-500' },
    { name: 'PowerPoint Builder', path: '/powerpoint', icon: Presentation, color: 'text-amber-500' },
    { name: 'PDF Tool Center', path: '/pdf', icon: FileStack, color: 'text-rose-500' },
    { name: 'Universal Converter', path: '/conversions', icon: Layers, color: 'text-indigo-500' },
    { name: 'Mobile Scanner', path: '/scanner', icon: Camera, color: 'text-purple-500' },
    { name: 'AI Studio', path: '/ai', icon: Sparkles, color: 'text-purple-500', badge: 'AI' },
    { name: 'Templates', path: '/templates', icon: LayoutTemplate },
  ];

  const secondaryNav = [
    { name: 'Shared With Me', path: '/shared', icon: Users },
    { name: 'Recent', path: '/recent', icon: Clock },
    { name: 'Trash', path: '/trash', icon: Trash2 },
  ];

  const storageUsedGB = ((user?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(1);
  const storageLimitGB = ((user?.storageLimit || 5 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024)).toFixed(0);
  const storagePercent = Math.min(100, Math.round(((user?.storageUsed || 0) / (user?.storageLimit || 1)) * 100)) || 28;

  const aiPercent = Math.min(100, Math.round(((user?.aiCreditsUsed || 0) / (user?.aiCredits || 1)) * 100)) || 13;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen glass-panel border-r border-slate-200/80 dark:border-slate-800/80 p-4 shrink-0 transition-colors select-none">
      {/* Brand Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-3 mb-4 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            DocuFlow <span className="text-brand-500">AI</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Create. Convert. Understand.</div>
        </div>
      </Link>

      {/* Main Nav Links */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 mb-2">
            Workspaces & Tools
          </div>
          <nav className="space-y-1">
            {mainNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold shadow-xs border border-brand-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${item.color || 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 mb-2">
            Organization
          </div>
          <nav className="space-y-1">
            {secondaryNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4 text-slate-400" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {user?.role === 'ADMIN' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                <span>Admin Console</span>
              </NavLink>
            )}

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* AI Credit Mini-Widget */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">

        {/* AI Credits Meter (Canva Style) */}
        <Link
          to="/billing"
          className="group block p-3 rounded-xl bg-gradient-to-r from-purple-500/10 via-brand-500/10 to-indigo-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1.5">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" /> AI Magic Credits
            </span>
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center group-hover:translate-x-0.5 transition-transform">
              Upgrade <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-brand-500 to-purple-600 transition-all duration-500"
              style={{ width: `${Math.max(5, Math.min(100, Math.round((availableCredits / (totalCredits || 1)) * 100)))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{availableCredits} / {totalCredits}</span>
            <span className="text-purple-600 dark:text-purple-400 font-mono">Refills: {formatTimeRemaining(refillSecondsRemaining)}</span>
          </div>
        </Link>

        {/* Creator Info / LinkedIn Credit */}
        <div className="px-1 py-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Created by</span>
          <a
            href="https://www.linkedin.com/in/sankar-s-707792291/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BqVCs3j3tQAurygkWC7HhVQ%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-[#0077B5] text-[#0077B5] hover:text-white dark:text-blue-400 dark:hover:text-white font-medium transition-all group"
            title="Connect with Sankar S on LinkedIn"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span>Sankar S</span>
            <span className="text-[9px] opacity-70 group-hover:opacity-100">↗</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
