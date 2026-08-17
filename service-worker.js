const CACHE_NAME = "tpcl-v12";

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
            .catch(error => {

                console.error(
                    "Cache install failed:",
                    error
                );

            })

    );

    self.skipWaiting();

});


// ================================
// ACTIVATE
// ================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(cacheName => {

                        if (
                            cacheName !== CACHE_NAME
                        ) {

                            return caches.delete(
                                cacheName
                            );

                        }

                    })

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


// ================================
// FETCH
// ================================

self.addEventListener("fetch", event => {

    const request =
        event.request;

    // Only handle GET requests
    if (request.method !== "GET") {
        return;
    }

    event.respondWith(

        fetch(request)
            .then(response => {

                return response;

            })
            .catch(() => {

                return caches.match(request);

            })

    );

});
