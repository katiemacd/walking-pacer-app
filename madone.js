'use strict';

let timePara;
let distancePara;
let currentfield;
let startTime;
let startLocation;
let isTracking = false;
let totalDistance = 0;
let totalWalkTime = 0;
let inclinePrompt;
//let lastDeviceOrientationEvent = null;
let showInclineData = false;
let inclineData = null;
let lastLocation = null;

const buttonClickHandler = function(evt) {
    const buttonValue = evt.target.innerText;
    if (!isNaN(parseInt(buttonValue))) {
        //number button click
        if (currentfield) {
            if (currentfield.innerText.length - 1 < (currentfield.id === "distance" ? 5 : 3)) {
                if (currentfield.innerText === '0|') {
                    currentfield.innerText = buttonValue + '|';
                } else {
                    currentfield.innerText = currentfield.innerText.replace('|', '') + buttonValue + '|';
                }
                calculatePace();
            }
        }
    } else if (buttonValue === 'C') {
        // clear current field
        if (currentfield) {
            currentfield.innerText = '0|';
            calculatePace();
        }
    } else if (buttonValue === '⇦') {
        //backspace button
        if (currentfield) {
            currentfield.innerText = currentfield.innerText.slice(0, -2) + '|';
            if (currentfield.innerText === '|') {
                currentfield.innerText = '0|';
            }
            calculatePace();
        }
    }
}

const calculatePace = function() {
    const distance = parseInt(distancePara.innerText);
    const time = parseInt(timePara.innerText);

    if (distance >= 10 && time >= 5) {
        const pace = Math.floor(time / (distance / 1000));
        document.getElementById('pace').innerText = `${pace} mins/km`;
    } else {
        document.getElementById('pace').innerText = '--';
    }
}

const selectField = function(field) {
    if (currentfield) {
        currentfield.innerText = currentfield.innerText.replace('|', '');
    }
    field.innerText += '|';
    currentfield = field;
}

// live pace and distance functions

const startTracking = function() {
    isTracking = true;
    startTime = new Date();
    totalDistance = 0;
    getCurrentLocation();
    document.getElementById('start').innerText = 'Stop';
}

const stopTracking = function() {
    isTracking = false;
    const stopTime = new Date();
    const walkTime = (stopTime - startTime) / (1000 * 60);
    totalWalkTime += walkTime;
    calculateAveragePace();
    document.getElementById('start').innerText = 'Start';
}
const updateLiveDistance = function(position) {
    if (isTracking) {
        const currentLocation = position.coords;
        if (lastLocation) {
            const distanceIncrement = calculateDistance(lastLocation, currentLocation);
            totalDistance += distanceIncrement;
            document.getElementById('live-distance').innerText = `Live Distance: ${totalDistance.toFixed(2)} metres`;
        } else if (!lastLocation && startLocation) {
            const initialDistance = calculateDistance(startLocation, currentLocation);
            totalDistance += initialDistance;
            document.getElementById('live-distance').innerText = `Live Distance: ${totalDistance.toFixed(2)} metres`;
        }
        lastLocation = currentLocation;
    }
};

const calculateAveragePace = function () {
    if (totalDistance > 0 && totalWalkTime > 0) {
        const averagePace = totalWalkTime / (totalDistance / 1000);
        document.getElementById('average-pace').innerText = `Average Pace: ${averagePace.toFixed(2)} mins/km`;
    } else {
        document.getElementById('average-pace').innerText = 'Average Pace: -- mins/km';
    }
}

const getCurrentLocation = function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            startLocation = position.coords;
            navigator.geolocation.watchPosition(updateLiveDistance);
        });
    } else {
        console.log("Geolocation not supported");
    }
}

const calculateDistance = function (startLocation, endLocation) {
    const R = 6371;
    const dLat = (endLocation.latitude - startLocation.latitude) * (Math.PI / 180);
    const dLon = (endLocation.longitude - startLocation.longitude) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(startLocation.latitude * (Math.PI / 180)) * Math.cos(endLocation.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2* Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance * 1000;
}

// incline feature functions

const handleDeviceOrientation = function (event) {
    //console.log("device orientation changed");
    if (event) {
        console.log("Device orientation changed");

        if (!showInclineData) {
            return;
        }
        const { beta } = event;
        let degrees = beta;
        let inclinePercentage = degreesToPercent(degrees);
        let direction = "flat";
        if (degrees > 0) {
            direction = "uphill";
        } else if (degrees < 0) {
            direction = "downhill";
        }
        inclineData = { inclinePercentage, degrees, direction };
        updateInclineDisplay();
    } else {
        console.error("No event object provided to handleDeviceOrientation");
    }
}
const degreesToPercent = function(degrees) {
    return Math.tan(Math.abs(degrees) * Math.PI / 180) * 100;
}

const updateInclineDisplay = function () {
    console.log("update incline display used ");
    if (inclineData) {
        const {inclinePercentage, degrees, direction} = inclineData;
        document.getElementById("incline-prompt").innerText = `◬ Incline: ${(inclinePercentage).toFixed(0)}% ${direction} (${(degrees).toFixed(0)}°) ◬`;
        setTimeout(() => {
            document.getElementById("incline-prompt").innerText = "◬ Tap to show incline ◬";
            showInclineData = false; // Reset flag after 30 seconds
        }, 30000);
    }
}
const displayIncline = function() {
    console.log("clicked on incline prompt");
    showInclineData = true;
    //window.addEventListener("deviceorientation", handleDeviceOrientation, true);
    handleDeviceOrientation({beta: 0});
}

const init = function() {
    console.log("initialising test");
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
        const inclinePrompt = document.getElementById("incline-prompt");
        inclinePrompt.innerHTML = "◬ Tap to show incline ◬";
        inclinePrompt.addEventListener("click", () => {
            DeviceOrientationEvent.requestPermission()
                .then((response) => {
                    if (response === "granted") {
                        window.addEventListener("deviceorientation", handleDeviceOrientation, true);
                        inclinePrompt.innerText = "◬ Tap to show incline ◬";
                    } else {
                        console.log("Permission is needed!");
                    }
                })
                .catch(console.error);
        });
    } else {
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleDeviceOrientation, true);
        }
    }
    // Called on page show - use to intialise variables and any startup code
    timePara = document.getElementById("time");
    distancePara = document.getElementById("distance");
    currentfield = distancePara;

    //pacePara = document.getElementById("pace");
    selectField(currentfield);
    document.getElementById("time").addEventListener("click", function() {
        selectField(timePara);
    });
    document.getElementById("distance").addEventListener("click", function() {
        selectField(distancePara);
    });

    document.getElementById("b0").addEventListener("click", buttonClickHandler);
    document.getElementById("b1").addEventListener("click", buttonClickHandler);
    document.getElementById("b2").addEventListener("click", buttonClickHandler);
    document.getElementById("b3").addEventListener("click", buttonClickHandler);
    document.getElementById("b4").addEventListener("click", buttonClickHandler);
    document.getElementById("b5").addEventListener("click", buttonClickHandler);
    document.getElementById("b6").addEventListener("click", buttonClickHandler);
    document.getElementById("b7").addEventListener("click", buttonClickHandler);
    document.getElementById("b8").addEventListener("click", buttonClickHandler);
    document.getElementById("b9").addEventListener("click", buttonClickHandler);
    document.getElementById("bC").addEventListener("click", buttonClickHandler);
    document.getElementById("bBack").addEventListener("click", buttonClickHandler);

    navigator.geolocation.watchPosition(updateLiveDistance);

    document.getElementById('start').addEventListener('click', function () {
        if (!isTracking) {
            startTracking()
        } else {
            stopTracking();
        }
    });

    //setInterval(updateLiveDistance, 1000);
    calculatePace();

    window.addEventListener("deviceorientation", handleDeviceOrientation, true);

    inclinePrompt = document.getElementById("incline-prompt");
    inclinePrompt.addEventListener("click", displayIncline);

    if (!window.DeviceOrientationEvent) {
        console.log("Device orientation event not supported.");
    }
}



window.addEventListener("pageshow", init);
