var allowedCountries = {};
var countryGdpHash = {};
$(function () {
    getGdpInfoByYear();
    //renderMap();
});

function getGdpInfoByYear() {
    var data = new FormData();
    data.append("year", "2017");
    $.ajax({
        type: "POST",
        url: "/Home/getGdpAllCountriesByYear",
        data: data,
        contentType: false,
        processData: false,
        success: function (result) {
            result = JSON.parse(result);
            if (result.status == "success") {
                gdpInfo = JSON.parse(result.data);
                parseGdpInfo(gdpInfo[1]);
            }
            else
                alert("Error:" + result.message);
        },
        error: function (result) {
            alert("Error:" + result.statusText);
        }
    });
}
var countries = "Countries";
var gdpList = "GDP";
var notInList = "";
function parseGdpInfo(data) {
    for (var i = 0 ; i < data.length; i++) {
        var country = data[i];
        if (country.countryiso3code != "")
            countryGdpHash[country.countryiso3code] = country.value;
    }
    console.log("Size of gdp list: " + countryGdpHash.length);
    renderMap();    
}

function getColorForCountry(country) {
    var cColor = '#ff0000';
    var gdp = countryGdpHash[country.properties.iso_a3];
    if (gdp == undefined) {
        cColor = '#ffff00';
        notInList = notInList + "#" + country.properties.iso_a3;        
    }
    else if (gdp < 10000)
        cColor = '#00ff00';
    return cColor;
}
function renderMap() {
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
                }
                if (item.geometry.type == 'Point') {
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

                }
                else {
                    var fillColor = getColorForCountry(item);
                    return {
                        fillColor: fillColor,
                        fillOpacity: 0.7,
                        fill: true,
                        color: fillColor,
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
                var fillColor = getColorForCountry(feature);
                function ctxFillColor() {
                    return allowedCountries[name] ? '#ffddff' : fillColor;
                }
                layer.on('click', function () {
                    allowedCountries[name] = !allowedCountries[name];
                    console.log(allowedCountries[name])
                    console.log(notInList);
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

    });
}