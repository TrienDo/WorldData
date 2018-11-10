var selectedCountries = {}; //Hash map: Country Codes of selected countries for comparison
var countryGdpHash = {};    //Hash map: Country Code - GDP
var map;                    //Map
var jsonCountries;          //Json data about boundaries of countries loaded from geojson file
var countriesFeatureLayer;  //Layers of country rendering --> So map can removing them when render new GDP data 
var infoPanel;              //The top right panel to show GDP PC of the hovered country 
var intervalId = null;      //id of the inteval animation --> So can stop them later
var interverPeriod = 2000;  //2 seconds per year for animation --> Can let user specify this later
var curYear = 2018;         //Data range to the latest year --> Can dynamic get from the current date
var startYear = 1980;       //World bank provide data from 1968? but only use data from 1980 in this app
var animatedYear = startYear;//Record the current year the animation is rendering

//Initiate the page
$(function () {
    map = L.map('map');
    renderMap();
    getGdpInfoByYear(curYear-1);
    addInfoPanel();
    addLegend();
    addControls();

    //When the user select a year -> Update map
    $("#yearRange").click(function () {
        changeYear();
    });

    //Start/Stop animation
    $("#animation").click(function () {
        if (this.innerText.includes("Play"))
            startAnimation()
        else
            stopAnimation();
    });

    //Compare GDP of selected countries
    $("#compare").click(function () {
        //Get selected country codes
        var selCountries = [];
        Object.keys(selectedCountries).forEach(function (key) {
            if (selectedCountries[key])
                selCountries.push(key);
        });
        if (selCountries.length <= 10 && selCountries.length > 0)
            getGdpForSelectedCountries(selCountries);
        else
            alert("You should select between [1-10] countries on the map");
    });

    //Compare GDP of k neareast countries
    $("#knearest").click(function () {
        //Get selected country codes
        var selCountries = [];
        Object.keys(selectedCountries).forEach(function (key) {
            if (selectedCountries[key])
                selCountries.push(key);
        });
        if (selCountries.length == 1) {
            var knearest = getKNearestCountries(5, selCountries[0]);
            getGdpForSelectedCountries(knearest);
        }
        else
            alert("You should select only one country on the map");
    });
});

//Get k nearest countries of a country
function getKNearestCountries(k, countryCode) {
    var gdp = countryGdpHash[countryCode];
    if(gdp == undefined)
        alert("The selected country has no GDP PC info!");
    var knearest = [];
    knearest.push({'code':countryCode,'gdp': Number.MAX_VALUE});//This value will be removed later    
    Object.keys(countryGdpHash).forEach(function (key) {
        if(countryGdpHash[key] == undefined)
            return;
        var curDis = Math.abs(countryGdpHash[key] - gdp) ;
        var maxDis = Math.abs(knearest[knearest.length - 1].gdp - gdp);
        if (curDis < maxDis) {//Closer than the largest
            if (knearest.length == k)//Full of k nearest -> remove the last to add the new one
                knearest.pop();
            knearest.push({ 'code': key, 'gdp': countryGdpHash[key] });
            //knearest quite small so just sort it;
            knearest.sort((a,b)=>(Math.abs(a.gdp - gdp) > Math.abs(b.gdp - gdp)) ? 1 : (Math.abs(b.gdp-gdp) > Math.abs(a.gdp-gdp) ? -1 : 0));
        }
    });
    var output = [];
    knearest.forEach(n => output.push(n.code));
    return output;
}

//When the user select a year -> Update map
function changeYear() {
    var selYear = $("#yearRange").val();
    $("#selectedYear").text(selYear);
    getGdpInfoByYear(selYear);
}

function startAnimation() {
    $("#animation").html('<span class="glyphicon glyphicon-stop"></span> Stop animation');
    animatedYear = startYear;
    intervalId = setInterval(function () {
            $("#yearRange").val(animatedYear);
            changeYear();
            animatedYear++;
            if (animatedYear == curYear)
                animatedYear = startYear;
        },
        interverPeriod
    );
}

function stopAnimation() {
    $("#animation").html('<span class="glyphicon glyphicon-play"></span> Play animation');
    clearInterval(intervalId);
}

function getGdpForSelectedCountries(selectedCountries) {
    //Call api from controller
    var data = new FormData();
    data.append("countryList", selectedCountries.join(';'));
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

/*
 *  Tutorial on chart but need customising  http://bl.ocks.org/asielen/44ffca2877d0132572cb
 */
function compareSelectedCountries(jsonData) {
    /*Create a footprint for all data entry = hashmap of 
        key = year
        value = Array of Countries 
        [{
            code: countryCode,
            gdp: gdp            
        }]
    */
    var data = {};
    for (var year = startYear; year < curYear; year++) {
        data[year] = [];
    }

    //Fill the hashmap with data: year: {Country1,Country2}
    jsonData.forEach(function (d) {
        if (data[parseInt(d.date)] != undefined)
            data[parseInt(d.date)].push({
                "code": d.countryiso3code,
                "gdp": d.value
            })
    });

    //Calculate size for the chart
    var elementId = "#countriesChart"; //id of the div tag where the chart will be rendered 
    $(".modal .modal-dialog").width($(document).width() - 50);
    var w = $(".modal .modal-dialog").width() - 50;
    var h = 500;   
    $("#countriesChart").html("");
    $("#dialogtitle").html("COMPARING GDP PER CAPITA OF SELECTED COUNTRIES FROM " + startYear + " (Hover to see exact values)");
    $("#modelVisualisation").modal("show");

    //Format the data to pass into the chart
    //Array of object {year:1999,CountryCode1:gdp1,ContryCode2:gdp2}
    var pointInfo = [];
    for (var year = startYear; year < curYear; year++) {
        var yearInfo = data[year];
        var dataItem = {};
        dataItem["year"] = year;
        yearInfo.forEach(function (d) {
            if (d.gdp == undefined)
                d.gdp = 0;
            dataItem[d.code] = parseInt(d.gdp);
        });        
        pointInfo.push(dataItem)
    }

    //Get a template to create legends for lines of the chart
    //A hashmap of {CoundtryCode1: {'column':CoundtryCode1}}, {CoundtryCode2: {'column':CoundtryCode2}}
    var template = pointInfo[0];    
    var cLegend = {};
    Object.keys(template).forEach(function (key) {
            if(key != 'year')
                cLegend[key] = {'column': key}
        }
    );
    
    //bind to the chart and render it
    var chart = makeLineChart(pointInfo, 'year', cLegend, { xAxis: 'YEARS', yAxis: 'GDP PER CAPITA in USD' }, w, h);
    chart.bind(elementId);    
    chart.render();
}

//Call api from controller to get GDP of all countries by selected year
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

//Create a hashmap of countryCode: GDP so can match with countryCode when rendering regions
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
                infoPanel.update(feature.properties.name + ": " + (gdp == undefined ? "N/A" : Math.round(gdp)));
            })

            layer.on('mouseout', function () {
                infoPanel.update();
                layer.setStyle({
                    weight: countryBorderWidth()
                })
            })
        }
    });
    countriesFeatureLayer.addTo(map);
}

function addInfoPanel() {
    infoPanel = L.control();
    infoPanel.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    infoPanel.update = function (content) {
        this._div.innerHTML = '<h4>GDP PER CAPITA in USD</h4>' + (content ?
			'<b>' + content : 'Move the mouse over a country to see GDP <br/>Click to de/select countries to compare');
    };
    infoPanel.addTo(map);
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
        labels.push('<div class="slidecontainer"><table width="100%"><tr><td><h4>Selected year [' + startYear + '-' + (curYear - 1) + ']: <span id="selectedYear">' + (curYear - 1) + '</span></h4></td>' +
            '<td><button type="button" class="btn btn-primary righAlign" id="compare"> <span class="glyphicon glyphicon-signal"></span> Compare countries</button>'
            + '<button type="button" class="btn btn-primary righAlign" id="cluster"> <span class="glyphicon glyphicon-globe"></span> Cluster countries</button>'
            + '<button type="button" class="btn btn-primary righAlign" id="knearest"> <span class="glyphicon glyphicon-screenshot"></span> K-nearest countries</button>'
            + '<button type="button" class="btn btn-primary righAlign" id="animation"> <span class="glyphicon glyphicon-play"></span> Play animation</button></td></tr></table><br/>'
            + '<input type="range" min="' + startYear + '" max="' + (curYear - 1) + '" value="' + (curYear - 1) + '" step="1" class="slider" id="yearRange">');
        labels.push('<div class="sliderticks">');
        for (var i = startYear; i < curYear; i++)
            labels.push('<p>' + (i%100) + '</p>');
        labels.push('</div>');
        labels.push('</div>');
        div.innerHTML = labels.join('<br>');
        return div;
    };
    legend.addTo(map);
}

/*
 * Tool to generate gradians http://www.perbang.dk/rgbgradient/ from red to green
 */

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