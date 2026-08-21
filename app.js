/* =====================================================
   TPCL APP
   Customer → Vehicle → Tire → Inspection

   Search
   Region Filter
   Township Dependent Filter
   Tire Size Filter
   GPS
   Distance
   Navigate
   Customer List
   Notes
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

let userLocationMarker = null;

let listOpen = false;


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initMap();

        bindEvents();

        getUserLocation();

        loadAllData();

    }
);


/* =====================================================
   EVENTS
===================================================== */

function bindEvents() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            searchCustomer
        );

    }

}


/* =====================================================
   MAP
===================================================== */

function initMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {

        console.error(
            "Map element not found."
        );

        return;

    }


    if (map) return;


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

            map.invalidateSize();

        },
        300
    );

}


/* =====================================================
   LOAD DATA
===================================================== */

async function loadAllData() {

    const list =
        document.getElementById(
            "listContent"
        );


    if (list) {

        list.innerHTML =
            "Loading Customers...";

    }


    try {

        const results =
            await Promise.all([

                fetchJSON(CUSTOMER_API),

                fetchJSON(VEHICLE_API),

                fetchJSON(TIRE_API),

                fetchJSON(INSPECTION_API)

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


        buildFilterOptions();

        showCustomers();


    }
    catch (error) {

        console.error(
            "TPCL DATA ERROR:",
            error
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


/* =====================================================
   FETCH JSON
===================================================== */

async function fetchJSON(url) {

    const response =
        await fetch(url, {
            cache: "no-store"
        });


    if (!response.ok) {

        throw new Error(
            "API Error: " +
            response.status
        );

    }


    const data =
        await response.json();


    return data;

}


/* =====================================================
   GPS
===================================================== */

function getUserLocation() {

    if (!navigator.geolocation) {

        console.log(
            "GPS not supported."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;


            console.log(
                "User:",
                userLat,
                userLng
            );


            updateOpenPopupDistances();

        },

        error => {

            console.log(
                "GPS unavailable:",
                error.message
            );

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

    if (!navigator.geolocation) {

        alert(
            "GPS is not supported."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            userLat =
                position.coords.latitude;

            userLng =
                position.coords.longitude;


            if (!map) return;


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


            if (userLocationMarker) {

                map.removeLayer(
                    userLocationMarker
                );

            }


            userLocationMarker =
                L.circleMarker(
                    [
                        userLat,
                        userLng
                    ],
                    {
                        radius: 8
                    }
                )
                .addTo(map)
                .bindPopup(
                    "📍 Your Current Location"
                );


            updateOpenPopupDistances();

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
   FILTER OPTIONS
===================================================== */

function buildFilterOptions() {

    buildRegionOptions();

    buildTownshipOptions();

    buildSizeOptions();

}


/* =====================================================
   REGION OPTIONS
===================================================== */

function buildRegionOptions() {

    const select =
        document.getElementById(
            "regionFilter"
        );

    if (!select) return;


    const regions =
        uniqueValues(
            customers.map(
                c => c.Region
            )
        );


    select.innerHTML = `
        <option value="">
            All Regions
        </option>
    `;


    regions
        .sort(compareText)
        .forEach(region => {

            select.innerHTML += `
                <option value="${escapeHTML(region)}">
                    ${escapeHTML(region)}
                </option>
            `;

        });

}


/* =====================================================
   TOWNSHIP OPTIONS

   IMPORTANT:
   Region ရွေးပြီးရင်
   အဲဒီ Region ထဲက Township တွေပဲပြမယ်
===================================================== */

function buildTownshipOptions() {

    const region =
        getFilterValue(
            "regionFilter"
        );


    const select =
        document.getElementById(
            "townshipFilter"
        );

    if (!select) return;


    let source =
        customers;


    if (region) {

        source =
            customers.filter(
                customer =>
                    normalize(
                        customer.Region
                    ) === normalize(
                        region
                    )
            );

    }


    const townships =
        uniqueValues(
            source.map(
                c => c.Township
            )
        );


    select.innerHTML = `
        <option value="">
            All Townships
        </option>
    `;


    townships
        .sort(compareText)
        .forEach(township => {

            select.innerHTML += `
                <option value="${escapeHTML(township)}">
                    ${escapeHTML(township)}
                </option>
            `;

        });

}


/* =====================================================
   TIRE SIZE OPTIONS
===================================================== */

function buildSizeOptions() {

    const select =
        document.getElementById(
            "sizeFilter"
        );

    if (!select) return;


    const sizes =
        uniqueValues(
            tires.map(
                tire => tire.Size
            )
        );


    select.innerHTML = `
        <option value="">
            All Sizes
        </option>
    `;


    sizes
        .sort(compareText)
        .forEach(size => {

            select.innerHTML += `
                <option value="${escapeHTML(size)}">
                    ${escapeHTML(size)}
                </option>
            `;

        });

}


/* =====================================================
   REGION CHANGED
===================================================== */

function regionChanged() {

    const township =
        document.getElementById(
            "townshipFilter"
        );


    /*
       Region ပြောင်းတိုင်း
       Township ကို အသစ်ပြန်တည်ဆောက်မယ်
    */

    buildTownshipOptions();


    /*
       Township အဟောင်းကို
       reset လုပ်မယ်
    */

    if (township) {

        township.value = "";

    }


    applyFilters();

}


/* =====================================================
   APPLY FILTERS
===================================================== */

function applyFilters() {

    const region =
        getFilterValue(
            "regionFilter"
        );

    const township =
        getFilterValue(
            "townshipFilter"
        );

    const size =
        getFilterValue(
            "sizeFilter"
        );


    const filtered =
        customers.filter(
            customer => {

                /*
                   REGION
                */

                if (
                    region &&
                    normalize(
                        customer.Region
                    ) !== normalize(
                        region
                    )
                ) {

                    return false;

                }


                /*
                   TOWNSHIP
                */

                if (
                    township &&
                    normalize(
                        customer.Township
                    ) !== normalize(
                        township
                    )
                ) {

                    return false;

                }


                /*
                   TIRE SIZE

                   Customer
                   ↓
                   Vehicle
                   ↓
                   Tire
                   ↓
                   Size
                */

                if (size) {

                    const customerVehicles =
                        vehicles.filter(
                            vehicle =>
                                sameID(
                                    vehicle.Customer_ID,
                                    customer.Customer_ID
                                )
                        );


                    const vehicleIDs =
                        customerVehicles.map(
                            vehicle =>
                                vehicle.Vehicle_ID
                        );


                    const sizeMatch =
                        tires.some(
                            tire => {

                                const vehicleMatch =
                                    vehicleIDs.some(
                                        id =>
                                            sameID(
                                                id,
                                                tire.Vehicle_ID
                                            )
                                    );


                                return (
                                    vehicleMatch &&
                                    normalize(
                                        tire.Size
                                    ) === normalize(
                                        size
                                    )
                                );

                            }
                        );


                    if (!sizeMatch) {

                        return false;

                    }

                }


                return true;

            }
        );


    showCustomers(filtered);

}


/* =====================================================
   RESET FILTERS
===================================================== */

function resetFilters() {

    const region =
        document.getElementById(
            "regionFilter"
        );

    const township =
        document.getElementById(
            "townshipFilter"
        );

    const size =
        document.getElementById(
            "sizeFilter"
        );


    if (region)
        region.value = "";

    if (township)
        township.value = "";

    if (size)
        size.value = "";


    buildTownshipOptions();

    showCustomers();

}


/* =====================================================
   SEARCH
===================================================== */

function searchCustomer() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const keyword =
        normalize(
            input
                ? input.value
                : ""
        );


    if (!keyword) {

        applyFilters();

        return;

    }


    const region =
        getFilterValue(
            "regionFilter"
        );

    const township =
        getFilterValue(
            "townshipFilter"
        );

    const size =
        getFilterValue(
            "sizeFilter"
        );


    const filtered =
        customers.filter(
            customer => {

                /*
                   Apply normal filters first
                */

                if (
                    region &&
                    normalize(
                        customer.Region
                    ) !== normalize(
                        region
                    )
                ) {

                    return false;

                }


                if (
                    township &&
                    normalize(
                        customer.Township
                    ) !== normalize(
                        township
                    )
                ) {

                    return false;

                }


                if (
                    size &&
                    !customerHasTireSize(
                        customer,
                        size
                    )
                ) {

                    return false;

                }


                /*
                   CUSTOMER SEARCH
                */

                const customerText =
                    [
                        customer.Customer_ID,
                        customer.Customer_Name,
                        customer.Region,
                        customer.Township,
                        customer.Brand,
                        customer.Note
                    ]
                    .map(
                        value =>
                            normalize(value)
                    )
                    .join(" ");


                if (
                    customerText.includes(
                        keyword
                    )
                ) {

                    return true;

                }


                /*
                   VEHICLE SEARCH
                */

                const customerVehicles =
                    vehicles.filter(
                        vehicle =>
                            sameID(
                                vehicle.Customer_ID,
                                customer.Customer_ID
                            )
                    );


                return customerVehicles.some(
                    vehicle => {

                        const vehicleText =
                            [
                                vehicle.Vehicle_ID,
                                vehicle.Vehicle_Number,
                                vehicle.Vehicle_Type,
                                vehicle.Regular_Route,
                                vehicle.Brand,
                                vehicle.Note
                            ]
                            .map(
                                value =>
                                    normalize(value)
                            )
                            .join(" ");


                        return vehicleText.includes(
                            keyword
                        );

                    }
                );

            }
        );


    showCustomers(filtered);

}


/* =====================================================
   CUSTOMER HAS TIRE SIZE
===================================================== */

function customerHasTireSize(
    customer,
    size
) {

    const customerVehicles =
        vehicles.filter(
            vehicle =>
                sameID(
                    vehicle.Customer_ID,
                    customer.Customer_ID
                )
        );


    const vehicleIDs =
        customerVehicles.map(
            vehicle =>
                vehicle.Vehicle_ID
        );


    return tires.some(
        tire => {

            return (
                vehicleIDs.some(
                    id =>
                        sameID(
                            id,
                            tire.Vehicle_ID
                        )
                )
                &&
                normalize(
                    tire.Size
                ) === normalize(size)
            );

        }
    );

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
                )
                .addTo(map);


            const customerID =
                String(
                    customer.Customer_ID || ""
                );


            const phone =
                customer.Phone_Number || "";


            const note =
                customer.Note || "";


            marker.bindPopup(
                buildCustomerPopup(
                    customer
                )
            );


            marker.on(
                "popupopen",
                () => {

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


/* =====================================================
   CUSTOMER POPUP
===================================================== */

function buildCustomerPopup(
    customer
) {

    const customerID =
        String(
            customer.Customer_ID || ""
        );


    const phone =
        String(
            customer.Phone_Number || ""
        );


    const lat =
        Number(
            customer.Latitude
        );


    const lng =
        Number(
            customer.Longitude
        );


    const note =
        String(
            customer.Note || ""
        ).trim();


    let phoneButton = "";

    if (phone) {

        phoneButton = `
            <a
                class="popup-btn call-btn"
                href="tel:${escapeAttr(phone)}"
            >
                📞 Call
            </a>
        `;

    }


    const noteHTML =
        note
            ? `
                <div class="popup-note">
                    📝 <b>Note:</b><br>
                    ${escapeHTML(note)}
                </div>
              `
            : "";


    return `
        <div class="popup-box">

            <h3 class="popup-title">
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

            <span
                id="distance-${safeID(customerID)}"
            >
                📏 Calculating...
            </span>

            ${noteHTML}


            <button
                class="popup-btn vehicle-btn"
                style="
                    width:100%;
                    margin-top:12px;
                "
                onclick="
                    openCustomerVehicles(
                        '${escapeJS(customerID)}'
                    )
                "
            >
                🚛 View Vehicles
            </button>


            <div class="popup-buttons">

                ${phoneButton}


                <a
                    class="popup-btn navigate-btn"
                    target="_blank"
                    rel="noopener"
                    href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}"
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

function showDistance(
    customer
) {

    const id =
        "distance-" +
        safeID(
            customer.Customer_ID
        );


    const element =
        document.getElementById(id);


    if (!element) return;


    if (
        userLat === null ||
        userLng === null
    ) {

        element.innerHTML =
            "📏 Getting location...";


        /*
           GPS မရသေးရင်
           နောက်ထပ် တစ်ကြိမ်ကြိုးစားမယ်
        */

        getUserLocation();

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


/* =====================================================
   HAVERSINE DISTANCE
===================================================== */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        toRadians(
            lat2 - lat1
        );

    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(dLat / 2) ** 2
        +
        Math.cos(
            toRadians(lat1)
        )
        *
        Math.cos(
            toRadians(lat2)
        )
        *
        Math.sin(dLon / 2) ** 2;


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


/* =====================================================
   UPDATE OPEN POPUP DISTANCES
===================================================== */

function updateOpenPopupDistances() {

    if (!map) return;


    const popup =
        map._popup;


    if (!popup) return;


    const popupElement =
        popup.getElement();


    if (!popupElement) return;


    const openedMarker =
        markers.find(
            marker =>
                marker.isPopupOpen()
        );


    if (!openedMarker) return;


    const position =
        openedMarker.getLatLng();


    const customer =
        customers.find(
            c => {

                const lat =
                    Number(
                        c.Latitude
                    );

                const lng =
                    Number(
                        c.Longitude
                    );


                return (
                    Math.abs(
                        lat -
                        position.lat
                    ) < 0.000001
                    &&
                    Math.abs(
                        lng -
                        position.lng
                    ) < 0.000001
                );

            }
        );


    if (customer) {

        showDistance(
            customer
        );

    }

}


/* =====================================================
   CUSTOMER LIST
===================================================== */

function buildCustomerList(
    data = customers
) {

    const container =
        document.getElementById(
            "listContent"
        );


    if (!container) return;


    if (!data.length) {

        container.innerHTML = `
            <div style="
                padding:30px;
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


            const note =
                String(
                    customer.Note || ""
                ).trim();


            html += `
                <div
                    class="customer-item"
                    onclick="
                        focusCustomer(
                            ${lat},
                            ${lng}
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
                        note
                            ? `
                                <div class="detail-note">
                                    📝 <b>Note:</b><br>
                                    ${escapeHTML(note)}
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
    lng
) {

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        return;

    }


    if (!map) return;


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
            m => {

                const p =
                    m.getLatLng();


                return (
                    Math.abs(
                        p.lat - lat
                    ) < 0.000001
                    &&
                    Math.abs(
                        p.lng - lng
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
   CUSTOMER → VEHICLES
===================================================== */

function openCustomerVehicles(
    customerID
) {

    const customer =
        customers.find(
            c =>
                sameID(
                    c.Customer_ID,
                    customerID
                )
        );


    if (!customer) return;


    const data =
        vehicles.filter(
            vehicle =>
                sameID(
                    vehicle.Customer_ID,
                    customerID
                )
        );


    showVehiclePanel(
        customer,
        data
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


    if (!content) return;


    let html = `
        <div style="padding:4px">

            <button
                class="panel-btn back-btn"
                onclick="showCustomers(); openPanel();"
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


    if (!data.length) {

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
                        sameID(
                            tire.Vehicle_ID,
                            vehicle.Vehicle_ID
                        )
                ).length;


            const note =
                String(
                    vehicle.Note || ""
                ).trim();


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
                        note
                            ? `
                                <div class="detail-note">
                                    📝 <b>Note:</b><br>
                                    ${escapeHTML(note)}
                                </div>
                              `
                            : ""
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


/* =====================================================
   VEHICLE → TIRES
===================================================== */

function openVehicleTires(
    vehicleID
) {

    const vehicle =
        vehicles.find(
            v =>
                sameID(
                    v.Vehicle_ID,
                    vehicleID
                )
        );


    if (!vehicle) return;


    const data =
        tires.filter(
            tire =>
                sameID(
                    tire.Vehicle_ID,
                    vehicleID
                )
        );


    showTirePanel(
        vehicle,
        data
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


    if (!content) return;


    let html = `
        <div style="padding:4px">

            <button
                class="panel-btn back-btn"
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

            <h3>
                🛞 Tires -
                ${escapeHTML(
                    vehicle.Vehicle_Number
                )}
            </h3>
    `;


    if (!data.length) {

        html += `
            <p>
                No Tire
            </p>
        `;

    }


    data.forEach(
        tire => {

            const inspectionCount =
                inspections.filter(
                    inspection =>
                        sameID(
                            inspection.Tire_ID,
                            tire.Tire_ID
                        )
                ).length;


            const note =
                String(
                    tire.Note || ""
                ).trim();


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
                        note
                            ? `
                                <div class="detail-note">
                                    📝 <b>Note:</b><br>
                                    ${escapeHTML(note)}
                                </div>
                              `
                            : ""
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


/* =====================================================
   BACK TO VEHICLES
===================================================== */

function openCustomerVehiclesByVehicle(
    vehicleID
) {

    const vehicle =
        vehicles.find(
            v =>
                sameID(
                    v.Vehicle_ID,
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
            t =>
                sameID(
                    t.Tire_ID,
                    tireID
                )
        );


    if (!tire) return;


    const history =
        inspections
            .filter(
                inspection =>
                    sameID(
                        inspection.Tire_ID,
                        tireID
                    )
            )
            .sort(
                (a, b) =>
                    String(
                        b.Inspection_Date || ""
                    )
                    .localeCompare(
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


    if (!content) return;


    const tireNote =
        String(
            tire.Note || ""
        ).trim();


    let html = `
        <div style="padding:4px">

            <button
                class="panel-btn back-btn"
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

            <h3>
                🔍 Inspection
            </h3>


            <div class="detail-box">

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

                ${
                    tireNote
                        ? `
                            <div class="detail-note">
                                📝 <b>Note:</b><br>
                                ${escapeHTML(
                                    tireNote
                                )}
                            </div>
                          `
                        : ""
                }

            </div>
    `;


    if (!data.length) {

        html += `
            <p>
                No inspection history.
            </p>
        `;

    }


    data.forEach(
        item => {

            const note =
                String(
                    item.Note || ""
                ).trim();


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
                        note
                            ? `
                                <div class="detail-note">
                                    📝 <b>Note:</b><br>
                                    ${escapeHTML(note)}
                                </div>
                              `
                            : ""
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


/* =====================================================
   BACK TO TIRES
===================================================== */

function openVehicleTiresByTire(
    tireID
) {

    const tire =
        tires.find(
            t =>
                sameID(
                    t.Tire_ID,
                    tireID
                )
        );


    if (!tire) return;


    openVehicleTires(
        tire.Vehicle_ID
    );

}


/* =====================================================
   CLEAR MARKERS
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
   PANEL
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


    listOpen = true;


    setTimeout(
        () => {

            if (map) {

                map.invalidateSize();

            }

        },
        300
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


    listOpen = false;


    setTimeout(
        () => {

            if (map) {

                map.invalidateSize();

            }

        },
        300
    );

}


function toggleList() {

    if (listOpen) {

        closePanel();

    }
    else {

        openPanel();

    }

}


/* =====================================================
   FILTER PANEL
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


function closeFilter() {

    const panel =
        document.getElementById(
            "filterPanel"
        );


    if (!panel) return;


    panel.classList.remove(
        "show"
    );

}


/* =====================================================
   HELPERS
===================================================== */

function getFilterValue(
    id
) {

    const element =
        document.getElementById(id);


    return element
        ? element.value.trim()
        : "";

}


function normalize(
    value
) {

    return String(
        value ?? ""
    )
    .trim()
    .toLowerCase();

}


function sameID(
    a,
    b
) {

    return normalize(a) ===
        normalize(b);

}


function uniqueValues(
    values
) {

    return [
        ...new Set(
            values
                .map(
                    value =>
                        String(
                            value ?? ""
                        ).trim()
                )
                .filter(
                    value =>
                        value !== ""
                )
        )
    ];

}


function compareText(
    a,
    b
) {

    return String(a)
        .localeCompare(
            String(b)
        );

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
   ATTRIBUTE ESCAPE
===================================================== */

function escapeAttr(
    value
) {

    return escapeHTML(
        value
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
        /"/g,
        '\\"'
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
                            "TPCL Service Worker:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    error => {

                        console.error(
                            "Service Worker Error:",
                            error
                        );

                    }
                );

        }
    );

}
