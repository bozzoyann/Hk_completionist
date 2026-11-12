/*
 * Offline support. Site files are loaded from the network first (so a new version shows
 * up on the next reload) and fall back to the cache when offline. Google Fonts are cached.
 */
const VERSION = "hkc-v7";
const SHELL = [
  "./", "index.html", "lore.html", "css/style.css", "favicon.svg", "manifest.webmanifest",
  "js/version.js", "js/aes.js", "js/save.js", "js/data.js", "js/journal-data.js", "js/achievements-data.js", "js/features-data.js", "js/i18n.js", "js/extras.js", "js/app.js",
  "js/background.js", "js/lore-data.js", "js/lore.js", "img/icon-192.png", "img/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;

  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      if (sameOrigin) {
        // Network first, bypassing the HTTP cache, then the offline copy
        try {
          const res = await fetch(req, { cache: "no-cache" });
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          const cached = await cache.match(req, { ignoreSearch: true });
          return cached || Response.error();
        }
      }
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
