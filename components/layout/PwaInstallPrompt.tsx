'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Sparkles } from 'lucide-react';
import Logo from './Logo';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [viewMode, setViewMode] = useState<'prompt' | 'ios-instructions'>('prompt');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 1. Register the Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW: Registered successfully with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('SW: Registration failed:', err);
        });
    }

    // 2. Standalone Mode Detection
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;

    if (isStandalone) {
      console.log('PWA: Already running in standalone mode.');
      return;
    }

    // 3. Check LocalStorage Snooze (7 Days)
    const lastDismissed = localStorage.getItem('synap-pwa-dismissed');
    const isSnoozed =
      lastDismissed &&
      Date.now() - parseInt(lastDismissed, 10) < 7 * 24 * 60 * 60 * 1000;

    if (isSnoozed) {
      console.log('PWA: Prompt is currently snoozed.');
      return;
    }

    // 4. Device and Browser Detection
    const userAgent = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const isMobileUA = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const isMobileWidth = window.innerWidth < 768;
    const isMobileDevice = isMobileUA || isMobileWidth;

    // 5. iOS Flow: Show custom guide after a delay if not standalone/snoozed
    if (ios && isMobileDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 6000); // 6 seconds delay so they can absorb the page first
      return () => clearTimeout(timer);
    }

    // 6. Android/Chrome Flow: Listen for standard beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('PWA: beforeinstallprompt fired.');
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show after a delay if on mobile device
      if (isMobileDevice) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 6000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setViewMode('ios-instructions');
      return;
    }

    if (!deferredPrompt) return;

    // Show native browser install prompt
    deferredPrompt.prompt();

    // Await user resolution
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: User install outcome: ${outcome}`);

    // Clean up
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('synap-pwa-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!isMounted || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-[400px] z-50 animate-fade-in">
      {/* Glow highlight backdrop */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur-xl opacity-40 pointer-events-none -z-10" />

      {/* Main glass card container */}
      <div className="relative bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>

        {viewMode === 'prompt' ? (
          <div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl shrink-0 shadow-inner">
                <Logo size={28} />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 leading-none mb-1.5">
                  Install Synap Web App
                  <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse-soft" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add Synap to your home screen for quick, full-screen access to notes, practice quizzes, and syllabus tracking.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={handleDismiss}
                className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
              >
                Maybe Later
              </button>
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_16px_rgba(139,92,246,0.4)] rounded-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg shrink-0">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="text-sm font-semibold text-foreground leading-none mb-2">
                  Install on iOS Device
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Follow these quick steps in your Safari browser:
                </p>

                <ol className="space-y-3.5 text-xs text-foreground">
                  <li className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold shrink-0">
                      1
                    </span>
                    <span className="flex items-center flex-wrap gap-1 leading-normal">
                      Tap the <strong className="text-primary font-semibold">Share</strong> button
                      <span className="inline-flex items-center justify-center p-1 bg-white/5 border border-white/10 rounded-md">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5 text-primary"
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                      </span>
                      in Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <span className="leading-normal">
                      Scroll down and tap <strong className="text-primary font-semibold">"Add to Home Screen"</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <span className="leading-normal">
                      Confirm by tapping <strong className="text-accent font-semibold">Add</strong> in the top-right corner.
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
