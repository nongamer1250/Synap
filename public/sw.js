const CACHE_NAME = 'synap-cache-v2';
const PRE_CACHE_ASSETS = [
  '/',
  '/icon.svg',
  '/manifest.json'
];

// Install Event - Pre-cache essential files and force activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRE_CACHE_ASSETS).catch((err) => {
          console.warn('Service Worker: Pre-caching bypassed for some assets', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches and claim control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Highly optimized caching strategies (Cache-First & Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // Exclude third-party requests (Supabase, Groq, Google APIs, Ads, etc.)
  if (url.origin !== self.location.origin) return;

  // Exclude Next.js hot-reloading and internal development paths
  if (url.pathname.includes('/_next/webpack-hmr') || url.pathname.includes('/api/')) return;

  // Exclude authentication callbacks
  if (url.pathname.includes('/auth/')) return;

  // 1. Cache-First Strategy for Static Assets (Next.js compiled scripts, styles, fonts, and images)
  const isStaticAsset = 
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2|woff|ttf)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate Strategy for HTML Pages and Next.js RSC Data Payloads
  // This makes page transitions inside the mobile app feel instantaneous (0ms)
  const isPageOrData = 
    url.pathname === '/' || 
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/login') || 
    url.pathname.startsWith('/register') ||
    event.request.headers.get('RSC') === '1' ||
    url.searchParams.has('_rsc');

  if (isPageOrData) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[SW] Background fetch failed for:', url.pathname, err);
          return cachedResponse;
        });

        // Return cached response instantly if available, while refreshing in the background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
