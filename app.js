// ======================================================
// TPCL APP
// Customer → Vehicle → Tire → Inspection
// Search + Filter + GPS + Distance + Navigate
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
// GLOBAL
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
// FILTER STATE
// ======================================================

let activeFilters = {
    region: "",
    township: "",
    brand: "",
    vehicleType: ""
};


// ======================================================
// START
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    initMap();

    loadAllData();

    getUserLocation();

    setupFilterEvents();

});


// ======================================================
// MAP
// ======================================================

function initMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        console.error("Map element not found");
        return;
    }

    if (map) return;

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

    setTimeout(function () {

        map.invalidateSize();

    }, 500);

}


// ======================================================
// GPS
// ======================================================

function getUserLocation() {

    if (!navigator.geolocation) {

        console.log(
            "GPS not supported"
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        function (position) {

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
             * GPS ရပြီးတာနဲ့
             * customer popup distance ကို
             * ပြန် generate လုပ်
             */

            if (customers.length > 0) {

                showCustomers(
                    getFilteredCustomers()
                );

            }

        },

        function (error) {

            console.log(
                "GPS unavailable:",
                error.message
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
// CURRENT LOCATION
// ======================================================

function goCurrentLocation() {

    if (!navigator.geolocation) {

        alert(
            "GPS is not supported."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        function (position) {

            userLat =
                Number(
                    position.coords.latitude
                );

            userLng =
                Number(
                    position.coords.longitude
                );


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


            L.circleMarker(
                [
                    userLat,
                    userLng
                ],
                {
                    radius: 7
                }
            )
                .addTo(map)
                .bindPopup(
                    "📍 Your Current Location"
                )
                .openPopup();


            /*
             * Distance update
             */

            if (customers.length > 0) {

                showCustomers(
                    getFilteredCustomers()
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
            timeout: 15000,
            maximumAge: 0
        }

    );

}


// ======================================================
// LOAD DATA
// ======================================================

async function loadAllData() {

    try {

        const results =
            await Promise.all([

                fetch(CUSTOMER_API)
                    .then(function (r) {

                        if (!r.ok)
                            throw new Error(
                                "Customer API error"
                            );

                        return r.json();

                    }),

                fetch(VEHICLE_API)
                    .then(function (r) {

                        if (!r.ok)
                            throw new Error(
                                "Vehicle API error"
                            );

                        return r.json();

                    }),

                fetch(TIRE_API)
                    .then(function (r) {

                        if (!r.ok)
                            throw new Error(
                                "Tire API error"
                            );

                        return r.json();

                    }),

                fetch(INSPECTION_API)
                    .then(function (r) {

                        if (!r.ok)
                            throw new Error(
                                "Inspection API error"
                            );

                        return r.json();

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


        buildFilterOptions();


        showCustomers(
            getFilteredCustomers()
        );

    }

    catch (error) {

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
// CLEAR MARKERS
// ======================================================

function clearMarkers() {

    markers.forEach(function (marker) {

        if (map) {

            map.removeLayer(marker);

        }

    });

    markers = [];

}


// ======================================================
// SHOW CUSTOMERS
// ======================================================

function showCustomers(
    data = customers
) {

    if (!map) {

        initMap();

    }


    if (!map) return;


    clearMarkers();


    data.forEach(function (customer) {

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


        const customerID =
            String(
                customer.Customer_ID || ""
            );


        const phone =
            String(
                customer.Phone_Number || ""
            );


        /*
         * Distance
         */

        const distanceText =
            getDistanceText(customer);


        /*
         * Customer Note
         */

        const customerNote =
            customer.Note
                ? `
                    <br>
                    📝 <b>Note:</b>
                    ${escapeHTML(customer.Note)}
                `
                : "";


        /*
         * Popup
         */

        const popupHTML = `

            <div style="
                min-width:260px;
                max-width:300px;
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

                📏
                <span id="
                    distance-${safeID(customerID)}
                ">
                    ${distanceText}
                </span>

                ${customerNote}


                <br><br>


                <button
                    onclick="
                        openCustomerVehicles(
                            '${escapeJS(customerID)}'
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
                        ? `
                            <a
                                href="tel:${escapeHTML(phone)}"
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
                        : ""
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

        `;


        marker.bindPopup(
            popupHTML
        );


        /*
         * Popup open ဖြစ်တဲ့အခါ
         * distance ကို ထပ် update
         */

        marker.on(
            "popupopen",
            function () {

                showDistance(
                    customer
                );

            }
        );


        markers.push(
            marker
        );

    });


    buildCustomerList(
        data
    );

}


// ======================================================
// DISTANCE TEXT
// ======================================================

function getDistanceText(
    customer
) {

    if (
        userLat === null ||
        userLng === null
    ) {

        return "📏 GPS unavailable";

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

        return "📏 Location unavailable";

    }


    const R = 6371;


    const dLat =
        (
            lat - userLat
        ) *
        Math.PI / 180;


    const dLng =
        (
            lng - userLng
        ) *
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
            Math.sqrt(1 - a)
        );


    const distance =
        (
            R * c
        ).toFixed(1);


    return (
        "📏 Distance: " +
        distance +
        " km"
    );

}


// ======================================================
// SHOW DISTANCE
// ======================================================

function showDistance(
    customer
) {

    const id =
        "distance-" +
        safeID(
            customer.Customer_ID
        );


    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.innerHTML =
        getDistanceText(
            customer
        );

}


// ======================================================
// SEARCH
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


    const filtered =
        getFilteredCustomers(
            keyword
        );


    showCustomers(
        filtered
    );

}


// ======================================================
// GET FILTERED CUSTOMERS
// ======================================================

function getFilteredCustomers(
    searchKeyword = ""
) {

    const keyword =
        String(
            searchKeyword || ""
        )
        .trim()
        .toLowerCase();


    return customers.filter(
        function (customer) {


            // ------------------------------------------
            // SEARCH
            // ------------------------------------------

            let searchMatch =
                true;


            if (keyword) {

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


                const phone =
                    String(
                        customer.Phone_Number || ""
                    )
                    .toLowerCase();


                const vehicleMatch =
                    vehicles.some(
                        function (vehicle) {

                            if (
                                String(
                                    vehicle.Customer_ID || ""
                                ) !==
                                String(
                                    customer.Customer_ID || ""
                                )
                            ) {

                                return false;

                            }


                            const number =
                                String(
                                    vehicle.Vehicle_Number || ""
                                )
                                .toLowerCase();


                            const id =
                                String(
                                    vehicle.Vehicle_ID || ""
                                )
                                .toLowerCase();


                            return (
                                number.includes(keyword) ||
                                id.includes(keyword)
                            );

                        }
                    );


                searchMatch =
                    customerID.includes(keyword) ||
                    customerName.includes(keyword) ||
                    region.includes(keyword) ||
                    township.includes(keyword) ||
                    brand.includes(keyword) ||
                    phone.includes(keyword) ||
                    vehicleMatch;

            }


            if (!searchMatch) {

                return false;

            }


            // ------------------------------------------
            // REGION
            // ------------------------------------------

            if (
                activeFilters.region &&
                String(
                    customer.Region || ""
                ) !==
                String(
                    activeFilters.region
                )
            ) {

                return false;

            }


            // ------------------------------------------
            // TOWNSHIP
            // ------------------------------------------

            if (
                activeFilters.township &&
                String(
                    customer.Township || ""
                ) !==
                String(
                    activeFilters.township
                )
            ) {

                return false;

            }


            // ------------------------------------------
            // BRAND
            // ------------------------------------------

            if (
                activeFilters.brand &&
                String(
                    customer.Brand || ""
                ) !==
                String(
                    activeFilters.brand
                )
            ) {

                return false;

            }


            // ------------------------------------------
            // VEHICLE TYPE
            // ------------------------------------------

            if (
                activeFilters.vehicleType
            ) {

                const hasVehicleType =
                    vehicles.some(
                        function (vehicle) {

                            return (

                                String(
                                    vehicle.Customer_ID || ""
                                ) ===
                                String(
                                    customer.Customer_ID || ""
                                )

                                &&

                                String(
                                    vehicle.Vehicle_Type || ""
                                ) ===
                                String(
                                    activeFilters.vehicleType
                                )

                            );

                        }
                    );


                if (!hasVehicleType) {

                    return false;

                }

            }


            return true;

        }
    );

}


// ======================================================
// BUILD FILTER OPTIONS
// ======================================================

function buildFilterOptions() {

    fillSelect(
        "regionFilter",
        uniqueValues(
            customers,
            "Region"
        ),
        "All Regions"
    );


    fillSelect(
        "townshipFilter",
        uniqueValues(
            customers,
            "Township"
        ),
        "All Townships"
    );


    fillSelect(
        "brandFilter",
        uniqueValues(
            customers,
            "Brand"
        ),
        "All Brands"
    );


    fillSelect(
        "vehicleTypeFilter",
        uniqueValues(
            vehicles,
            "Vehicle_Type"
        ),
        "All Vehicle Types"
    );

}


// ======================================================
// UNIQUE VALUES
// ======================================================

function uniqueValues(
    data,
    field
) {

    const values =
        data
            .map(
                item =>
                    String(
                        item[field] || ""
                    ).trim()
            )
            .filter(
                value =>
                    value !== ""
            );


    return [
        ...new Set(values)
    ].sort();

}


// ======================================================
// FILL SELECT
// ======================================================

function fillSelect(
    elementID,
    values,
    defaultText
) {

    const select =
        document.getElementById(
            elementID
        );


    if (!select) return;


    select.innerHTML = "";


    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value = "";

    defaultOption.textContent =
        defaultText;


    select.appendChild(
        defaultOption
    );


    values.forEach(
        function (value) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                value;

            option.textContent =
                value;


            select.appendChild(
                option
            );

        }
    );

}


// ======================================================
// FILTER EVENTS
// ======================================================

function setupFilterEvents() {

    const ids = [
        "regionFilter",
        "townshipFilter",
        "brandFilter",
        "vehicleTypeFilter"
    ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (!element) return;


            element.addEventListener(
                "change",
                function () {

                    // Township / Brand စတာတွေကို
                    // ရွေးချယ်တဲ့အချိန်မှာပဲ
                    // Apply နှိပ်နိုင်အောင်ထား

                }
            );

        }
    );

}


// ======================================================
// APPLY FILTER
// ======================================================

function applyFilters() {

    activeFilters = {

        region:
            getValue("regionFilter"),

        township:
            getValue("townshipFilter"),

        brand:
            getValue("brandFilter"),

        vehicleType:
            getValue("vehicleTypeFilter")

    };


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const keyword =
        searchInput
            ? searchInput.value
            : "";


    showCustomers(
        getFilteredCustomers(
            keyword
        )
    );


    toggleFilterPanel();

}


// ======================================================
// CLEAR FILTER
// ======================================================

function clearFilters() {

    activeFilters = {

        region: "",
        township: "",
        brand: "",
        vehicleType: ""

    };


    setValue(
        "regionFilter",
        ""
    );

    setValue(
        "townshipFilter",
        ""
    );

    setValue(
        "brandFilter",
        ""
    );

    setValue(
        "vehicleTypeFilter",
        ""
    );


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (searchInput) {

        searchInput.value = "";

    }


    showCustomers(
        customers
    );


    toggleFilterPanel();

}


// ======================================================
// FILTER PANEL
// ======================================================

function toggleFilterPanel() {

    const panel =
        document.getElementById(
            "filterPanel"
        );


    if (!panel) return;


    panel.classList.toggle(
        "show"
    );

}


// ======================================================
// GET VALUE
// ======================================================

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value
        : "";

}


// ======================================================
// SET VALUE
// ======================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value;

    }

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


    if (!data.length) {

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
        function (customer) {

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
            function (item) {

                const position =
                    item.getLatLng();


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
            function (c) {

                return String(
                    c.Customer_ID
                ) === String(
                    customerID
                );

            }
        );


    if (!customer) return;


    const data =
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
        data
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
                onclick="showCustomers(
                    getFilteredCustomers()
                )"
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


    if (!data.length) {

        html += `
            <p>
                No vehicle data found.
            </p>
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
                            ? `
                                <br>
                                📝
                                ${escapeHTML(
                                    vehicle.Note
                                )}
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


    if (!vehicle) return;


    const data =
        tires.filter(
            function (t) {

                return String(
                    t.Vehicle_ID
                ) === String(
                    vehicleID
                );

            }
        );


    showTirePanel(
        vehicle,
        data
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


    /*
     * Empty positions မပြ
     */

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
                            ? `
                                <br>
                                📝
                                ${escapeHTML(
                                    tire.Note
                                )}
                            `
                            : ""
                    }

                </div>

            `;

        }
    );


    if (!data.length) {

        html += `
            <p>
                No Tire
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
            function (v) {

                return String(
                    v.Vehicle_ID
                ) === String(
                    vehicleID
                );

            }
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
            function (t) {

                return String(
                    t.Tire_ID
                ) === String(
                    tireID
                );

            }
        );


    if (!tire) return;


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

                    return String(
                        b.Inspection_Date
                    ).localeCompare(
                        String(
                            a.Inspection_Date
                        )
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

                ${
                    tire.Note
                        ? `
                            <br><br>
                            📝
                            ${escapeHTML(
                                tire.Note
                            )}
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
        function (item) {

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
                            ? `
                                <br><br>
                                📝
                                ${escapeHTML(
                                    item.Note
                                )}
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


    if (!tire) return;


    openVehicleTires(
        tire.Vehicle_ID
    );

}


// ======================================================
// CUSTOMER LIST
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
        function () {

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
        function () {

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

    } else {

        openPanel();

    }

}


// ======================================================
// ESCAPE HTML
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
// ESCAPE JS
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
                            "TPCL Service Worker:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    function (error) {

                        console.error(
                            "Service Worker Error:",
                            error
                        );

                    }
                );

        }
    );

}
// ======================================================
// FILTER TOGGLE
// ======================================================

function toggleFilter() {

    const filterArea =
        document.getElementById("filterArea");

    if (!filterArea) return;

    filterArea.classList.toggle("show");

}


// ======================================================
// BUILD FILTER OPTIONS
// ======================================================

function buildFilters() {

    const regionFilter =
        document.getElementById("regionFilter");

    const townshipFilter =
        document.getElementById("townshipFilter");

    const brandFilter =
        document.getElementById("brandFilter");

    if (
        !regionFilter ||
        !townshipFilter ||
        !brandFilter
    ) return;


    const regions = [
        ...new Set(
            customers
                .map(c => String(c.Region || "").trim())
                .filter(Boolean)
        )
    ].sort();


    const townships = [
        ...new Set(
            customers
                .map(c => String(c.Township || "").trim())
                .filter(Boolean)
        )
    ].sort();


    const brands = [
        ...new Set(
            customers
                .map(c => String(c.Brand || "").trim())
                .filter(Boolean)
        )
    ].sort();


    regionFilter.innerHTML =
        `<option value="">All Regions</option>` +
        regions.map(
            x => `<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`
        ).join("");


    townshipFilter.innerHTML =
        `<option value="">All Townships</option>` +
        townships.map(
            x => `<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`
        ).join("");


    brandFilter.innerHTML =
        `<option value="">All Brands</option>` +
        brands.map(
            x => `<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`
        ).join("");

}


// ======================================================
// APPLY FILTER
// ======================================================

function applyFilters() {

    const region =
        document.getElementById("regionFilter")?.value || "";

    const township =
        document.getElementById("townshipFilter")?.value || "";

    const brand =
        document.getElementById("brandFilter")?.value || "";


    const filtered =
        customers.filter(customer => {

            const customerRegion =
                String(customer.Region || "").trim();

            const customerTownship =
                String(customer.Township || "").trim();

            const customerBrand =
                String(customer.Brand || "").trim();


            return (

                (!region ||
                    customerRegion === region)

                &&

                (!township ||
                    customerTownship === township)

                &&

                (!brand ||
                    customerBrand === brand)

            );

        });


    showCustomers(filtered);

}


// ======================================================
// CLEAR FILTER
// ======================================================

function clearFilters() {

    const region =
        document.getElementById("regionFilter");

    const township =
        document.getElementById("townshipFilter");

    const brand =
        document.getElementById("brandFilter");


    if (region) region.value = "";
    if (township) township.value = "";
    if (brand) brand.value = "";


    showCustomers();

}
