// ======================================================
// TPCL APP v5.0
// Customer → Vehicle → Tire → Tire Inspection
// ======================================================

// ======================================================
// API
// ======================================================

const CUSTOMER_API =
"https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=customers";

const VEHICLE_API =
"https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=vehicles";

const TIRE_API =
"https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=tires";

const INSPECTION_API =
"https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec?api=inspections";


// ======================================================
// GLOBAL DATA
// ======================================================

let map;

let customers = [];
let vehicles = [];
let tires = [];
let inspections = [];

let markers = [];

let userLat = null;
let userLng = null;

let listOpen = false;


// ======================================================
// MAP
// ======================================================

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


// ======================================================
// GPS
// ======================================================

if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

        function(position) {

    userLat = position.coords.latitude;
    userLng = position.coords.longitude;

    L.marker([
        userLat,
        userLng
    ])
    .addTo(map)
    .bindPopup("📍 Your Current Location");

    map.setView(
        [userLat, userLng],
        11
    );

    // Popup ဖွင့်ထားပြီးသားဆို Distance ကို update လုပ်မယ်
    map.eachLayer(function(layer) {

        if (
            layer instanceof L.Marker &&
            layer.isPopupOpen &&
            layer.isPopupOpen()
        ) {
            layer.fire("popupopen");
        }

    });

}

        function() {

            console.log(
                "GPS Permission Denied"
            );

        }

    );

}


// ======================================================
// CURRENT LOCATION BUTTON
// ======================================================

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
                15,
                {
                    animate: true
                }
            );

        }

    );

}


// ======================================================
// LOAD ALL DATA
// ======================================================

loadAllData();


async function loadAllData() {

    try {

        const results =
            await Promise.all([

                fetch(CUSTOMER_API)
                    .then(r => r.json()),

                fetch(VEHICLE_API)
                    .then(r => r.json()),

                fetch(TIRE_API)
                    .then(r => r.json()),

                fetch(INSPECTION_API)
                    .then(r => r.json())

            ]);


        customers = results[0];

        vehicles = results[1];

        tires = results[2];

        inspections = results[3];


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

    catch(error) {

        console.error(error);

        alert(
            "Cannot Load TPCL Data"
        );

    }

}


// ======================================================
// SHOW CUSTOMER MARKERS
// ======================================================

function showCustomers(data = customers) {

    markers.forEach(
        marker => map.removeLayer(marker)
    );

    markers = [];


    data.forEach(customer => {

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
            ])
            .addTo(map);


        marker.bindPopup(`

            <div style="min-width:240px">

                <h3>
                    ${escapeHTML(
                        customer.Customer_Name
                    )}
                </h3>

                🌏 <b>Region:</b>
                ${escapeHTML(
                    customer.Region
                )}
                <br>

                📍 <b>Township:</b>
                ${escapeHTML(
                    customer.Township
                )}
                <br>

                🚛 <b>Vehicles:</b>
                ${escapeHTML(
                    customer.Vehicle_Count
                )}
                <br>

                🏷 <b>Brand:</b>
                ${escapeHTML(
                    customer.Brand
                )}
                <br>

                📏
                <span id="
                    distance-${safeID(
                        customer.Customer_ID
                    )}
                ">
                    Calculating...
                </span>

                <br><br>

                <button
                    onclick="
                    openCustomerVehicles(
                        '${escapeJS(
                            customer.Customer_ID
                        )}'
                    )"
                    style="
                    width:100%;
                    padding:10px;
                    border:0;
                    border-radius:8px;
                    background:#1976D2;
                    color:white;
                    ">
                    🚛 View Vehicles
                </button>

                <br><br>

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
    rel="noopener"
    href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}"
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

        `);


        marker.on(
            "popupopen",
            function() {

                showDistance(
                    customer
                );

            }
        );


        markers.push(marker);

    });


    buildCustomerList(data);

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


    if (!container) return;


    let html = "";


    data.forEach(customer => {

        html += `

            <div
                class="customer-item"
                onclick="
                focusCustomer(
                    ${Number(
                        customer.Latitude
                    )},
                    ${Number(
                        customer.Longitude
                    )},
                    '${escapeJS(
                        customer.Customer_ID
                    )}'
                )">

                <b>
                    ${escapeHTML(
                        customer.Customer_Name
                    )}
                </b>

                <br>

                🌏 ${escapeHTML(
                    customer.Region
                )}

                <br>

                📍 ${escapeHTML(
                    customer.Township
                )}

                <br>

                🏷 ${escapeHTML(
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

    map.setView(
        [lat, lng],
        16,
        {
            animate: true
        }
    );


    const customer =
        customers.find(
            c =>
                String(
                    c.Customer_ID
                ) === String(
                    customerID
                )
        );


    if (!customer) return;


    markers.forEach(marker => {

        const popup =
            marker.getPopup();

        if (!popup) return;

        const content =
            popup.getContent();

        if (
            content.includes(
                escapeHTML(
                    customer.Customer_Name
                )
            )
        ) {

            marker.openPopup();

        }

    });


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


    if (!input) return;


    const keyword =
        input.value
        .trim()
        .toLowerCase();


    if (keyword === "") {

        showCustomers();

        return;

    }


    const filtered =
        customers.filter(customer => {

            return (

                String(
                    customer.Customer_ID || ""
                )
                .toLowerCase()
                .includes(keyword)

                ||

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

        });


    showCustomers(filtered);

}


// ======================================================
// CUSTOMER → VEHICLES
// ======================================================

function openCustomerVehicles(
    customerID
) {

    const customer =
        customers.find(
            c =>
                String(
                    c.Customer_ID
                ) === String(
                    customerID
                )
        );


    if (!customer) return;


    const customerVehicles =
        vehicles.filter(
            v =>
                String(
                    v.Customer_ID
                ) === String(
                    customerID
                )
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

    const panel =
        document.getElementById(
            "customerList"
        );

    const content =
        document.getElementById(
            "listContent"
        );


    if (!panel || !content) return;


    let html = `

        <div style="
            padding:12px;
        ">

            <button
                onclick="showCustomers()"
                style="
                padding:8px 12px;
                border:0;
                border-radius:8px;
                ">
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

            <p>
                No vehicle data found.
            </p>

        `;

    }


    data.forEach(vehicle => {

        const tireCount =
            tires.filter(
                t =>
                    String(
                        t.Vehicle_ID
                    ) === String(
                        vehicle.Vehicle_ID
                    )
            ).length;


        html += `

            <div
                class="customer-item"
                onclick="
                openVehicleTires(
                    '${escapeJS(
                        vehicle.Vehicle_ID
                    )}'
                )">

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

    });


    html += `</div>`;


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
            v =>
                String(
                    v.Vehicle_ID
                ) === String(
                    vehicleID
                )
        );


    if (!vehicle) return;


    const vehicleTires =
        tires.filter(
            t =>
                String(
                    t.Vehicle_ID
                ) === String(
                    vehicleID
                )
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

    if (!content) return;


    let html = `

        <div style="
            padding:12px;
        ">

            <button
                onclick="
                openCustomerVehiclesByVehicle(
                    '${escapeJS(
                        vehicle.Vehicle_ID
                    )}'
                )"
                style="
                padding:8px 12px;
                border:0;
                border-radius:8px;
                ">
                ← Vehicles
            </button>

            <h3>
                🛞 Tires -
                ${escapeHTML(
                    vehicle.Vehicle_Number
                )}
            </h3>

    `;


    // ==================================================
    // NO TIRE DATA
    // ==================================================

    if (!data || data.length === 0) {

        html += `

            <div
                style="
                padding:15px;
                background:#f5f5f5;
                border-radius:10px;
                text-align:center;
                color:#777;
                ">

                🛞 No Tire Data

            </div>

        `;

    }


    // ==================================================
    // SHOW ONLY TIRES THAT EXIST
    // ==================================================

    if (data && data.length > 0) {

        data.forEach(tire => {

            const inspectionCount =
                inspections.filter(
                    i =>
                        String(
                            i.Tire_ID
                        ) === String(
                            tire.Tire_ID
                        )
                ).length;


            html += `

                <div
                    class="customer-item"
                    onclick="
                    openTireInspection(
                        '${escapeJS(
                            tire.Tire_ID
                        )}'
                    )">

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

        });

    }


    html += `</div>`;


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
            v =>
                String(
                    v.Vehicle_ID
                ) === String(
                    vehicleID
                )
        );


    if (!vehicle) return;


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
            t =>
                String(
                    t.Tire_ID
                ) === String(
                    tireID
                )
        );


    if (!tire) return;


    const history =
        inspections
        .filter(
            i =>
                String(
                    i.Tire_ID
                ) === String(
                    tireID
                )
        )
        .sort(
            (a,b) =>
                String(
                    b.Inspection_Date
                ).localeCompare(
                    String(
                        a.Inspection_Date
                    )
                )
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


    if (!content) return;


    let html = `

        <div style="
            padding:12px;
        ">

            <button
                onclick="
                openVehicleTiresByTire(
                    '${escapeJS(
                        tire.Tire_ID
                    )}'
                )"
                style="
                padding:8px 12px;
                border:0;
                border-radius:8px;
                ">
                ← Tires
            </button>

            <h3>
                🔍 Inspection
            </h3>

            <div style="
                background:#f5f5f5;
                padding:12px;
                border-radius:10px;
                margin-bottom:12px;
            ">

                <b>
                    🛞 ${escapeHTML(
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

            <p>
                No inspection history.
            </p>

        `;

    }


    data.forEach(item => {

        html += `

            <div
                class="customer-item">

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

                <b>
                    OTD:
                </b>
                ${escapeHTML(
                    item.OTD
                )}

                mm

                <br>

                <b>
                    RTD:
                </b>
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

                <br>

                ${
                    item.Note
                    ?
                    `
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

    });


    html += `</div>`;


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
            t =>
                String(
                    t.Tire_ID
                ) === String(
                    tireID
                )
        );


    if (!tire) return;


    openVehicleTires(
        tire.Vehicle_ID
    );

}


// ======================================================
// DISTANCE
// ======================================================

function showDistance(
    customer
) {

    if (
        userLat === null ||
        userLng === null
    ) {

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

        return;

    }


    const R = 6371;


    const dLat =
        (lat - userLat)
        * Math.PI / 180;


    const dLng =
        (lng - userLng)
        * Math.PI / 180;


    const a =

        Math.sin(dLat / 2)
        *
        Math.sin(dLat / 2)

        +

        Math.cos(
            userLat *
            Math.PI / 180
        )

        *

        Math.cos(
            lat *
            Math.PI / 180
        )

        *

        Math.sin(dLng / 2)
        *
        Math.sin(dLng / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    const distance =
        (R * c).toFixed(1);


    const id =
        "distance-" +
        safeID(
            customer.Customer_ID
        );


    const el =
        document.getElementById(id);


    if (el) {

        el.innerHTML =
            "📏 Distance: " +
            distance +
            " km";

    }

}


// ======================================================
// PANEL
// ======================================================

function openPanel() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) return;


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


    if (!panel) return;


    panel.classList.remove(
        "show"
    );


    listOpen = false;

}


function toggleList() {

    if (listOpen) {

        closePanel();

    } else {

        openPanel();

    }

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

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
// JS ESCAPE
// ======================================================

function escapeJS(value) {

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
    );

}


// ======================================================
// SAFE ID
// ======================================================

function safeID(value) {

    return String(
        value ?? ""
    )
    .replace(
        /[^a-zA-Z0-9_-]/g,
        ""
    );

}


// ======================================================
// PWA SERVICE WORKER
// ======================================================

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
