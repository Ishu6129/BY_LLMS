const CACHE_NAME = 'pucchu-mines-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request)
          .then(fetchResponse => {
            return caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request.url, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(() => {
        // Fallback for failed requests
        if (event.request.url.endsWith('.html')) {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
});