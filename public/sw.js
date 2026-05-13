// Minimal service worker — exists only to satisfy PWA installability criteria
// (Chrome/Edge require a SW with a fetch handler before firing beforeinstallprompt).
// We intentionally do NOT cache anything to avoid stale content issues.

const VERSION = "v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clear any leftover caches from previous SW versions
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

// Pass-through fetch handler — required for installability, no caching.
self.addEventListener("fetch", (event) => {
  // Let the browser handle everything normally.
  return;
});
