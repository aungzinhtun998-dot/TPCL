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

            <b>${customer.Customer_Name}</b><br><br>

            🌏 ${customer.Region}<br>
            📍 ${customer.Township}<br>
            🏷 ${customer.Brand}

        `);

        markers.push(marker);

    });

    buildCustomerList();

}
