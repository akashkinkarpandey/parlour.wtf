// Minimal app-shell service worker: stale-while-revalidate for same-origin
// GET requests. No hardcoded precache manifest to keep in sync with hashed
// build output -- the cache fills in naturally as pages are visited.
//
// Bumped to v2: a stale-cached "/" document from before a deploy can
// reference /_astro/*.HASH.* asset filenames that the new deploy has
// already deleted (content hashes change when an asset's bytes change),
// so serving that HTML from cache-first breaks the page with 404s until
// the cache happens to refresh. Bumping the cache name purges any such
// stale entries for existing clients as soon as this SW activates.
const CACHE = 'parlour-v2';
const SKIP_PREFIXES = ['/api/'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p))) return;

  // HTML navigations must be network-first, not stale-while-revalidate:
  // the document is what names every other hashed asset it needs, so
  // serving a stale one can point at files that no longer exist. Only
  // fall back to the cached shell when the network is unreachable.
  //
  // response.clone() must run before *anything* starts reading the
  // response body, including the browser itself once it's handed back
  // via respondWith -- cloning inside a separate .then() chain attached
  // to the same fetch() promise races the browser's own consumption and
  // throws "body already used". Doing both in one async function, clone
  // before return, avoids that. Cache.put() also throws for a request
  // whose mode is "navigate", hence keying off the URL string instead.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const forCache = response.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request.url, forCache)));
          }
          return response;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(request.url)) || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then((response) => (response.ok ? cache.put(request, response) : null))
            .catch(() => {})
        );
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response.ok) event.waitUntil(cache.put(request, response.clone()));
        return response;
      } catch {
        return Response.error();
      }
    })()
  );
});
