'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  FileText,
  CreditCard,
  MessageSquare
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/upload', label: 'Upload', icon: Upload },
    { href: '/dashboard/notes', label: 'Notes', icon: FileText },
    { href: '/dashboard/flashcards', label: 'Recall', icon: CreditCard },
    { href: '/dashboard/chat', label: 'Tutor', icon: MessageSquare },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/85 backdrop-blur-lg border-t border-border/40 h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-all duration-200 ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-primary' : ''}`} />
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
