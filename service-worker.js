const CACHE_VERSION = "v2";
const CACHE_NAME = `myplanner-${CACHE_VERSION}`;

const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-512.png",
  "/img/dropdown-arrow.svg",
  "/img/icons8-calendar-24.png",
  "/img/icons8-drag-handle-90.png",
  "/img/icons8-trash.svg",
  "/img/icons8-flag-96.png",
  "/img/icons8-flag-96-2.png",
  "/img/icons8-edit-96.png",
];

// Install - cache files and skip waiting
self.addEventListener("install", (event) => {
  console.log("[SW] Installing version:", CACHE_VERSION);

  // Force this service worker to become active immediately
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching files");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("[SW] Cache failed:", error);
      })
  );
});

// Activate - delete old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating version:", CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any cache that doesn't match current version
            if (
              cacheName.startsWith("myplanner-") &&
              cacheName !== CACHE_NAME
            ) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        console.log("[SW] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Fetch - network first, then cache (better for updates)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    // Try network first
    fetch(event.request)
      .then((response) => {
        // If successful, update cache with new version
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving from cache:", event.request.url);
            return cachedResponse;
          }
          // Nothing in cache either
          return new Response("Offline - content not available", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});

// Listen for skip waiting message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
