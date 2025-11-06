// service-worker.js (put at site root)
const CACHE_NAME = 'waktu-solat-v1';
const ASSETS = [
  '/my/', 
  '/my/index.html',
  '/my/manifest.json',
  '/my/Images/icon-192.png',
  '/my/Images/icon-512.png',
  '/my/Images/sunset.jpg', // optional - remove if you don't have it
  '/my/Takwim-hijri.html',
  '/my/qiblat.html'
];

// Install: pre-cache basic assets
self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(()=>{}))
  );
});

// Activate: clean old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())
    ))
  );
  self.clients.claim();
});

// Fetch: navigation -> index.html fallback, for other GET requests prefer cache then network and cache it
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  if (req.method !== 'GET') return;
  // navigation requests -> try network then fallback to cache index.html
  if (req.mode === 'navigate') {
    evt.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
        return res;
      }).catch(() => caches.match('/my/index.html'))
    );
    return;
  }
  // for same-origin assets: try cache first
  evt.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        // cache same-origin GET assets
        if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque' && new URL(req.url).origin === location.origin) {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return networkRes;
      }).catch(()=> cached || new Response('', {status:504}));
    })
  );
});

// Listen for skipWaiting message
self.addEventListener('message', (evt) => {
  if (evt.data && evt.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
