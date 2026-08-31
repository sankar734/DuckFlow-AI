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

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

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

        {/* AI Credits Meter */}
        <Link
          to="/billing"
          className="group block p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-brand-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1.5">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> AI Credits
            </span>
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center group-hover:translate-x-0.5 transition-transform">
              Upgrade <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-500"
              style={{ width: `${aiPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {user?.aiCredits ? user.aiCredits - user.aiCreditsUsed : 435} credits remaining
          </div>
        </Link>
      </div>
    </aside>
  );
};
