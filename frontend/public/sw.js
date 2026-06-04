const CACHE_NAME = 'gitjourney-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force active immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim all clients immediately
  );
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests and skip browser extensions/external API calls
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy: Try to get latest from network first
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If response is valid, clone and cache it
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed (offline), fallback to cache
        return caches.match(e.request);
      })
  );
});
