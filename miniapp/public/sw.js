// Service worker: ilovani o'rnatish mumkin bo'lishi va internet yo'qda ham ochilishi uchun.
// Sahifalar — avval internetdan (yangi narxlar), bo'lmasa keshdan. Statik fayllar — keshdan.
// /api va videolar keshlanmaydi.
const CACHE = 'ts-v1';
const STATIC = /^\/(_next\/static|rasmlar|images|icons)\//;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    // ?order=5, ?source=pwa — bitta sahifa sifatida saqlanadi
    const key = url.origin + url.pathname;
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(() => caches.match(key).then((hit) => hit || caches.match(url.origin + '/')))
    );
    return;
  }

  if (STATIC.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});
