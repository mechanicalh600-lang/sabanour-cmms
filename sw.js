
// Update version to force cache refresh and clean old files
const CACHE_NAME = 'cmms-pro-v24-dynamic';
const REPO_NAME = '/sabanour-cmms';

const urlsToCache = [
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/manifest.json`,
  `${REPO_NAME}/vite.svg`
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation immediately
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
          // Delete old caches to prevent serving stale versions
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
  // Strategy: Network First for HTML, Cache First (Stale-While-Revalidate pattern) for Assets
  
  if (event.request.mode === 'navigate') {
    // 1. Navigation Request (HTML): Try Network -> Cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network works, update cache and return response
          return caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, response.clone());
             return response;
          });
        })
        .catch(() => {
          // If network fails (offline), return cached version
          return caches.match(event.request);
        })
    );
  } else {
    // 2. Asset Request (JS/CSS/Images): Cache First -> Network -> Cache (Dynamic)
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Return cached response if found
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Not in cache? Fetch from network
          return fetch(event.request).then(networkResponse => {
             // Only cache valid responses (status 200) and basic/cors requests
             if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                 const responseToCache = networkResponse.clone();
                 caches.open(CACHE_NAME).then(cache => {
                     cache.put(event.request, responseToCache);
                 });
             }
             return networkResponse;
          });
        })
    );
  }
});
