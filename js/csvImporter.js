/* ==========================================================
   Shopee Product Finder
   csvImporter.js
========================================================== */

"use strict";

const CSVImporter = {

    BATCH_SIZE: 500,

    rows: [],

    imported: 0

};


/* ==========================================================
    Import CSV
========================================================== */

async function importCSVFile(file){

    if(!file){

        alert("กรุณาเลือกไฟล์ CSV");

        return;

    }

    CSVImporter.rows=[];

    CSVImporter.imported=0;

    showLoading();

    importStatus.innerHTML="กำลังอ่านไฟล์...";

    await clearProducts();

    Papa.parse(file,{

    header:true,

    skipEmptyLines:true,

    worker:true,

    dynamicTyping:false,

    complete:async function(results){

        console.log("CSV Rows =", results.data.length);

        console.log("First Row =", results.data[0]);

        CSVImporter.rows=results.data;

        await saveBatch();

    },

    error:function(error){

        hideLoading();

        console.error(error);

        alert(error.message);

    }

});

}


/* ==========================================================
    Save Batch
========================================================== */

async function saveBatch(){

    const total=CSVImporter.rows.length;

    while(CSVImporter.imported<total){

        const batch=

        CSVImporter.rows.slice(

            CSVImporter.imported,

            CSVImporter.imported+

            CSVImporter.BATCH_SIZE

        );

        const products=batch.map(row=>({

            product_id:String(row.product_id),

            name:row.name,

            cat:row.cat,

            cat_id:row.cat_id,

            price:Number(row.price)||0,

            rating:Number(row.rating)||0,

            sales:Number(row.sales)||0,

            revenue:Number(row.revenue)||0,

            creators:Number(row.creators)||0,

            score:Number(row.score)||0,

            img:row.img,

            tiktok_url:row.tiktok_url

        }));


        // ===== เพิ่มตรงนี้ =====

        console.log("Saving batch", CSVImporter.imported);

        await addProducts(products);

        console.log("Batch OK");

        // =======================


        CSVImporter.imported+=batch.length;

        updateProgress(

            CSVImporter.imported,

            total

        );

        await waitFrame();

    }

    importFinished();

}


/* ==========================================================
    Progress
========================================================== */

function updateProgress(current,total){

    const percent=

    Math.floor(

        current/

        total*

        100

    );

    importStatus.innerHTML=

        `Import ${current.toLocaleString()} / ${total.toLocaleString()} (${percent}%)`;

}


/* ==========================================================
    Finish
========================================================== */

async function importFinished(){

    hideLoading();

    const count=

    await countProducts();

    totalProducts.innerHTML=count;

    totalResults.innerHTML=count;

    importStatus.innerHTML=

    "Import สำเร็จ";

    App.products=

    await getAllProducts();

    App.filtered=

    [...App.products];

    renderProducts();

}


/* ==========================================================
    Helper
========================================================== */

function waitFrame(){

    return new Promise(resolve=>{

        requestAnimationFrame(resolve);

    });

}
