// Self-destructing service worker.
//
// This app no longer uses a service worker. Offline access is of little use for a
// live financial dashboard, and a cached app shell pinned browsers to an older
// build and hid newly shipped features. Some browsers still have the previous
// worker installed, and they will keep using it until it is explicitly replaced —
// so this file stays deployed purely to evict itself.
//
// It claims control, deletes every cache, unregisters, and reloads any open page
// so the browser fetches the current build from the network.
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) {
        clients.forEach(function (c) { c.navigate(c.url); });
      })
      .catch(function () { /* best effort */ })
  );
});

// Pass everything straight through in the meantime. Nothing is cached or served
// from cache, so this worker can never be the reason a stale page appears.
self.addEventListener('fetch', function () {});
