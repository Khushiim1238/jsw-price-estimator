const CACHE_NAME = 'jsw-estimator-v2'; // Bumped version to clear old cache
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './images.png',
    './elegant-steel-logo.png'
];

self.addEventListener('install', event => {
    // Forces the waiting service worker to become the active service worker immediately
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    // Clean up old caches when a new version is activated
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName); 
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all tabs immediately
    );
});

self.addEventListener('fetch', event => {
    // "Network First, falling back to cache" Strategy
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // If we get a valid response from the internet, update the cache with the new version
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline (network fails), serve from the cache
                return caches.match(event.request);
            })
    );
});
