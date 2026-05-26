'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  FileText,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Zap,
  X,
} from 'lucide-react';
import type { Profile } from '@/types';
import AdBanner from './AdBanner';

interface SidebarProps {
  user: Profile;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/notes', label: 'My Notes', icon: FileText },
  { href: '/dashboard/flashcards', label: 'Flashcards', icon: CreditCard },
  { href: '/dashboard/quiz', label: 'Quizzes', icon: HelpCircle },
  { href: '/dashboard/chat', label: 'AI Chat', icon: MessageSquare },
];

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full flex flex-col border-r border-border bg-card shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110 shadow-md group-hover:shadow-primary/30"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight gradient-text transition-all duration-300 group-hover:opacity-90">Synap</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground lg:hidden transition-colors active:scale-95">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link active-press transition-all duration-200 hover:translate-x-1 ${
                isActive ? 'active shadow-sm shadow-primary/5' : ''
              }`}
            >
              <Icon 
                className={`w-4.5 h-4.5 shrink-0 transition-transform duration-300 ${
                  isActive ? 'scale-110 text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`} 
                style={{ width: '1.1rem', height: '1.1rem' }} 
              />
              <span className={isActive ? 'font-semibold text-foreground' : ''}>{label}</span>
              {isActive && (
                <span 
                  className="ml-auto w-1.5 h-1.5 rounded-full animate-scale-in"
                  style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 8px hsl(var(--primary))' }} 
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Premium Sponsor/Ad Placement */}
      <div className="px-4 py-3 mt-auto border-t border-border/40">
        <AdBanner type="sidebar" />
      </div>

      {/* User Info */}
      <div className="border-t border-border px-4 py-4 transition-all hover:bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
            {(user.full_name || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.full_name || 'Student'}</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
