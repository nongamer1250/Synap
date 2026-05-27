'use client';

import React from 'react';
import { ReactLenis } from 'lenis/react';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
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
