const API_URL = "https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=customers";

let customers = [];
let markers = [];
let listOpen = false;

// ======================
// Create Map
// ======================

const map = L.map("map").setView([16.8661, 96.1951], 7);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
}).addTo(map);

// ======================
// Current Location
// ======================

if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(function(position){

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        L.marker([lat, lng])
            .addTo(map)
            .bindPopup("📍 Your Current Location");

        map.setView([lat, lng], 11);

    });

}

// ======================
// Load Customers
// ======================

loadCustomers();

async function loadCustomers(){

    try{

        const response = await fetch(API_URL);

        customers = await response.json();

        customers.forEach(customer => {

            if(customer.Latitude && customer.Longitude){

                const marker = L.marker([
                    parseFloat(customer.Latitude),
                    parseFloat(customer.Longitude)
                ])
                .addTo(map)
                .bindPopup(`
                    <b>${customer.Customer_Name}</b><br>
                    🌏 ${customer.Region}<br>
                    📍 ${customer.Township}<br>
                    🏷 ${customer.Brand}
                `);

                markers.push(marker);

            }

        });

        buildCustomerList();

        console.log(customers.length + " Customers Loaded");

    }catch(err){

        console.error(err);
        alert("Customer Data Load Error");

    }

}

// ======================
// Search Customer
// ======================

function searchCustomer(){

    const keyword = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    if(keyword === "") return;

    for(let i=0;i<customers.length;i++){

        const customer = customers[i];

        if(customer.Customer_Name &&
           customer.Customer_Name.toLowerCase().includes(keyword)){

            map.setView([
                parseFloat(customer.Latitude),
                parseFloat(customer.Longitude)
            ],16);

            markers[i].openPopup();

            return;
        }

    }

}

// ======================
// Customer List
// ======================

function buildCustomerList(){

    let html = "";

    customers.forEach((customer,index)=>{

        html += `
        <div class="customer-item" onclick="focusCustomer(${index})">

            <b>${customer.Customer_Name}</b><br>

            🌏 ${customer.Region}<br>

            📍 ${customer.Township}<br>

            🏷 ${customer.Brand}

        </div>
        `;

    });

    document.getElementById("listContent").innerHTML = html;

}

// ======================
// Focus Customer
// ======================

function focusCustomer(index){

    const customer = customers[index];

    map.setView([
        parseFloat(customer.Latitude),
        parseFloat(customer.Longitude)
    ],16);

    markers[index].openPopup();

    toggleList();

}

// ======================
// Toggle List
// ======================

function toggleList(){

    const panel = document.getElementById("customerList");

    listOpen = !listOpen;

    if(listOpen){

        panel.classList.add("show");

    }else{

        panel.classList.remove("show");

    }

}
