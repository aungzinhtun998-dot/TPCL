console.log("TPCL v3.0 Started");

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}
