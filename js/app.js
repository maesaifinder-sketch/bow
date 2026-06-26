/* ===========================================================
   Shopee Product Finder
   Version : 1.0.0
   app.js
=========================================================== */

"use strict";

/* ===========================================================
    Global State
=========================================================== */

const App = {

    products: [],

    filtered: [],

    csvFile: null,

    version: "1.0.0"

};


/* ===========================================================
    DOM
=========================================================== */

const csvInput =
document.getElementById("csvFile");

const importButton =
document.getElementById("btnImport");

const searchInput =
document.getElementById("searchInput");

const totalProducts =
document.getElementById("totalProducts");

const totalResults =
document.getElementById("totalResults");

const productGrid =
document.getElementById("productGrid");

const importStatus =
document.getElementById("importStatus");

const loading =
document.getElementById("loading");


/* ===========================================================
    Startup
=========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    init

);

async function init(){

    console.log(

        "Shopee Product Finder",

        App.version

    );

    await initDatabase();

    bindEvents();

}


/* ===========================================================
    Events
=========================================================== */

function bindEvents(){

    csvInput.addEventListener(

        "change",

        onFileSelected

    );

    importButton.addEventListener(

        "click",

        importCSV

    );

    searchInput.addEventListener(

        "input",

        realtimeSearch

    );

}


/* ===========================================================
    CSV
=========================================================== */

function onFileSelected(event){

    App.csvFile = event.target.files[0];

    if(!App.csvFile){

        return;

    }

    importStatus.innerHTML =

        "ไฟล์ : " +

        App.csvFile.name;

}


async function importCSV(){

    if(!App.csvFile){

        alert("กรุณาเลือกไฟล์");

        return;

    }

    await importCSVFile(App.csvFile);

}

/* ===========================================================
    Search
=========================================================== */

function realtimeSearch(){

    const keyword =

        searchInput.value

        .trim()

        .toLowerCase();

    if(keyword===""){

        App.filtered=[

            ...App.products

        ];

    }

    else{

        App.filtered=

        App.products.filter(item=>{

            return item.name

            .toLowerCase()

            .includes(keyword);

        });

    }

    updateSummary();

    renderProducts();

}


/* ===========================================================
    Render
=========================================================== */

function renderProducts(){

    productGrid.innerHTML="";

    if(

        App.filtered.length===0

    ){

        productGrid.innerHTML=

        `

        <div class="card">

        ไม่พบสินค้า

        </div>

        `;

        return;

    }

    App.filtered.forEach(product=>{

        const card=

        document.createElement("div");

        card.className="product";

        card.innerHTML=

        `

        <img src="${product.img}">

        <div class="product-content">

            <div class="product-title">

            ${product.name}

            </div>

            <div class="product-price">

            ฿ ${product.price}

            </div>

            <div class="product-info">

            ⭐ ${product.rating}

            </div>

            <button

            class="open-btn"

            onclick="openProduct('${product.tiktok_url}')">

            เปิด TikTok

            </button>

        </div>

        `;

        productGrid.appendChild(card);

    });

}


/* ===========================================================
    Summary
=========================================================== */

function updateSummary(){

    totalProducts.innerHTML=

        App.products.length;

    totalResults.innerHTML=

        App.filtered.length;

}


/* ===========================================================
    Product
=========================================================== */

function openProduct(url){

    window.open(

        url,

        "_blank"

    );

}


/* ===========================================================
    Loading
=========================================================== */

function showLoading(){

    loading.classList.remove(

        "hidden"

    );

}

function hideLoading(){

    loading.classList.add(

        "hidden"

    );

}


/* ===========================================================
    Utils
=========================================================== */

function notify(text){

    console.log(text);

}
