const CACHE_NAME = 'mines-game-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request)));