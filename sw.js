
const CACHE_NAME = 'cmms-pro-v2';
const REPO_NAME = '/sabanour-cmms';

const urlsToCache = [
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/manifest.json`
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', event => {
  // For navigation requests (HTML), try network first, then cache.
  // This prevents white screen due to stale index.html pointing to missing JS chunks.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, response.clone());
             return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For assets (JS, CSS, Images), try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
