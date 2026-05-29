'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// Helper to walk up the DOM tree and check if the user is truly at the top of any active scrolling container
function isAtScrollTop(target: EventTarget | null): boolean {
  // 1. Check global window / document / body scroll states
  if (
    window.scrollY > 0 ||
    document.documentElement.scrollTop > 0 ||
    document.body.scrollTop > 0
  ) {
    return false;
  }

  // 2. Check if the main scroll container is scrolled down
  const mainEl = document.querySelector('main');
  if (mainEl && mainEl.scrollTop > 0) {
    return false;
  }

  // 3. Check any visible overflow-y elements on the page that might be scrolled
  const scrollContainers = document.querySelectorAll('.overflow-y-auto, .overflow-y-scroll, [style*="overflow"]');
  for (let i = 0; i < scrollContainers.length; i++) {
    const el = scrollContainers[i] as HTMLElement;
    if (el.offsetHeight > 0 && el.scrollHeight > el.clientHeight && el.scrollTop > 0) {
      return false;
    }
  }

  // 4. Safely walk up the parent chain of the touch target if it is connected
  if (target) {
    let el = target as HTMLElement | null;
    
    // Check nodeType to handle text nodes safely
    if (el && el.nodeType === 3) { // Node.TEXT_NODE
      el = el.parentElement;
    }
    
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.scrollTop > 0) {
        return false;
      }
      
      // Shadow DOM boundary crossing support
      if (!el.parentElement && el.parentNode) {
        if (el.parentNode.nodeType === 11) { // Node.DOCUMENT_FRAGMENT_NODE (ShadowRoot)
          el = (el.parentNode as any).host as HTMLElement;
          continue;
        }
      }
      
      el = el.parentElement;
    }
  }

  return true;
}

// Dynamic pull-to-refresh gesture detector for native Capacitor webview
function setupPullToRefresh() {
  let startY = 0;
  let pulling = false;
  
  // Create and append the premium loader indicator dynamically
  const ptr = document.createElement('div');
  ptr.id = 'ptr-indicator';
  ptr.innerHTML = `
    <div style="
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      background: rgba(18, 15, 27, 0.9); 
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1); 
      box-shadow: 0 4px 15px rgba(0,0,0,0.6); 
      display: flex; 
      align-items: center; 
      justify-content: center;
      transition: transform 0.1s ease, opacity 0.1s ease;
      pointer-events: none;
    ">
      <svg id="ptr-spinner" style="width: 20px; height: 20px; color: hsl(255 85% 68%); transition: transform 0.1s linear;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
    </div>
  `;
  
  Object.assign(ptr.style, {
    position: 'fixed',
    top: '0px',
    left: '50%',
    transform: 'translate3d(-50%, -60px, 0)',
    zIndex: '9999',
    opacity: '0',
    transition: 'transform 0.2s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.2s ease',
    pointerEvents: 'none'
  });
  
  document.body.appendChild(ptr);
  
  const spinner = document.getElementById('ptr-spinner');
  
  const handleTouchStart = (e: TouchEvent) => {
    if (isAtScrollTop(e.touches[0].target)) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!pulling) return;
    
    // Secondary check: verify if we are still at the top
    if (!isAtScrollTop(e.touches[0].target)) {
      pulling = false;
      ptr.style.transform = 'translate3d(-50%, -60px, 0)';
      ptr.style.opacity = '0';
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 0) {
      // Prevent browser default overscroll bounce/stretch
      if (e.cancelable) e.preventDefault();
      
      const translateY = Math.min(diff * 0.4, 75); 
      const opacity = Math.min(diff / 120, 1);
      
      ptr.style.transform = `translate3d(-50%, ${translateY - 50}px, 0)`;
      ptr.style.opacity = opacity.toString();
      
      if (spinner) {
        spinner.style.transform = `rotate(${diff * 2}deg)`;
      }
    } else {
      pulling = false;
      ptr.style.transform = 'translate3d(-50%, -60px, 0)';
      ptr.style.opacity = '0';
    }
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!pulling) return;
    pulling = false;
    
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 140) {
      // Trigger reload
      ptr.style.transform = 'translate3d(-50%, 20px, 0)';
      ptr.style.opacity = '1';
      if (spinner) {
        spinner.classList.add('animate-spin');
        if (!document.getElementById('ptr-animation-style')) {
          const style = document.createElement('style');
          style.id = 'ptr-animation-style';
          style.innerHTML = '@keyframes ptr-spin { to { transform: rotate(360deg); } } .animate-spin { animation: ptr-spin 0.8s linear infinite; }';
          document.head.appendChild(style);
        }
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } else {
      // Hide back
      ptr.style.transform = 'translate3d(-50%, -60px, 0)';
      ptr.style.opacity = '0';
    }
  };
  
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd);
  
  return () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    ptr.remove();
  };
}

export default function DeepLinkProvider() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).Capacitor) return;

    // Initialize pull-to-refresh
    const cleanupPTR = setupPullToRefresh();

    let activeListener: any;
    const setupDeepLinks = async () => {
      const { App } = await import('@capacitor/app');
      
      activeListener = await App.addListener('appUrlOpen', async (data: any) => {
        const urlStr = data.url;
        console.log('App opened with deep link URL:', urlStr);

        try {
          const parsedUrl = new URL(urlStr);
          // Parse parameters from both search query and hash fragments
          const searchParams = parsedUrl.searchParams;
          const hashParams = new URLSearchParams(
            parsedUrl.hash.startsWith('#') ? parsedUrl.hash.substring(1) : parsedUrl.hash
          );

          const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
          const code = searchParams.get('code') || hashParams.get('code');

          if (accessToken && refreshToken) {
            console.log('[DeepLink] Found access and refresh tokens. Setting session...');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (error) throw error;

            toast.success('Successfully authenticated! 🔐');
            router.push('/dashboard');
            router.refresh();
          } else if (code) {
            console.log('[DeepLink] Found auth code. Exchanging for session...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) throw error;

            toast.success('Successfully authenticated! 🔐');
            router.push('/dashboard');
            router.refresh();
          } else {
            console.warn('[DeepLink] No auth tokens or code found in URL:', urlStr);
          }
        } catch (err: any) {
          console.error('Deep link auth error:', err);
          toast.error(`Auth sync failed: ${err.message || err}`);
        }
      });
    };

    setupDeepLinks();

    return () => {
      cleanupPTR();
      if (activeListener) {
        activeListener.remove();
      }
    };
  }, [router, supabase]);

  return null;
}
