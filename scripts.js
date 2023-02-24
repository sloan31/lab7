var map = L.map('map').setView([47.258728, -122.465973], 13);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic2xvYW5tb29yZTMxIiwiYSI6ImNsYTM1anB5NzAxMmczb3BqcGlpMW9xeTYifQ.YwqRi3XLnVSFNFDmYvg9dw'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var tableData = L.layerGroup().addTo(map);
var url = "https://178.128.228.240:4000/sql?q=";
// change the Query below by replacing lab_7_name with your table name
var sqlQuery = "SELECT * FROM boulder_table; geom, bouldername, boulderdescription";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + feature.properties.bouldername + "</b><br>" +
        feature.properties.boulderdescription 
    );
}

fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });

new L.Control.Draw({
    draw : {
        polygon : true,
        polyline : true,
        rectangle : true,     // Rectangles disabled
        circle : true,        
        circlemarker : true,  // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

function createFormPopup() {
    var popupContent =
    '<form>' + 
    '    Boulder Name:<br><input type="text" id="input_name"><br>' + 
    '    Description of Boulder:<br><input type="text" id="input_desc"><br>' + 
    '    Number of routes on boulder:<input type="number" id="input_route"><br>' + 
    '    Date Boulder Discovered:<input type="date" id="input_discover"><br>' + 
    '    Date of First Ascent:<input type="date" id="input_FA"><br>' + 
    '' + 
    '    <input type="button" value="Submit" id="submit">' + 
    '    </form>' + 
    '';
    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});

function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        var enteredUsername = document.getElementById("input_name").value;
        var enteredDescription = document.getElementById("input_desc").value;
        var enteredNumber = document.getElementById("input_route").value;
        var enteredDiscover = document.getElementById("input_discover").value;
        var enteredFA = document.getElementById("input_FA").value;
          	// For each drawn layer
    drawnItems.eachLayer(function(layer) {
           
        // Create SQL expression to insert layer
        var drawing = JSON.stringify(layer.toGeoJSON().geometry);
        var sql =
            "INSERT INTO boulder_table (geom, bouldername, boulderdescription, routenumber, dateboulder, dateroute) " +
            "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
            drawing + "'), 4326), '" +
            enteredUsername + "', '" +
            enteredDescription + "', '" +
            enteredNumber + "', '" +
            enteredDiscover + "', '" +
            enteredFA + "');";
        console.log(sql);

        // Send the data
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "q=" + encodeURI(sql)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log("Data saved:", data);
        })
        .catch(function(error) {
            console.log("Problem saving the data:", error);
        });

    // Transfer submitted drawing to the tableData layer 
    //so it persists on the map without you having to refresh the page
    var newData = layer.toGeoJSON();
    newData.properties.bouldername = enteredUsername;
    newData.properties.boulderdescription = enteredDescription;
    L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

});

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});