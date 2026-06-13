// ── NFL Parlay Model — Service Worker ─────────────────────────────────────
// Strategy: Cache-first for static assets, network-first for API calls.
// The app works offline once loaded (no API calls, just stale data).

const CACHE_NAME    = 'nfl-parlay-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/nfl-predictor.jsx',
  '/manifest.json',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800;900&display=swap',
];

// ── Install: pre-cache all static assets ─────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache what we can — ignore failures for CDN assets behind CORS
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => {/* CDN assets may reject, that's OK */})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static, network-first for API ─────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept the Anthropic API or our own proxy — always go to network
  if (url.hostname === 'api.anthropic.com' || url.pathname === '/api/claude') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Google Fonts — network-first with cache fallback
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback — return app shell
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── Background sync: update cache when online ────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() =>
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage('CACHE_CLEARED'))
      )
    );
  }
});
