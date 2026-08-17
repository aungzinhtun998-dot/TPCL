const CACHE_NAME = "tpcl-v11";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];


// ================================
// INSTALL
// ================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(APP_FILES);

            })

    );

    self.skipWaiting();

});


// ================================
// ACTIVATE
// ================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames.map(cacheName => {

                    if (cacheName !== CACHE_NAME) {

                        return caches.delete(cacheName);

                    }

                })

            );

        })

    );

    self.clients.claim();

});


// ================================
// FETCH
// ================================

self.addEventListener("fetch", event => {

    const request = event.request;

    // Only handle GET
    if (request.method !== "GET") {
        return;
    }


    // HTML → Network first
    // This prevents old index.html from getting stuck.
    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)
                .then(response => {

                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, copy);
                        });

                    return response;

                })
                .catch(() => {

                    return caches.match(request);

                })

        );

        return;
    }


    // CSS / JS / images → Cache first
    event.respondWith(

        caches.match(request)
            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }

                return fetch(request)
                    .then(response => {

                        return response;

                    });

            })

    );

});
