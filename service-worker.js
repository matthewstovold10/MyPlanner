const CACHE_VERSION = "v97";
const CACHE_NAME = `myplanner-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "https://cdn.jsdelivr.net/npm/theme-toggles@4/css/classic.min.css",
  "./manifest.json",
  "./icons/icon-512.png",
  "./icons/icon-512-background.png",
  "./icons/icon-192-background.png",
  "./icons/icon-192.ico",
  "./icons/icon-192-flat.png",
  "./icons/icon-192-transparent.png",
  "./icons/icon-192-flat-try.png",
  "./icons/icon-512-flat.png",
  "./icons/icon-512-white-1.png",
  "./icons/icon-512-white-2.png",
  "./icons/icon-512-white.png",
  "./icons/512-icon-correct.png",
  "./img/dropdown-arrow.svg",
  "./img/icons8-calendar-24.png",
  "./img/icons8-drag-handle-90.png",
  "./img/icons8-trash.svg",
  "./img/icons8-flag-96.png",
  "./img/icons8-flag-96-2.png",
  "./img/icons8-edit-96.png",
];

// Domains that should NEVER be intercepted by the SW.
// Firebase handles its own caching/auth internally — intercepting it
// adds latency and can break requests.
const SKIP_DOMAINS = [
  "firestore.googleapis.com",
  "firebase.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "gstatic.com",
  "firebaseapp.com",
  "googleapis.com",
  "google.com",
  "accounts.google.com",
];

function shouldSkip(url) {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return true;
    return SKIP_DOMAINS.some((d) => hostname.endsWith(d));
  } catch {
    return true;
  }
}

// Install — pre-cache static assets and activate immediately
self.addEventListener("install", (event) => {
  console.log("[SW] Installing:", CACHE_VERSION);
  self.skipWaiting(); // activate straight away, no waiting for old tabs
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.error("[SW] Cache install failed:", err)),
  );
});

// Activate — delete old caches and take control immediately
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating:", CACHE_VERSION);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key.startsWith("myplanner-") && key !== CACHE_NAME) {
              console.log("[SW] Removing old cache:", key);
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch — cache-first for static assets, network-only for everything else
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Let Firebase and other API calls go straight to the network untouched
  if (request.method !== "GET" || shouldSkip(request.url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Serve from cache immediately, refresh in background
        fetch(request)
          .then((fresh) => {
            if (fresh && fresh.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(request, fresh));
            }
          })
          .catch(() => {});
        return cached;
      }

      // Not in cache — fetch from network and cache for next time
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(
          () =>
            new Response("Offline - content not available", {
              status: 503,
              statusText: "Service Unavailable",
            }),
        );
    }),
  );
});

// Allow manual skip-waiting from the page if needed
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
