const CACHE_NAME = "knock-later-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/login",
  "/signup",
  "/manifest.json",
  "/logo.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/maskable-icon.png",
  "/apple-touch-icon.png",
  "/screenshot.png"
];

// Install Event - cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - network first, fallback to cache for pages/assets
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and skip Supabase/API or chrome-extension URLs
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("supabase.co") ||
    event.request.url.startsWith("chrome-extension://")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache new successful requests dynamically
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If offline, return cached asset if available
        return caches.match(event.request);
      })
  );
});
