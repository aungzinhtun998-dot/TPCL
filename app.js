// ======================================================
// TPCL APP - CLEAN VERSION
// Customer → Vehicle → Tire → Inspection
// Search / Filter / GPS / Distance / Navigate
// Customer / Vehicle / Tire / Inspection Notes
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

let listOpen = false;


// ======================================================
// MAP
// ======================================================

function initMap() {

    if (map) return;

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
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

    setTimeout(() => {

        if (map) {
            map.invalidateSize();
        }

    }, 300);

}


// ======================================================
// START APP
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initMap();

        getUserLocation();

        loadAllData();

    }
);


// ======================================================
// GPS
// ======================================================

function getUserLocation() {

    if (!navigator.geolocation) {

        console.log(
            "GPS not supported."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;

            console.log(
                "User location:",
                userLat,
                userLng
            );

        },

        function(error) {

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

        function(position) {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;

            if (!map) return;

            map.setView(
                [userLat, userLng],
                15,
                {
                    animate: true
                }
            );

            L.circleMarker(
                [userLat, userLng],
                {
                    radius: 7
                }
            )
            .addTo(map)
            .bindPopup(
                "📍 Your Current Location"
            )
            .openPopup();

        },

        function(error) {

            console.log(
                error
            );

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

        const results =
            await Promise.all([

                fetch(CUSTOMER_API)
                    .then(response => {

                        if (!response.ok) {
                            throw new Error(
                                "Customer API error"
                            );
                        }

                        return response.json();

                    }),

                fetch(VEHICLE_API)
                    .then(response => {

                        if (!response.ok) {
                            throw new Error(
                                "Vehicle API error"
                            );
                        }

                        return response.json();

                    }),

                fetch(TIRE_API)
                    .then(response => {

                        if (!response.ok) {
                            throw new Error(
                                "Tire API error"
                            );
                        }

                        return response.json();

                    }),

                fetch(INSPECTION_API)
                    .then(response => {

                        if (!response.ok) {
                            throw new Error(
                                "Inspection API error"
                            );
                        }

                        return response.json();

                    })

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

    catch(error) {

        console.error(
            "TPCL DATA ERROR:",
            error
        );

        const list =
            document.getElementById(
                "listContent"
            );

        if (list) {

            list.innerHTML = `

                <div style="
                    padding:20px;
                    color:#b00020;
                ">

                    ❌ Cannot load TPCL data.

                    <br><br>

                    Please check Google Apps Script API.

                </div>

            `;

        }

    }

}


// ======================================================
// CLEAR MAP MARKERS
// ======================================================

function clearMarkers() {

    markers.forEach(
        marker => {

            if (map) {

                map.removeLayer(
                    marker
                );

            }

        }
    );

    markers = [];

}


// ======================================================
// SHOW CUSTOMERS ON MAP
// ======================================================

function showCustomers(
    data = customers
) {

    if (!map) {

        initMap();

    }

    clearMarkers();


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


            const customerID =
                customer.Customer_ID || "";

            const phone =
                customer.Phone_Number || "";


            const marker =
                L.marker([
                    lat,
                    lng
                ])
                .addTo(map);


            // ==================================================
            // CUSTOMER POPUP
            // ==================================================

            marker.bindPopup(`

                <div style="
                    min-width:250px;
                ">

                    <h3 style="
                        margin-top:0;
                        margin-bottom:8px;
                    ">

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


                    <span id="
                        distance-${safeID(
                            customerID
                        )}
                    ">

                        📏 Calculating...

                    </span>


                    ${
                        customer.Note
                        ?
                        `

                        <br>

                        📝 <b>Customer Note:</b>
                        ${escapeHTML(
                            customer.Note
                        )}

                        `
                        :
                        ""
                    }


                    <br><br>


                    <button
                        onclick="
                            openCustomerVehicles(
                                '${escapeJS(
                                    customerID
                                )}'
                            )
                        "
                        style="
                            width:100%;
                            padding:10px;
                            border:0;
                            border-radius:8px;
                            background:#1976D2;
                            color:white;
                            font-size:15px;
                        "
                    >

                        🚛 View Vehicles

                    </button>


                    <br><br>


                    ${
                        phone
                        ?
                        `

                        <a
                            href="tel:${escapeHTML(
                                phone
                            )}"
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
                        rel="noopener"
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


            marker.on(
                "popupopen",
                function() {

                    showDistance(
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

}


// ======================================================
// SEARCH / FILTER
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

                const customerID =
                    String(
                        customer.Customer_ID || ""
                    )
                    .toLowerCase();

                const customerName =
                    String(
                        customer.Customer_Name || ""
                    )
                    .toLowerCase();

                const region =
                    String(
                        customer.Region || ""
                    )
                    .toLowerCase();

                const township =
                    String(
                        customer.Township || ""
                    )
                    .toLowerCase();

                const brand =
                    String(
                        customer.Brand || ""
                    )
                    .toLowerCase();


                const customerNote =
                    String(
                        customer.Note || ""
                    )
                    .toLowerCase();


                const customerVehicles =
                    vehicles.filter(
                        vehicle =>
                            String(
                                vehicle.Customer_ID || ""
                            )
                            ===
                            String(
                                customer.Customer_ID || ""
                            )
                    );


                const vehicleMatch =
                    customerVehicles.some(
                        vehicle => {

                            const vehicleNumber =
                                String(
                                    vehicle.Vehicle_Number || ""
                                )
                                .toLowerCase();

                            const vehicleID =
                                String(
                                    vehicle.Vehicle_ID || ""
                                )
                                .toLowerCase();

                            const vehicleNote =
                                String(
                                    vehicle.Note || ""
                                )
                                .toLowerCase();


                            return (

                                vehicleNumber.includes(
                                    keyword
                                )

                                ||

                                vehicleID.includes(
                                    keyword
                                )

                                ||

                                vehicleNote.includes(
                                    keyword
                                )

                            );

                        }
                    );


                return (

                    customerID.includes(
                        keyword
                    )

                    ||

                    customerName.includes(
                        keyword
                    )

                    ||

                    region.includes(
                        keyword
                    )

                    ||

                    township.includes(
                        keyword
                    )

                    ||

                    brand.includes(
                        keyword
                    )

                    ||

                    customerNote.includes(
                        keyword
                    )

                    ||

                    vehicleMatch

                );

            }
        );


    showCustomers(
        filtered
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


    if (data.length === 0) {

        container.innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
            ">

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

                    ${
                        customer.Note
                        ?
                        `

                        <br>

                        📝
                        ${escapeHTML(
                            customer.Note
                        )}

                        `
                        :
                        ""
                    }

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

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        return;

    }


    if (!map) return;


    map.setView(
        [lat, lng],
        16,
        {
            animate: true
        }
    );


    const marker =
        markers.find(
            m => {

                const position =
                    m.getLatLng();

                return (

                    Math.abs(
                        position.lat - lat
                    ) < 0.000001

                    &&

                    Math.abs(
                        position.lng - lng
                    ) < 0.000001

                );

            }
        );


    if (marker) {

        marker.openPopup();

    }


    closePanel();

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
                )
                ===
                String(
                    customerID
                )
        );


    if (!customer) return;


    const customerVehicles =
        vehicles.filter(
            vehicle =>
                String(
                    vehicle.Customer_ID
                )
                ===
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

        <div style="
            padding:12px;
        ">


            <button
                onclick="showCustomers()"
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


    // CUSTOMER NOTE
    if (customer.Note) {

        html += `

            <div style="
                background:#fff8e1;
                padding:10px;
                border-radius:8px;
                margin-bottom:10px;
            ">

                📝 <b>Customer Note:</b>

                <br>

                ${escapeHTML(
                    customer.Note
                )}

            </div>

        `;

    }


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
                    tire =>
                        String(
                            tire.Vehicle_ID
                        )
                        ===
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


                    ${
                        vehicle.Note
                        ?
                        `

                        <br>

                        📝 <b>Vehicle Note:</b>

                        ${escapeHTML(
                            vehicle.Note
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
                )
                ===
                String(
                    vehicleID
                )
        );


    if (!vehicle) return;


    const vehicleTires =
        tires.filter(
            tire =>
                String(
                    tire.Vehicle_ID
                )
                ===
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

        <div style="
            padding:12px;
        ">


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


    // VEHICLE NOTE
    if (vehicle.Note) {

        html += `

            <div style="
                background:#fff8e1;
                padding:10px;
                border-radius:8px;
                margin-bottom:10px;
            ">

                📝 <b>Vehicle Note:</b>

                <br>

                ${escapeHTML(
                    vehicle.Note
                )}

            </div>

        `;

    }


    // ==================================================
    // ONLY EXISTING TIRES
    // ==================================================

    if (data.length === 0) {

        html += `

            <p style="
                text-align:center;
                padding:15px;
            ">

                🛞 No Tire

            </p>

        `;

    }


    data.forEach(
        tire => {

            const inspectionCount =
                inspections.filter(
                    inspection =>
                        String(
                            inspection.Tire_ID
                        )
                        ===
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


                    ${
                        tire.Note
                        ?
                        `

                        <br>

                        📝 <b>Tire Note:</b>

                        ${escapeHTML(
                            tire.Note
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
                )
                ===
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
                )
                ===
                String(
                    tireID
                )
        );


    if (!tire) return;


    const history =
        inspections
            .filter(
                inspection =>
                    String(
                        inspection.Tire_ID
                    )
                    ===
                    String(
                        tireID
                    )
            )
            .sort(
                (a, b) =>
                    String(
                        b.Inspection_Date
                    )
                    .localeCompare(
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


            <div style="
                background:#f5f5f5;
                padding:12px;
                border-radius:10px;
                margin-bottom:12px;
            ">

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


    // TIRE NOTE
    if (tire.Note) {

        html += `

            <div style="
                background:#fff8e1;
                padding:10px;
                border-radius:8px;
                margin-bottom:12px;
            ">

                📝 <b>Tire Note:</b>

                <br>

                ${escapeHTML(
                    tire.Note
                )}

            </div>

        `;

    }


    if (data.length === 0) {

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


                    ${
                        item.Note
                        ?
                        `

                        <br><br>

                        📝 <b>Inspection Note:</b>

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
                )
                ===
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
// DISTANCE
// ======================================================

function showDistance(
    customer
) {

    const element =
        document.getElementById(
            "distance-" +
            safeID(
                customer.Customer_ID
            )
        );


    if (!element) return;


    if (
        userLat === null ||
        userLng === null
    ) {

        element.innerHTML =
            "📏 Location unavailable";

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
            "📏 Location unavailable";

        return;

    }


    const R = 6371;


    const dLat =
        (
            lat - userLat
        )
        *
        Math.PI / 180;


    const dLng =
        (
            lng - userLng
        )
        *
        Math.PI / 180;


    const a =

        Math.sin(
            dLat / 2
        ) ** 2

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

        Math.sin(
            dLng / 2
        ) ** 2;


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
        )
        .toFixed(1);


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


    setTimeout(
        function() {

            if (map) {

                map.invalidateSize();

            }

        },
        300
    );

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


    setTimeout(
        function() {

            if (map) {

                map.invalidateSize();

            }

        },
        300
    );

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
                            "TPCL Service Worker:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    function(error) {

                        console.error(
                            "Service Worker Error:",
                            error
                        );

                    }
                );

        }
    );

}
