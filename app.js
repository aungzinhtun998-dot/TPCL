// ================================
// TPCL v4.0
// Part 1 - Map + GPS + Load Customer
// ================================

const API_URL = "https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=customers";

let map;
let customers = [];
let markers = [];

let userLat = null;
let userLng = null;

let listOpen = false;

// ================================
// Map
// ================================

map = L.map("map").setView([16.8661,96.1951],7);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom:19,
        attribution:"© OpenStreetMap"
    }
).addTo(map);

// ================================
// Current GPS
// ================================

if(navigator.geolocation){

    navigator.geolocation.getCurrentPosition(

        function(position){

            userLat = position.coords.latitude;
            userLng = position.coords.longitude;

            L.marker([userLat,userLng])
                .addTo(map)
                .bindPopup("📍 Your Current Location");

            map.setView([userLat,userLng],11);

        },

        function(){

            console.log("GPS Permission Denied");

        }

    );

}

// ================================
// Floating GPS Button
// ================================

function goCurrentLocation(){

    if(!navigator.geolocation){

        alert("GPS Not Supported");
        return;

    }

    navigator.geolocation.getCurrentPosition(function(position){

        userLat = position.coords.latitude;
        userLng = position.coords.longitude;

        map.setView([userLat,userLng],15);

    });

}

// ================================
// Load Customer
// ================================

loadCustomers();

async function loadCustomers(){

    try{

        const response = await fetch(API_URL);

        customers = await response.json();

        showCustomers();

    }

    catch(error){

        console.error(error);

        alert("Cannot Load Customer Data");

    }

}

// ================================
// Show Customer Marker
// ================================

function showCustomers(){

    markers.forEach(marker=>{

        map.removeLayer(marker);

    });

    markers=[];

    customers.forEach(customer=>{

        if(!customer.Latitude || !customer.Longitude) return;

        const marker = L.marker([

            Number(customer.Latitude),
            Number(customer.Longitude)

        ])
        .addTo(map)
        .bindPopup(`
    <div style="min-width:220px">

        <h3 style="margin-bottom:8px;">
            ${customer.Customer_Name}
        </h3>

        🌏 <b>Region:</b> ${customer.Region}<br>
        📍 <b>Township:</b> ${customer.Township}<br>
        🏷 <b>Brand:</b> ${customer.Brand}<br>

        <div id="distance-${customer.Customer_Name.replace(/\s+/g,"")}">
            📏 Calculating...
        </div>

        <br>

        <a
        href="tel:${customer.Phone_Number || ""}"
        style="
        display:inline-block;
        background:#28a745;
        color:white;
        padding:8px 12px;
        border-radius:8px;
        text-decoration:none;
        ">
        📞 Call
        </a>

        <a
        target="_blank"
        href="https://www.google.com/maps/dir/?api=1&destination=${customer.Latitude},${customer.Longitude}"
        style="
        display:inline-block;
        background:#1976D2;
        color:white;
        padding:8px 12px;
        border-radius:8px;
        text-decoration:none;
        margin-left:8px;
        ">
        🧭 Navigate
        </a>

    </div>
`)
.on("popupopen", function(){

    showDistance(customer);

});

        markers.push(marker);

    });

    buildCustomerList();

}
// ================================
// Search Customer
// ================================

function searchCustomer(){

    const keyword = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    if(keyword===""){

        showCustomers();
        return;

    }

    const filtered = customers.filter(customer=>{

        return (

            String(customer.Customer_Name || "").toLowerCase().includes(keyword) ||
            String(customer.Region || "").toLowerCase().includes(keyword) ||
            String(customer.Township || "").toLowerCase().includes(keyword) ||
            String(customer.Brand || "").toLowerCase().includes(keyword)

        );

    });

    showFilteredCustomers(filtered);

}

// ================================
// Show Filtered Customer
// ================================

function showFilteredCustomers(data){

    markers.forEach(marker=>map.removeLayer(marker));

    markers=[];

    data.forEach((customer,index)=>{

        if(!customer.Latitude || !customer.Longitude) return;

        const marker = L.marker([
            Number(customer.Latitude),
            Number(customer.Longitude)
        ])
        .addTo(map)
        .bindPopup(`
            <b>${customer.Customer_Name}</b><br><br>
            🌏 ${customer.Region}<br>
            📍 ${customer.Township}<br>
            🏷 ${customer.Brand}
        `);

        markers.push(marker);

    });

    buildCustomerList(data);

}

// ================================
// Customer List
// ================================

function buildCustomerList(data = customers){

    let html="";

    data.forEach(customer=>{

        html += `
        <div class="customer-item"
            onclick="focusCustomer(${Number(customer.Latitude)},${Number(customer.Longitude)},'${String(customer.Customer_Name).replace(/'/g,"\\'")}')">

            <b>${customer.Customer_Name}</b><br>

            🌏 ${customer.Region}<br>

            📍 ${customer.Township}<br>

            🏷 ${customer.Brand}

        </div>
        `;

    });

    document.getElementById("listContent").innerHTML=html;

}

// ================================
// Focus Customer
// ================================

function focusCustomer(lat,lng,name){

    map.setView([lat,lng],16);

    markers.forEach(marker=>{

        const popup=marker.getPopup();

        if(popup && popup.getContent().includes(name)){

            marker.openPopup();

        }

    });

    toggleList();

}

// ================================
// Bottom Sheet
// ================================

function toggleList(){

    const panel=document.getElementById("customerList");

    listOpen=!listOpen;

    if(listOpen){

        panel.classList.add("show");

    }else{

        panel.classList.remove("show");

    }

}
// ================================
// Distance
// ================================

function showDistance(customer){

    if(userLat==null || userLng==null) return;

    const R = 6371;

    const dLat = (Number(customer.Latitude)-userLat)*Math.PI/180;
    const dLng = (Number(customer.Longitude)-userLng)*Math.PI/180;

    const a =

        Math.sin(dLat/2)*Math.sin(dLat/2)+

        Math.cos(userLat*Math.PI/180)*
        Math.cos(Number(customer.Latitude)*Math.PI/180)*

        Math.sin(dLng/2)*
        Math.sin(dLng/2);

    const c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

    const distance = (R*c).toFixed(1);

    const id = "distance-"+customer.Customer_Name.replace(/\s+/g,"");

    const el = document.getElementById(id);

    if(el){

        el.innerHTML="📏 Distance : "+distance+" km";

    }

}
// ================================
// TPCL PWA - Service Worker
// ================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", function () {

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(function (registration) {

                console.log(
                    "TPCL Service Worker registered:",
                    registration.scope
                );

            })
            .catch(function (error) {

                console.error(
                    "Service Worker registration failed:",
                    error
                );

            });

    });

}
