/* ==========================================================
   CampusOne — Service Worker
   Scope-relative, deployment-agnostic (localhost / GitHub
   Pages project path / future custom domain — no host baked in).
   ========================================================== */

const SW_VERSION = "v2";
const STATIC_CACHE = `campusone-static-${SW_VERSION}`;
const RUNTIME_CACHE = `campusone-runtime-${SW_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, RUNTIME_CACHE];

// All paths are relative to this file's own location, so they resolve
// correctly whether the app root is "/", "/CampusOne/", or a custom domain.
const OFFLINE_URL = "./offline.html";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./shared/styles/main.css",
  "./assets/pwa/icon-192.png",
  "./assets/pwa/icon-512.png",
  "./assets/favicon/favicon.ico"
];

// Hosts that should NEVER be cached (auth/API/live data).
const NETWORK_ONLY_HOSTS = [
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebasestorage.googleapis.com"
];

/* ---------------- install ---------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Cache each file independently so one missing/blocked asset
      // (e.g. a font CDN hiccup) can't fail the entire install.
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response.ok) await cache.put(url, response);
          } catch (err) {
            console.warn("[SW] precache skipped:", url, err);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

/* ---------------- activate ---------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("campusone-") && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

/* ---------------- fetch ---------------- */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return; // never intercept writes
  const url = new URL(request.url);

  // 1. Firebase / API calls -> network first, never cached.
  if (NETWORK_ONLY_HOSTS.some((host) => url.hostname.includes(host))) {
    event.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ error: "offline" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )));
    return;
  }

  // 2. Navigations (page loads / route changes) -> network first,
  //    cache fallback, offline page as last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  // 3. Same-origin static assets (css/js/img/fonts) -> cache first,
  //    then revalidate in the background (stale-while-revalidate).
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const networkFetch = fetch(request)
          .then(async (response) => {
            if (response.ok) {
              const cache = await caches.open(RUNTIME_CACHE);
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);

        return cached || (await networkFetch) || Response.error();
      })()
    );
    return;
  }

  // 4. Cross-origin (fonts.gstatic.com etc.) -> network first, cache fallback.
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
        return response;
      })
      .catch(() => caches.match(request))
  );
});
