// service-worker.js - simple cache-first with network update
const CACHE_NAME = 'waktu-solat-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './Images/icon-192.png',
  './Images/icon-512.png',
  // add any other local resources you rely on (takwim-hijri.html, qiblat.html, CSS images etc)
];

// install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(()=>{}))
  );
});

// activate - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if(k !== CACHE_NAME) return caches.delete(k);
    })))
  );
  self.clients.claim();
});

// fetch - navigation: network-first fallback to cached index; other GET: cache-first then fetch and update cache
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // navigation => try network then fallback to cache (index)
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).then(response => {
        // update cache copy
        caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()).catch(()=>{}));
        return response;
      }).catch(()=> caches.match('./index.html'))
    );
    return;
  }

  // for same-origin GETs, try cache then network and update cache
  if(req.method === 'GET' && url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then(cached => {
        if(cached) {
          // fetch in background to update cache
          fetch(req).then(resp => {
            if(resp && resp.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()).catch(()=>{}));
          }).catch(()=>{});
          return cached;
        }
        return fetch(req).then(response => {
          if(response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()).catch(()=>{}));
          return response;
        }).catch(()=> new Response('', {status:504}));
      })
    );
    return;
  }

  // fallback for everything else
  event.respondWith(fetch(req).catch(()=> caches.match(req)));
});
