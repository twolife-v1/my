// service-worker.js — cache-first with update handling
const CACHE_NAME = 'waktu-solat-v1';
const ASSETS = [
  './',
  './index.html',
  './Takwim-hijri.html',
  './qiblat.html',
  './manifest.json',
  './service-worker.js',
  './Images/icon-192.png',
  './Images/icon-512.png',
  // Add more assets you want precached: 
  './apps/your-other-script.js'
];

// Install: precache
self.addEventListener('install', event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(err=>console.warn('SW precache failed', err)))
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    )).then(()=> self.clients.claim())
  );
});

// Fetch: cache-first, then network and update cache
self.addEventListener('fetch', event=>{
  const req = event.request;
  const url = new URL(req.url);

  // For navigation (HTML), prefer network fallback to cache
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).then(r => { 
        // update cache
        caches.open(CACHE_NAME).then(cache => cache.put(req, r.clone()));
        return r;
      }).catch(()=> caches.match('./index.html'))
    );
    return;
  }

  // For other requests: cache-first, then network
  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) {
        // Update cache in background
        fetch(req).then(resp => {
          if(resp && resp.ok && req.method === 'GET' && req.url.startsWith(self.location.origin)){
            caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
          }
        }).catch(()=>{});
        return cached;
      }
      return fetch(req).then(resp => {
        if(resp && resp.ok && req.method === 'GET' && req.url.startsWith(self.location.origin)){
          caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
        }
        return resp;
      }).catch(()=> {
        // final fallback: if image requested return a simple 1x1 transparent PNG (optional)
        if(req.destination === 'image') return new Response('', {status: 204});
        return new Response('', {status: 504});
      });
    })
  );
});

// Listen for skip waiting (update flow)
self.addEventListener('message', (event)=>{
  if(event.data === 'skipWaiting') self.skipWaiting();
});
