/* ==========================================================
   Bow Product Finder
   csvImporter.js v2.0
   Production Build
========================================================== */

"use strict";

const DEBUG = false;

const CSV = {

    file: null,

    parser: null,

    buffer: [],

    totalRows: 0,

    importedRows: 0,

    skippedRows: 0,

    batchSize: 500,

    isImporting: false,

    resumeRow: 0,

    resumeEnabled: true,

    lastSaveTime: 0

};

/* ==========================================================
   Start Import
========================================================== */

CSV.startImport = async function (file) {

    if (!file) {

        throw new Error("No CSV file selected.");

    }

    if (CSV.isImporting) {

        alert("กำลัง Import อยู่");

        return;

    }

    CSV.reset();

    CSV.file = file;
    
    const resume = CSV.loadResume();

if(resume){

    const ok = confirm(

        `พบการนำเข้าที่ยังค้างอยู่\n\n`+

        `นำเข้าแล้ว ${resume.importedRows.toLocaleString()} แถว\n\n`+

        `ต้องการนำเข้าต่อหรือไม่?`

    );

    if(ok){

        CSV.resumeRow =

            resume.importedRows;
            CSV.importedRows =

    CSV.resumeRow;

    }

    else{

        CSV.clearResume();

        CSV.resumeRow = 0;
        
        CSV.lastSaveTime = 0;
        
        CSV.importedRows = 0;

    }

}

    CSV.isImporting = true;

    if (typeof showLoading === "function") {

        showLoading("กำลังนำเข้าข้อมูล...");

    }

    if (typeof updateImportStatus === "function") {

        updateImportStatus("กำลังอ่านไฟล์...");

    }

    if(DEBUG){

    console.log("Import Started");

    console.log(file.name);

    console.log(file.size);

}

    await CSV.parse();

};

/* ==========================================================
   Reset
========================================================== */

CSV.reset = function () {

    CSV.file = null;

    CSV.parser = null;

    CSV.buffer = [];

    CSV.totalRows = 0;

    CSV.importedRows = 0;

    CSV.skippedRows = 0;

    CSV.isImporting = false;

};

/* ==========================================================
   Cancel Import
========================================================== */

CSV.cancel = function () {

    if (CSV.parser) {

        CSV.parser.abort();

    }

    CSV.isImporting = false;

    CSV.buffer = [];

    if(DEBUG){

    console.log("Import Cancelled");

}

};

/* ==========================================================
   Parse CSV
   (Phase 2.2)
========================================================== */

/* ==========================================================
   Parse CSV (Streaming)
========================================================== */

CSV.parse = async function () {

    return new Promise((resolve, reject) => {

        Papa.parse(CSV.file, {

    header: true,

    worker: true,

    skipEmptyLines: true,

    dynamicTyping: false,

    step: async function(result, parser){
    
    CSV.parser = parser;

    CSV.totalRows++;

    if(CSV.totalRows <= CSV.resumeRow){

        return;

    }

    const product = CSV.mapRow(result.data);

    if(product){

        CSV.buffer.push(product);

    }

    if(CSV.buffer.length >= CSV.batchSize){

        parser.pause();

        await CSV.saveBuffer();

        parser.resume();

    }

},

            complete: async function () {

                try {

                    if (CSV.buffer.length > 0) {

                        await CSV.saveBuffer();

                    }

                    await CSV.finish();

                    resolve(true);

                } catch (err) {

                    reject(err);

                }

            },

            error: function (err) {

                reject(err);

            }

        });

    });

};

/* ==========================================================
   Save Buffer
========================================================== */

CSV.saveBuffer = async function () {

    if (CSV.buffer.length === 0) {

        return;

    }

    const batch = [...CSV.buffer];

    // ล้าง Buffer เพื่อรับข้อมูลชุดใหม่
    CSV.buffer.length = 0;

    await DB.saveProducts(batch);

    CSV.importedRows += batch.length;

    CSV.saveResume();

    CSV.updateProgress();

};

/* ==========================================================
   Update Progress
========================================================== */

CSV.updateProgress = function () {

    if (typeof updateImportStatus === "function") {

        updateImportStatus(

            `Import ${CSV.importedRows.toLocaleString()} รายการ`

        );

    }

};

/* ==========================================================
   Map CSV Row
========================================================== */

CSV.mapRow = function (row) {

    if (!row || !row["itemid"]) {

        return null;

    }

    return {

        product_id: String(
            row["itemid"]
        ).trim(),

        name: String(
            row["title"] || ""
        ).trim(),

        shop_name: String(
            row["shop_name"] || ""
        ).trim(),

        price: CSV.parsePrice(
            row["price"]
        ),

        sold: CSV.parseSold(
            row["item_sold"]
        ),

        commission_rate: 0,

        commission_amount: 0,

        product_url: String(
            row["product_link"] || ""
        ).trim(),

        offer_url: String(
            row["product_short link"] || ""
        ).trim(),

        const imageUrl = [
    row["image_link"],
    row["image_link_2"],
    row["image_link_3"],
    row["image_link_4"],
    row["image_link_5"],
    row["image_link_6"],
    row["image_link_7"],
    row["image_link_8"],
    row["image_link_9"],
    row["image_link_10"],
    row["additional_image_link"]
].find(url =>
    url &&
    String(url).trim() !== "" &&
    String(url).trim().toLowerCase() !== "undefined"
);

return {
    product_id: String(row["itemid"]).trim(),
    name: String(row["title"] || "").trim(),
    shop_name: String(row["shop_name"] || "").trim(),
    price: CSV.parsePrice(row["price"]),
    sold: CSV.parseSold(row["item_sold"]),
    commission_rate: 0,
    commission_amount: 0,
    product_url: String(row["product_link"] || "").trim(),
    offer_url: String(row["product_short link"] || "").trim(),

    image_url: imageUrl ? imageUrl.trim() : ""
};

    };

};

CSV.parsePrice = function(value){

    if(!value) return 0;

    value = String(value)
        .replace(/,/g,"")
        .replace(/฿/g,"")
        .trim();

    if(value.includes("พัน")){

        value = parseFloat(value)*1000;

    }

    return Number(value)||0;

};

CSV.parsePercent = function(value){

    if(!value) return 0;

    return Number(

        String(value)

        .replace("%","")

    )||0;

};

CSV.parseMoney=function(value){

    if(!value) return 0;

    value=String(value)

    .replace(/฿/g,"")

    .replace(/,/g,"")

    .trim();

    return Number(value)||0;

};

CSV.parseSold=function(value){

    if(!value) return 0;

    value=String(value).trim();

    if(value.includes("พัน")){

        return parseFloat(value)*1000;

    }

    if(value.includes("หมื่น")){

        return parseFloat(value)*10000;

    }

    if(value.includes("แสน")){

        return parseFloat(value)*100000;

    }

    value=value.replace("+","");

    return Number(value)||0;

};

/* ==========================================================
   Finish Import
========================================================== */

CSV.finish = async function () {

    CSV.clearResume();
    
    DB.clearQueryCache();
    
    CSV.isImporting = false;

    App.totalProducts =

    await DB.countProducts();

App.totalResults =

    App.totalProducts;

App.queryOffset = 0;

App.hasMore = true;

await applyFilters();

    // ซ่อน Loading
    if (typeof hideLoading === "function") {

        hideLoading();

    }

    // แสดงสถานะ
    if (typeof updateImportStatus === "function") {

        updateImportStatus(

            `Import สำเร็จ ${CSV.importedRows.toLocaleString()} รายการ`

        );

    }

    if(DEBUG){

    console.log(

        "Import Finished",

        CSV.importedRows

    );

}

};

/* ==========================================================
   Save Resume
========================================================== */

CSV.saveResume = function(){

    if(!CSV.resumeEnabled){

        return;

    }

    localStorage.setItem(

        "csv_resume",

        JSON.stringify({

            importedRows:

                CSV.importedRows,

            totalRows:

                CSV.totalRows,

            time:

                Date.now()

        })

    );

};

/* ==========================================================
   Load Resume
========================================================== */

CSV.loadResume = function(){

    const text = localStorage.getItem(

        "csv_resume"

    );

    if(!text){

        return null;

    }

    return JSON.parse(text);

};

/* ==========================================================
   Clear Resume
========================================================== */

CSV.clearResume = function(){

    localStorage.removeItem(

        "csv_resume"

    );

};


CSV.startCommissionImport = async function(file){

    const text = await file.text();

    const rows = Papa.parse(text,{header:true, skipEmptyLines:true}).data;

    const db = await DB.getAllProducts();
    const map = new Map(db.map(p=>[String(p.product_id),p]));

    let updated=[];

    rows.forEach(r=>{
        const id = String(r.itemid || r["itemid"] || "").trim();
        const product = map.get(id);

        if(product){
            product.commission_rate = parseFloat(String(r.commission_rate || r["commission"] || r["ค่าคอมมิชชัน"] || 0).replace('%','')) || 0;
            product.commission_amount = Number(String(r.commission_amount || r["commission_amount"] || r["ค่าคอม"] || 0).replace(/[^0-9.]/g,'')) || 0;
            product.offer_url = String(r["product_short link"] || r.offer_url || r["ลิงก์ข้อเสนอ"] || product.offer_url || '').trim();
            updated.push(product);
        }
    });

    await DB.saveProducts(updated);
    alert('อัปเดตค่าคอมแล้ว '+updated.length+' รายการ');
};
