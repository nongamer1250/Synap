'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdBannerProps {
  type: 'sidebar' | 'loading' | 'content';
}

export default function AdBanner({ type }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // Read ad IDs from environment variables
  const carbonZoneId = process.env.NEXT_PUBLIC_CARBON_ZONE_ID;
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-5143493824024577';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    // Clear previous contents
    containerRef.current.innerHTML = '';

    // 1. Carbon Ads Integration
    if (carbonZoneId) {
      const script = document.createElement('script');
      script.src = `//cdn.carbonads.com/carbon.js?serve=${carbonZoneId}&placement=synapbond`;
      script.id = '_carbonads_js';
      script.async = true;
      containerRef.current.appendChild(script);
      return;
    }

    // 2. Google AdSense Integration
    if (adsenseClientId) {
      const adElement = document.createElement('ins');
      adElement.className = 'adsbygoogle';
      adElement.style.display = 'block';
      adElement.setAttribute('data-ad-client', adsenseClientId);

      if (type === 'sidebar') {
        adElement.setAttribute('data-ad-slot', 'sidebar-slot');
        adElement.setAttribute('data-ad-format', 'rectangle');
      } else if (type === 'loading') {
        adElement.setAttribute('data-ad-slot', 'loading-slot');
        adElement.setAttribute('data-ad-format', 'horizontal');
      } else {
        adElement.setAttribute('data-ad-slot', 'content-slot');
        adElement.setAttribute('data-ad-format', 'auto');
      }

      containerRef.current.appendChild(adElement);

      try {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);

        // Push ad
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense script error:', err);
      }
    }
  }, [isClient, carbonZoneId, adsenseClientId, type]);

  if (!isClient) return null;

  const hasActiveAd = Boolean(carbonZoneId || adsenseClientId);

  // Render placeholder if no premium ad API keys are set (perfect for local dev & demo)
  if (!hasActiveAd) {
    if (type === 'sidebar') {
      return (
        <a
          href="https://groq.com"
          target="_blank"
          rel="noreferrer"
          className="group block rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 p-3 transition-all duration-200"
        >
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-semibold mb-1 block">
            Sponsored Sponsor
          </span>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Groq Cloud
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </h4>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                Powering Synap's ultra-fast 70B AI note generations.
              </p>
            </div>
          </div>
        </a>
      );
    }

    if (type === 'loading') {
      return (
        <a
          href="https://supabase.com"
          target="_blank"
          rel="noreferrer"
          className="group block rounded-2xl border border-dashed border-border/60 bg-muted/10 hover:bg-muted/25 p-4 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
              Partner Spotlight
            </span>
            <span className="text-[10px] text-primary flex items-center gap-1">
              Visit Sponsor <ExternalLink className="w-3 h-3" />
            </span>
          </div>
          <div className="flex gap-4 items-center mt-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <span className="text-xl">⚡</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Supabase Serverless DB
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  — The open source Firebase alternative.
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Enjoyed by developers worldwide. Scale your next project database instantly.
              </p>
            </div>
          </div>
        </a>
      );
    }

    return null;
  }

  return (
    <div className="ad-container relative w-full overflow-hidden" ref={containerRef}>
      {/* Script injected ad will render here */}
    </div>
  );
}
