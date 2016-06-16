var Map = function (center, zoom = 16) {
    var map = L.map('map', {
        zoomControl: false
    });
    L.tileLayer('https://api.mapbox.com/styles/v1/fediazgon/ciouky95m0031ddmkoxm9o589/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZmVkaWF6Z29uIiwiYSI6ImNpb3VrcGVtdzAwNG12dmx3MTNjczN4ZmIifQ.39QVufsizGt9zB2qMpB4uQ').addTo(map);
    map.setView(center, zoom);
    new L.Control.Zoom({
        position: 'bottomright'
    }).addTo(map);
    this.map = map;

    //Add default icons. Objects of type Icon (see http://leafletjs.com/reference.html#icon)
    this.icons = {};
    this._addIcons();

    // Objects of type Marker (see http://leafletjs.com/reference.html#marker). Represent the origin of the route.
    this.originMarker = {};
    this.placeMarkers = [];

    // Stores route lines, markers and steps.
    // see http://www.liedman.net/leaflet-routing-machine/api/#l-routing-control
    this.routeControl = {};

    this.shouldAvoidStairs = false;
};

Map.prototype.setAvoidStairs = function (shouldAvoidStairs) {
    this.shouldAvoidStairs = shouldAvoidStairs;
};

Map.prototype._addIcons = function () {
    var icons = ['origin', 'museum', 'monument', 'restaurant', 'cinema', 'beach', 'park', 'parking'];
    // Place the icons in the 'images' folder. Icons must have the same name as those of the array.
    icons.forEach(this._addIcon.bind(this));
};

Map.prototype._addIcon = function (name) {
    this.icons[name] = L.icon({
        iconUrl: 'images/markers/' + name + '.png',
        iconSize: [32, 37],
        popupAnchor: [0, -25]
    });
}

Map.prototype._removeLayers = function (layers) {
    var instance = this;
    layers.map(function (layer) {
        instance.map.removeLayer(layer);
    });
}

Map.prototype._removeControl = function () {
    this.map.closePopup();
    this.map.removeControl(this.routeControl);
}

Map.prototype.showOriginMarker = function (address) {

    if (!_.isEmpty(this.originMarker))
        this._removeLayers([this.originMarker]);

    var numResults = 1;
    var url = 'https://search.mapzen.com/v1/search?api_key=search-DeSaHZB&text=' + address + '&boundary.country=ES&size=' + numResults;

    var instance = this;
    $.get(url).done(function (response) {
        response.features.map(function (location) {
            var cords = location.geometry.coordinates;
            var pos = [cords[1], cords[0]];
            var icon = instance.icons['origin'];
            instance.originMarker = instance.addMarker(pos, icon); // this function returns a Marker
            instance.map.panTo(new L.LatLng(cords[1], cords[0]));
        });
    }).fail(function () {
        console.log('Could not find location: ' + url);
    });
};

Map.prototype.showPlacesMarkers = function (places, placeClass) {

    // Delete previous places markers and add selected.
    this._removeLayers(this.placeMarkers);
    this.placeMarkers.length = 0;

    var instance = this;
    places.forEach(function (place) {
        instance.placeMarkers.push(instance.addPlaceMarker(place, placeClass)); // this function returns a Marker
    });
};

Map.prototype.addMarker = function (location, icon) {

    var options = {};
    options['icon'] = icon;
    return L.marker(location, options).addTo(this.map);
};

Map.prototype.addPlaceMarker = function (place, placeClass) {

    var placeLocation = [place.lat.value, place.long.value];
    var placeImage = 'images/thumbnails/' + placeClass + '_default.png';
    var placeName = '';
    var placeDescription = 'There is no description';

    switch (placeClass) {
    case 'parking':
        var uri = place.uri.value;
        placeName = uri.substr(uri.lastIndexOf('/') + 1);
        break;

    default:
        if (place.imagen != undefined)
            placeImage = place.imagen.value;
        if (place.nombre != undefined)
            placeName = place.nombre.value;
        if (place.descripcion != undefined)
            placeDescription = place.descripcion.value;
    }

    var options = {};
    options['icon'] = this.icons[placeClass];

    return L.marker(placeLocation, options).addTo(this.map)
        .bindPopup(this._getPlacePopupHTML(placeName, placeDescription, placeImage, placeLocation));
};

Map.prototype._getPlacePopupHTML = function (placeName, placeDescription, placeImage, placeLocation) {
    return (
        '<div class="popup-thumbnail">' +
        '   <img class="effect" alt="' + placeName + ' image" src="' + placeImage + '">' +
        '   <span class="caption full-caption">' +
        '       <h3>' + placeName + '</h3>' +
        '       <p>' + placeDescription + '</p>' +
        '   </span>' +
        '   </div>' +
        '   <paper-button raised noink onclick="map.drawRouteFromOrigin(' + placeLocation[0] + ", " + placeLocation[1] + ')">' +
        '       <iron-icon icon="maps:directions"></iron-icon> Go Here' +
        '   </paper-button>');
};

Map.prototype.drawRouteFromOrigin = function (destinationLat, destinationLng) {

    var originLatLng = this.originMarker._latlng;
    var origin = [originLatLng.lat, originLatLng.lng];
    var destination = [destinationLat, destinationLng]

    this.routeControl = this._calculateRoutePedestrian(origin, destination, this.shouldAvoidStairs).addTo(this.map);
}

Map.prototype._calculateRoutePedestrian = function (origin, destination, shouldAvoidStairs = false) {

    var waypoints = [origin, destination];
    var mode = 'pedestrian';
    var stepPenalty = shouldAvoidStairs ? 99999 : 0;
    var costingOptions = {
        'pedestrian': {
            'step_penalty': stepPenalty
        }
    };
    return this._calculateRoute(waypoints, mode, costingOptions);
};

Map.prototype._calculateRoute = function (waypoints, mode, costing_options) {

    if (!_.isEmpty(this.routeControl))
        this._removeControl();

    var styles = [{
        color: '#00B38C',
        weight: 8,
        opacity: 0.7,
        }];

    var options = {
        parking_route: mode,
        waypoints: waypoints,
        lineOptions: {
            styles: styles
        },
        router: L.Routing.mapzen('valhalla-GpNj5cM', {
            costing: 'pedestrian',
            costing_options: costing_options
        }),
        formatter: new L.Routing.mapzenFormatter(),
        summaryTemplate: '<div class="start">{name}</div><div class="info {costing}">{distance}, {time}</div>',
        routeWhileDragging: false
    };

    return L.Routing.control(options);
};