'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LogOut, Bell, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

interface HeaderProps {
  user: Profile;
  onMenuClick?: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(typeof window !== 'undefined' && !!(window as any).Capacitor);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
    router.refresh();
  };

  const handleScheduleReminders = async () => {
    try {
      const { LocalNotifications } = require('@capacitor/local-notifications');
      
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        toast.error('Notification permissions denied!');
        return;
      }

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

      toast.success('Daily study reminder scheduled at 6:00 PM! ⏰');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to schedule local reminders');
    }
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-sm font-medium text-muted-foreground truncate">
          Welcome back, <span className="text-foreground font-semibold">{user.full_name?.split(' ')[0] || 'Student'}</span> 👋
        </h2>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={isNative ? handleScheduleReminders : undefined}
          title={isNative ? "Schedule Study Reminders" : "System Notifications"}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-4.5 h-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
