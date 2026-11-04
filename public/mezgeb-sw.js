/* Mezgeb service worker. Registered only by Mezgeb pages, with scope /mezgeb.
 *
 * It lives at /mezgeb-sw.js (not /mezgeb/sw.js) so that its scope can include
 * the start page /mezgeb itself: a worker may only control paths at or below
 * its own folder, and Next.js serves /mezgeb without a trailing slash.
 *
 * What it caches: the app shell (page HTML, which holds no data, plus hashed
 * JS/CSS/fonts and icons). What it never caches: anything from another origin,
 * which includes every Supabase API call, so financial data stays off disk.
 */

const VERSION = "v2";
const SHELL = `mezgeb-shell-${VERSION}`;
const ASSETS = `mezgeb-assets-${VERSION}`;
const OFFLINE = "/mezgeb/offline.html";
const PRECACHE = ["/mezgeb/manifest.webmanifest", "/mezgeb/icons/icon-192.png", "/mezgeb/icons/icon-512.png"];

// Cloudflare's static assets redirect /mezgeb/offline.html to /mezgeb/offline. A redirected response cannot
// answer a page navigation, so the offline page is stored as a fresh, non-redirected copy under OFFLINE.
async function cacheOfflinePage(cache) {
  const response = await fetch(OFFLINE);
  if (!response.ok) throw new Error("offline page unavailable");
  const body = await response.blob();
  await cache.put(OFFLINE, new Response(body, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => Promise.all([cache.addAll(PRECACHE), cacheOfflinePage(cache)]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("mezgeb-") && k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isMezgebPage(url) {
  return url.pathname === "/mezgeb" || url.pathname.startsWith("/mezgeb/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Other origins (Supabase, Google) go straight to the network, never cached.
  if (url.origin !== self.location.origin) return;

  // Hashed build files never change: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/mezgeb/icons/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Pages and route payloads: network first, then the cached shell, then the offline page.
  if (request.mode === "navigate" || (isMezgebPage(url) && request.headers.get("RSC"))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && isMezgebPage(url) && request.mode === "navigate") {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(url.pathname, { cacheName: SHELL });
          if (cached && request.mode === "navigate") return cached;
          if (request.mode === "navigate") return (await caches.match(OFFLINE)) || Response.error();
          return Response.error();
        }),
    );
  }
});
