/* ==========================================================
   Bow Product Finder
   searchWorker.js
========================================================== */

"use strict";

let PRODUCTS = [];

self.onmessage = function(event){

    const data = event.data;

    switch(data.action){

        case "init":

            PRODUCTS = data.products || [];

            self.postMessage({

                action:"ready"

            });

        break;

        case "search":

            searchProducts(data);

        break;

    }

};

function searchProducts(data){

    const keyword =

        (data.keyword || "")

        .toLowerCase()

        .trim();

    const result = PRODUCTS.filter(product=>{

        if(keyword){

            const text = (

                String(product.product_id)+" "+

                String(product.name)+" "+

                String(product.shop_name)

            ).toLowerCase();

            if(!text.includes(keyword)){

                return false;

            }

        }

        if(

            product.commission_rate

            <

            data.minCommission

        ){

            return false;

        }

        if(

            product.sold

            <

            data.minSold

        ){

            return false;

        }

        return true;

    });

    self.postMessage({

        action:"result",

        products:result

    });

}