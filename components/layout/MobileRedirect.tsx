'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      router.replace('/dashboard');
    }
  }, [router]);

  return null;
}
