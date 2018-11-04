var allowedCountries = {};
var countryGdpHash = {};

$(function () {
    getGdpInfoByYear();
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

function parseGdpInfo(data) {
    for (var i = 0 ; i < data.length; i++) {
        var country = data[i];
        if (country.countryiso3code != "")
            countryGdpHash[country.countryiso3code] = country.value;
    }
    renderMap();    
}

function getColorForCountry(country) {
    var cColor = '#ff0000';
    var gdp = countryGdpHash[country.properties.iso_a3];
    if (gdp == undefined) 
        cColor = '#ffff00';
    else if (gdp < 10000)
        cColor = '#00ff00';
    return cColor;
}
function renderMap() {
    var myGeoJSONPath = '../Data/custom.geojson';
    
    $.getJSON(myGeoJSONPath, function (json) {
        var map = L.map('map');
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            maxZoom: 18,
            minZoom: 2,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors | Demo app ' + '<a mailto="vantriendo@hotmail.com">&copy Trien Do</a>',
            id: 'mapbox.streets'
        }).addTo(map);
        map.fitBounds([[70, -180], [-60, 195]]);

        L.geoJson(json, {
            clickable: true,
            style: function (item) {
                var cColor = getColorForCountry(item);
                return {
                    fillColor: cColor,
                    fillOpacity: 0.7,
                    fill: true,
                    color: '#fff',
                    weight: 1
                }
            },           
            onEachFeature: function (feature, layer) {
                var name = feature.properties.name;
                var cColor = getColorForCountry(feature);
                function ctxFillColor() {
                    return allowedCountries[name] ? '#ffddff' : cColor;
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

    });
}