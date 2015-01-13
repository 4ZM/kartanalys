'use strict';

angular.module('kartanalysApp')
  .controller('MapCtrl', function ($scope, $http, $q, ngProgress) {

    $scope.map = {
      defaults : {
        tileLayer: 'http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png',
        maxZoom: 18,
        zoomControlPosition: 'bottomleft',
      },
      center: {
        lat : 59.259289,
        lng : 18.041106,
        zoom : 12
      }
    };

    var t1 = new Date().getTime();
    console.log("Start: " + t1);

    var loadElectionData = function(file) {
      return $q(function(resolve, reject) {
        var dict = {};

        // Parse local CSV file
        Papa.parse(file, {
          header: true,
          delimiter: ";",
          download: true,
          step: function(row) {
            dict[row.data[0].LAN + row.data[0].KOM + row.data[0].VALDIST] = row.data[0];
          },
          complete: function() {
            console.log("CSV loaded: " + (new Date().getTime() - t1));
            resolve(dict);
          }
        });
      });
    };

    console.log("WOOP: " + t1);

    function onEachFeature(feature, layer) {
      var sdProc = parseFloat(layer.feature.electionData["SD proc"].replace(',', '.'));
      var popupTitle = feature.properties.VD + ": " + feature.properties.VD_NAMN;

      layer.bindPopup(popupTitle + "<br />SD: " + sdProc + "%");
      if (sdProc > 8.0) {
        layer.options.fillColor = "blue";
        layer.options.fillOpacity = 0.5;
      }
    }

    var makeGeoJson = function(electionData) {
      console.log("GIS start: " + (new Date().getTime() - t1));

      $http.get("/data/valkretsar.geojson").success(function(data, status) {

        console.log("GIS loaded: " + (new Date().getTime() - t1));

        _(data.features).forEach(function(f) {
          f.electionData = electionData[f.properties.VD];
        });

        console.log("GIS instrumented 1: " + (new Date().getTime() - t1));

        var geoJson = {
          geojson: {
            data: data,
            style: {
              weight: 1,
              opacity: 1,
              color: 'red',
              fillOpacity: 0
            },
            onEachFeature: onEachFeature,
            resetStyleOnMouseout: true
          }
        };

        console.log("GIS instrumented 2: " + (new Date().getTime() - t1));

        angular.extend($scope, geoJson);

        console.log("GIS done: " + (new Date().getTime() - t1));
      });
    };

    console.log("WOOP2: " + t1);

    $scope.load = function() {
      console.log("loading...");
      ngProgress.start();
      loadElectionData('/data/2014_riksdagsval_per_valdistrikt.skv')
        .then(function(electionData) { makeGeoJson(electionData); })
        .then(function() { ngProgress.complete(); });
    };
  });
