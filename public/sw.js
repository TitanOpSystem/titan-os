// Service worker — offline fallback only, never a source of stale UI.
//
// Deliberately conservative: the app is a live financial dashboard, so showing
// yesterday's build or yesterday's logo is worse than simply requiring a network
// connection. Everything is fetched from the network first, and the cache is only
// consulted when the network fails.
//
// Bump CACHE_NAME to force every client to drop its cached copies on activate.
const CACHE_NAME = 'titanos-v3';

// Only pre-cache things that are useful as an offline fallback. index.html is
// deliberately NOT pre-cached: a stale shell references asset filenames from an
// older build, which is the classic "app won't update" failure.
const ASSETS = ['/manifest.json', '/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Lets the page trigger an immediate takeover after it detects a new build.
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isHtmlRequest(request) {
  return request.mode === 'navigate' ||
    request.destination === 'document' ||
    (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Live data and the version probe must never be served from cache.
  if (url.hostname.endsWith('supabase.co')) return;
  if (url.pathname === '/version.json') return;

  // Navigations bypass the cache entirely so a deploy is picked up on reload.
  // Falling back to a cached shell would pin the user to an older build.
  if (isHtmlRequest(request)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Only store same-origin, fully successful responses. Opaque cross-origin
        // and partial (206) responses can't be replayed reliably.
        if (response.ok && response.type === 'basic' && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
