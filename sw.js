const CACHE_NAME = 'mukmin-cache-v2'; // Increment version to force update
const urlsToCache = [
  './',
  './index.html',
  './induk.html',          // Added: Your main file
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
  './asbab.html',
  './tracker.html',            // Added: From your recent update
  './kelebihan_alquran.html'   // Added: From your recent update
];

// Install: Cache all the files listed above
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate: Clean up old caches
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

// Fetch: Network First Strategy (Smart Version)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1. IGNORE APIs (Let the app handle data via IndexedDB)
  if (requestUrl.pathname.startsWith('/v1/') || 
      requestUrl.hostname.includes('api.') || 
      requestUrl.hostname.includes('firebase')) {
    return; // Do not cache API calls in SW
  }

  // 2. Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200) {
          return response;
        }

        // 3. SMART CACHING:
        // Allow caching of own files ('basic') AND external assets like Fonts/Images ('cors')
        const isInternal = response.type === 'basic';
        const isExternalAsset = response.type === 'cors' && (
             requestUrl.hostname.includes('fonts.googleapis.com') ||
             requestUrl.hostname.includes('fonts.gstatic.com') ||
             requestUrl.hostname.includes('githubusercontent.com') // For your fog texture
        );

        if (isInternal || isExternalAsset) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // 4. OFFLINE FALLBACK
        return caches.match(event.request).then(cachedResponse => {
           if (cachedResponse) {
             return cachedResponse;
           }
           // Optional: You could return a custom "offline.html" here if the page isn't found
        });
      })
  );
});
