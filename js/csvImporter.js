/* ==========================================================
   Bow Product Finder
   csvImporter.js v3.0
========================================================== */

"use strict";

const CSV = {

    file:null,

    parser:null,

    buffer:[],

    batchSize:500,

    importedRows:0,

    totalRows:0,

    isImporting:false

};

/* ==========================================================
   Start Import
========================================================== */

CSV.startCommissionImport = async function(file){

    const rows = await CSV.readCSV(file);

    rows.forEach(row=>{

        const id =
            row["รหัสสินค้า"] ||
            row["สินค้า ID"] ||
            row["itemid"];

        if(!id) return;

        if(!DB.products[id]){
    DB.products[id] = {};
}

const item = DB.products[id];

        item.commission =
            row["ค่าคอมมิชชั่น"] ||
            row["Commission"] ||
            row["อัตราค่าคอมมิชชัน"] ||
            "";

        item.platformCommission =
            row["Platform"] ||
            "";

    });

    renderProducts();

}

CSV.startImport = async function(file){

    if(!file){

        alert("กรุณาเลือกไฟล์ CSV");

        return;

    }

    if(CSV.isImporting){

        alert("กำลัง Import อยู่");

        return;

    }

    CSV.file=file;

    CSV.buffer=[];

    CSV.importedRows=0;

    CSV.totalRows=0;

    CSV.isImporting=true;

    showLoading("กำลัง Import...");

    return CSV.parse();

};

/* ==========================================================
   Parse CSV
========================================================== */

CSV.parse=function(){

    return new Promise((resolve,reject)=>{

        Papa.parse(CSV.file,{

            header:true,

            skipEmptyLines:true,

            worker:true,

            dynamicTyping:false,

            step:async(result,parser)=>{

                CSV.parser=parser;

                CSV.totalRows++;

                const product=CSV.mapRow(result.data);

                if(product){

                    CSV.buffer.push(product);

                }

                if(CSV.buffer.length>=CSV.batchSize){

                    parser.pause();

                    await CSV.saveBuffer();

                    parser.resume();

                }

            },

            complete:async()=>{

                try{

                    if(CSV.buffer.length){

                        await CSV.saveBuffer();

                    }

                    await CSV.finish();

                    resolve();

                }

                catch(e){

                    reject(e);

                }

            },

            error:reject

        });

    });

};

/* ==========================================================
   Save Buffer
========================================================== */

CSV.saveBuffer=async function(){

    if(!CSV.buffer.length){

        return;

    }

    const batch=[...CSV.buffer];

    CSV.buffer=[];

    await DB.saveProducts(batch);

    CSV.importedRows+=batch.length;

    updateImportStatus(

        "Import "+CSV.importedRows.toLocaleString()+" รายการ"

    );

};

/* ==========================================================
   Map CSV Row
========================================================== */

CSV.mapRow = function(row){

    if(!row || !row["รหัสสินค้า"]){
        return null;
    }

    return{

    product_id:String(
        row["รหัสสินค้า"] ||
        row["สินค้า ID"] ||
        row["itemid"] ||
        ""
    ).trim(),

    name:String(
        row["ชื่อสินค้า"] ||
        row["title"] ||
        row["name"] ||
        ""
    ).trim(),

    shop_name:String(
        row["ชื่อร้านค้า"] ||
        row["shop_name"] ||
        ""
    ).trim(),

    price:CSV.parsePrice(
        row["ราคา"] ||
        row["price"] ||
        0
    ),

    sold:CSV.parseSold(
        row["ขาย"] ||
        row["historical_sold"] ||
        row["sold"] ||
        0
    ),

    commission_rate:
        parseFloat(
            String(
                row["อัตราค่าคอมมิชชัน"] ||
                row["commission_rate"] ||
                0
            ).replace("%","")
        ) || 0,

    commission_amount:
        Number(
            String(
                row["คอมมิชชัน"] ||
                row["commission_amount"] ||
                0
            ).replace(/[^0-9.]/g,"")
        ) || 0,

    product_url:String(
        row["ลิงก์สินค้า"] ||
        row["product_link"] ||
        row["product_url"] ||
        ""
    ).trim(),

    offer_url:String(
        row["ลิงก์ข้อเสนอ"] ||
        row["offer_url"] ||
        ""
    ).trim(),

    image_url:String(
        row["รูปสินค้า"] ||
        row["รูป"] ||
        row["image"] ||
        row["image_url"] ||
        row["image_link"] ||
        ""
    ).trim()

};

/* ==========================================================
   Parse Price
========================================================== */

CSV.parsePrice=function(value){

    if(value===undefined || value===null){

        return 0;

    }

    return Number(

        String(value)
        .replace(/,/g,"")
        .replace(/฿/g,"")
        .trim()

    ) || 0;

};

/* ==========================================================
   Parse Sold
========================================================== */

CSV.parseSold=function(value){

    if(value===undefined || value===null){

        return 0;

    }

    return Number(

        String(value)
        .replace(/,/g,"")
        .replace("+","")
        .trim()

    ) || 0;

};

/* ==========================================================
   Finish
========================================================== */

CSV.finish = async function(){

    CSV.isImporting=false;

    DB.clearQueryCache();

    App.totalProducts =
        await DB.countProducts();

    App.totalResults =
        App.totalProducts;

    App.queryOffset = 0;

    App.hasMore = true;

    await applyFilters();

    hideLoading();

    updateImportStatus(

        "Import สำเร็จ " +
        CSV.importedRows.toLocaleString() +
        " รายการ"

    );

};

/* ==========================================================
   Cancel
========================================================== */

CSV.cancel=function(){

    if(CSV.parser){

        CSV.parser.abort();

    }

    CSV.isImporting=false;

    CSV.buffer=[];

};
