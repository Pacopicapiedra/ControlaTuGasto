self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('ctg-cache').then(cache => {
      return cache.addAll(['.', 'index.html', 'style.css', 'main.js', 'xlsx.full.min.js']);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});