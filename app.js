const API_URL = "https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=customers";
let customers = [];
let markers = [];
const map = L.map("map").setView([16.8661, 96.1951], 7);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
}).addTo(map);

// Current Location
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

// Load Customers
loadCustomers();

async function loadCustomers(){

    try{

        const response = await fetch(API_URL);

        const customers = await response.json();
console.log(customers);
alert("Customers : " + customers.length);
        customers.forEach(customer=>{

            if(customer.Latitude && customer.Longitude){

                L.marker([
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

            }

        });

        console.log(customers.length + " Customers Loaded");

    }catch(err){

        console.error(err);

    }

}
