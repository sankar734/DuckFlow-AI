import React, { useState } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import {
  Search,
  Plus,
  Bell,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Command,
  FileText,
  Table,
  Presentation,
  FileUp,
  Camera,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Menu,
  X,
  LayoutDashboard,
  FolderClosed,
  FileStack,
  Layers,
  LayoutTemplate,
  Users,
  Clock,
  Trash2,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useUIStore } from '../../store/uiStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { openCommandPalette, openMobileScanner } = useUIStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const mainNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Documents', path: '/documents', icon: FolderClosed },
    { name: 'Word Document Editor', path: '/word', icon: FileText, color: 'text-blue-500' },
    { name: 'Excel Spreadsheet', path: '/excel', icon: Table, color: 'text-emerald-500' },
    { name: 'PowerPoint Builder', path: '/powerpoint', icon: Presentation, color: 'text-amber-500' },
    { name: 'PDF Tool Center', path: '/pdf', icon: FileStack, color: 'text-rose-500' },
    { name: 'Universal Converter', path: '/conversions', icon: Layers, color: 'text-indigo-500' },
    { name: 'Mobile Scanner', path: '/scanner', icon: Camera, color: 'text-purple-500' },
    { name: 'AI Studio', path: '/ai', icon: Sparkles, color: 'text-purple-500' },
    { name: 'Templates', path: '/templates', icon: LayoutTemplate },
    { name: 'Shared With Me', path: '/shared', icon: Users },
    { name: 'Recent Files', path: '/recent', icon: Clock },
    { name: 'Trash', path: '/trash', icon: Trash2 },
    { name: 'Settings & Security', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-4 lg:px-6 flex items-center justify-between transition-colors">
      {/* Mobile Drawer Trigger & Logo */}
      <div className="flex items-center gap-2 lg:hidden mr-2">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="hidden xs:inline">DocuFlow</span>
        </Link>
      </div>

      {/* Search & Command Palette Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200/60 dark:border-slate-700/60"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search tools, files...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xs">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 ml-2">
        {/* Create Quick Action Dropdown */}
        <div className="relative">
          <Button
            variant="gradient"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
            className="px-2.5 sm:px-3 text-xs"
          >
            <span className="hidden sm:inline">Create</span>
          </Button>


          {isCreateMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsCreateMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3 py-1.5">
                  New Workspace
                </div>
                <button
                  onClick={() => { setIsCreateMenuOpen(false); navigate('/word'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-semibold">Word Document</div>
                    <div className="text-[10px] text-slate-400">Rich text & AI drafting</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsCreateMenuOpen(false); navigate('/excel'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl transition-colors text-left"
                >
                  <Table className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Excel Spreadsheet</div>
                    <div className="text-[10px] text-slate-400">Formulas & AI analysis</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsCreateMenuOpen(false); navigate('/powerpoint'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl transition-colors text-left"
                >
                  <Presentation className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold">PowerPoint Deck</div>
                    <div className="text-[10px] text-slate-400">AI slide outlines</div>
                  </div>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={() => { setIsCreateMenuOpen(false); navigate('/conversions'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl transition-colors text-left"
                >
                  <FileUp className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="font-semibold">Convert File</div>
                    <div className="text-[10px] text-slate-400">Word, Excel, PPT, PDF</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsCreateMenuOpen(false); openMobileScanner(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl transition-colors text-left"
                >
                  <Camera className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-semibold">Scan Document</div>
                    <div className="text-[10px] text-slate-400">Camera & OCR extract</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* AI Studio Quick Link */}
        <Link to="/ai">
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors border border-purple-200/60 dark:border-purple-800/60">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
            <span>AI Studio</span>
          </button>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications & Security Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-brand-600 text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-84 sm:w-96 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications & Alerts</span>
                    {unreadCount > 0 && <Badge variant="brand" size="sm">{unreadCount} new</Badge>}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-1.5 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer text-left border ${
                          n.isRead
                            ? 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            : 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {n.type === 'security' && <span className="text-amber-500">🔒</span>}
                            {n.type === 'ai' && <span className="text-purple-500">✦</span>}
                            {n.type === 'billing' && <span className="text-emerald-500">💳</span>}
                            {n.title}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {n.message}
                        </div>
                        {n.emailDispatched && (
                          <div className="mt-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span>📧</span> Confirmation email dispatched
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{user?.name || user?.email?.split('@')[0] || 'User Profile'}</div>
              <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium uppercase">{user?.planId ? `${user.planId} Plan` : 'Free Plan'}</div>
            </div>
          </button>

          {isProfileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || user?.email?.split('@')[0] || 'Account'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email || 'user@docuflow.ai'}</div>
                </div>

                <button
                  onClick={() => { setIsProfileMenuOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profile & Settings</span>
                </button>

                <button
                  onClick={() => { setIsProfileMenuOpen(false); navigate('/billing'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Upgrade & Credits</span>
                </button>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); navigate('/admin'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl transition-colors text-left"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => { setIsProfileMenuOpen(false); logout(); navigate('/'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Full Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col p-5 overflow-y-auto border-r border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-left duration-200">
            {/* Header with Logo & Close */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
              <Link
                to="/dashboard"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    DocuFlow <span className="text-brand-500">AI</span>
                  </div>
                  <div className="text-[9px] text-slate-400">Office Suite & Conversion</div>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 space-y-1 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                All Workspaces & Tools
              </div>
              {mainNavLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <link.icon className={`w-4 h-4 ${link.color || 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Mobile Footer with User Plan & Logout */}
            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user?.name || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                    {user?.planId ? `${user.planId} Plan` : 'Free Plan'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
