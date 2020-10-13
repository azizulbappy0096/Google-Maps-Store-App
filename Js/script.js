"use strict";   
let map;
let infoWindow;
let pos;
let markers = [];
const URL = "https://google-map-store-locator.herokuapp.com/api/stores"

function initMap() {
    var myPlace = {lat: 34.063584, lng: -118.376354}; 
    map = new google.maps.Map(document.getElementById("map"), {
        center: myPlace,
        zoom: 9,
    });
    infoWindow = new google.maps.InfoWindow();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
        pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

        })
      }
};

const createMarker = (latlng, name, address, openStatus, phoneNumber, number) => {
    
    let html = `
        <div class="store-info-window">
            <h4> ${name} </h4>
            <p class="store-open-status">
                ${openStatus}
            </p>

            <div class="store-address">
                <i class="fas fa-location-arrow"></i>
                <span> <a href="https://www.google.com/maps/dir/?api=1&origin=${pos.lat},${pos.lng}&destination=${address}" target="_blank"> ${address} </a> </span>
            </div>

            <div class="store-phoneNumber">
                <i class="fas fa-phone-alt"></i>
                <span> <a href="tel: ${phoneNumber}"> ${phoneNumber} </a> </span>
            </div>
        </div>
    `;
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        label: number.toString() 
    });
   setEventListener(html, marker);
   markers.push(marker);
}

const clearMarkers = (map) => {
    infoWindow.close();
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
    markers = [];
}

const noStoreFound = () => {
    const HTML = `
        <div class="no-store-found">
            <p> No store found!!! </p>
        </div>
    `
    document.querySelector(".store-lists").innerHTML = HTML;
}

const setEventListener = (html, marker) => {
    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
    });
};

const setOnClickEvent = () => {
    let storeElement = document.querySelectorAll(".store-container");
    
    storeElement.forEach((element, index) => {
        
        element.addEventListener("click", () => {
            infoWindow.close();
            map.setZoom(12);
            setTimeout(() => {
                google.maps.event.trigger(markers[index], 'click');
                map.setZoom(14);
                map.setCenter(markers[index].getPosition());
            }, 800)   
        })
    })
}

const setOnEnter = (e) => {
    if(e.keyCode === 13) {
        getStores()
    }
}

const getStores = () => { 
    const userInput = document.getElementById("user-input").value;
    const query = `?zip_code=${userInput}`;
    const fullUrl = `${URL}${query}`
    fetch(fullUrl).then(response => {
        if(response.ok) {
            return response.json();
        }

        throw new Error("Request failed!");
    }, networkError => console.log(networkError.message)
    ).then(jsonResponse => {
        if(jsonResponse.length > 0) {
            searchLocationsNear(jsonResponse);
            buildStoresListDisplay(jsonResponse);
            setOnClickEvent();
        }else {
            clearMarkers(null);
            noStoreFound();
        }
        
    })
};

const searchLocationsNear = (stores) => {
    clearMarkers(null);
    const bounds = new google.maps.LatLngBounds();
    stores.map((store, index) => {
        let latlng = new google.maps.LatLng(
            store.location.coordinates[1],
            store.location.coordinates[0]
        );
        let name = store.storeName;
        let address = store.addressLines[0];
        let openStatus = store.openStatus;
        let phoneNumber = store.phoneNumber
        createMarker(latlng, name, address, openStatus, phoneNumber, index+1);
        bounds.extend(latlng);
    })
    map.fitBounds(bounds);
}

const buildStoresListDisplay = (stores) => {
    let storeContent = "";

    stores.map((store, index) => {
        storeContent += `
        <div class=store-container>
            <div class="store">
                <div class="store-info">
                    <h3> ${store.addressLines[0]} </h3>
                    <h5> ${store.addressLines[1]} ${store.addressLines[2] ? store.addressLines[2]:""} </h5>
                    <p> <a href="tel: ${store.phoneNumber}"> ${store.phoneNumber} </a> </p>
                </div>
                <div class="store-num">${index+1}</div>
            </div>
        </div>    
        `;
    });

    document.querySelector(".store-lists").innerHTML = storeContent;
}