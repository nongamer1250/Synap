'use client';

import React from 'react';
import { ReactLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,        // Scroll damping ratio (lower = smoother inertia)
        duration: 1.2,     // Scroll animation duration in seconds
      }}
    >
      {children}
    </ReactLenis>
  );
}

