const map = L.map("map").setView([16.8661, 96.1951], 7);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom:19,
    attribution:"© OpenStreetMap"
}).addTo(map);

// User GPS
if(navigator.geolocation){

    navigator.geolocation.getCurrentPosition(function(position){

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        L.marker([lat,lng])
            .addTo(map)
            .bindPopup("📍 Your Location")
            .openPopup();

        map.setView([lat,lng],12);

    });
const API_URL = "https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=customers";

fetch(API_URL)
.then(response => response.json())
.then(customers => {

    customers.forEach(customer => {

        if(customer.Latitude && customer.Longitude){

            L.marker([
                Number(customer.Latitude),
                Number(customer.Longitude)
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

})
.catch(error => {

    console.log(error);

});
}
