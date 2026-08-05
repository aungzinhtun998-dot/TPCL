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

}
