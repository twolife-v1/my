// service-worker.js for Waktu Solat Lite PWA

const CACHE_NAME = 'waktu-solat-lite-v1';
const ASSETS = [
  '/',
  '/index.html',
'/manifest.json',
  '/service-worker.js',   // SW itself
  './Images/icon-192.png',
  './Images/icon-512.png',
  './Images/icon-1080.png',
  '/Takwim-hijri.html', // Any extra JS
  // Pre-cache the install popup HTML/CSS/JS if external files
  // If popup is inline, no need, already in main HTML/JS
];

// Install: precache assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching all assets');
      return cache.addAll(ASSETS);
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Fetch: serve cached assets first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(networkResponse => {
          // Optionally cache new requests dynamically
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Optional: listen to push notifications, sync events, etc.
