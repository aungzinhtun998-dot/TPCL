/* =====================================================
   TPCL APP - CLEAN VERSION
   Customer
      ↓
   Vehicle
      ↓
   Tire
      ↓
   Inspection

   Features:
   - Map
   - Customer markers
   - GPS
   - Distance
   - Search
   - Filter
   - Customer List
   - Customer Note
   - Vehicle Note
   - Tire Note
   - Inspection Note
===================================================== */


/* =====================================================
   API
===================================================== */

const API_BASE =
    "https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec";


const CUSTOMER_API =
    API_BASE + "?api=customers";

const VEHICLE_API =
    API_BASE + "?api=vehicles";

const TIRE_API =
    API_BASE + "?api=tires";

const INSPECTION_API =
    API_BASE + "?api=inspections";


/* =====================================================
   GLOBAL
===================================================== */

let map = null;

let customers = [];
let vehicles = [];
let tires = [];
let inspections = [];

let markers = [];

let userLat = null;
let userLng = null;

let currentCustomerData = [];


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initMap();

        setupSearch();

        loadAllData();

        getUserLocation();

    }
);


/* =====================================================
   MAP
===================================================== */

function initMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {

        console.error(
            "TPCL: #map not found."
        );

        return;

    }


    if (map) {

        map.invalidateSize();

        return;

    }


    map = L.map(
        "map",
        {
            zoomControl: true
        }
    ).setView(
        [16.8661, 96.1951],
        7
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    setTimeout(
        () => {

            if (map) {

                map.invalidateSize();

            }

        },
        500
    );

}


/* =====================================================
   SEARCH
===================================================== */

function setupSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );

    if (!input) return;


    input.addEventListener(
        "input",
        () => {

            searchCustomer(
                input.value
            );

        }
    );

}


function searchCustomer(keyword) {

    keyword =
        String(keyword || "")
            .trim()
            .toLowerCase();


    if (!keyword) {

        showCustomers(
            getFilteredCustomers()
        );

        return;

    }


    const result =
        customers.filter(
            customer => {

                const customerID =
                    String(
                        customer.Customer_ID || ""
                    ).toLowerCase();


                const customerName =
                    String(
                        customer.Customer_Name || ""
                    ).toLowerCase();


                const region =
                    String(
                        customer.Region || ""
                    ).toLowerCase();


                const township =
                    String(
                        customer.Township || ""
                    ).toLowerCase();


                const brand =
                    String(
                        customer.Brand || ""
                    ).toLowerCase();


                const note =
                    String(
                        customer.Note || ""
                    ).toLowerCase();


                const customerVehicles =
                    vehicles.filter(
                        vehicle =>
                            sameID(
                                vehicle.Customer_ID,
                                customer.Customer_ID
                            )
                    );


                const vehicleMatch =
                    customerVehicles.some(
                        vehicle => {

                            const number =
                                String(
                                    vehicle.Vehicle_Number || ""
                                ).toLowerCase();


                            const id =
                                String(
                                    vehicle.Vehicle_ID || ""
                                ).toLowerCase();


                            const vehicleNote =
                                String(
                                    vehicle.Note || ""
                                ).toLowerCase();


                            return (
                                number.includes(keyword) ||
                                id.includes(keyword) ||
                                vehicleNote.includes(keyword)
                            );

                        }
                    );


                return (

                    customerID.includes(keyword) ||

                    customerName.includes(keyword) ||

                    region.includes(keyword) ||

                    township.includes(keyword) ||

                    brand.includes(keyword) ||

                    note.includes(keyword) ||

                    vehicleMatch

                );

            }
        );


    showCustomers(result);

}


/* =====================================================
   LOAD DATA
===================================================== */

async function loadAllData() {

    try {

        showLoading();


        const results =
            await Promise.all([
                fetchJSON(CUSTOMER_API),
                fetchJSON(VEHICLE_API),
                fetchJSON(TIRE_API),
                fetchJSON(INSPECTION_API)
            ]);


        customers =
            normalizeData(results[0]);

        vehicles =
            normalizeData(results[1]);

        tires =
            normalizeData(results[2]);

        inspections =
            normalizeData(results[3]);


        console.log(
            "TPCL Customers:",
            customers.length
        );

        console.log(
            "TPCL Vehicles:",
            vehicles.length
        );

        console.log(
            "TPCL Tires:",
            tires.length
        );

        console.log(
            "TPCL Inspections:",
            inspections.length
        );


        buildFilters();


        currentCustomerData =
            customers.slice();


        showCustomers(
            currentCustomerData
        );


        /*

           IMPORTANT:

           Customer List is CLOSED
           when app starts.

        */

        closePanel();


    }
    catch (error) {

        console.error(
            "TPCL LOAD ERROR:",
            error
        );


        const content =
            document.getElementById(
                "listContent"
            );


        if (content) {

            content.innerHTML = `

                <div class="loading">

                    ❌ Cannot load TPCL data.

                    <br><br>

                    Please check Google Apps Script API.

                    <br><br>

                    ${escapeHTML(
                        error.message
                    )}

                </div>

            `;

        }

    }

}


/* =====================================================
   FETCH JSON
===================================================== */

async function fetchJSON(url) {

    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    const data =
        await response.json();


    return data;

}


/* =====================================================
   NORMALIZE DATA
===================================================== */

function normalizeData(data) {

    if (Array.isArray(data)) {

        return data;

    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    if (
        data &&
        Array.isArray(data.values)
    ) {

        return data.values;

    }


    return [];

}


/* =====================================================
   GPS
===================================================== */

function getUserLocation() {

    if (
        !navigator.geolocation
    ) {

        console.log(
            "GPS not supported."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            userLat =
                Number(
                    position.coords.latitude
                );

            userLng =
                Number(
                    position.coords.longitude
                );


            console.log(
                "GPS:",
                userLat,
                userLng
            );


            /*
               Update currently opened popup
               distances.
            */

            updateAllDistances();

        },


        error => {

            console.log(
                "GPS unavailable:",
                error.message
            );

            updateAllDistances();

        },


        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 60000
        }

    );

}


/* =====================================================
   CURRENT LOCATION
===================================================== */

function goCurrentLocation() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "GPS is not supported."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            userLat =
                Number(
                    position.coords.latitude
                );

            userLng =
                Number(
                    position.coords.longitude
                );


            if (!map) {

                initMap();

            }


            map.setView(
                [
                    userLat,
                    userLng
                ],
                15,
                {
                    animate: true
                }
            );


            L.circleMarker(
                [
                    userLat,
                    userLng
                ],
                {
                    radius: 8,

                    weight: 3
                }
            )
                .addTo(map)
                .bindPopup(
                    "📍 Your Current Location"
                );


            updateAllDistances();

        },


        error => {

            alert(
                "Unable to get your current location."
            );

        },


        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0
        }

    );

}


/* =====================================================
   MARKERS
===================================================== */

function clearMarkers() {

    markers.forEach(
        marker => {

            if (
                map &&
                map.hasLayer(marker)
            ) {

                map.removeLayer(
                    marker
                );

            }

        }
    );


    markers = [];

}


/* =====================================================
   SHOW CUSTOMERS
===================================================== */

function showCustomers(
    data = customers
) {

    if (!map) {

        initMap();

    }


    clearMarkers();


    currentCustomerData =
        data.slice();


    data.forEach(
        customer => {

            const lat =
                Number(
                    customer.Latitude
                );

            const lng =
                Number(
                    customer.Longitude
                );


            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                lat === 0 ||
                lng === 0
            ) {

                return;

            }


            const marker =
                L.marker(
                    [
                        lat,
                        lng
                    ]
                ).addTo(map);


            marker.customer =
                customer;


            marker.bindPopup(
                createCustomerPopup(
                    customer
                )
            );


            marker.on(
                "popupopen",
                () => {

                    updateDistanceElement(
                        customer
                    );

                }
            );


            markers.push(
                marker
            );

        }
    );


    buildCustomerList(
        data
    );


    /*
       If filtered result exists,
       fit map to those markers.
    */

    if (
        markers.length > 0 &&
        data.length < customers.length
    ) {

        const group =
            L.featureGroup(
                markers
            );

        map.fitBounds(
            group.getBounds(),
            {
                padding: [40, 40],

                maxZoom: 14
            }
        );

    }

}


/* =====================================================
   CUSTOMER POPUP
===================================================== */

function createCustomerPopup(
    customer
) {

    const id =
        String(
            customer.Customer_ID || ""
        );


    const safeCustomerID =
        escapeJS(id);


    const name =
        customer.Customer_Name ||
        "Unknown Customer";


    const phone =
        customer.Phone_Number ||
        customer.Phone ||
        "";


    const note =
        customer.Note ||
        "";


    const lat =
        Number(
            customer.Latitude
        );


    const lng =
        Number(
            customer.Longitude
        );


    return `

        <div class="tpcl-popup">

            <h3 class="popup-title">

                ${escapeHTML(name)}

            </h3>


            <div class="popup-row">

                🌏
                <b>Region:</b>
                ${escapeHTML(
                    customer.Region
                )}

            </div>


            <div class="popup-row">

                📍
                <b>Township:</b>
                ${escapeHTML(
                    customer.Township
                )}

            </div>


            <div class="popup-row">

                🚛
                <b>Vehicles:</b>
                ${escapeHTML(
                    customer.Vehicle_Count
                )}

            </div>


            <div class="popup-row">

                🏷
                <b>Brand:</b>
                ${escapeHTML(
                    customer.Brand
                )}

            </div>


            <div
                class="popup-row"
                id="distance-${safeID(id)}"
            >

                📏 Calculating...

            </div>


            ${
                note
                    ? `

                    <div class="popup-note">

                        📝
                        <b>Customer Note:</b>

                        <br>

                        ${escapeHTML(note)}

                    </div>

                    `
                    : ""
            }


            <button
                class="popup-vehicle"
                type="button"
                onclick="
                    openCustomerVehicles(
                        '${safeCustomerID}'
                    )
                "
            >

                🚛 View Vehicles

            </button>


            <div class="popup-buttons">

                ${
                    phone
                        ? `

                        <a
                            class="
                                popup-btn
                                popup-call
                            "
                            href="tel:${escapeHTML(
                                phone
                            )}"
                        >

                            📞 Call

                        </a>

                        `
                        : ""
                }


                <a
                    class="
                        popup-btn
                        popup-navigate
                    "
                    target="_blank"
                    rel="noopener"
                    href="
                        https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}
                    "
                >

                    🧭 Navigate

                </a>

            </div>

        </div>

    `;

}


/* =====================================================
   DISTANCE
===================================================== */

function calculateDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lng1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lng2)
    ) {

        return null;

    }


    const R = 6371;


    const dLat =
        (
            lat2 - lat1
        ) *
        Math.PI /
        180;


    const dLng =
        (
            lng2 - lng1
        ) *
        Math.PI /
        180;


    const a =
        Math.sin(
            dLat / 2
        ) ** 2
        +
        Math.cos(
            lat1 *
            Math.PI /
            180
        )
        *
        Math.cos(
            lat2 *
            Math.PI /
            180
        )
        *
        Math.sin(
            dLng / 2
        ) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


/* =====================================================
   UPDATE DISTANCE
===================================================== */

function updateDistanceElement(
    customer
) {

    const id =
        "distance-" +
        safeID(
            customer.Customer_ID
        );


    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    if (
        userLat === null ||
        userLng === null
    ) {

        element.innerHTML =
            "📏 GPS unavailable";

        return;

    }


    const lat =
        Number(
            customer.Latitude
        );

    const lng =
        Number(
            customer.Longitude
        );


    const distance =
        calculateDistance(
            userLat,
            userLng,
            lat,
            lng
        );


    if (distance === null) {

        element.innerHTML =
            "📏 Distance unavailable";

        return;

    }


    element.innerHTML =
        "📏 Distance: " +
        distance.toFixed(1) +
        " km";

}


/* =====================================================
   UPDATE ALL DISTANCES
===================================================== */

function updateAllDistances() {

    currentCustomerData.forEach(
        customer => {

            updateDistanceElement(
                customer
            );

        }
    );

}


/* =====================================================
   CUSTOMER LIST
===================================================== */

function buildCustomerList(
    data
) {

    const container =
        document.getElementById(
            "listContent"
        );


    if (!container) return;


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `

            <div class="loading">

                🔍 No customer found.

            </div>

        `;

        return;

    }


    let html = "";


    data.forEach(
        customer => {

            const lat =
                Number(
                    customer.Latitude
                );

            const lng =
                Number(
                    customer.Longitude
                );


            const customerID =
                String(
                    customer.Customer_ID || ""
                );


            const note =
                customer.Note ||
                "";


            html += `

                <div
                    class="customer-item"
                    onclick="
                        focusCustomer(
                            ${lat},
                            ${lng},
                            '${escapeJS(
                                customerID
                            )}'
                        )
                    "
                >

                    <div class="customer-name">

                        ${escapeHTML(
                            customer.Customer_Name
                        )}

                    </div>


                    <div class="info-line">

                        🌏
                        ${escapeHTML(
                            customer.Region
                        )}

                    </div>


                    <div class="info-line">

                        📍
                        ${escapeHTML(
                            customer.Township
                        )}

                    </div>


                    <div class="info-line">

                        🏷
                        ${escapeHTML(
                            customer.Brand
                        )}

                    </div>


                    ${
                        note
                            ? `

                            <div class="note-box">

                                📝
                                ${escapeHTML(
                                    note
                                )}

                            </div>

                            `
                            : ""
                    }

                </div>

            `;

        }
    );


    container.innerHTML =
        html;

}


/* =====================================================
   FOCUS CUSTOMER
===================================================== */

function focusCustomer(
    lat,
    lng,
    customerID
) {

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        return;

    }


    if (!map) {

        initMap();

    }


    map.setView(
        [
            lat,
            lng
        ],
        16,
        {
            animate: true
        }
    );


    const marker =
        markers.find(
            item => {

                const pos =
                    item.getLatLng();


                return (

                    Math.abs(
                        pos.lat - lat
                    ) < 0.000001

                    &&

                    Math.abs(
                        pos.lng - lng
                    ) < 0.000001

                );

            }
        );


    if (marker) {

        marker.openPopup();

    }


    closePanel();

}


/* =====================================================
   FILTER TOGGLE
===================================================== */

function toggleFilter() {

    const panel =
        document.getElementById(
            "filterPanel"
        );


    if (!panel) return;


    panel.classList.toggle(
        "show"
    );

}


/* =====================================================
   BUILD FILTERS
===================================================== */

function buildFilters() {

    const region =
        document.getElementById(
            "regionFilter"
        );

    const township =
        document.getElementById(
            "townshipFilter"
        );

    const brand =
        document.getElementById(
            "brandFilter"
        );


    if (
        !region ||
        !township ||
        !brand
    ) {

        return;

    }


    const regions =
        uniqueValues(
            customers,
            "Region"
        );


    const townships =
        uniqueValues(
            customers,
            "Township"
        );


    const brands =
        uniqueValues(
            customers,
            "Brand"
        );


    region.innerHTML =
        `<option value="">All Regions</option>` +
        regions
            .map(
                value =>
                    `
                    <option
                        value="${escapeHTML(value)}"
                    >
                        ${escapeHTML(value)}
                    </option>
                    `
            )
            .join("");


    township.innerHTML =
        `<option value="">All Townships</option>` +
        townships
            .map(
                value =>
                    `
                    <option
                        value="${escapeHTML(value)}"
                    >
                        ${escapeHTML(value)}
                    </option>
                    `
            )
            .join("");


    brand.innerHTML =
        `<option value="">All Brands</option>` +
        brands
            .map(
                value =>
                    `
                    <option
                        value="${escapeHTML(value)}"
                    >
                        ${escapeHTML(value)}
                    </option>
                    `
            )
            .join("");

}


/* =====================================================
   UNIQUE FILTER VALUES
===================================================== */

function uniqueValues(
    data,
    field
) {

    return [
        ...new Set(
            data
                .map(
                    item =>
                        String(
                            item[field] || ""
                        ).trim()
                )
                .filter(Boolean)
        )
    ].sort();

}


/* =====================================================
   GET FILTERED CUSTOMERS
===================================================== */

function getFilteredCustomers() {

    const region =
        document.getElementById(
            "regionFilter"
        )?.value || "";


    const township =
        document.getElementById(
            "townshipFilter"
        )?.value || "";


    const brand =
        document.getElementById(
            "brandFilter"
        )?.value || "";


    return customers.filter(
        customer => {

            const customerRegion =
                String(
                    customer.Region || ""
                ).trim();


            const customerTownship =
                String(
                    customer.Township || ""
                ).trim();


            const customerBrand =
                String(
                    customer.Brand || ""
                ).trim();


            return (

                (
                    !region ||
                    customerRegion === region
                )

                &&

                (
                    !township ||
                    customerTownship === township
                )

                &&

                (
                    !brand ||
                    customerBrand === brand
                )

            );

        }
    );

}


/* =====================================================
   APPLY FILTER
===================================================== */

function applyFilters() {

    const filtered =
        getFilteredCustomers();


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (
        searchInput &&
        searchInput.value.trim()
    ) {

        searchCustomer(
            searchInput.value
        );

    }
    else {

        showCustomers(
            filtered
        );

    }


    const panel =
        document.getElementById(
            "filterPanel"
        );


    if (panel) {

        panel.classList.remove(
            "show"
        );

    }

}


/* =====================================================
   CLEAR FILTER
===================================================== */

function clearFilters() {

    const region =
        document.getElementById(
            "regionFilter"
        );

    const township =
        document.getElementById(
            "townshipFilter"
        );

    const brand =
        document.getElementById(
            "brandFilter"
        );

    const search =
        document.getElementById(
            "searchInput"
        );


    if (region) {
        region.value = "";
    }


    if (township) {
        township.value = "";
    }


    if (brand) {
        brand.value = "";
    }


    if (search) {
        search.value = "";
    }


    showCustomers(
        customers
    );

}


/* =====================================================
   CUSTOMER → VEHICLES
===================================================== */

function openCustomerVehicles(
    customerID
) {

    const customer =
        customers.find(
            item =>
                sameID(
                    item.Customer_ID,
                    customerID
                )
        );


    if (!customer) {

        return;

    }


    const customerVehicles =
        vehicles.filter(
            vehicle =>
                sameID(
                    vehicle.Customer_ID,
                    customerID
                )
        );


    showVehiclePanel(
        customer,
        customerVehicles
    );

}


/* =====================================================
   VEHICLE PANEL
===================================================== */

function showVehiclePanel(
    customer,
    data
) {

    const content =
        document.getElementById(
            "listContent"
        );


    const title =
        document.getElementById(
            "panelTitle"
        );


    if (!content) return;


    if (title) {

        title.innerText =
            "Vehicle List";

    }


    let html = `

        <div>

            <button
                class="panel-back-btn"
                onclick="showCustomers()"
            >

                ← Customers

            </button>


            <div
                class="customer-item"
                style="cursor:default"
            >

                <div class="customer-name">

                    ${escapeHTML(
                        customer.Customer_Name
                    )}

                </div>


                <div class="info-line">

                    🌏
                    ${escapeHTML(
                        customer.Region
                    )}

                </div>


                <div class="info-line">

                    📍
                    ${escapeHTML(
                        customer.Township
                    )}

                </div>


                ${
                    customer.Note
                        ? `

                        <div class="note-box">

                            📝
                            <b>Customer Note:</b>

                            <br>

                            ${escapeHTML(
                                customer.Note
                            )}

                        </div>

                        `
                        : ""
                }

            </div>

    `;


    if (
        data.length === 0
    ) {

        html += `

            <div class="loading">

                No vehicle data found.

            </div>

        `;

    }


    data.forEach(
        vehicle => {

            const vehicleID =
                String(
                    vehicle.Vehicle_ID || ""
                );


            const tireCount =
                tires.filter(
                    tire =>
                        sameID(
                            tire.Vehicle_ID,
                            vehicleID
                        )
                ).length;


            html += `

                <div
                    class="customer-item"
                    onclick="
                        openVehicleTires(
                            '${escapeJS(
                                vehicleID
                            )}'
                        )
                    "
                >

                    <div class="customer-name">

                        🚛
                        ${escapeHTML(
                            vehicle.Vehicle_Number
                        )}

                    </div>


                    <div class="info-line">

                        🆔
                        ${escapeHTML(
                            vehicle.Vehicle_ID
                        )}

                    </div>


                    <div class="info-line">

                        🚚
                        ${escapeHTML(
                            vehicle.Vehicle_Type
                        )}

                    </div>


                    <div class="info-line">

                        🛣
                        ${escapeHTML(
                            vehicle.Regular_Route
                        )}

                    </div>


                    <div class="info-line">

                        🛞 Tires:
                        ${tireCount}

                    </div>


                    ${
                        vehicle.Note
                            ? `

                            <div class="note-box">

                                📝
                                <b>Vehicle Note:</b>

                                <br>

                                ${escapeHTML(
                                    vehicle.Note
                                )}

                            </div>

                            `
                            : ""
                    }

                </div>

            `;

        }
    );


    html += `</div>`;


    content.innerHTML =
        html;


    openPanel();

}


/* =====================================================
   VEHICLE → TIRES
===================================================== */

function openVehicleTires(
    vehicleID
) {

    const vehicle =
        vehicles.find(
            item =>
                sameID(
                    item.Vehicle_ID,
                    vehicleID
                )
        );


    if (!vehicle) {

        return;

    }


    const vehicleTires =
        tires.filter(
            tire =>
                sameID(
                    tire.Vehicle_ID,
                    vehicleID
                )
        );


    showTirePanel(
        vehicle,
        vehicleTires
    );

}


/* =====================================================
   TIRE PANEL
===================================================== */

function showTirePanel(
    vehicle,
    data
) {

    const content =
        document.getElementById(
            "listContent"
        );


    const title =
        document.getElementById(
            "panelTitle"
        );


    if (!content) return;


    if (title) {

        title.innerText =
            "Tire List";

    }


    let html = `

        <div>

            <button
                class="panel-back-btn"
                onclick="
                    openCustomerVehiclesByVehicle(
                        '${escapeJS(
                            vehicle.Vehicle_ID
                        )}'
                    )
                "
            >

                ← Vehicles

            </button>


            <div
                class="customer-item"
                style="cursor:default"
            >

                <div class="customer-name">

                    🚛
                    ${escapeHTML(
                        vehicle.Vehicle_Number
                    )}

                </div>


                <div class="info-line">

                    🆔
                    ${escapeHTML(
                        vehicle.Vehicle_ID
                    )}

                </div>


                ${
                    vehicle.Note
                        ? `

                        <div class="note-box">

                            📝
                            <b>Vehicle Note:</b>

                            <br>

                            ${escapeHTML(
                                vehicle.Note
                            )}

                        </div>

                        `
                        : ""
                }

            </div>

    `;


    if (
        data.length === 0
    ) {

        html += `

            <div class="loading">

                No tire data found.

            </div>

        `;

    }


    data.forEach(
        tire => {

            const tireID =
                String(
                    tire.Tire_ID || ""
                );


            const inspectionCount =
                inspections.filter(
                    item =>
                        sameID(
                            item.Tire_ID,
                            tireID
                        )
                ).length;


            html += `

                <div
                    class="customer-item"
                    onclick="
                        openTireInspection(
                            '${escapeJS(
                                tireID
                            )}'
                        )
                    "
                >

                    <div class="customer-name">

                        🛞
                        ${escapeHTML(
                            tire.Position
                        )}

                        —
                        ${escapeHTML(
                            tireID
                        )}

                    </div>


                    <div class="info-line">

                        🏷
                        ${escapeHTML(
                            tire.Brand
                        )}

                    </div>


                    <div class="info-line">

                        📐
                        ${escapeHTML(
                            tire.Size
                        )}

                    </div>


                    <div class="info-line">

                        🔧
                        ${escapeHTML(
                            tire.Pattern
                        )}

                    </div>


                    <div class="info-line">

                        📅
                        ${escapeHTML(
                            tire.Installation_Date
                        )}

                    </div>


                    <div class="info-line">

                        🔍 Inspections:
                        ${inspectionCount}

                    </div>


                    ${
                        tire.Note
                            ? `

                            <div class="note-box">

                                📝
                                <b>Tire Note:</b>

                                <br>

                                ${escapeHTML(
                                    tire.Note
                                )}

                            </div>

                            `
                            : ""
                    }

                </div>

            `;

        }
    );


    html += `</div>`;


    content.innerHTML =
        html;


    openPanel();

}


/* =====================================================
   BACK TO VEHICLES
===================================================== */

function openCustomerVehiclesByVehicle(
    vehicleID
) {

    const vehicle =
        vehicles.find(
            item =>
                sameID(
                    item.Vehicle_ID,
                    vehicleID
                )
        );


    if (!vehicle) return;


    openCustomerVehicles(
        vehicle.Customer_ID
    );

}


/* =====================================================
   TIRE → INSPECTION
===================================================== */

function openTireInspection(
    tireID
) {

    const tire =
        tires.find(
            item =>
                sameID(
                    item.Tire_ID,
                    tireID
                )
        );


    if (!tire) return;


    const history =
        inspections
            .filter(
                item =>
                    sameID(
                        item.Tire_ID,
                        tireID
                    )
            )
            .sort(
                (a, b) =>
                    String(
                        b.Inspection_Date || ""
                    ).localeCompare(
                        String(
                            a.Inspection_Date || ""
                        )
                    )
            );


    showInspectionPanel(
        tire,
        history
    );

}


/* =====================================================
   INSPECTION PANEL
===================================================== */

function showInspectionPanel(
    tire,
    data
) {

    const content =
        document.getElementById(
            "listContent"
        );


    const title =
        document.getElementById(
            "panelTitle"
        );


    if (!content) return;


    if (title) {

        title.innerText =
            "Inspection History";

    }


    let html = `

        <div>

            <button
                class="panel-back-btn"
                onclick="
                    openVehicleTiresByTire(
                        '${escapeJS(
                            tire.Tire_ID
                        )}'
                    )
                "
            >

                ← Tires

            </button>


            <div
                class="customer-item"
                style="cursor:default"
            >

                <div class="customer-name">

                    🛞
                    ${escapeHTML(
                        tire.Tire_ID
                    )}

                </div>


                <div class="info-line">

                    📍 Position:
                    ${escapeHTML(
                        tire.Position
                    )}

                </div>


                <div class="info-line">

                    🏷 Brand:
                    ${escapeHTML(
                        tire.Brand
                    )}

                </div>


                <div class="info-line">

                    📐 Size:
                    ${escapeHTML(
                        tire.Size
                    )}

                </div>


                <div class="info-line">

                    🔧 Pattern:
                    ${escapeHTML(
                        tire.Pattern
                    )}

                </div>


                ${
                    tire.Note
                        ? `

                        <div class="note-box">

                            📝
                            <b>Tire Note:</b>

                            <br>

                            ${escapeHTML(
                                tire.Note
                            )}

                        </div>

                        `
                        : ""
                }

            </div>

    `;


    if (
        data.length === 0
    ) {

        html += `

            <div class="loading">

                No inspection history.

            </div>

        `;

    }


    data.forEach(
        item => {

            html += `

                <div
                    class="customer-item"
                    style="cursor:default"
                >

                    <div class="customer-name">

                        🔍
                        ${escapeHTML(
                            item.Inspection_ID
                        )}

                    </div>


                    <div class="info-line">

                        📅
                        ${escapeHTML(
                            item.Inspection_Date
                        )}

                    </div>


                    <div class="info-line">

                        <b>OTD:</b>
                        ${escapeHTML(
                            item.OTD
                        )}
                        mm

                    </div>


                    <div class="info-line">

                        <b>RTD:</b>
                        ${escapeHTML(
                            item.RTD
                        )}
                        mm

                    </div>


                    <div class="info-line">

                        🚛 Driven:
                        ${escapeHTML(
                            item["Driven Kilometer"]
                        )}
                        km

                    </div>


                    <div class="info-line">

                        📊 Km/mm:
                        ${escapeHTML(
                            item["Km/mm"]
                        )}

                    </div>


                    ${
                        item.Note
                            ? `

                            <div class="note-box">

                                📝
                                <b>Inspection Note:</b>

                                <br>

                                ${escapeHTML(
                                    item.Note
                                )}

                            </div>

                            `
                            : ""
                    }

                </div>

            `;

        }
    );


    html += `</div>`;


    content.innerHTML =
        html;


    openPanel();

}


/* =====================================================
   BACK TO TIRES
===================================================== */

function openVehicleTiresByTire(
    tireID
) {

    const tire =
        tires.find(
            item =>
                sameID(
                    item.Tire_ID,
                    tireID
                )
        );


    if (!tire) return;


    openVehicleTires(
        tire.Vehicle_ID
    );

}


/* =====================================================
   CUSTOMER LIST PANEL
===================================================== */

function openPanel() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) return;


    panel.classList.add(
        "show"
    );


    setTimeout(
        () => {

            if (map) {

                map.invalidateSize();

            }

        },
        250
    );

}


function closePanel() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) return;


    panel.classList.remove(
        "show"
    );


    setTimeout(
        () => {

            if (map) {

                map.invalidateSize();

            }

        },
        250
    );

}


function toggleList() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) return;


    if (
        panel.classList.contains(
            "show"
        )
    ) {

        closePanel();

    }
    else {

        /*
           When opening from the 📋 button,
           always show customer list.
        */

        const title =
            document.getElementById(
                "panelTitle"
            );


        if (title) {

            title.innerText =
                "Customer List";

        }


        showCustomers(
            getFilteredCustomers()
        );


        openPanel();

    }

}


/* =====================================================
   LOADING
===================================================== */

function showLoading() {

    const content =
        document.getElementById(
            "listContent"
        );


    if (!content) return;


    content.innerHTML = `

        <div class="loading">

            Loading Customers...

        </div>

    `;

}


/* =====================================================
   HELPERS
===================================================== */

function sameID(
    a,
    b
) {

    return String(
        a ?? ""
    ).trim() === String(
        b ?? ""
    ).trim();

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   JAVASCRIPT ESCAPE
===================================================== */

function escapeJS(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /\r?\n/g,
            "\\n"
        );

}


/* =====================================================
   SAFE ID
===================================================== */

function safeID(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /[^a-zA-Z0-9_-]/g,
            ""
        );

}


/* =====================================================
   SERVICE WORKER
===================================================== */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    registration => {

                        console.log(
                            "TPCL Service Worker registered:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    error => {

                        console.error(
                            "TPCL Service Worker error:",
                            error
                        );

                    }
                );

        }
    );

}
