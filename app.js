// ======================================================
// TPCL APP - CLEAN VERSION
// Customer → Vehicle → Tire → Inspection
// GitHub Pages / PWA
// ======================================================


// ======================================================
// API
// ======================================================

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


// ======================================================
// GLOBAL DATA
// ======================================================

let map = null;

let customers = [];
let vehicles = [];
let tires = [];
let inspections = [];

let markers = [];

let userLat = null;
let userLng = null;

let listOpen = false;


// ======================================================
// MAP INITIALIZE
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    initMap();
    loadAllData();
    initGPS();

});


// ======================================================
// MAP
// ======================================================

function initMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        console.error("Map element not found.");
        return;
    }

    map = L.map("map", {
        zoomControl: true
    }).setView(
        [16.8661, 96.1951],
        7
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    // Fix Leaflet rendering on GitHub Pages
    setTimeout(function () {

        if (map) {
            map.invalidateSize();
        }

    }, 500);

}


// ======================================================
// GPS
// ======================================================

function initGPS() {

    if (!navigator.geolocation) {

        console.log(
            "Geolocation is not supported."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;


            console.log(
                "GPS:",
                userLat,
                userLng
            );


            L.marker([
                userLat,
                userLng
            ])
            .addTo(map)
            .bindPopup(
                "📍 Your Current Location"
            );


        },

        function (error) {

            console.log(
                "GPS unavailable:",
                error.message
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }

    );

}


// ======================================================
// CURRENT LOCATION BUTTON
// ======================================================

function goCurrentLocation() {

    if (!navigator.geolocation) {

        alert(
            "GPS is not supported on this device."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;


            if (map) {

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

            }

        },

        function () {

            alert(
                "Unable to get your current location."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );

}


// ======================================================
// LOAD ALL DATA
// ======================================================

async function loadAllData() {

    try {

        const responses =
            await Promise.all([

                fetch(CUSTOMER_API),
                fetch(VEHICLE_API),
                fetch(TIRE_API),
                fetch(INSPECTION_API)

            ]);


        customers =
            await responses[0].json();

        vehicles =
            await responses[1].json();

        tires =
            await responses[2].json();

        inspections =
            await responses[3].json();


        console.log(
            "Customers:",
            customers.length
        );

        console.log(
            "Vehicles:",
            vehicles.length
        );

        console.log(
            "Tires:",
            tires.length
        );

        console.log(
            "Inspections:",
            inspections.length
        );


        showCustomers();


    }
    catch (error) {

        console.error(
            "TPCL data loading error:",
            error
        );


        const container =
            document.getElementById(
                "listContent"
            );


        if (container) {

            container.innerHTML =
                "<p>❌ Cannot load TPCL data.</p>";

        }

    }

}


// ======================================================
// SHOW CUSTOMERS
// ======================================================

function showCustomers(
    data = customers
) {

    clearMarkers();


    data.forEach(function (customer) {

        const lat =
            Number(customer.Latitude);

        const lng =
            Number(customer.Longitude);


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat === 0 ||
            lng === 0
        ) {

            return;

        }


        const marker =
            L.marker([
                lat,
                lng
            ]).addTo(map);


        const customerID =
            String(
                customer.Customer_ID || ""
            );


        const popupHTML = `

            <div class="customer-popup">

                <h3>
                    ${escapeHTML(
                        customer.Customer_Name
                    )}
                </h3>

                <div>
                    🌎 <b>Region:</b>
                    ${escapeHTML(
                        customer.Region
                    )}
                </div>

                <div>
                    📍 <b>Township:</b>
                    ${escapeHTML(
                        customer.Township
                    )}
                </div>

                <div>
                    🚛 <b>Vehicles:</b>
                    ${escapeHTML(
                        customer.Vehicle_Count
                    )}
                </div>

                <div>
                    🏷 <b>Brand:</b>
                    ${escapeHTML(
                        customer.Brand
                    )}
                </div>

                <div
                    id="distance-${safeID(customerID)}"
                    class="distance-text"
                >
                    📏 Checking location...
                </div>

                <button
                    class="popup-main-button"
                    onclick="openCustomerVehicles('${escapeJS(customerID)}')"
                >
                    🚛 View Vehicles
                </button>

                <div class="popup-buttons">

                    ${
                        customer.Phone_Number
                        ?
                        `
                        <a
                            href="tel:${escapeHTML(customer.Phone_Number)}"
                            class="call-button"
                        >
                            📞 Call
                        </a>
                        `
                        :
                        ""
                    }

                    <a
                        href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}"
                        target="_blank"
                        rel="noopener"
                        class="navigate-button"
                    >
                        🧭 Navigate
                    </a>

                </div>

            </div>

        `;


        marker.bindPopup(
            popupHTML
        );


        marker.on(
            "popupopen",
            function () {

                updateDistance(
                    customer
                );

            }
        );


        markers.push(
            marker
        );

    });


    buildCustomerList(data);

}


// ======================================================
// CLEAR MARKERS
// ======================================================

function clearMarkers() {

    markers.forEach(
        function (marker) {

            if (map) {
                map.removeLayer(marker);
            }

        }
    );


    markers = [];

}


// ======================================================
// CUSTOMER LIST
// ======================================================

function buildCustomerList(
    data = customers
) {

    const container =
        document.getElementById(
            "listContent"
        );


    if (!container) {
        return;
    }


    if (data.length === 0) {

        container.innerHTML =
            "<p>No customers found.</p>";

        return;

    }


    let html = "";


    data.forEach(function (customer) {

        const lat =
            Number(customer.Latitude);

        const lng =
            Number(customer.Longitude);


        html += `

            <div
                class="customer-item"
                onclick="
                    focusCustomer(
                        ${lat},
                        ${lng},
                        '${escapeJS(customer.Customer_ID)}'
                    )
                "
            >

                <b>
                    ${escapeHTML(
                        customer.Customer_Name
                    )}
                </b>

                <br>

                🌎
                ${escapeHTML(
                    customer.Region
                )}

                <br>

                📍
                ${escapeHTML(
                    customer.Township
                )}

                <br>

                🏷
                ${escapeHTML(
                    customer.Brand
                )}

            </div>

        `;

    });


    container.innerHTML =
        html;

}


// ======================================================
// FOCUS CUSTOMER
// ======================================================

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


    if (map) {

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

    }


    const marker =
        markers.find(function (m) {

            const position =
                m.getLatLng();

            return (
                Math.abs(
                    position.lat - lat
                ) < 0.000001 &&
                Math.abs(
                    position.lng - lng
                ) < 0.000001
            );

        });


    if (marker) {

        marker.openPopup();

    }


    closePanel();

}


// ======================================================
// SEARCH CUSTOMER
// ======================================================

function searchCustomer() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) {
        return;
    }


    const keyword =
        input.value
            .trim()
            .toLowerCase();


    if (!keyword) {

        showCustomers();

        return;

    }


    const filtered =
        customers.filter(
            function (customer) {

                return [

                    customer.Customer_ID,
                    customer.Customer_Name,
                    customer.Region,
                    customer.Township,
                    customer.Brand

                ]
                .some(function (value) {

                    return String(
                        value || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    );

                });

            }
        );


    showCustomers(
        filtered
    );

}


// ======================================================
// CUSTOMER → VEHICLES
// ======================================================

function openCustomerVehicles(
    customerID
) {

    const customer =
        customers.find(
            function (c) {

                return String(
                    c.Customer_ID
                ) === String(
                    customerID
                );

            }
        );


    if (!customer) {
        return;
    }


    const customerVehicles =
        vehicles.filter(
            function (v) {

                return String(
                    v.Customer_ID
                ) === String(
                    customerID
                );

            }
        );


    showVehiclePanel(
        customer,
        customerVehicles
    );

}


// ======================================================
// VEHICLE PANEL
// ======================================================

function showVehiclePanel(
    customer,
    data
) {

    const content =
        document.getElementById(
            "listContent"
        );


    if (!content) {
        return;
    }


    let html = `

        <div class="panel-content">

            <button
                class="back-button"
                onclick="showCustomers()"
            >
                ← Customers
            </button>

            <h3>
                🚛
                ${escapeHTML(
                    customer.Customer_Name
                )}
            </h3>

    `;


    if (data.length === 0) {

        html += `
            <p>No vehicle data found.</p>
        `;

    }


    data.forEach(
        function (vehicle) {

            const tireCount =
                tires.filter(
                    function (tire) {

                        return String(
                            tire.Vehicle_ID
                        ) === String(
                            vehicle.Vehicle_ID
                        );

                    }
                ).length;


            html += `

                <div
                    class="customer-item"
                    onclick="
                        openVehicleTires(
                            '${escapeJS(vehicle.Vehicle_ID)}'
                        )
                    "
                >

                    <b>
                        🚛
                        ${escapeHTML(
                            vehicle.Vehicle_Number
                        )}
                    </b>

                    <br>

                    🆔
                    ${escapeHTML(
                        vehicle.Vehicle_ID
                    )}

                    <br>

                    🚚
                    ${escapeHTML(
                        vehicle.Vehicle_Type
                    )}

                    <br>

                    🛣
                    ${escapeHTML(
                        vehicle.Regular_Route
                    )}

                    <br>

                    🛞 Tires:
                    ${tireCount}

                </div>

            `;

        }
    );


    html += `
        </div>
    `;


    content.innerHTML =
        html;


    openPanel();

}


// ======================================================
// VEHICLE → TIRES
// ======================================================

function openVehicleTires(
    vehicleID
) {

    const vehicle =
        vehicles.find(
            function (v) {

                return String(
                    v.Vehicle_ID
                ) === String(
                    vehicleID
                );

            }
        );


    if (!vehicle) {
        return;
    }


    const vehicleTires =
        tires.filter(
            function (tire) {

                return String(
                    tire.Vehicle_ID
                ) === String(
                    vehicleID
                );

            }
        );


    showTirePanel(
        vehicle,
        vehicleTires
    );

}


// ======================================================
// TIRE PANEL
// ======================================================

function showTirePanel(
    vehicle,
    data
) {

    const content =
        document.getElementById(
            "listContent"
        );


    if (!content) {
        return;
    }


    let html = `

        <div class="panel-content">

            <button
                class="back-button"
                onclick="
                    openCustomerVehiclesByVehicle(
                        '${escapeJS(vehicle.Vehicle_ID)}'
                    )
                "
            >
                ← Vehicles
            </button>

            <h3>
                🛞 Tires -
                ${escapeHTML(
                    vehicle.Vehicle_Number
                )}
            </h3>

    `;


    // IMPORTANT:
    // Only show tires that actually exist.
    // Empty positions / No Tire are hidden.

    if (data.length === 0) {

        html += `
            <p>No tire data found.</p>
        `;

    }


    data.forEach(
        function (tire) {

            const inspectionCount =
                inspections.filter(
                    function (inspection) {

                        return String(
                            inspection.Tire_ID
                        ) === String(
                            tire.Tire_ID
                        );

                    }
                ).length;


            html += `

                <div
                    class="customer-item"
                    onclick="
                        openTireInspection(
                            '${escapeJS(tire.Tire_ID)}'
                        )
                    "
                >

                    <b>
                        ${escapeHTML(
                            tire.Position
                        )}
                        —
                        ${escapeHTML(
                            tire.Tire_ID
                        )}
                    </b>

                    <br>

                    🏷
                    ${escapeHTML(
                        tire.Brand
                    )}

                    <br>

                    📐
                    ${escapeHTML(
                        tire.Size
                    )}

                    <br>

                    🔧
                    ${escapeHTML(
                        tire.Pattern
                    )}

                    <br>

                    📅
                    ${escapeHTML(
                        tire.Installation_Date
                    )}

                    <br>

                    🔍 Inspections:
                    ${inspectionCount}

                </div>

            `;

        }
    );


    html += `
        </div>
    `;


    content.innerHTML =
        html;


    openPanel();

}


// ======================================================
// BACK TO VEHICLES
// ======================================================

function openCustomerVehiclesByVehicle(
    vehicleID
) {

    const vehicle =
        vehicles.find(
            function (v) {

                return String(
                    v.Vehicle_ID
                ) === String(
                    vehicleID
                );

            }
        );


    if (!vehicle) {
        return;
    }


    openCustomerVehicles(
        vehicle.Customer_ID
    );

}


// ======================================================
// TIRE → INSPECTION
// ======================================================

function openTireInspection(
    tireID
) {

    const tire =
        tires.find(
            function (t) {

                return String(
                    t.Tire_ID
                ) === String(
                    tireID
                );

            }
        );


    if (!tire) {
        return;
    }


    const history =
        inspections
            .filter(
                function (inspection) {

                    return String(
                        inspection.Tire_ID
                    ) === String(
                        tireID
                    );

                }
            )
            .sort(
                function (a, b) {

                    return parseDate(
                        b.Inspection_Date
                    ) - parseDate(
                        a.Inspection_Date
                    );

                }
            );


    showInspectionPanel(
        tire,
        history
    );

}


// ======================================================
// INSPECTION PANEL
// ======================================================

function showInspectionPanel(
    tire,
    data
) {

    const content =
        document.getElementById(
            "listContent"
        );


    if (!content) {
        return;
    }


    let html = `

        <div class="panel-content">

            <button
                class="back-button"
                onclick="
                    openVehicleTiresByTire(
                        '${escapeJS(tire.Tire_ID)}'
                    )
                "
            >
                ← Tires
            </button>

            <h3>
                🔍 Inspection
            </h3>

            <div class="tire-summary">

                <b>
                    🛞
                    ${escapeHTML(
                        tire.Tire_ID
                    )}
                </b>

                <br>

                📍 Position:
                ${escapeHTML(
                    tire.Position
                )}

                <br>

                🏷 Brand:
                ${escapeHTML(
                    tire.Brand
                )}

                <br>

                📐 Size:
                ${escapeHTML(
                    tire.Size
                )}

                <br>

                🔧 Pattern:
                ${escapeHTML(
                    tire.Pattern
                )}

                <br>

                📅 Installed:
                ${escapeHTML(
                    tire.Installation_Date
                )}

            </div>

    `;


    if (data.length === 0) {

        html += `
            <p>No inspection history.</p>
        `;

    }


    data.forEach(
        function (item) {

            html += `

                <div class="customer-item">

                    <b>
                        🔍
                        ${escapeHTML(
                            item.Inspection_ID
                        )}
                    </b>

                    <br>

                    📅
                    ${escapeHTML(
                        item.Inspection_Date
                    )}

                    <br><br>

                    <b>OTD:</b>
                    ${escapeHTML(
                        item.OTD
                    )}
                    mm

                    <br>

                    <b>RTD:</b>
                    ${escapeHTML(
                        item.RTD
                    )}
                    mm

                    <br>

                    🚛 Driven:
                    ${escapeHTML(
                        item["Driven Kilometer"]
                    )}
                    km

                    <br>

                    📊 Km/mm:
                    ${escapeHTML(
                        item["Km/mm"]
                    )}

                    ${
                        item.Note
                        ?
                        `
                        <br><br>
                        📝
                        ${escapeHTML(
                            item.Note
                        )}
                        `
                        :
                        ""
                    }

                </div>

            `;

        }
    );


    html += `
        </div>
    `;


    content.innerHTML =
        html;


    openPanel();

}


// ======================================================
// BACK TO TIRES
// ======================================================

function openVehicleTiresByTire(
    tireID
) {

    const tire =
        tires.find(
            function (t) {

                return String(
                    t.Tire_ID
                ) === String(
                    tireID
                );

            }
        );


    if (!tire) {
        return;
    }


    openVehicleTires(
        tire.Vehicle_ID
    );

}


// ======================================================
// DISTANCE
// ======================================================

function updateDistance(
    customer
) {

    const element =
        document.getElementById(
            "distance-" +
            safeID(
                customer.Customer_ID
            )
        );


    if (!element) {
        return;
    }


    if (
        userLat === null ||
        userLng === null
    ) {

        element.innerHTML =
            "📍 Location unavailable";

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


    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        element.innerHTML =
            "📍 Customer location unavailable";

        return;

    }


    const distance =
        calculateDistance(
            userLat,
            userLng,
            lat,
            lng
        );


    element.innerHTML =
        "📏 Distance: " +
        distance.toFixed(1) +
        " km";

}


// ======================================================
// HAVERSINE DISTANCE
// ======================================================

function calculateDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R =
        6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );

    const dLng =
        toRadians(
            lng2 - lng1
        );


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            toRadians(lat1)
        ) *
        Math.cos(
            toRadians(lat2)
        ) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


function toRadians(
    degrees
) {

    return degrees *
        Math.PI /
        180;

}


// ======================================================
// PANEL
// ======================================================

function openPanel() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) {
        return;
    }


    panel.classList.add(
        "show"
    );


    listOpen = true;

}


function closePanel() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) {
        return;
    }


    panel.classList.remove(
        "show"
    );


    listOpen = false;

}


function toggleList() {

    if (listOpen) {

        closePanel();

    }
    else {

        openPanel();

    }

}


// ======================================================
// DATE PARSER
// ======================================================

function parseDate(
    value
) {

    if (!value) {
        return 0;
    }


    const date =
        new Date(value);


    if (!isNaN(date.getTime())) {

        return date.getTime();

    }


    return 0;

}


// ======================================================
// HTML ESCAPE
// ======================================================

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


// ======================================================
// JAVASCRIPT ESCAPE
// ======================================================

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
        /"/g,
        '\\"'
    )
    .replace(
        /\r?\n/g,
        "\\n"
    );

}


// ======================================================
// SAFE ID
// ======================================================

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


// ======================================================
// SERVICE WORKER
// ======================================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    function (registration) {

                        console.log(
                            "TPCL Service Worker registered:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    function (error) {

                        console.error(
                            "Service Worker error:",
                            error
                        );

                    }
                );

        }
    );

}
