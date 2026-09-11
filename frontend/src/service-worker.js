/* Simple network-first service worker for the Room Rent PWA.
 * - Enables installability (has a fetch handler + manifest).
 * - Never caches API or upload responses.
 * - Falls back to the cached app shell when offline. */
const CACHE = 'roomrent-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Do not cache backend traffic.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) return;
  // Only handle same-origin navigations/assets.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/index.html'))
      )
  );
});
