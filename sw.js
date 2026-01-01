/* =========================================
   ULTIMATE SERVICE WORKER FOR MUKMIN.COM
   Version: 2.0 (UPDATED TO FORCE INSTALL TRACKING)
   ========================================= */

// CHANGE 1: Increment this to 'v2' to force everyone's phone to update
const CACHE_NAME = 'mukmin-app-v2';
const DYNAMIC_CACHE = 'mukmin-dynamic-v2';

// 1. ASSETS TO PRE-CACHE (The App Shell)
const ASSETS_TO_CACHE = [
    './',
    './index.html', // <--- CHANGE 2: Ensure this matches your actual file name (usually index.html)
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

// 2. INSTALL EVENT
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activation
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 3. ACTIVATE EVENT (Cleans up v1)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    // If the cache key is NOT v2, delete it (removes v1)
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                        console.log('[Service Worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim(); 
});

// 4. FETCH EVENT
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Bypass API requests
    if (url.origin.includes('api.alquran.cloud') || url.href.includes('nominatim')) {
        return; 
    }

    // NETWORK FIRST FOR HTML (Ensures updates load)
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
                    // CHANGE 3: Fallback also needs to match the correct filename
                    return caches.match('./index.html'); 
                })
        );
        return;
    }

    // STALE-WHILE-REVALIDATE FOR ASSETS
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                return caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
            return cachedResponse || fetchPromise;
        })
    );
});
