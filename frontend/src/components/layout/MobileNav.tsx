import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderClosed,
  Plus,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const MobileNav: React.FC = () => {
  const { openCommandPalette } = useUIStore();

  return (
    <nav aria-label="Mobile navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 px-3 flex items-center justify-around select-none">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
            isActive ? 'text-brand-600 dark:text-brand-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Home</span>
      </NavLink>

      <NavLink
        to="/documents"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
            isActive ? 'text-brand-600 dark:text-brand-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <FolderClosed className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Files</span>
      </NavLink>

      {/* Floating Center Create Action */}
      <div className="relative -top-3">
        <button
          onClick={openCommandPalette}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-glow active:scale-90 transition-transform"
          title="Create or Quick Search"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <NavLink
        to="/ai"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
            isActive ? 'text-purple-600 dark:text-purple-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <Sparkles className="w-5 h-5 text-purple-500" />
        <span className="text-[10px] tracking-tight">AI Studio</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
            isActive ? 'text-brand-600 dark:text-brand-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Profile</span>
      </NavLink>
    </nav>
  );
};

