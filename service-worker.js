/* 🕌 Waktu Solat Lite Service Worker */
const CACHE_NAME = "wsolat-lite-v1.0.0";
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './style.css',
  
];

// ✅ Install: Precache essential assets
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.warn("[SW] Precache failed:", err))
  );
});

// ✅ Activate: Cleanup old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ✅ Fetch: Cache-first with background update for all except HTML (network-first)
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Handle navigation requests (HTML pages)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Handle all other requests
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // Background update
        fetch(req).then(response => {
          if (response && response.ok && req.method === "GET" && req.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
          }
        }).catch(() => {});
        return cached;
      }

      // Not cached: fetch and cache if successful
      return fetch(req).then(response => {
        if (response && response.ok && req.method === "GET" && req.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
        }
        return response;
      }).catch(() => {
        // Fallbacks
        if (req.destination === "image") {
          // 1×1 transparent PNG fallback
          return new Response(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,
            0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,12,73,68,65,84,8,153,99,
            0,1,0,0,5,0,1,13,10,26,10,0,0,0,0,73,69,78,68,174,66,96,130]),
            { headers: { "Content-Type": "image/png" } });
        }
        return new Response("Offline", { status: 504, statusText: "Offline" });
      });
    })
  );
});

// ✅ Listen for skipWaiting trigger (manual update)
self.addEventListener("message", event => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});ll
