// ✅ FIXED service-worker.js for Waktu Solat Lite PWA
const CACHE_NAME = 'waktu-solat-lite-v1';

const ASSETS = [
  '/my/',
  '/my/index.html',
  '/my/manifest.json',
  '/my/service-worker.js',
  '/my/Images/icon-192.png',
  '/my/Images/icon-512.png',
  '/my/Images/icon-1080.png',
  '/my/Takwim-hijri.html',
  '/my/Images/subuh.jpg',
  '/my/Images/zohor.jpg',
  '/my/Images/asar.jpg',
  '/my/Images/maghrib.jpg',
  '/my/Images/isyak.jpg',
];

// Install
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (response &&
              response.ok &&
              event.request.method === 'GET' &&
              event.request.url.startsWith(self.location.origin)) {

            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, response.clone())
            );
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          if (event.request.destination === 'document') {
            return caches.match('/my/index.html');
          }
        });
    })
  );
});
