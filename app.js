// ======================================================
// TPCL APP v6.0
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

let map = null;

let customers = [];
let vehicles = [];
let tires = [];
let inspections = [];

let markers = [];

let userLat = null;
let userLng = null;

let userLocationMarker = null;

let listOpen = false;

let currentPopupCustomer = null;


// ======================================================
// START APP
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    initializeMap();

    startGPS();

    loadAllData();

});


// ======================================================
// MAP INITIALIZE
// ======================================================

function initializeMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {

        console.error(
            "Map element not found"
        );

        return;

    }


    if (typeof L === "undefined") {

        console.error(
            "Leaflet library not loaded"
        );

        return;

    }


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


    console.log(
        "TPCL Map initialized"
    );

}


// ======================================================
// GPS START
// ======================================================

function startGPS() {

    if (!navigator.geolocation) {

        console.log(
            "GPS Not Supported"
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            updateUserLocation(
                position
            );

        },

        function (error) {

            console.log(
                "GPS Permission / Error:",
                error
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
        }

    );

}


// ======================================================
// UPDATE USER LOCATION
// ======================================================

function updateUserLocation(position) {

    userLat =
        Number(
            position.coords.latitude
        );

    userLng =
        Number(
            position.coords.longitude
        );


    if (
        !Number.isFinite(userLat) ||
        !Number.isFinite(userLng)
    ) {

        return;

    }


    if (!map) return;


    // Remove old GPS marker

    if (userLocationMarker) {

        map.removeLayer(
            userLocationMarker
        );

    }


    // Add current location marker

    userLocationMarker =
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


    // Update currently opened customer distance

    if (currentPopupCustomer) {

        showDistance(
            currentPopupCustomer
        );

    }

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

        function (position) {

            updateUserLocation(
                position
            );


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

        function (error) {

            console.error(
                "GPS Error:",
                error
            );

            alert(
                "GPS Location မရရှိပါ။ Phone Location Permission ကိုစစ်ပေးပါ။"
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}


// ======================================================
// LOAD ALL DATA
// ======================================================

async function loadAllData() {

    try {

        const results =
            await Promise.all([

                fetch(
                    CUSTOMER_API
                ).then(
                    response => {

                        if (!response.ok) {

                            throw new Error(
                                "Customer API Error"
                            );

                        }

                        return response.json();

                    }
                ),

                fetch(
                    VEHICLE_API
                ).then(
                    response => {

                        if (!response.ok) {

                            throw new Error(
                                "Vehicle API Error"
                            );

                        }

                        return response.json();

                    }
                ),

                fetch(
                    TIRE_API
                ).then(
                    response => {

                        if (!response.ok) {

                            throw new Error(
                                "Tire API Error"
                            );

                        }

                        return response.json();

                    }
                ),

                fetch(
                    INSPECTION_API
                ).then(
                    response => {

                        if (!response.ok) {

                            throw new Error(
                                "Inspection API Error"
                            );

                        }

                        return response.json();

                    }
                )

            ]);


        customers =
            Array.isArray(results[0])
                ? results[0]
                : [];


        vehicles =
            Array.isArray(results[1])
                ? results[1]
                : [];


        tires =
            Array.isArray(results[2])
                ? results[2]
                : [];


        inspections =
            Array.isArray(results[3])
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
            "TPCL DATA ERROR:",
            error
        );


        alert(
            "Cannot Load TPCL Data"
        );

    }

}


// ======================================================
// SHOW CUSTOMER MARKERS
// ======================================================

function showCustomers(
    data = customers
) {

    if (!map) return;


    // Remove old markers

    markers.forEach(
        marker => {

            map.removeLayer(
                marker
            );

        }
    );


    markers = [];


    // Build new markers

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
                L.marker([
                    lat,
                    lng
                ])
                .addTo(map);


            const customerName =
                escapeHTML(
                    customer.Customer_Name
                );


            const region =
                escapeHTML(
                    customer.Region
                );


            const township =
                escapeHTML(
                    customer.Township
                );


            const vehicleCount =
                escapeHTML(
                    customer.Vehicle_Count
                );


            const brand =
                escapeHTML(
                    customer.Brand
                );


            const phone =
                String(
                    customer.Phone_Number || ""
                );


            const customerID =
                String(
                    customer.Customer_ID || ""
                );


            const safeCustomerID =
                escapeJS(
                    customerID
                );


            const phoneSafe =
                escapeHTML(
                    phone
                );


            const navigationURL =
                "https://www.google.com/maps/dir/?api=1&destination="
                +
                encodeURIComponent(
                    lat + "," + lng
                );


            const popupHTML = `

                <div
                    style="
                    min-width:240px;
                    max-width:320px;
                    "
                >

                    <h3
                        style="
                        margin:0 0 6px 0;
                        "
                    >
                        ${customerName}
                    </h3>


                    🌏
                    <b>Region:</b>
                    ${region}

                    <br>


                    📍
                    <b>Township:</b>
                    ${township}

                    <br>


                    🚛
                    <b>Vehicles:</b>
                    ${vehicleCount}

                    <br>


                    🏷
                    <b>Brand:</b>
                    ${brand}

                    <br>


                    📏

                    <span
                        id="distance-${safeID(customerID)}"
                    >
                        Calculating...
                    </span>


                    <br><br>


                    <button

                        onclick="
                        openCustomerVehicles(
                            '${safeCustomerID}'
                        )
                        "

                        style="
                        width:100%;
                        padding:12px;
                        border:0;
                        border-radius:8px;
                        background:#1976D2;
                        color:white;
                        font-size:16px;
                        font-weight:bold;
                        "
                    >

                        🚛 View Vehicles

                    </button>


                    <br><br>


                    <a

                        href="tel:${phoneSafe}"

                        style="
                        display:inline-block;
                        background:#28a745;
                        color:white;
                        padding:9px 13px;
                        border-radius:8px;
                        text-decoration:none;
                        font-size:15px;
                        "
                    >

                        📞 Call

                    </a>


                    <a

                        href="${navigationURL}"

                        target="_blank"

                        rel="noopener noreferrer"

                        style="
                        display:inline-block;
                        background:#1976D2;
                        color:white;
                        padding:9px 13px;
                        border-radius:8px;
                        text-decoration:none;
                        margin-left:8px;
                        font-size:15px;
                        "
                    >

                        🧭 Navigate

                    </a>


                </div>

            `;


            marker.bindPopup(
                popupHTML
            );


            marker.on(
                "popupopen",
                function () {

                    currentPopupCustomer =
                        customer;


                    // Calculate immediately

                    showDistance(
                        customer
                    );


                    // Calculate again after GPS update/render

                    setTimeout(
                        function () {

                            showDistance(
                                customer
                            );

                        },
                        500
                    );


                    setTimeout(
                        function () {

                            showDistance(
                                customer
                            );

                        },
                        1500
                    );

                }
            );


            marker.on(
                "popupclose",
                function () {

                    if (
                        currentPopupCustomer ===
                        customer
                    ) {

                        currentPopupCustomer =
                            null;

                    }

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
                !Number.isFinite(lng)
            ) {

                return;

            }


            html += `

                <div

                    class="customer-item"

                    onclick="
                    focusCustomer(
                        ${lat},
                        ${lng},
                        '${escapeJS(
                            customer.Customer_ID
                        )}'
                    )
                    "
                >

                    <b>
                        ${escapeHTML(
                            customer.Customer_Name
                        )}
                    </b>

                    <br>

                    🌏
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

        }
    );


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

    if (!map) return;


    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        return;

    }


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
                ) ===
                String(
                    customerID
                )
        );


    if (!customer) return;


    markers.forEach(
        marker => {

            const markerLatLng =
                marker.getLatLng();


            if (
                Math.abs(
                    markerLatLng.lat - lat
                ) < 0.000001
                &&
                Math.abs(
                    markerLatLng.lng - lng
                ) < 0.000001
            ) {

                marker.openPopup();

            }

        }
    );


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
        customers.filter(
            customer => {

                return (

                    String(
                        customer.Customer_ID || ""
                    )
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                    ||

                    String(
                        customer.Customer_Name || ""
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
            c =>
                String(
                    c.Customer_ID
                ) ===
                String(
                    customerID
                )
        );


    if (!customer) return;


    const customerVehicles =
        vehicles.filter(
            v =>
                String(
                    v.Customer_ID
                ) ===
                String(
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

    const content =
        document.getElementById(
            "listContent"
        );


    if (!content) return;


    let html = `

        <div
            style="
            padding:12px;
            "
        >

            <button

                onclick="
                showCustomers()
                "

                style="
                padding:8px 12px;
                border:0;
                border-radius:8px;
                "
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

            <p>
                No vehicle data found.
            </p>

        `;

    }


    data.forEach(
        vehicle => {

            const tireCount =
                tires.filter(
                    t =>
                        String(
                            t.Vehicle_ID
                        ) ===
                        String(
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
            v =>
                String(
                    v.Vehicle_ID
                ) ===
                String(
                    vehicleID
                )
        );


    if (!vehicle) return;


    const vehicleTires =
        tires.filter(
            t =>
                String(
                    t.Vehicle_ID
                ) ===
                String(
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

        <div
            style="
            padding:12px;
            "
        >

            <button

                onclick="
                openCustomerVehiclesByVehicle(
                    '${escapeJS(
                        vehicle.Vehicle_ID
                    )}'
                )
                "

                style="
                padding:8px 12px;
                border:0;
                border-radius:8px;
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


    // ==================================================
    // IMPORTANT
    // No Tire position will NOT be displayed.
    // Only real tire data will be displayed.
    // ==================================================

    const positions = [
        "1P",
        "2P",
        "3P",
        "4P",
        "5P",
        "6P",
        "7P",
        "8P",
        "9P",
        "10P"
    ];


    let realTireCount = 0;


    positions.forEach(
        position => {

            const tire =
                data.find(
                    t =>
                        String(
                            t.Position
                        ).trim().toUpperCase() ===
                        position
                );


            // ------------------------------------------
            // Only show tire if it actually exists
            // ------------------------------------------

            if (!tire) {

                return;

            }


            realTireCount++;


            const inspectionCount =
                inspections.filter(
                    i =>
                        String(
                            i.Tire_ID
                        ) ===
                        String(
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
                    )
                    "
                >

                    <b>

                        ${escapeHTML(
                            position
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


    if (
        realTireCount === 0
    ) {

        html += `

            <p
                style="
                padding:12px;
                color:#777;
                "
            >

                No Tire Data

            </p>

        `;

    }


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
            v =>
                String(
                    v.Vehicle_ID
                ) ===
                String(
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
                ) ===
                String(
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
                    ) ===
                    String(
                        tireID
                    )
            )
            .sort(
                function (a, b) {

                    return parseInspectionDate(
                        b.Inspection_Date
                    )
                    -
                    parseInspectionDate(
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


    if (!content) return;


    let html = `

        <div
            style="
            padding:12px;
            "
        >

            <button

                onclick="
                openVehicleTiresByTire(
                    '${escapeJS(
                        tire.Tire_ID
                    )}'
                )
                "

                style="
                padding:8px 12px;
                border:0;
                border-radius:8px;
                "
            >

                ← Tires

            </button>


            <h3>
                🔍 Inspection
            </h3>


            <div

                style="
                background:#f5f5f5;
                padding:12px;
                border-radius:10px;
                margin-bottom:12px;
                "
            >

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


    if (
        data.length === 0
    ) {

        html += `

            <p>
                No inspection history.
            </p>

        `;

    }


    data.forEach(
        item => {

            html += `

                <div
                    class="customer-item"
                >

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
            t =>
                String(
                    t.Tire_ID
                ) ===
                String(
                    tireID
                )
        );


    if (!tire) return;


    openVehicleTires(
        tire.Vehicle_ID
    );

}


// ======================================================
// DISTANCE CALCULATION
// ======================================================

function showDistance(
    customer
) {

    const elementID =
        "distance-" +
        safeID(
            customer.Customer_ID
        );


    const element =
        document.getElementById(
            elementID
        );


    if (!element) {

        return;

    }


    // GPS not ready

    if (
        userLat === null ||
        userLng === null
    ) {

        element.innerHTML =
            "📏 Distance: GPS not ready";

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
            "📏 Distance unavailable";

        return;

    }


    const R =
        6371;


    const dLat =
        (
            lat -
            userLat
        )
        *
        Math.PI /
        180;


    const dLng =
        (
            lng -
            userLng
        )
        *
        Math.PI /
        180;


    const userLatRad =
        userLat *
        Math.PI /
        180;


    const latRad =
        lat *
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
            userLatRad
        )
        *
        Math.cos(
            latRad
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


    const distance =
        (
            R * c
        ).toFixed(1);


    element.innerHTML =
        "📏 Distance: " +
        distance +
        " km";

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


// ======================================================
// CLOSE PANEL
// ======================================================

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


// ======================================================
// TOGGLE LIST
// ======================================================

function toggleList() {

    if (listOpen) {

        closePanel();

    }

    else {

        openPanel();

    }

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
// INSPECTION DATE PARSER
// ======================================================

function parseInspectionDate(
    value
) {

    if (!value) {

        return 0;

    }


    const parsed =
        new Date(
            value
        ).getTime();


    if (
        Number.isFinite(
            parsed
        )
    ) {

        return parsed;

    }


    return 0;

}


// ======================================================
// PWA SERVICE WORKER
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
                            "Service Worker registration failed:",
                            error
                        );

                    }
                );

        }
    );

}
