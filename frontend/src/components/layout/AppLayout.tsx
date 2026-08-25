import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { MobileScannerModal } from '../scanner/MobileScannerModal';
import { useUIStore } from '../../store/uiStore';

export const AppLayout: React.FC = () => {
  const { isMobileScannerOpen, closeMobileScanner } = useUIStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Persistent Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 p-2 sm:p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Global Modals & Command Center */}
      <CommandPalette />
      <MobileScannerModal isOpen={isMobileScannerOpen} onClose={closeMobileScanner} />
    </div>
  );
};
