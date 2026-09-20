/* eslint-disable no-restricted-globals */
/**
 * Study Hub service worker — what turns the website into an *app*.
 *
 * Why it is needed: the app already keeps all study data inside the browser
 * (SQLite as WebAssembly in IndexedDB), so the only thing missing offline was
 * the code itself. This worker keeps a copy of the app shell, so the installed
 * app opens instantly and keeps working with no internet at all.
 *
 * Rules that matter:
 *   - `/api/...` is NEVER cached. On the two static hosts the API is answered
 *     inside the page, and when the app runs against a real Express server it
 *     must always get fresh data.
 *   - navigation requests are network-first: a new deploy is visible at once,
 *     and offline the cached shell is used.
 *   - static assets are stale-while-revalidate: instant start, updated quietly.
 *   - __BUILD__ is replaced with a fresh stamp on every build, so a new deploy
 *     gets a new cache name and old caches are deleted on activate.
 *
 * There is no push/notification logic here on purpose — the app has nothing to
 * push, and a study app should not nag.
 */
const BUILD = '__BUILD__';
const CACHE = `study-hub-${BUILD}`;

// relative to the service-worker scope → works at "/" (Vercel/dev) and at
// "/study-hub/" (GitHub Pages) with the same file
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'fonts/fonts.css',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined) // a missing optional file must not break the install
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('study-hub-') && name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

/** The page asks for this after showing "নতুন version এসেছে". */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isApi = (url) => url.pathname.includes('/api/');
const isSameOrigin = (url) => url.origin === self.location.origin;

async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE);
    cache.put('index.html', fresh.clone());
    return fresh;
  } catch {
    const cache = await caches.open(CACHE);
    const cached = (await cache.match('index.html')) ?? (await cache.match('./'));
    if (cached) return cached;
    throw new Error('offline and no cached shell');
  }
}

async function handleAsset(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  return cached ?? (await network) ?? Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(url) || isApi(url)) return; // the browser handles these normally

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  event.respondWith(handleAsset(request));
});
