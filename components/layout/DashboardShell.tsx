'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import type { Profile } from '@/types';
import { DashboardCacheProvider } from '@/components/providers/DashboardCacheProvider';

interface DashboardShellProps {
  user: Profile;
  children: React.ReactNode;
}

/**
 * Premium Mobile-Responsive Dashboard Shell.
 * Manages mobile drawer toggles, provides overlays and backdrops with
 * smooth fluid animations, and ensures zero content squishing on small screens.
 */
export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Automatically collapse mobile drawer on route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* 1. Desktop Sidebar (static, only shown on lg and above) */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar user={user} />
      </div>

      {/* 2. Mobile Sidebar Drawer Overlay (lg hidden, only visible when sidebarOpen is true) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar Drawer container panel */}
          <div className="relative flex w-64 max-w-xs flex-col bg-card h-full z-10 shadow-2xl animate-slide-in-left">
            <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main viewport container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <DashboardCacheProvider>
            {children}
          </DashboardCacheProvider>
        </main>
      </div>
    </div>
  );
}
