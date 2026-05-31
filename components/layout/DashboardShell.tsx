'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
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
  const [isNative, setIsNative] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const isApp = typeof window !== 'undefined' && !!(window as any).Capacitor;
    setIsNative(isApp);

    if (isApp) {
      const initNotifications = async () => {
        try {
          const { LocalNotifications } = require('@capacitor/local-notifications');
          const check = await LocalNotifications.checkPermissions();
          
          if (check.display === 'prompt') {
            const perm = await LocalNotifications.requestPermissions();
            if (perm.display !== 'granted') return;
          } else if (check.display !== 'granted') {
            return;
          }

          // Cancel and reschedule to keep the daily trigger updated
          await LocalNotifications.cancel({
            notifications: [{ id: 101 }]
          });

          const now = new Date();
          const scheduledTime = new Date();
          scheduledTime.setHours(18, 0, 0, 0);

          if (scheduledTime.getTime() <= now.getTime()) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
          }

          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Synap Study Call! 🧠",
                body: "Keep your study streak burning. You have recall flashcards due today!",
                id: 101,
                schedule: {
                  at: scheduledTime,
                  allowWhileIdle: true,
                  every: 'day'
                },
                sound: 'default'
              }
            ]
          });
          console.log('[Notifications] Daily study reminder auto-scheduled.');
        } catch (err) {
          console.warn('[Notifications] Auto-schedule failed:', err);
        }
      };
      initNotifications();
    }
  }, []);

  // Automatically collapse mobile drawer on route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* 1. Desktop Sidebar (static, only shown on lg and above) */}
      {!isNative && (
        <div className="hidden lg:block h-full shrink-0">
          <Sidebar user={user} />
        </div>
      )}

      {/* 2. Mobile Sidebar Drawer Overlay (lg hidden, only visible when sidebarOpen is true) */}
      {sidebarOpen && !isNative && (
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
        <Header 
          user={user} 
          onMenuClick={isNative ? undefined : () => setSidebarOpen(true)} 
        />
        
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${isNative ? 'pb-20' : ''}`}>
          <DashboardCacheProvider>
            {children}
          </DashboardCacheProvider>
        </main>

        {isNative && <MobileBottomNav />}
      </div>
    </div>
  );
}
