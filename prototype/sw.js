const CACHE = 'vypusto-v4';
const CORE  = ['/prototype/', '/prototype/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() =>
      /* After purging old caches, tell every open tab to reload once so it
         picks up the fresh HTML instead of the SW-cached stale version.    */
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
  /* skip Firebase and Google Fonts — always network */
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic')) return;

  /* Network-first for HTML documents so updates are always picked up */
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
      }).catch(() => caches.match(e.request))  /* offline fallback */
    );
    return;
  }

  /* Cache-first for everything else (fonts, scripts, icons…) */
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
