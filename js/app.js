/* ==========================================================
   Bow Product Finder
   app.js v2.0
   Production Build
========================================================== */

"use strict";

/* ==========================================================
   Application State
========================================================== */

const App = {

    version: "2.0.0",

    initialized: false,
    
    searchWorker: null,

    filtered: [],
    
    totalProducts: 0,

totalResults: 0,

lastRenderTime: 0,

maxRenderBatch: 100,

minRenderBatch: 20,

queryOffset: 0,

renderQueue: [],

renderRunning: false,

performance:{

    renderTime:0,

    queryTime:0,

    renderCount:0,

    queryCount:0

},

renderBatch: 20,

queryWorker: null,

loadingMore: false,

prefetchRunning: false,

prefetchData: [],

hasMore: true,

    csvFile: null,

    loading: false,

    keyword: "",

    minCommission: 0,

    minSold: 0,

    sortMode: "commission_desc",

    visibleCount: 50,

loadSize: 50,

renderedCount: 0,

maxRendered: 500,

removeBatch: 100,

virtual:{

    itemHeight:260,

    buffer:10,

    startIndex:0,

    endIndex:0

}

};

/* ==========================================================
   Search Debounce
========================================================== */

let searchTimer = null;

/* ==========================================================
   DOM Cache
========================================================== */

const UI = {

    csvFile:

        document.getElementById("csvFile"),

    btnImport:

        document.getElementById("btnImport"),

    btnReset:

        document.getElementById("btnReset"),

    btnExport:

        document.getElementById("btnExport"),

    searchInput:

        document.getElementById("searchInput"),

    commissionInput:

        document.getElementById("commissionInput"),

    soldInput:

        document.getElementById("soldInput"),

    sortSelect:

        document.getElementById("sortSelect"),

    totalProducts:

        document.getElementById("totalProducts"),

    totalResults:

        document.getElementById("totalResults"),

    importStatus:

        document.getElementById("importStatus"),

    loading:

        document.getElementById("loading"),

    productGrid:

    document.getElementById("productGrid"),

scrollContainer:

    document.getElementById("scrollContainer"),

virtualSpacer:

    document.getElementById("virtualSpacer"),

pageInfo:

    document.getElementById("pageInfo"),


loadMoreStatus:

    document.getElementById("loadMoreStatus")
    
};    

/* ==========================================================
   Check Required Elements
========================================================== */

function checkUI(){

    const required=[

        "csvFile",

        "btnImport",

        "searchInput",

        "productGrid"

    ];

    required.forEach(id=>{

        if(!UI[id]){

            console.error(

                "Missing Element :",

                id

            );

        }

    });

}
/* ==========================================================
   Startup
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    init

);

async function init(){

    try{

        console.log(

            "Bow Product Finder",

            App.version

        );

        checkUI();

        await DB.init();
        

/*
App.searchWorker = new Worker(
    "searchWorker.js"
);
*/

/*App.searchWorker.onmessage=function(event){

    switch(event.data.action){

        case "ready":

            console.log(

                "Worker Ready"

            );

        break;

        case "result":

            App.filtered=

                event.data.products;

            sortProducts();

            updateSummary();

            renderProducts();

        break;

    }

};*/

await loadProducts();

setInterval(

    showPerformance,

    5000

);

bindEvents();

        App.initialized=true;

        console.log(

            "Application Ready"

        );

    }

    catch(error){

        console.error(error);

        alert(

            "ไม่สามารถเริ่มระบบได้"

        );

    }

}
/* ==========================================================
   Load Products
========================================================== */

async function loadProducts(){

    App.totalProducts =

        await DB.countProducts();

    App.filtered = [];

    App.visibleCount = App.loadSize;

    App.renderedCount = 0;

    updateSummary();

    await applyFilters();

}

/* ==========================================================
   Bind Events
========================================================== */

function bindEvents(){

    // เลือกไฟล์ CSV
    if(UI.csvFile){

        UI.csvFile.addEventListener(
            "change",
            onFileSelected
        );

    }

    // ปุ่ม Import
    if(UI.btnImport){

        UI.btnImport.addEventListener(
            "click",
            importCSV
        );

    }

    // ค้นหา
    if(UI.searchInput){

        UI.searchInput.addEventListener(
            "input",
            debounceSearch
        );

    }

    // Filter ค่าคอม
    if(UI.commissionInput){

        UI.commissionInput.addEventListener(
            "input",
            e=>{

                setCommission(
                    e.target.value
                );

            }

        );

    }

    // Filter ยอดขาย
    if(UI.soldInput){

        UI.soldInput.addEventListener(
            "input",
            e=>{

                setSold(
                    e.target.value
                );

            }

        );

    }

    // Sort
    if(UI.sortSelect){

        UI.sortSelect.addEventListener(
            "change",
            e=>{

                App.sortMode=
                e.target.value;

                applyFilters();

            }

        );

    }

    // Reset Database
    if(UI.btnReset){

        UI.btnReset.addEventListener(
            "click",
            resetDatabase
        );

    }

    // Export CSV
    if(UI.btnExport){

        UI.btnExport.addEventListener(
            "click",
            exportCSV
        );

    }

if(UI.scrollContainer){

    UI.scrollContainer.addEventListener(

        "scroll",

        handleScroll,

        {

            passive:true

        }

    );

}
}

/* ==========================================================
   Select CSV
========================================================== */

function onFileSelected(event){

    App.csvFile=

    event.target.files[0];

    if(!App.csvFile){

        return;

    }

    UI.importStatus.textContent=

        App.csvFile.name;

}
/* ==========================================================
   Import CSV
========================================================== */

async function importCSV(){

    if(!App.csvFile){

        alert(

            "กรุณาเลือกไฟล์"

        );

        return;

    }

    await CSV.startImport(

        App.csvFile

    );

}

/* ==========================================================
   Debounce Search
========================================================== */

function debounceSearch(){

    clearTimeout(searchTimer);

    searchTimer = setTimeout(

        realtimeSearch,

        250

    );

}

/* ==========================================================
   Search Engine (Web Worker)
========================================================== */

async function realtimeSearch(){

    App.keyword =

        UI.searchInput.value

        .trim()

        .toLowerCase();

    if(!App.searchWorker){

        await applyFilters();

        return;

    }

    /*App.searchWorker.postMessage({

    action:"search",

    keyword:App.keyword,

    minCommission:App.minCommission,

    minSold:App.minSold

});*/

}

/* ==========================================================
   Apply Filters
========================================================== */

async function applyFilters(){

    App.queryOffset = 0;

    App.filtered = await DB.queryProducts({

        keyword: App.keyword,

        minCommission: App.minCommission,

        minSold: App.minSold,

        sort: App.sortMode,

        limit: App.loadSize,

        offset: App.queryOffset

    });

    App.queryOffset = App.filtered.length;

App.prefetchData = [];

App.hasMore =

    App.filtered.length === App.loadSize;

App.totalResults =

    await DB.countQueryProducts({

        keyword: App.keyword,

        minCommission: App.minCommission,

        minSold: App.minSold

    });

updateSummary();

renderProducts();

}

/* ==========================================================
   Sort
========================================================== */

function sortProducts(){

    switch(App.sortMode){

        case "commission_desc":

            App.filtered.sort(

                (a,b)=>

                b.commission_rate-

                a.commission_rate

            );

        break;

        case "sold_desc":

            App.filtered.sort(

                (a,b)=>

                b.sold-a.sold

            );

        break;

        case "price_desc":

            App.filtered.sort(

                (a,b)=>

                b.price-a.price

            );

        break;

        case "price_asc":

            App.filtered.sort(

                (a,b)=>

                a.price-b.price

            );

        break;

    }

}

async function setCommission(value){

    App.minCommission =

        Number(value) || 0;

    await applyFilters();

}

async function setSold(value){

    App.minSold =

        Number(value) || 0;

    await applyFilters();

}

/* ==========================================================
   Render Products (Append Mode)
========================================================== */

function renderProducts(){

    if(App.filtered.length===0){

        UI.productGrid.innerHTML=`

            <div class="empty">

                ไม่พบสินค้า

            </div>

        `;

        App.renderedCount=0;

        return;

    }

    if(App.renderedCount===0){

        UI.productGrid.innerHTML="";

    }

    const fragment=document.createDocumentFragment();
    
    const startTime = performance.now();

    const end = Math.min(

    App.renderedCount + App.renderBatch,

    App.filtered.length

);

    for(

        let i=App.renderedCount;

        i<end;

        i++

    ){

        fragment.appendChild(

            createProductCard(

                App.filtered[i]

            )

        );

    }

    UI.productGrid.appendChild(fragment);
    
    App.lastRenderTime =

    performance.now() -

    startTime;
    
    App.performance.renderTime =
    App.lastRenderTime;

App.performance.renderCount++;
    
    if(App.lastRenderTime > 16){

    App.renderBatch = Math.max(

        App.minRenderBatch,

        App.renderBatch - 10

    );

}
else{

    App.renderBatch = Math.min(

        App.maxRenderBatch,

        App.renderBatch + 10

    );

}

App.renderedCount=end;

runWhenIdle(()=>{

    notify(

        `แสดง ${end.toLocaleString()} / ${App.filtered.length.toLocaleString()} รายการ`

    );

    cleanupOldCards();

});

if(

    App.renderedCount <

    App.filtered.length

){

    requestAnimationFrame(

        renderProducts

    );

}

}

function runWhenIdle(task){

    if("requestIdleCallback" in window){

        requestIdleCallback(task);

    }

    else{

        setTimeout(task, 0);

    }

}

/* ==========================================================
   Product Card
========================================================== */

function createProductCard(product){

    const card=document.createElement("div");

    card.className="product";

    card.innerHTML=`

        ${
    product.image_url
        ? `<img loading="lazy" src="${product.image_url}" alt="">`
        : ""
}

        <div class="product-body">

            <div class="title">

                ${product.name}

            </div>

            <div>

                ร้าน :

                ${product.shop_name}

            </div>

            <div>

                ราคา :

                ฿${product.price.toLocaleString()}

            </div>

            <div>

                ขาย :

                ${product.sold.toLocaleString()}

            </div>

            <div>

                คอม :

                ${product.commission_rate}%

            </div>

            <div>

                ฿${product.commission_amount.toLocaleString()}

            </div>

            <button

                onclick="openProduct(

                '${product.offer_url}'

                )">

                เปิดสินค้า

            </button>

        </div>

    `;

    return card;

}

/* ==========================================================
   Reset Database
========================================================== */

async function resetDatabase(){

    const ok = confirm(

        "คุณต้องการลบสินค้าทั้งหมดใช่หรือไม่?"

    );

    if(!ok){

        return;

    }

    try{

        showLoading("กำลังลบข้อมูล...");

        await DB.clearProducts();
        
        DB.clearQueryCache();

        App.filtered=[];

        updateSummary();

        renderProducts();

        hideLoading();

        UI.importStatus.textContent=

            "ลบข้อมูลทั้งหมดแล้ว";

    }

    catch(error){

        console.error(error);

        hideLoading();

        alert("ลบข้อมูลไม่สำเร็จ");

    }

}

/* ==========================================================
   Export CSV
========================================================== */

function exportCSV(){

    if(App.filtered.length===0){

        alert("ไม่มีข้อมูล");

        return;

    }

    const header=[

        "รหัสสินค้า",

        "ชื่อสินค้า",

        "ร้านค้า",

        "ราคา",

        "ขาย",

        "ค่าคอม (%)",

        "ค่าคอม"

    ];

    const rows=

    App.filtered.map(product=>[

        product.product_id,

        product.name,

        product.shop_name,

        product.price,

        product.sold,

        product.commission_rate,

        product.commission_amount

    ]);

    const csv=[header,...rows]

    .map(r=>r.join(","))

    .join("\n");

    const blob=new Blob(

        [csv],

        {

            type:"text/csv;charset=utf-8;"

        }

    );

    const url=

    URL.createObjectURL(blob);

    const a=

    document.createElement("a");

    a.href=url;

    a.download="products.csv";

    a.click();

    URL.revokeObjectURL(url);

}

/* ==========================================================
   Loading
========================================================== */

function showLoading(text="กำลังทำงาน..."){

    App.loading = true;

    if(UI.loading){

        UI.loading.classList.remove("hidden");

    }

    if(UI.importStatus){

        UI.importStatus.textContent = text;

    }

}

function hideLoading(){

    App.loading = false;

    if(UI.loading){

        UI.loading.classList.add("hidden");

    }

}

/* ==========================================================
   Update Summary
========================================================== */

function updateSummary(){

    if(UI.totalProducts){

        UI.totalProducts.textContent =
            App.totalProducts.toLocaleString();

    }

    if(UI.totalResults){

        UI.totalResults.textContent =
            App.totalResults.toLocaleString();

    }

}

function showPerformance(){

    console.table({

        Render:

            App.performance.renderTime.toFixed(2) + " ms",

        Query:

            App.performance.queryTime.toFixed(2) + " ms",

        RenderBatch:

            App.renderBatch,

        RenderCount:

            App.performance.renderCount,

        QueryCount:

            App.performance.queryCount

    });

}

/* ==========================================================
   Open Product
========================================================== */

function openProduct(url){

    if(!url){

        notify("ไม่พบลิงก์สินค้า","warning");

        return;

    }

    window.open(
        url,
        "_blank"
    );

}

/* ==========================================================
   Notification
========================================================== */

function notify(message,type="info"){

    if(UI.importStatus){

        UI.importStatus.textContent=

            message;

    }

    if(UI.loadMoreStatus){

        UI.loadMoreStatus.textContent=

            message;

    }

    console.log(

        `[${type}]`,

        message

    );

}

/* ==========================================================
   Infinite Scroll
========================================================== */

async function handleScroll(){

    if(App.loadingMore){

        return;

    }

    const container=UI.scrollContainer;

    if(!container){

        return;

    }

    const scrollTop = container.scrollTop;

const scrollHeight = container.scrollHeight;

const clientHeight = container.clientHeight;

const remain =

    scrollHeight -

    scrollTop -

    clientHeight;

// โหลดเพิ่มเมื่อใกล้ถึงท้าย
if(remain < 500){

    loadMoreProducts();

}

// Prefetch เมื่อเลื่อนเกินประมาณ 70%
if(

    !App.prefetchRunning &&

    App.prefetchData.length === 0 &&

    App.hasMore

){

    const percent =

        scrollTop /

        (scrollHeight - clientHeight);

    if(percent >= 0.7){

    runWhenIdle(()=>{

        prefetchNextPage();

    });

}

}

}

/* ==========================================================
   Load More
========================================================== */

async function loadMoreProducts(){

    if(App.loadingMore){

        return;

    }

    if(!App.hasMore){

        return;

    }

    App.loadingMore = true;

    notify("กำลังโหลดสินค้า...");

    let products;

if(App.prefetchData.length > 0){

    products = App.prefetchData;

    App.prefetchData = [];

}

else{

    products = await DB.queryProducts({

        keyword: App.keyword,

        minCommission: App.minCommission,

        minSold: App.minSold,

        sort: App.sortMode,

        limit: App.loadSize,

        offset: App.queryOffset

    });

}

    App.hasMore =

    products.length ===

    App.loadSize;

if(products.length > 0){

    App.filtered.push(

        ...products

    );

    App.queryOffset +=

        products.length;

    renderProducts();

}

    App.loadingMore = false;

    notify("");

}

async function prefetchNextPage(){

    if(App.prefetchRunning){

        return;

    }

    if(App.prefetchData.length > 0){

        return;

    }

    if(!App.hasMore){

        return;

    }

    App.prefetchRunning = true;

    App.prefetchData = await DB.queryProducts({

        keyword: App.keyword,

        minCommission: App.minCommission,

        minSold: App.minSold,

        sort: App.sortMode,

        limit: App.loadSize,

        offset: App.queryOffset

    });

    App.prefetchRunning = false;

}

/* ==========================================================
   Memory Cleanup
========================================================== */

function cleanupOldCards(){

    const cards = UI.productGrid.children;

    if(cards.length <= App.maxRendered){

        return;

    }

    const removeCount = Math.min(

        App.removeBatch,

        cards.length - App.maxRendered

    );

    for(let i = 0; i < removeCount; i++){

        UI.productGrid.removeChild(

            UI.productGrid.firstElementChild

        );

    }

App.renderedCount -= removeCount;

if(App.renderedCount<0){

    App.renderedCount=0;
    
    }

}
