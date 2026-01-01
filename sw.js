/* =========================================
   ULTIMATE SERVICE WORKER FOR MUKMIN.COM
   Version: 1.0 (Increment this to force update)
   ========================================= */

const CACHE_NAME = 'mukmin-app-v1';
const DYNAMIC_CACHE = 'mukmin-dynamic-v1';

// 1. ASSETS TO PRE-CACHE (The App Shell)
// These files will be downloaded immediately when the app is installed.
const ASSETS_TO_CACHE = [
    './',
    './indexx.html',
    './manifest.json',
    './azan.mp3', // Important for offline audio
    // We assume these pages exist based on your code references:
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
    // External CDNs (Caching these makes the app load faster)
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;600;800&display=swap',
    'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
    'https://raw.githubusercontent.com/nexus-js/cdn/main/fog-texture.png'
];

// 2. INSTALL EVENT
// Runs once when the user first visits. Caches core files.
self.addEventListener('install', (event) => {
    // console.log('[Service Worker] Installing...');
    self.skipWaiting(); // Force this SW to become active immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // console.log('[Service Worker] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 3. ACTIVATE EVENT
// Runs when the SW starts up. Cleans up old caches from previous versions.
self.addEventListener('activate', (event) => {
    // console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                        // console.log('[Service Worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control of all pages immediately
});

// 4. FETCH EVENT (The Traffic Cop)
// Decides how to handle every network request.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // STRATEGY A: API REQUESTS (Quran Data) -> Network Only
    // We let the app's internal logic (IndexedDB) handle Quran data. 
    // We do NOT want to cache API errors or stale prayer times.
    if (url.origin.includes('api.alquran.cloud') || url.href.includes('nominatim')) {
        return; // Bypass SW, go straight to network
    }

    // STRATEGY B: HTML PAGES -> Network First, Fallback to Cache
    // Ensures user gets the latest layout updates if online.
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
                    // If offline, return cached indexx.html
                    return caches.match('./indexx.html'); 
                })
        );
        return;
    }

    // STRATEGY C: STATIC ASSETS (Fonts, JS, Images, Audio) -> Stale-While-Revalidate
    // Serve from cache instantly, but update the cache in the background for next time.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                return caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
            // Return cached response if found, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
