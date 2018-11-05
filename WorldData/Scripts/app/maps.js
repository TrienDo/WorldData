var selectedCountries = {};
var countryGdpHash = {};
var map;
var jsonCountries;
var countriesFeatureLayer;
var info;
var intervalId = null;
var interverPeriod = 2000;//2 seconds
var curYear = 2017;

$(function () {
    map = L.map('map');
    renderMap();
    getGdpInfoByYear(2017);
    addInfo();
    addLegend();
    addControls();
    $("#yearRange").click(function () {
        changeYear();
    });

    $("#animation").click(function () {
        if (this.innerText.includes("Play"))
            startAnimation()
        else
            stopAnimation();
    });

    $("#compare").click(function () {
        getGdpForSelectedCountries();        
    });
});

function getGdpForSelectedCountries() {
    var selContries = [];
    Object.keys(selectedCountries).forEach(function (key) {
        if (selectedCountries[key])
            selContries.push(key);
    });
    
    var data = new FormData();
    data.append("countryList", selContries.join(';'));
    $.ajax({
        type: "POST",
        url: "/Home/getGdpForCountries",
        data: data,
        contentType: false,
        processData: false,
        success: function (result) {
            result = JSON.parse(result);
            if (result.status == "success") {
                gdpInfo = JSON.parse(result.data);
                compareSelectedCountries(gdpInfo[1]);
            }
            else
                alert("Error:" + result.message);
        },
        error: function (result) {
            alert("Error:" + result.statusText);
        }
    });
}

//http://bl.ocks.org/asielen/44ffca2877d0132572cb
function compareSelectedCountries(jsonData) {
    var data = {};
    var startYear = 1970;
    for (var year = startYear; year < 2018; year++) {
        data[year] = [];
    }
    //Parse data for each country
    jsonData.forEach(function (d) {
        if (data[parseInt(d.date)] != undefined)
            data[parseInt(d.date)].push({
                "code": d.countryiso3code,
                "gdp": d.value
            })
    });
    //Calculate size
    var elementId = "#countriesChart";
    $(".modal .modal-dialog").width($(document).width() - 50);
    var w = $(".modal .modal-dialog").width() - 50;
    var h = 500;   
    $("#countriesChart").html("");
    $("#dialogtitle").html("Comparing GDP Per Capita from " + startYear);
    $("#modelVisualisation").modal("show");
    // format the data
    var info = [];
    for (var year = startYear; year < 2018; year++) {
        var yearInfo = data[year];
        var dataItem = {};
        dataItem["year"] = year;
        yearInfo.forEach(function (d) {
            console.log(d.gdp);
            if (d.gdp == undefined)
                d.gdp = 0;
            dataItem[d.code] = parseInt(d.gdp);
        });        
        info.push(dataItem)
    }
    var template = info[0];
    
    var cLegend = {};
    Object.keys(template).forEach(function (key) {
            if(key != 'year')
                cLegend[key] = {'column': key}
        }
    );
    
    //bind to chart

    var chart = makeLineChart(info, 'year', cLegend, {xAxis: 'Years', yAxis: 'GDP per capita in USD'}, w, h);
    chart.bind(elementId);    
    chart.render();
}
function changeYear() {
    var selYear = $("#yearRange").val();
    $("#selectedYear").text(selYear);
    getGdpInfoByYear(selYear);
}
function startAnimation() {
    $("#animation").html('<span class="glyphicon glyphicon-stop"></span> Stop animation through years');
    curYear = 1980;
    intervalId = setInterval(function () {
            $("#yearRange").val(curYear);
            changeYear();
            curYear++;
            if (curYear == 2018)
                curYear = 1980;
        },
        interverPeriod
    );    
}
function stopAnimation() {
    $("#animation").html('<span class="glyphicon glyphicon-play"></span> Play animation through years');
    clearInterval(intervalId);
}

function getGdpInfoByYear(year) {
    var data = new FormData();
    data.append("year", year);
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
    renderCountries();
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
        jsonCountries = json;
    });
}

function renderCountries() {
    if (countriesFeatureLayer != undefined)
        countriesFeatureLayer.clearLayers();
    countriesFeatureLayer = L.geoJson(jsonCountries, {
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
            var countryCode = feature.properties.iso_a3;
            var selectedBorder = 3;
            function countryBorderWidth() {
                return selectedCountries[countryCode] ? selectedBorder : 1;
            }

            function countryBorderColor() {
                return selectedCountries[countryCode] ? '#ff0' : '#fff';
            }

            layer.on('click', function () {
                selectedCountries[countryCode] = !selectedCountries[countryCode];
                layer.setStyle({
                    weight: countryBorderWidth(),
                    color: countryBorderColor()
                });
            });

            layer.on('mouseover', function (e) {
                layer.setStyle({
                    weight: selectedBorder
                });
                var gdp = countryGdpHash[feature.properties.iso_a3];
                info.update(feature.properties.name + ": " + (gdp == undefined ? "N/A" : Math.round(gdp)));
            })

            layer.on('mouseout', function () {
                info.update();
                layer.setStyle({
                    weight: countryBorderWidth()
                })
            })
        }
    });
    countriesFeatureLayer.addTo(map);
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
        var div = L.DomUtil.create('div', 'info mapLegend'),
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
        var div = L.DomUtil.create('div', 'infoLeft mapLegend');
        var labels = [];        
        labels.push('<div class="slidecontainer"><table width="100%"><tr><td><h4>Click on a tick to select a year [1980-2017]: <span id="selectedYear">2017</span></h4></td>' +
            '<td><button type="button" class="btn btn-primary righAlign" id="compare"> <span class="glyphicon glyphicon-signal"></span> Compare selected countries</button>'
            + '<button type="button" class="btn btn-primary righAlign" id="animation"> <span class="glyphicon glyphicon-play"></span> Play animation through years</button></td></tr></table><br/>'
            + '<input type="range" min="1980" max="2017" value="2017" step="1" class="slider" id="yearRange">');
        labels.push('<div class="sliderticks">');
        for (var i = 1980; i < 2018; i++)
            labels.push('<p>' + (i%100) + '</p>');
        labels.push('</div>');
        labels.push('</div>');
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
