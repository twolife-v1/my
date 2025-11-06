// service-worker.js
const CACHE_NAME = "waktusolatlite-v1";
const APP_SHELL = [
  "/",                // root
  "/index.html",
  "/manifest.webmanifest",
  "/styles.css",
  "/app.js",
  "/Images/icon-192.png",
  "/Images/icon-512.png",
  "/Images/icon-1024.png",
  // Add other static assets you want offline...
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network → cache fallback
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// 🔄 Auto-reload when new SW installed
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});