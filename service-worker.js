/* ============================================
   Shopee Product Finder
   Service Worker v1.0.0
============================================ */

const CACHE_NAME = "shopee-finder-v2.0.1";

/* Files ที่ต้องเก็บไว้ใช้งาน Offline */

const APP_FILES = [

    "./",
    "./index.html",

    "./manifest.json",

    "./css/app.css",

    "./js/app.js",
    
    "./js/database.js",
    
    "./js/csvImporter.js",

    "./js/vendor/papaparse.min.js",

    "./assets/icon192.png",
    "./assets/icon512.png"

];


/* ============================================
   Install
============================================ */

self.addEventListener("install", event => {

    console.log("Service Worker Installed");

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => {

                return cache.addAll(APP_FILES);

            })

    );

    self.skipWaiting();

});


/* ============================================
   Activate
============================================ */

self.addEventListener("activate", event => {

    console.log("Service Worker Activated");

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {

                        return caches.delete(key);

                    }

                })

            );

        })

    );

    self.clients.claim();

});


/* ============================================
   Fetch
============================================ */

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(

        caches.match(event.request)

            .then(cacheResponse => {

                if (cacheResponse) {
    return cacheResponse;
}

                return fetch(event.request)

                    .then(networkResponse => {

                        const clone = networkResponse.clone();

                        caches.open(CACHE_NAME)

                            .then(cache => {

                                cache.put(event.request, clone);

                            });

                        return networkResponse;

                    })

                    .catch(() => {

                        return caches.match("./index.html");

                    });

            })

    );

});


/* ============================================
   Message
============================================ */

self.addEventListener("message", event => {

    if (event.data === "SKIP_WAITING") {

        self.skipWaiting();

    }

});
