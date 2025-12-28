const CACHE_NAME = 'mukmin-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './azan.mp3',
  './Takwim-hijri.html',
  './qiblat.html',
  './panduan.html',
  './doa.html',
  './asmaul.html',
  './vibes.html',
  './kisah.html',
  './quiz.html',
  './hadith40.html',
  './kutub.html',
  './asbab.html'
];

// Install: Cache all the files listed above
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate: Clean up old caches (like the old 'pipah' ones)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Network First Strategy
// Tries to get fresh files from the internet. If offline, falls back to cache.
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If valid response, clone it to cache (so the cache stays updated)
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), return from cache
        return caches.match(event.request);
      })
  );
});
