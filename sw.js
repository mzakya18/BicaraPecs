/* Fungsi: Mengatur cache berkas PWA Bicara PECS untuk akses offline dengan versi terpusat.
   Batasan: Hanya mengelola penyimpanan cache berkas aplikasi, bukan data pengguna. */

const CACHE_VERSION = 'v20';
const CACHE_NAME = `bicara-pecs-${CACHE_VERSION}`;

const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './css/theme.css',
    './css/base.css',
    './js/config.js',
    './js/main.js',
    './js/data/defaultCards.js',
    './js/data/arasaacDict.js',
    './js/storage/localStore.js',
    './js/storage/idbStore.js',
    './js/storage/storageService.js',
    './js/storage/backupValidator.js',
    './js/lock/pinLock.js',
    './js/lock/childLock.js',
    './js/shared/helpers.js',
    './js/shared/speech.js',
    './js/shared/errorHandler.js',
    './js/features/registry.js',
    './js/features/theme/index.js',
    './js/features/history/index.js',
    './js/features/sentence/index.js',
    './js/features/cards/index.js',
    './js/features/backup/index.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key.startsWith('bicara-pecs-') && key !== CACHE_NAME)
                    .map((oldKey) => caches.delete(oldKey))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                const isSameOrigin = event.request.url.startsWith(self.location.origin);
                if (isSameOrigin && networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match('./index.html');
            });
        })
    );
});
