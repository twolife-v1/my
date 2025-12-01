const CACHE_NAME = 'waktusolat-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './images/icon-192.png',
    './images/icon-512.png',
    './Takwim-hijri.html',
    './qiblat.html',
    './images/subuh.jpg',
    './images/zohor.jpg',
    './images/asar.jpg',
    './images/maghrib.jpg',
    './images/isyak.jpg',
    './images/offline.jpg',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[SW] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(self.location.origin)) return;
    event.respondWith(
        fetch(event.request)
            .then((response) => response)
            .catch(() => caches.match(event.request))
    );
});
