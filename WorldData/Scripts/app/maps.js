var myGeoJSONPath = '../Data/custom.geojson';
var myCustomStyle = {
    stroke: false,
    fill: true,
    fillColor: '#fff',
    fillOpacity: 1
}
$.getJSON(myGeoJSONPath, function (json) {
    var map = L.map('map').setView([39.74739, -105], 4);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors | Demo app ' +
			'<a mailto="vantriendo@hotmail.com">&copy Trien Do</a>',
        id: 'mapbox.streets'
    }).addTo(map);
    map.fitWorld();
    
    /*L.geoJson(json, {
        clickable: false,
        style: myCustomStyle
    }).addTo(map);
    */
    var allowedCountries = {};
    L.geoJson(json, {
        clickable: true,
        style: function (item) {
            if (item.properties.type == 'stateline') {
                return {
                    fill: false,
                    stroke: true,
                    color: '#EAEAEA',
                    weight: 2
                }
            } if (item.geometry.type == 'Point') {
                if (item.properties.importance > 1) {
                    return {
                        fill: false,
                        stroke: false
                    }
                }

                return {
                    fill: true,
                    fillOpacity: 1,
                    stroke: false,
                    fillColor: "#aaa",
                    radius: 2 / item.properties.importance
                }

            } else {
                return {
                    fillColor: '#fff',
                    fillOpacity: 0.7,
                    fill: true,
                    color: '#eeeeff',
                    weight: 1
                }
            }
        },
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng)
                .bindLabel(feature.properties.name, {
                    noHide: true
                });
        },
        onEachFeature: function (feature, layer) {
            var name = feature.properties.name;
            console.log(feature.properties.sov_a3);
            function ctxFillColor() {
                return allowedCountries[name] ? '#ffddff' : '#fff';
            }
            layer.on('click', function () {
                allowedCountries[name] = !allowedCountries[name];
                console.log(allowedCountries[name])
                layer.setStyle({
                    fillColor: ctxFillColor()
                });
            });

            layer.on('mouseover', function () {
                layer.setStyle({
                    fillColor: '#ffaaff'
                })
            })

            layer.on('mouseout', function () {
                layer.setStyle({
                    fillColor: ctxFillColor()
                })
            })
        }
    }).addTo(map);

})