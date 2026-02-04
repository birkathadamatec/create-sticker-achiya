const CACHE_NAME = "barcode-label-v7";
const ASSETS = [
  "./",
  "./scan.html",
  "./styles.css?v=7",
  "./scan.js?v=7",
  "./manifest.json?v=7",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            // Ignore cache failures for optional assets.
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
