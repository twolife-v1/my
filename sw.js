/* =========================================
   ULTIMATE SERVICE WORKER FOR MUKMIN.COM
   Version: 4.0 (FORCE UPDATE FIX)
   ========================================= */

// CHANGED: Version 4 to force your phone to delete the old cache
const CACHE_NAME = 'mukmin-app-v4';
const DYNAMIC_CACHE = 'mukmin-dynamic-v4';

const ASSETS_TO_CACHE = [
    './',
    './index.html',  // <--- This MUST match your file name exactly
    './manifest.json',
    './azan.mp3',
    './qiblat.html',
    './sunnah.html',
    './tracker.html',
    './kelebihan_alquran.html',
    './panduan.html',
    './doa.html',
    './asmaul.html',
    './vibes.html',
    './kisah.html',
    './quiz.html',
    './hadith40.html',
    './kutub.html',
    './asbab.html',
    './settings.html',
    './Takwim-hijri.html',
    './twolife.html',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;600;800&display=swap',
    'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
    'https://raw.githubusercontent.com/nexus-js/cdn/main/fog-texture.png'
];

// 1. INSTALL: Force immediate takeover
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. ACTIVATE: Delete all old caches (v1, v2, v3)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                        console.log('Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 3. FETCH: Network First for HTML
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignore API calls
    if (url.origin.includes('api.alquran.cloud') || url.href.includes('nominatim')) return;

    // HTML Pages: Try Network -> Fail to Cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // IF OFFLINE: Load the cached index.html
                    return caches.match('./index.html');
                })
        );
        return;
    }

    // Static Assets: Cache First
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                return caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
