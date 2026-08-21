import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderClosed,
  Plus,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const { openCommandPalette } = useUIStore();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 px-2 flex items-center justify-around">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </NavLink>

      <NavLink
        to="/documents"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <FolderClosed className="w-5 h-5" />
        <span className="text-[10px]">Files</span>
      </NavLink>

      {/* Floating Center Create Button */}
      <button
        onClick={openCommandPalette}
        className="w-12 h-12 -mt-6 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shadow-glow active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      <NavLink
        to="/ai"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Sparkles className="w-5 h-5 text-purple-500" />
        <span className="text-[10px]">AI Studio</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </NavLink>
    </div>
  );
};
