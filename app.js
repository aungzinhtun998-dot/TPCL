// =====================================================
// TPCL v4.0
// Customer Map + GPS + Vehicle + Tire API
// =====================================================


// =====================================================
// API
// =====================================================

const API_URL =
"https://script.google.com/macros/s/AKfycbxiO2Zex_xr3CYDbwHy0N7_h0k7N5ujK5zgGvqP09aYrtmhVRA7K2snrNdaUlmZkikm/exec";


// =====================================================
// GLOBAL DATA
// =====================================================

let map = null;

let customers = [];
let vehicles = [];
let tires = [];

let markers = [];

let userLat = null;
let userLng = null;

let myLocationMarker = null;

let listOpen = false;


// =====================================================
// CREATE MAP
// =====================================================

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


// =====================================================
// GPS
// =====================================================

if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

        function(position) {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;


            if (myLocationMarker) {

                map.removeLayer(
                    myLocationMarker
                );

            }


            myLocationMarker =
                L.marker([
                    userLat,
                    userLng
                ])
                .addTo(map)
                .bindPopup(
                    "📍 Your Current Location"
                );


            console.log(
                "GPS:",
                userLat,
                userLng
            );

        },

        function() {

            console.log(
                "GPS Permission Denied"
            );

        }

    );

}


// =====================================================
// CURRENT LOCATION BUTTON
// =====================================================

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
                [
                    userLat,
                    userLng
                ],
                15
            );


            if (myLocationMarker) {

                map.removeLayer(
                    myLocationMarker
                );

            }


            myLocationMarker =
                L.marker([
                    userLat,
                    userLng
                ])
                .addTo(map)
                .bindPopup(
                    "📍 Your Current Location"
                )
                .openPopup();


            // Refresh customer list
            // so distance can update

            showCustomers();

        },

        function() {

            alert(
                "Unable to get your location."
            );

        }

    );

}


// =====================================================
// LOAD ALL DATA
// =====================================================

loadAllData();


async function loadAllData() {

    try {

        console.log(
            "Loading Customer Data..."
        );


        const customerResponse =
            await fetch(
                API_URL +
                "?api=customers"
            );


        if (!customerResponse.ok) {

            throw new Error(
                "Customer API Error"
            );

        }


        customers =
            await customerResponse.json();


        console.log(
            "Customers:",
            customers.length
        );


        // ---------------------------------------------
        // Vehicles
        // ---------------------------------------------

        console.log(
            "Loading Vehicle Data..."
        );


        const vehicleResponse =
            await fetch(
                API_URL +
                "?api=vehicles"
            );


        if (!vehicleResponse.ok) {

            throw new Error(
                "Vehicle API Error"
            );

        }


        vehicles =
            await vehicleResponse.json();


        console.log(
            "Vehicles:",
            vehicles.length
        );


        // ---------------------------------------------
        // Tires
        // ---------------------------------------------

        console.log(
            "Loading Tire Data..."
        );


        const tireResponse =
            await fetch(
                API_URL +
                "?api=tires"
            );


        if (!tireResponse.ok) {

            throw new Error(
                "Tire API Error"
            );

        }


        tires =
            await tireResponse.json();


        console.log(
            "Tires:",
            tires.length
        );


        // ---------------------------------------------
        // Show Customer
        // ---------------------------------------------

        showCustomers();


    }
    catch (error) {

        console.error(
            "API ERROR:",
            error
        );


        alert(
            "Cannot Load Google Sheet Data"
        );

    }

}


// =====================================================
// SHOW CUSTOMER MARKERS
// =====================================================

function showCustomers() {

    // Remove old markers

    markers.forEach(
        function(marker) {

            map.removeLayer(
                marker
            );

        }
    );


    markers = [];


    customers.forEach(
        function(customer) {

            const lat =
                parseFloat(
                    customer.Latitude
                );


            const lng =
                parseFloat(
                    customer.Longitude
                );


            // Skip invalid coordinates

            if (
                isNaN(lat) ||
                isNaN(lng)
            ) {

                console.warn(
                    "Invalid coordinate:",
                    customer.Customer_Name,
                    customer.Latitude,
                    customer.Longitude
                );

                return;

            }


            // -----------------------------------------
            // Customer Vehicle Count
            // -----------------------------------------

            const customerVehicles =
                vehicles.filter(
                    function(vehicle) {

                        return String(
                            vehicle.Customer_ID || ""
                        ) === String(
                            customer.Customer_ID || ""
                        );

                    }
                );


            // -----------------------------------------
            // Distance
            // -----------------------------------------

            let distanceText =
                "📏 Distance : -";


            if (
                userLat !== null &&
                userLng !== null
            ) {

                distanceText =
                    "📏 Distance : " +
                    calculateDistance(
                        userLat,
                        userLng,
                        lat,
                        lng
                    ) +
                    " km";

            }


            // -----------------------------------------
            // Marker
            // -----------------------------------------

            const marker =
                L.marker([
                    lat,
                    lng
                ]);


            marker
                .addTo(map)
                .bindPopup(`

                    <div
                        style="
                            min-width:240px;
                            font-size:14px;
                        "
                    >

                        <h3
                            style="
                                margin:0 0 10px 0;
                                color:#0B7285;
                            "
                        >
                            ${customer.Customer_Name || "-"}
                        </h3>


                        🌏
                        <b>Region:</b>
                        ${customer.Region || "-"}

                        <br>

                        📍
                        <b>Township:</b>
                        ${customer.Township || "-"}

                        <br>

                        🚛
                        <b>Vehicles:</b>
                        ${customerVehicles.length}

                        <br>

                        🏷
                        <b>Brand:</b>
                        ${customer.Brand || "-"}

                        <br><br>

                        <div>
                            ${distanceText}
                        </div>

                        <br>


                        <button
                            onclick="
                                showCustomerVehicles(
                                    '${escapeJS(
                                        customer.Customer_ID
                                    )}'
                                )
                            "
                            style="
                                width:100%;
                                padding:10px;
                                border:none;
                                border-radius:8px;
                                background:#0B7285;
                                color:white;
                                font-size:14px;
                                cursor:pointer;
                            "
                        >
                            🚛 View Vehicles
                        </button>


                        <br>


                        ${
                            customer.Phone_Number
                            ?
                            `
                            <a
                                href="
                                    tel:${customer.Phone_Number}
                                "
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
                            `
                            :
                            ""
                        }


                        <a
                            target="_blank"
                            href="
                                https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}
                            "
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

                `);


            // Popup Open

            marker.on(
                "popupopen",
                function() {

                    if (
                        userLat !== null &&
                        userLng !== null
                    ) {

                        console.log(
                            "Distance:",
                            calculateDistance(
                                userLat,
                                userLng,
                                lat,
                                lng
                            )
                        );

                    }

                }
            );


            markers.push(
                marker
            );

        }
    );


    // -----------------------------------------
    // Customer List
    // -----------------------------------------

    buildCustomerList(
        customers
    );


    // -----------------------------------------
    // Auto Fit Markers
    // -----------------------------------------

    if (
        markers.length > 0
    ) {

        const group =
            L.featureGroup(
                markers
            );


        map.fitBounds(
            group.getBounds(),
            {
                padding: [
                    40,
                    40
                ],

                maxZoom: 12,

                animate: false
            }
        );

    }


    console.log(
        "Customer Markers:",
        markers.length
    );

}


// =====================================================
// SEARCH CUSTOMER
// =====================================================

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


    if (
        keyword === ""
    ) {

        showCustomers();

        return;

    }


    const filtered =
        customers.filter(
            function(customer) {

                return (

                    String(
                        customer.Customer_Name || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                    ||

                    String(
                        customer.Customer_ID || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                    ||

                    String(
                        customer.Region || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                    ||

                    String(
                        customer.Township || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                    ||

                    String(
                        customer.Brand || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                );

            }
        );


    showFilteredCustomers(
        filtered
    );

}


// =====================================================
// SHOW FILTERED CUSTOMERS
// =====================================================

function showFilteredCustomers(
    data
) {

    // Remove markers

    markers.forEach(
        function(marker) {

            map.removeLayer(
                marker
            );

        }
    );


    markers = [];


    data.forEach(
        function(customer) {

            const lat =
                parseFloat(
                    customer.Latitude
                );


            const lng =
                parseFloat(
                    customer.Longitude
                );


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
                .addTo(map)
                .bindPopup(`

                    <div
                        style="
                            min-width:220px;
                        "
                    >

                        <h3>
                            ${customer.Customer_Name}
                        </h3>

                        🌏
                        ${customer.Region}

                        <br>

                        📍
                        ${customer.Township}

                        <br>

                        🏷
                        ${customer.Brand}

                        <br><br>

                        <button
                            onclick="
                                showCustomerVehicles(
                                    '${escapeJS(
                                        customer.Customer_ID
                                    )}'
                                )
                            "
                            style="
                                width:100%;
                                padding:10px;
                                border:none;
                                border-radius:8px;
                                background:#0B7285;
                                color:white;
                            "
                        >
                            🚛 View Vehicles
                        </button>

                    </div>

                `);


            markers.push(
                marker
            );

        }
    );


    buildCustomerList(
        data
    );


    // Fit filtered markers

    if (
        markers.length > 0
    ) {

        const group =
            L.featureGroup(
                markers
            );


        map.fitBounds(
            group.getBounds(),
            {
                padding: [
                    40,
                    40
                ],

                maxZoom: 14
            }
        );

    }

}


// =====================================================
// CUSTOMER LIST
// =====================================================

function buildCustomerList(
    data = customers
) {

    let html = "";


    data.forEach(
        function(customer) {

            const lat =
                parseFloat(
                    customer.Latitude
                );


            const lng =
                parseFloat(
                    customer.Longitude
                );


            html += `

                <div
                    class="customer-item"
                    onclick="
                        focusCustomer(
                            ${isNaN(lat) ? 0 : lat},
                            ${isNaN(lng) ? 0 : lng},
                            '${escapeJS(
                                customer.Customer_Name
                            )}'
                        )
                    "
                >

                    <b>
                        ${customer.Customer_Name || "-"}
                    </b>

                    <br>

                    🌏
                    ${customer.Region || "-"}

                    <br>

                    📍
                    ${customer.Township || "-"}

                    <br>

                    🏷
                    ${customer.Brand || "-"}

                </div>

            `;

        }
    );


    const list =
        document.getElementById(
            "listContent"
        );


    if (list) {

        list.innerHTML =
            html;

    }

}


// =====================================================
// FOCUS CUSTOMER
// =====================================================

function focusCustomer(
    lat,
    lng,
    name
) {

    if (
        isNaN(lat) ||
        isNaN(lng)
    ) {

        return;

    }


    map.setView(
        [
            lat,
            lng
        ],
        16
    );


    markers.forEach(
        function(marker) {

            const popup =
                marker.getPopup();


            if (
                popup &&
                popup.getContent()
                    .includes(
                        name
                    )
            ) {

                marker.openPopup();

            }

        }
    );


    toggleList();

}


// =====================================================
// BOTTOM SHEET
// =====================================================

function toggleList() {

    const panel =
        document.getElementById(
            "customerList"
        );


    if (!panel) {

        return;

    }


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


// =====================================================
// DISTANCE
// =====================================================

function calculateDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R =
        6371;


    const dLat =
        (
            lat2 - lat1
        )
        *
        Math.PI /
        180;


    const dLng =
        (
            lng2 - lng1
        )
        *
        Math.PI /
        180;


    const a =

        Math.sin(
            dLat / 2
        )
        *
        Math.sin(
            dLat / 2
        )

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
        )
        *
        Math.sin(
            dLng / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(
                1 - a
            )
        );


    return (
        R * c
    ).toFixed(1);

}


// =====================================================
// SHOW CUSTOMER VEHICLES
// =====================================================

function showCustomerVehicles(
    customerId
) {

    const customer =
        customers.find(
            function(customer) {

                return String(
                    customer.Customer_ID || ""
                ) === String(
                    customerId || ""
                );

            }
        );


    if (!customer) {

        alert(
            "Customer not found."
        );

        return;

    }


    const customerVehicles =
        vehicles.filter(
            function(vehicle) {

                return String(
                    vehicle.Customer_ID || ""
                ) === String(
                    customerId || ""
                );

            }
        );


    let html = `

        <div
            class="vehicle-panel"
            style="
                background:white;
                padding:18px;
                border-radius:16px;
                max-height:70vh;
                overflow-y:auto;
            "
        >

            <button
                onclick="closeVehiclePanel()"
                style="
                    float:right;
                    border:none;
                    background:#dc3545;
                    color:white;
                    width:35px;
                    height:35px;
                    border-radius:50%;
                    font-size:20px;
                "
            >
                ×
            </button>


            <h2
                style="
                    margin-top:0;
                    color:#0B7285;
                "
            >
                🚛 ${customer.Customer_Name}
            </h2>


            <div>
                🌏 ${customer.Region || "-"}
                <br>
                📍 ${customer.Township || "-"}
            </div>


            <hr>


            <h3>
                🚛 Vehicle List
            </h3>

    `;


    if (
        customerVehicles.length === 0
    ) {

        html += `

            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:#777;
                "
            >
                Vehicle Data မရှိသေးပါ။
            </div>

        `;

    }


    customerVehicles.forEach(
        function(vehicle) {

            html += `

                <div
                    style="
                        border:1px solid #ddd;
                        border-radius:12px;
                        padding:14px;
                        margin-bottom:12px;
                    "
                >

                    <div
                        style="
                            font-size:18px;
                            font-weight:bold;
                            color:#0B7285;
                        "
                    >
                        🚛
                        ${vehicle.Vehicle_ID || "-"}
                    </div>


                    <br>


                    🚘
                    <b>Vehicle Number:</b>
                    ${vehicle.Vehicle_Number || "-"}

                    <br>

                    🚚
                    <b>Vehicle Type:</b>
                    ${vehicle.Vehicle_Type || "-"}

                    <br>

                    🛣
                    <b>Regular Route:</b>
                    ${vehicle.Regular_Route || "-"}

                    <br>

                    📝
                    <b>Note:</b>
                    ${vehicle.Note || "-"}

                    <br><br>


                    <button
                        onclick="
                            showVehicleTires(
                                '${escapeJS(
                                    vehicle.Vehicle_ID
                                )}'
                            )
                        "
                        style="
                            width:100%;
                            padding:10px;
                            border:none;
                            border-radius:8px;
                            background:#198754;
                            color:white;
                            font-size:14px;
                        "
                    >
                        🛞 View Tire Information
                    </button>

                </div>

            `;

        }
    );


    html += `

        </div>

    `;


    openVehiclePanel(
        html
    );

}


// =====================================================
// VEHICLE PANEL
// =====================================================

function openVehiclePanel(
    html
) {

    let panel =
        document.getElementById(
            "vehiclePanel"
        );


    if (!panel) {

        panel =
            document.createElement(
                "div"
            );


        panel.id =
            "vehiclePanel";


        panel.style.position =
            "fixed";


        panel.style.left =
            "10px";


        panel.style.right =
            "10px";


        panel.style.bottom =
            "10px";


        panel.style.zIndex =
            "3000";


        panel.style.maxHeight =
            "75vh";


        panel.style.boxShadow =
            "0 5px 25px rgba(0,0,0,.3)";


        panel.style.borderRadius =
            "16px";


        document.body.appendChild(
            panel
        );

    }


    panel.innerHTML =
        html;


    panel.style.display =
        "block";

}


// =====================================================
// CLOSE VEHICLE PANEL
// =====================================================

function closeVehiclePanel() {

    const panel =
        document.getElementById(
            "vehiclePanel"
        );


    if (panel) {

        panel.style.display =
            "none";

    }

}


// =====================================================
// VEHICLE → TIRE
// =====================================================

function showVehicleTires(
    vehicleId
) {

    const vehicle =
        vehicles.find(
            function(vehicle) {

                return String(
                    vehicle.Vehicle_ID || ""
                ) === String(
                    vehicleId || ""
                );

            }
        );


    if (!vehicle) {

        alert(
            "Vehicle not found."
        );

        return;

    }


    const vehicleTires =
        tires.filter(
            function(tire) {

                return String(
                    tire.Vehicle_ID || ""
                ) === String(
                    vehicleId || ""
                );

            }
        );


    // Sort Position 1P - 10P

    vehicleTires.sort(
        function(a,b) {

            const pa =
                parseInt(
                    String(
                        a.Position || ""
                    )
                    .replace(
                        /[^0-9]/g,
                        ""
                    )
                ) || 0;


            const pb =
                parseInt(
                    String(
                        b.Position || ""
                    )
                    .replace(
                        /[^0-9]/g,
                        ""
                    )
                ) || 0;


            return pa - pb;

        }
    );


    let html = `

        <div
            style="
                background:white;
                padding:18px;
                border-radius:16px;
                max-height:75vh;
                overflow-y:auto;
            "
        >

            <button
                onclick="closeVehiclePanel()"
                style="
                    float:right;
                    border:none;
                    background:#dc3545;
                    color:white;
                    width:35px;
                    height:35px;
                    border-radius:50%;
                    font-size:20px;
                "
            >
                ×
            </button>


            <h2
                style="
                    margin-top:0;
                    color:#0B7285;
                "
            >
                🛞 Tire Information
            </h2>


            <b>
                🚛
                ${vehicle.Vehicle_ID || "-"}
            </b>


            <br>


            🚘
            ${vehicle.Vehicle_Number || "-"}


            <hr>

    `;


    if (
        vehicleTires.length === 0
    ) {

        html += `

            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:#777;
                "
            >
                Tire Data မရှိသေးပါ။
            </div>

        `;

    }


    vehicleTires.forEach(
        function(tire) {

            html += `

                <div
                    style="
                        border:1px solid #ddd;
                        border-radius:12px;
                        padding:14px;
                        margin-bottom:12px;
                    "
                >

                    <div
                        style="
                            font-size:20px;
                            font-weight:bold;
                            color:#0B7285;
                        "
                    >
                        🛞
                        ${tire.Position || "-"}
                    </div>


                    <br>


                    🏷
                    <b>Brand:</b>
                    ${tire.Brand || "-"}

                    <br>

                    📏
                    <b>Size:</b>
                    ${tire.Size || "-"}

                    <br>

                    🔧
                    <b>Pattern:</b>
                    ${tire.Pattern || "-"}

                    <br>

                    📐
                    <b>OTD:</b>
                    ${tire.OTD || "-"}

                    <br>

                    📉
                    <b>RTD:</b>
                    ${tire.RTD || "-"}

                    <br>

                    🚗
                    <b>Driven KM:</b>
                    ${tire.Driven_Kilometer || "-"}

                    <br>

                    📊
                    <b>mm/km:</b>
                    ${tire["mm/km"] || "-"}

                    <br>

                    📅
                    <b>Install Date:</b>
                    ${tire.Installation_Date || "-"}

                    <br>

                    📝
                    <b>Note:</b>
                    ${tire.Note || "-"}

                </div>

            `;

        }
    );


    html += `

        </div>

    `;


    openVehiclePanel(
        html
    );

}


// =====================================================
// ESCAPE JAVASCRIPT
// =====================================================

function escapeJS(
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
        /"/g,
        '\\"'
    );

}


// =====================================================
// PWA SERVICE WORKER
// =====================================================

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
