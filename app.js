// ============================================================
// TPCL v5.0
// Customer → Vehicle → Tire → Tire Inspection
// ============================================================

// ================================
// API
// ================================

const API_BASE =
    "https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec";

const CUSTOMER_API_URL =
    API_BASE + "?api=customers";

const VEHICLE_API_URL =
    API_BASE + "?api=vehicles";

const TIRE_API_URL =
    API_BASE + "?api=tires";

const INSPECTION_API_URL =
    API_BASE + "?api=inspections";


// ================================
// GLOBAL DATA
// ================================

let map;

let customers = [];
let vehicles = [];
let tires = [];
let inspections = [];

let markers = [];

let userLat = null;
let userLng = null;

let listOpen = false;


// ============================================================
// MAP
// ============================================================

map = L.map("map").setView(
    [16.8661, 96.1951],
    7
);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }
).addTo(map);


// ============================================================
// GPS
// ============================================================

if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

        function(position) {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;

            L.marker([
                userLat,
                userLng
            ])
            .addTo(map)
            .bindPopup(
                "📍 Your Current Location"
            );

            map.setView(
                [userLat, userLng],
                11
            );

        },

        function() {

            console.log(
                "GPS Permission Denied"
            );

        }

    );

}


// ============================================================
// CURRENT LOCATION BUTTON
// ============================================================

function goCurrentLocation() {

    if (!navigator.geolocation) {

        alert(
            "GPS Not Supported"
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;

            map.setView(
                [userLat, userLng],
                15
            );

        }

    );

}


// ============================================================
// LOAD ALL DATA
// ============================================================

loadAllData();


async function loadAllData() {

    try {

        console.log(
            "Loading TPCL data..."
        );

        const results =
            await Promise.all([

                fetch(CUSTOMER_API_URL)
                    .then(r => r.json()),

                fetch(VEHICLE_API_URL)
                    .then(r => r.json()),

                fetch(TIRE_API_URL)
                    .then(r => r.json()),

                fetch(INSPECTION_API_URL)
                    .then(r => r.json())

            ]);


        customers = Array.isArray(results[0])
            ? results[0]
            : [];

        vehicles = Array.isArray(results[1])
            ? results[1]
            : [];

        tires = Array.isArray(results[2])
            ? results[2]
            : [];

        inspections = Array.isArray(results[3])
            ? results[3]
            : [];


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
            "DATA LOAD ERROR:",
            error
        );

        alert(
            "Cannot Load TPCL Data"
        );

    }

}


// ============================================================
// SHOW CUSTOMER MARKERS
// ============================================================

function showCustomers() {

    markers.forEach(
        marker => map.removeLayer(marker)
    );

    markers = [];


    customers.forEach(
        customer => {

            if (
                !customer.Latitude ||
                !customer.Longitude
            ) {

                return;

            }


            const lat =
                Number(customer.Latitude);

            const lng =
                Number(customer.Longitude);


            if (
                isNaN(lat) ||
                isNaN(lng)
            ) {

                return;

            }


            const marker =
                L.marker([
                    lat,
                    lng
                ])
                .addTo(map);


            marker.bindPopup(
                createCustomerPopup(
                    customer
                )
            );


            markers.push(marker);

        }
    );


    buildCustomerList();

}


// ============================================================
// CUSTOMER POPUP
// ============================================================

function createCustomerPopup(customer) {

    const customerId =
        customer.Customer_ID || "";


    const vehicleCount =
        vehicles.filter(
            vehicle =>
                String(
                    vehicle.Customer_ID
                ) === String(customerId)
        ).length;


    return `

        <div style="
            min-width:260px;
            font-family:Arial;
        ">

            <h3 style="
                margin:0 0 10px 0;
            ">
                ${safe(customer.Customer_Name)}
            </h3>


            🌏 <b>Region:</b>
            ${safe(customer.Region)}
            <br>

            📍 <b>Township:</b>
            ${safe(customer.Township)}
            <br>

            🏷 <b>Brand:</b>
            ${safe(customer.Brand)}
            <br>

            🚛 <b>Vehicle:</b>
            ${vehicleCount}
            <br>


            <div
                id="customer-distance-${safeId(customerId)}"
                style="margin-top:5px;"
            >
            </div>


            <hr>


            <button
                onclick="openCustomerDetails('${escapeJs(customerId)}')"
                style="
                    width:100%;
                    padding:10px;
                    border:0;
                    border-radius:8px;
                    background:#1976D2;
                    color:white;
                    font-size:15px;
                    cursor:pointer;
                "
            >
                🚛 View Vehicles
            </button>


            <br><br>


            <a
                href="tel:${safe(customer.Phone_Number)}"
                style="
                    display:inline-block;
                    background:#28a745;
                    color:white;
                    padding:8px 12px;
                    border-radius:8px;
                    text-decoration:none;
                "
            >
                📞 Call
            </a>


            <a
                target="_blank"
                href="https://www.google.com/maps/dir/?api=1&destination=${latValue(customer.Latitude)},${lngValue(customer.Longitude)}"
                style="
                    display:inline-block;
                    background:#1976D2;
                    color:white;
                    padding:8px 12px;
                    border-radius:8px;
                    text-decoration:none;
                    margin-left:8px;
                "
            >
                🧭 Navigate
            </a>

        </div>

    `;

}


// ============================================================
// CUSTOMER DETAILS
// ============================================================

function openCustomerDetails(
    customerId
) {

    const customer =
        customers.find(
            c =>
                String(c.Customer_ID) ===
                String(customerId)
        );


    if (!customer) {

        alert(
            "Customer not found"
        );

        return;

    }


    const customerVehicles =
        vehicles.filter(
            vehicle =>
                String(
                    vehicle.Customer_ID
                ) === String(customerId)
        );


    let html = `

        <div class="tpcl-modal">

            <div class="tpcl-modal-box">

                <button
                    onclick="closeTPCLModal()"
                    style="
                        float:right;
                        border:0;
                        background:none;
                        font-size:24px;
                    "
                >
                    ✕
                </button>


                <h2>
                    ${safe(customer.Customer_Name)}
                </h2>


                <p>
                    🌏 ${safe(customer.Region)}
                    <br>
                    📍 ${safe(customer.Township)}
                </p>


                <hr>


                <h3>
                    🚛 Vehicles
                </h3>

    `;


    if (
        customerVehicles.length === 0
    ) {

        html += `
            <p>
                No vehicle data found.
            </p>
        `;

    }


    customerVehicles.forEach(
        vehicle => {

            html += createVehicleCard(
                vehicle
            );

        }
    );


    html += `

            </div>

        </div>

    `;


    showModal(html);

}


// ============================================================
// VEHICLE CARD
// ============================================================

function createVehicleCard(
    vehicle
) {

    const vehicleId =
        vehicle.Vehicle_ID || "";


    const vehicleTires =
        tires.filter(
            tire =>
                String(
                    tire.Vehicle_ID
                ) === String(vehicleId)
        );


    let tireHtml = "";


    if (
        vehicleTires.length === 0
    ) {

        tireHtml = `
            <p>
                No tire data.
            </p>
        `;

    }


    vehicleTires.forEach(
        tire => {

            tireHtml +=
                createTireCard(tire);

        }
    );


    return `

        <div style="
            border:1px solid #ddd;
            border-radius:10px;
            padding:12px;
            margin-bottom:12px;
        ">

            <b>
                🚛 ${safe(vehicle.Vehicle_Number)}
            </b>


            <br>

            Vehicle ID:
            ${safe(vehicle.Vehicle_ID)}


            <br>

            Type:
            ${safe(vehicle.Vehicle_Type)}


            <br>

            Regular Route:
            ${safe(vehicle.Regular_Route)}


            <hr>


            <b>
                🛞 Tires
            </b>


            ${tireHtml}

        </div>

    `;

}


// ============================================================
// TIRE CARD
// ============================================================

function createTireCard(
    tire
) {

    const tireId =
        tire.Tire_ID || "";


    const tireInspections =
        inspections.filter(
            inspection =>
                String(
                    inspection.Tire_ID
                ) === String(tireId)
        );


    const latestInspection =
        getLatestInspection(
            tireInspections
        );


    let latestText =
        "No inspection data";


    if (latestInspection) {

        latestText = `

            📅 ${safe(
                latestInspection.Inspection_Date
            )}

            <br>

            OTD:
            ${safe(latestInspection.OTD)}
            mm

            <br>

            RTD:
            ${safe(latestInspection.RTD)}
            mm

            <br>

            Km/mm:
            ${safe(latestInspection["Km/mm"])}

        `;

    }


    return `

        <div style="
            background:#f7f7f7;
            border-radius:8px;
            padding:10px;
            margin-top:8px;
        ">

            <b>
                🛞 ${safe(tire.Tire_ID)}
            </b>


            <br>

            Tire Number:
            ${safe(
                tire.Tire_Number
            )}


            <br>

            Brand:
            ${safe(tire.Brand)}


            <br>

            Size:
            ${safe(tire.Size)}


            <br>

            Pattern:
            ${safe(tire.Pattern)}


            <hr>


            <b>
                🔍 Latest Inspection
            </b>


            <div style="
                margin-top:5px;
            ">
                ${latestText}
            </div>


            <button
                onclick="showInspectionHistory('${escapeJs(tireId)}')"
                style="
                    width:100%;
                    margin-top:10px;
                    padding:8px;
                    border:0;
                    border-radius:7px;
                    background:#444;
                    color:white;
                    cursor:pointer;
                "
            >
                📋 Inspection History
            </button>

        </div>

    `;

}


// ============================================================
// INSPECTION HISTORY
// ============================================================

function showInspectionHistory(
    tireId
) {

    const tire =
        tires.find(
            t =>
                String(t.Tire_ID) ===
                String(tireId)
        );


    const history =
        inspections
            .filter(
                inspection =>
                    String(
                        inspection.Tire_ID
                    ) === String(tireId)
            )
            .sort(
                function(a,b) {

                    return parseDate(
                        b.Inspection_Date
                    )
                    -
                    parseDate(
                        a.Inspection_Date
                    );

                }
            );


    let html = `

        <div class="tpcl-modal">

            <div class="tpcl-modal-box">

                <button
                    onclick="closeTPCLModal()"
                    style="
                        float:right;
                        border:0;
                        background:none;
                        font-size:24px;
                    "
                >
                    ✕
                </button>


                <h2>
                    🛞 Tire ${safe(tireId)}
                </h2>


    `;


    if (tire) {

        html += `

            <p>

                Brand:
                <b>${safe(tire.Brand)}</b>

                <br>

                Size:
                <b>${safe(tire.Size)}</b>

                <br>

                Pattern:
                <b>${safe(tire.Pattern)}</b>

            </p>

            <hr>

        `;

    }


    html += `
        <h3>
            📋 Inspection History
        </h3>
    `;


    if (
        history.length === 0
    ) {

        html += `
            <p>
                No inspection records.
            </p>
        `;

    }


    history.forEach(
        inspection => {

            html += `

                <div style="
                    border:1px solid #ddd;
                    border-radius:10px;
                    padding:12px;
                    margin-bottom:10px;
                ">

                    <b>
                        ${safe(
                            inspection.Inspection_ID
                        )}
                    </b>


                    <br>

                    📅 Date:
                    ${safe(
                        inspection.Inspection_Date
                    )}


                    <br>

                    📏 OTD:
                    ${safe(
                        inspection.OTD
                    )}
                    mm


                    <br>

                    📏 RTD:
                    ${safe(
                        inspection.RTD
                    )}
                    mm


                    <br>

                    🚛 Driven:
                    ${safe(
                        inspection["Driven Kilometer"]
                    )}
                    km


                    <br>

                    📊 Km/mm:
                    <b>
                        ${safe(
                            inspection["Km/mm"]
                        )}
                    </b>


                    ${
                        inspection.Note
                        ?
                        `<br>
                        📝 Note:
                        ${safe(
                            inspection.Note
                        )}`
                        :
                        ""
                    }

                </div>

            `;

        }
    );


    html += `

            </div>

        </div>

    `;


    showModal(html);

}


// ============================================================
// LATEST INSPECTION
// ============================================================

function getLatestInspection(
    data
) {

    if (
        !data ||
        data.length === 0
    ) {

        return null;

    }


    return data
        .slice()
        .sort(
            function(a,b) {

                return parseDate(
                    b.Inspection_Date
                )
                -
                parseDate(
                    a.Inspection_Date
                );

            }
        )[0];

}


// ============================================================
// SEARCH CUSTOMER
// ============================================================

function searchCustomer() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) return;


    const keyword =
        input.value
            .trim()
            .toLowerCase();


    if (
        keyword === ""
    ) {

        showCustomers();

        return;

    }


    const filtered =
        customers.filter(
            customer => {

                return (

                    String(
                        customer.Customer_Name || ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    String(
                        customer.Region || ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    String(
                        customer.Township || ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    String(
                        customer.Brand || ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                );

            }
        );


    showFilteredCustomers(
        filtered
    );

}


// ============================================================
// FILTERED CUSTOMER MARKERS
// ============================================================

function showFilteredCustomers(
    data
) {

    markers.forEach(
        marker =>
            map.removeLayer(marker)
    );

    markers = [];


    data.forEach(
        customer => {

            if (
                !customer.Latitude ||
                !customer.Longitude
            ) return;


            const marker =
                L.marker([
                    Number(
                        customer.Latitude
                    ),
                    Number(
                        customer.Longitude
                    )
                ])
                .addTo(map);


            marker.bindPopup(
                createCustomerPopup(
                    customer
                )
            );


            markers.push(marker);

        }
    );


    buildCustomerList(
        data
    );

}


// ============================================================
// CUSTOMER LIST
// ============================================================

function buildCustomerList(
    data = customers
) {

    const list =
        document.getElementById(
            "listContent"
        );


    if (!list) return;


    let html = "";


    data.forEach(
        customer => {

            html += `

                <div
                    class="customer-item"
                    onclick="focusCustomer(
                        ${Number(customer.Latitude)},
                        ${Number(customer.Longitude)},
                        '${escapeJs(
                            customer.Customer_ID
                        )}'
                    )"
                >

                    <b>
                        ${safe(
                            customer.Customer_Name
                        )}
                    </b>

                    <br>

                    🌏 ${safe(
                        customer.Region
                    )}

                    <br>

                    📍 ${safe(
                        customer.Township
                    )}

                    <br>

                    🏷 ${safe(
                        customer.Brand
                    )}

                </div>

            `;

        }
    );


    list.innerHTML =
        html;

}


// ============================================================
// FOCUS CUSTOMER
// ============================================================

function focusCustomer(
    lat,
    lng,
    customerId
) {

    map.setView(
        [lat, lng],
        16
    );


    const customer =
        customers.find(
            c =>
                String(
                    c.Customer_ID
                ) ===
                String(customerId)
        );


    if (!customer) return;


    const index =
        customers.indexOf(
            customer
        );


    if (
        markers[index]
    ) {

        markers[index].openPopup();

    }


    toggleList();

}


// ============================================================
// BOTTOM SHEET
// ============================================================

function toggleList() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) return;


    listOpen =
        !listOpen;


    if (listOpen) {

        panel.classList.add(
            "show"
        );

    }
    else {

        panel.classList.remove(
            "show"
        );

    }

}


// ============================================================
// MODAL
// ============================================================

function showModal(
    html
) {

    let modal =
        document.getElementById(
            "tpclModal"
        );


    if (!modal) {

        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "tpclModal";

        document.body.appendChild(
            modal
        );

    }


    modal.innerHTML =
        html;


    modal.style.display =
        "block";

}


function closeTPCLModal() {

    const modal =
        document.getElementById(
            "tpclModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// ============================================================
// DISTANCE
// ============================================================

function getDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R = 6371;


    const dLat =
        (
            lat2 - lat1
        )
        *
        Math.PI / 180;


    const dLng =
        (
            lng2 - lng1
        )
        *
        Math.PI / 180;


    const a =

        Math.sin(dLat / 2)
        *
        Math.sin(dLat / 2)

        +

        Math.cos(
            lat1 * Math.PI / 180
        )
        *
        Math.cos(
            lat2 * Math.PI / 180
        )
        *
        Math.sin(
            dLng / 2
        )
        *
        Math.sin(
            dLng / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return (
        R * c
    ).toFixed(1);

}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function safe(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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


function escapeJs(
    value
) {

    return String(
        value || ""
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
        /\n/g,
        "\\n"
    )
    .replace(
        /\r/g,
        "\\r"
    );

}


function safeId(
    value
) {

    return String(
        value || ""
    )
    .replace(
        /[^a-zA-Z0-9_-]/g,
        ""
    );

}


function latValue(
    value
) {

    return Number(
        value
    );

}


function lngValue(
    value
) {

    return Number(
        value
    );

}


function parseDate(
    value
) {

    if (!value) {

        return 0;

    }


    const d =
        new Date(value);


    if (
        !isNaN(
            d.getTime()
        )
    ) {

        return d.getTime();

    }


    return 0;

}


// ============================================================
// PWA SERVICE WORKER
// ============================================================

if (
    "serviceWorker"
    in navigator
) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    function(registration) {

                        console.log(
                            "TPCL Service Worker registered:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    function(error) {

                        console.error(
                            "Service Worker registration failed:",
                            error
                        );

                    }
                );

        }
    );

}
