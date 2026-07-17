const CACHE_NAME = 'icpd-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }
  // Estrategia Network-First: Intenta primero descargar la última versión de la red
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Guarda una copia fresca en caché para soporte offline
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // Si no hay internet, sirve desde la caché
        return caches.match(e.request);
      })
  );
});
