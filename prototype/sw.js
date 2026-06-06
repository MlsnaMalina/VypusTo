const CACHE = 'vypusto-v5';
const PRECACHE = [
  '/prototype/',
  '/prototype/index.html',
  '/prototype/manifest.json',
  '/prototype/icon.svg',
  '/prototype/icon-maskable.svg',
  '/prototype/icon-192.png',
  '/prototype/icon-512.png',
  '/prototype/icon-maskable-192.png',
  '/prototype/icon-maskable-512.png',
  '/prototype/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() =>
      self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  /* Firebase and Google APIs — always network, never cache */
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic')) return;

  /* Network-first for HTML so updates land immediately; fall back to cache offline */
  const isHTML = e.request.destination === 'document'
              || url.endsWith('.html')
              || url.endsWith('/')
              || url === self.location.origin + '/prototype';

  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  /* Cache-first for everything else (icons, manifest, fonts…) */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
