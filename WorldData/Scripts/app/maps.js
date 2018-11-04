var allowedCountries = {};
var countryGdpHash = {};
var map;
var info;
$(function () {
    map = L.map('map');
    getGdpInfoByYear();
    addInfo();
    addLegend();
    addControls();
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

function renderMap() {
    var myGeoJSONPath = '../Data/worlddata.geojson';
    
    $.getJSON(myGeoJSONPath, function (json) {        
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
                var cColor = getColorForGdp(countryGdpHash[item.properties.iso_a3]);
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
                var selectedBorder = 3;
                function countryBorder() {
                    return allowedCountries[name] ? selectedBorder : 1;
                }
                
                //layer.bindPopup(name);

                layer.on('click', function () {
                    allowedCountries[name] = !allowedCountries[name];
                    layer.setStyle({
                        weight: countryBorder()
                    });
                });

                layer.on('mouseover', function (e) {                    
                    layer.setStyle({
                        weight: selectedBorder
                    });
                    var gdp = countryGdpHash[feature.properties.iso_a3];
                    info.update(name + ": " + (gdp == undefined ? "N/A" : Math.round(gdp)));
                    //layer.openPopup(e.latlng);
                })

                layer.on('mouseout', function () {
                    //layer.closePopup();
                    info.update();
                    layer.setStyle({
                        weight: countryBorder()
                    })
                })
            }
        }).addTo(map);

    });
}

function addInfo() {
    info = L.control();
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (content) {
        this._div.innerHTML = '<h4>GDP per capita (in USD)</h4>' + (content ?
			'<b>' + content : 'Move the mouse over a country');
    };
    info.addTo(map);
}
function addLegend() {    
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
			grades = [0, 1000, 2000, 5000, 10000, 20000, 30000, 40000, 50000],
			labels = [],
			from, to;

        for (var i = 0; i < grades.length; i++) {
            from = grades[i];
            to = grades[i + 1];

            labels.push(
				'<i style="background:' + getColorForGdp(from + 1) + '"></i> ' +
				from + (to ? '&ndash;' + to : '+'));
        }
        labels.push('<i style="background:#FFFFFF"></i>No data');
        div.innerHTML = labels.join('<br>');
        return div;
    };

    legend.addTo(map);
}

function addControls() {
    var legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
			grades = [0, 1000, 2000, 5000, 10000, 20000, 30000, 40000, 50000],
			labels = [],
			from, to;

        for (var i = 0; i < grades.length; i++) {
            from = grades[i];
            to = grades[i + 1];

            labels.push(
				'<i style="background:' + getColorForGdp(from + 1) + '"></i> ' +
				from + (to ? '&ndash;' + to : '+'));
        }
        labels.push('<i style="background:#FFFFFF"></i>No data');
        div.innerHTML = labels.join('<br>');
        return div;
    };

    legend.addTo(map);
}

//http://www.perbang.dk/rgbgradient/ from red to green
function getColorForGdp(gdp) {    
    if (gdp == undefined)
        return '#FFFFFF';
    return gdp > 50000 ? '#00FF00' :
           gdp > 40000 ? '#1FDF00' :
           gdp > 30000 ? '#3FBF00' :
           gdp > 20000 ? '#5F9F00' :
           gdp > 10000 ? '#7F7F00' :
           gdp > 5000  ? '#9F5F00' :
           gdp > 2000  ? '#BF3F00' :
           gdp > 1000  ? '#DF1F00' :
                         '#FF0000';
    
}
