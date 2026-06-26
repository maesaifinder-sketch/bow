/* ===========================================================
   Shopee Product Finder
   database.js
   IndexedDB Engine
=========================================================== */

"use strict";

const DB = {

    NAME: "ShopeeFinderDB",

    VERSION: 1,

    DATABASE: null,

    STORES: {

        PRODUCTS: "products",

        SETTINGS: "settings"

    }

};


/* ===========================================================
    Initialize Database
=========================================================== */

async function initDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(

            DB.NAME,

            DB.VERSION

        );

        request.onerror = () => {

            reject("Cannot open database.");

        };

        request.onsuccess = () => {

            DB.DATABASE = request.result;

            console.log("IndexedDB Ready");

            resolve();

        };

        request.onupgradeneeded = (event) => {

            const database = event.target.result;

            /* Products */

            if (!database.objectStoreNames.contains(DB.STORES.PRODUCTS)) {

                const store = database.createObjectStore(

                    DB.STORES.PRODUCTS,

                    {

                        keyPath: "product_id"

                    }

                );

                store.createIndex("name", "name");

                store.createIndex("cat", "cat");

                store.createIndex("price", "price");

                store.createIndex("rating", "rating");

                store.createIndex("sales", "sales");

                store.createIndex("score", "score");

            }

            /* Settings */

            if (!database.objectStoreNames.contains(DB.STORES.SETTINGS)) {

                database.createObjectStore(

                    DB.STORES.SETTINGS,

                    {

                        keyPath: "key"

                    }

                );

            }

        };

    });

}


/* ===========================================================
    Add Product
=========================================================== */

async function addProduct(product) {

    return new Promise((resolve, reject) => {

        const tx =

            DB.DATABASE.transaction(

                DB.STORES.PRODUCTS,

                "readwrite"

            );

        const store =

            tx.objectStore(

                DB.STORES.PRODUCTS

            );

        const request =

            store.put(product);

        request.onsuccess = () => {

            resolve();

        };

        request.onerror = () => {

            reject();

        };

    });

}


/* ===========================================================
    Bulk Insert
=========================================================== */

async function addProducts(products) {

    return new Promise((resolve, reject) => {

        const tx =

            DB.DATABASE.transaction(

                DB.STORES.PRODUCTS,

                "readwrite"

            );

        const store =

            tx.objectStore(

                DB.STORES.PRODUCTS

            );

        products.forEach(item => {

            store.put(item);

        });

        tx.oncomplete = () => {

            resolve();

        };

        tx.onerror = () => {

            reject();

        };

    });

}


/* ===========================================================
    Get All Products
=========================================================== */

async function getAllProducts() {

    return new Promise((resolve, reject) => {

        const tx =

            DB.DATABASE.transaction(

                DB.STORES.PRODUCTS,

                "readonly"

            );

        const store =

            tx.objectStore(

                DB.STORES.PRODUCTS

            );

        const request =

            store.getAll();

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject();

        };

    });

}


/* ===========================================================
    Search Product
=========================================================== */

async function searchProducts(keyword) {

    const data = await getAllProducts();

    if (!keyword) return data;

    keyword = keyword.toLowerCase();

    return data.filter(item =>

        item.name

            .toLowerCase()

            .includes(keyword)

    );

}


/* ===========================================================
    Count Products
=========================================================== */

async function countProducts() {

    return new Promise((resolve, reject) => {

        const tx =

            DB.DATABASE.transaction(

                DB.STORES.PRODUCTS,

                "readonly"

            );

        const store =

            tx.objectStore(

                DB.STORES.PRODUCTS

            );

        const request =

            store.count();

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject();

        };

    });

}


/* ===========================================================
    Clear Database
=========================================================== */

async function clearProducts() {

    return new Promise((resolve, reject) => {

        const tx =

            DB.DATABASE.transaction(

                DB.STORES.PRODUCTS,

                "readwrite"

            );

        const store =

            tx.objectStore(

                DB.STORES.PRODUCTS

            );

        const request =

            store.clear();

        request.onsuccess = () => {

            resolve();

        };

        request.onerror = () => {

            reject();

        };

    });

}