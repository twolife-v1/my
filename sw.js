const CACHE_NAME = 'waktusolat-v2'; // Changed to v2 to force an update for your users

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    
    // Core Media
    './azan.mp3',             // CRITICAL: Needed for notifications
    './images/icon-192.png',
    './images/icon-512.png',

    // Background Images
    './images/subuh.jpg',
    './images/zohor.jpg',
    './images/asar.jpg',
    './images/maghrib.jpg',
    './images/isyak.jpg',
    './images/offline.jpg',   // Keep this if you have a fallback image

    // Utility Features (Iframes)
    './Takwim-hijri.html',
    './qiblat.html',

    // Content Features (Must match the IDs in your index.html JS)
    './panduan.html',
    './hadith-bukhari.html',
    './hadith-muslim.html',
    './hadith-nawawi.html',
    './hadith-asbabun.html'
];

// 1. Install Event: Cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[SW] Caching all assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// 3. Fetch Event: Cache First Strategy (Faster)
// We check cache first. If it exists, serve it. If not, go to network.
self.addEventListener('fetch', (event) => {
    // Ignore external API calls (Firebase, Aladhan, etc.) - let them go to network
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if found, otherwise fetch from network
                return cachedResponse || fetch(event.request);
            })
    );
});
