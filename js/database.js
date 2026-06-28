/*
=========================================================
 Bow Product Finder
 database.js v2.0
 Core + Initialization
=========================================================
*/

"use strict";

const DB = {

    NAME: "BowDatabase",

    VERSION: 2,

    STORE: "products",

    db: null,
    
    BATCH_SIZE: 500,
    
    queryCache: new Map(),

maxCacheSize: 50

};

/* =====================================================
   Open Database
===================================================== */

DB.init = function () {

    return new Promise((resolve, reject) => {

        if (!window.indexedDB) {

            reject("IndexedDB is not supported.");

            return;

        }

        const request = indexedDB.open(

            DB.NAME,

            DB.VERSION

        );

        request.onerror = function (event) {

            console.error(
                "Database Open Error",
                event.target.error
            );

            reject(event.target.error);

        };

        request.onsuccess = function (event) {

            DB.db = event.target.result;

            console.log(
                "Database Ready"
            );

            resolve(DB.db);

        };

        request.onupgradeneeded = function(event){

    DB.db = event.target.result;

    DB.createSchema(event);

};

    });

};

/* =====================================================
   Create Schema
===================================================== */

DB.createSchema = function(event){

    let store;

    if (

        !DB.db.objectStoreNames.contains(

            DB.STORE

        )

    ) {

        store = DB.db.createObjectStore(

            DB.STORE,

            {

                keyPath: "product_id"

            }

        );


    } else {

        store =

        event.target.transaction.objectStore(

            DB.STORE

        );

    }

    DB.createIndexes(store);

};

/* =====================================================
   Create Indexes
===================================================== */

DB.createIndexes = function (store) {

    const indexes = [

        "name",

        "shop_name",

        "commission_rate",

        "sold",

        "price"

    ];

    indexes.forEach(index => {

        if (

            !store.indexNames.contains(index)

        ) {

            store.createIndex(

                index,

                index,

                {

                    unique: false

                }

            );

        }

    });

};

/* =====================================================
   Database Ready ?
===================================================== */

DB.isReady = function () {

    return DB.db !== null;

};

/* =====================================================
   Save Products (Bulk Upsert)
===================================================== */

DB.getAllProducts = function(){
    return new Promise((resolve,reject)=>{
        const tx=DB.db.transaction(DB.STORE,'readonly');
        const req=tx.objectStore(DB.STORE).getAll();
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
    });
};

DB.saveProducts = function (products) {

    if(!Array.isArray(products)){

    return Promise.reject(

        "Products must be an array."

    );

}

if(products.length===0){

    return Promise.resolve(true);

}

    return new Promise((resolve, reject) => {

        if (!DB.db) {

            reject("Database not initialized.");

            return;

        }

        const tx = DB.db.transaction(

            DB.STORE,

            "readwrite"

        );

        const store = tx.objectStore(

            DB.STORE

        );

        products.forEach(product => {

            store.put(product);

        });

        tx.oncomplete = function () {
        
        console.log(

    "Batch Saved:",

    products.length

);

            resolve(true);

        };

        tx.onerror = function (event) {

            console.error(

                "Save Error",

                event.target.error

            );

            reject(

                event.target.error

            );

        };

    });

};

/* =====================================================
   Get All Products
===================================================== */

DB.getAllProducts = function () {

    return new Promise((resolve, reject) => {

        const tx = DB.db.transaction(

            DB.STORE,

            "readonly"

        );

        const store = tx.objectStore(

            DB.STORE

        );

        const request = store.getAll();

        request.onsuccess = function () {

            resolve(

                request.result

            );

        };

        request.onerror = function () {

            reject(

                request.error

            );

        };

    });

};

/* ==========================================================
   Count Products
========================================================== */

DB.countProducts = function(){

    return new Promise((resolve,reject)=>{

        const tx = DB.db.transaction(

            DB.STORE,

            "readonly"

        );

        const store = tx.objectStore(

            DB.STORE

        );

        const request = store.count();

        request.onsuccess = function(){

            resolve(request.result);

        };

        request.onerror = function(){

            reject(request.error);

        };

    });

};

/* =====================================================
   Count Products
===================================================== */

DB.countProducts = function () {

    return new Promise((resolve, reject) => {

        const tx = DB.db.transaction(

            DB.STORE,

            "readonly"

        );

        const store = tx.objectStore(

            DB.STORE

        );

        const request = store.count();

        request.onsuccess = function () {

            resolve(

                request.result

            );

        };

        request.onerror = function () {

            reject(

                request.error

            );

        };

    });

};

/* =====================================================
   Get Product
===================================================== */

DB.getProduct = function (productId) {

    return new Promise((resolve, reject) => {

        const tx = DB.db.transaction(

            DB.STORE,

            "readonly"

        );

        const store = tx.objectStore(

            DB.STORE

        );

        const request = store.get(

            productId

        );

        request.onsuccess = function () {

            resolve(

                request.result

            );

        };

        request.onerror = function () {

            reject(

                request.error

            );

        };

    });

};

/* =====================================================
   Clear Database
===================================================== */

DB.clearProducts = function () {

    return new Promise((resolve, reject) => {

        const tx = DB.db.transaction(

            DB.STORE,

            "readwrite"

        );

        const store = tx.objectStore(

            DB.STORE

        );

        const request = store.clear();

        request.onsuccess = function () {

            resolve(true);

        };

        request.onerror = function () {

            reject(

                request.error

            );

        };

    });

};

/* ==========================================================
   Query Products
========================================================== */

DB.queryProducts = async function(options = {}) {

options = {

    limit: 100,

    offset: 0,

    ...options

};

const cacheKey = JSON.stringify({

    keyword: options.keyword,

    minCommission: options.minCommission,

    minSold: options.minSold,

    sort: options.sort,

    limit: options.limit,

    offset: options.offset

});

if(DB.queryCache.has(cacheKey)){

    return DB.queryCache.get(cacheKey);

}

    return new Promise((resolve, reject) => {
    
    const queryStart = performance.now();

        const tx = DB.db.transaction(
            DB.STORE,
            "readonly"
        );

        const store = tx.objectStore(DB.STORE);

let request;

// ใช้ Index + KeyRange สำหรับค่าคอม
if(
    options.minCommission > 0 &&
    !options.keyword &&
    !options.minSold
){

    const index = store.index("commission_rate");

    request = index.openCursor(

        IDBKeyRange.lowerBound(

            options.minCommission

        )

    );

}

// ใช้ Index + KeyRange สำหรับยอดขาย
else if(
    options.minSold > 0 &&
    !options.keyword &&
    !options.minCommission
){

    const index = store.index("sold");

    request = index.openCursor(

        IDBKeyRange.lowerBound(

            options.minSold

        )

    );

}

// กรณีทั่วไป
else{

    request = store.openCursor();

}

        const products = [];
        
        let skipped = 0;

let loaded = 0;

        request.onsuccess = function(event){

            const cursor = event.target.result;

            if(cursor){

                const product = cursor.value;
                
                if(

    skipped < options.offset

){

    skipped++;

    cursor.continue();

    return;

}

                // Keyword
                if(options.keyword){

                    const keyword =
                        options.keyword.toLowerCase();

                    const matched =

                        String(product.product_id)
                        .toLowerCase()
                        .includes(keyword)

                        ||

                        String(product.name)
                        .toLowerCase()
                        .includes(keyword)

                        ||

                        String(product.shop_name)
                        .toLowerCase()
                        .includes(keyword);

                    if(!matched){

                        cursor.continue();

                        return;

                    }

                }

                // Commission
                if(
                    options.minCommission &&
                    product.commission_rate <
                    options.minCommission
                ){

                    cursor.continue();

                    return;

                }

                // Sold
                if(
                    options.minSold &&
                    product.sold <
                    options.minSold
                ){

                    cursor.continue();

                    return;

                }

                products.push(product);

loaded++;

if(

    loaded >= options.limit

){

    DB.queryCache.set(

        cacheKey,

        products

    );

    if(

        DB.queryCache.size >

        DB.maxCacheSize

    ){

        const firstKey =

            DB.queryCache.keys().next().value;

        DB.queryCache.delete(firstKey);

    }
    
App.performance.queryTime =

    performance.now()

    - queryStart;

App.performance.queryCount++;

    resolve(products);

    return;

}

                cursor.continue();

            }
            else{

    DB.queryCache.set(

        cacheKey,

        products

    );

    if(

        DB.queryCache.size >

        DB.maxCacheSize

    ){

        const firstKey =

            DB.queryCache.keys().next().value;

        DB.queryCache.delete(firstKey);

    }
    
    App.performance.queryTime =

    performance.now()

    - queryStart;

App.performance.queryCount++;

    resolve(products);

}

        };

        request.onerror = function(){

            reject(request.error);

        };

    });

};

/* =====================================================
   Search + Filter
===================================================== */

DB.searchAndFilter = function (options = {}) {

    return new Promise((resolve, reject) => {

        const keyword = (options.keyword || "").trim().toLowerCase();

        const minCommission = Number(options.minCommission || 0);

        const minSold = Number(options.minSold || 0);

        const tx = DB.db.transaction(

            DB.STORE,

            "readonly"

        );

        const store = tx.objectStore(

            DB.STORE

        );

        const request = store.openCursor();

        const result = [];

        request.onerror = function () {

            reject(request.error);

        };

        request.onsuccess = function (event) {

            const cursor = event.target.result;

            if (!cursor) {

                resolve(result);

                return;

            }

            const item = cursor.value;

            let pass = true;

            if (keyword !== "") {

                const text = (

                    String(item.product_id) +

                    " " +

                    String(item.name) +

                    " " +

                    String(item.shop_name)

                ).toLowerCase();

                if (!text.includes(keyword)) {

                    pass = false;

                }

            }

            if (

                Number(item.commission_rate)

                <

                minCommission

            ) {

                pass = false;

            }

            if (

                Number(item.sold)

                <

                minSold

            ) {

                pass = false;

            }

            if (pass) {

                result.push(item);

            }

            cursor.continue();

        };

    });

};

/* =====================================================
   Search Only
===================================================== */

DB.searchProducts = function(keyword){

    return DB.searchAndFilter({

        keyword:keyword

    });

};

/* =====================================================
   Filter Only
===================================================== */

DB.filterProducts=function(options){

    return DB.searchAndFilter(options);

};

/* =====================================================
   Sort
===================================================== */

DB.sortProducts=function(

    products,

    mode

){

    switch(mode){

        case "commission_desc":

            products.sort(

                (a,b)=>

                b.commission_rate

                -

                a.commission_rate

            );

        break;

        case "sold_desc":

            products.sort(

                (a,b)=>

                b.sold-a.sold

            );

        break;

        case "price_desc":

            products.sort(

                (a,b)=>

                b.price-a.price

            );

        break;

        case "price_asc":

            products.sort(

                (a,b)=>

                a.price-b.price

            );

        break;

        case "name_asc":

            products.sort(

                (a,b)=>

                a.name.localeCompare(

                    b.name

                )

            );

        break;

    }

    return products;

};

/* ==========================================================
   Clear Query Cache
========================================================== */

DB.clearQueryCache = function(){

    DB.queryCache.clear();

    console.log(

        "Query Cache Cleared"

    );

};

DB.countQueryProducts = async function(options){

    options = {

        keyword: "",

        minCommission: 0,

        minSold: 0,

        ...options

    };

    const products = await DB.queryProducts({

        ...options,

        limit: 100000000,

        offset: 0

    });

    return products.length;

};

function showPerformance(){

    console.table({

        Render:

            App.performance.renderTime.toFixed(2)+" ms",

        Query:

            App.performance.queryTime.toFixed(2)+" ms",

        RenderBatch:

            App.renderBatch,

        RenderCount:

            App.performance.renderCount,

        QueryCount:

            App.performance.queryCount

    });

}