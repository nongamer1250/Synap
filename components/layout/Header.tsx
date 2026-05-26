'use client';

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
    router.refresh();
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
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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
