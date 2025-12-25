const CACHE_NAME = 'mukmin-v4'; // Update this version number when you edit files!

// Senarai fail yang WAJIB ada untuk aplikasi berfungsi offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './azan.mp3',
    './Takwim-hijri.html',
    './panduan.html',
    './doa.html',
    './vibes.html',
    './quiz.html',
    './hadith40.html',
    './kutub.html',
    './asbab.html',
    './images/icon-192.png',
    './images/icon-512.png'
];

// 1. INSTALL: Cache fail assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    // NOTE: We removed self.skipWaiting() here so we can control the update via the button
});

// 2. ACTIVATE: Buang cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
    self.clients.claim();
});

// 3. FETCH: Cache First, Network Fallback strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// 4. MESSAGE: Listen for "SKIP_WAITING" signal from index.html
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
