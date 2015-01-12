'use strict';

angular.module('kartanalysApp')
  .controller('MapCtrl', function ($scope, $http, $q) {

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

    var electionData = $q(function(resolve, reject) {

      // Parse local CSV file
      Papa.parse('/data/2014_riksdagsval_per_valdistrikt.skv', {
        header: true,
        delimiter: ";",
        download: true,
        encoding: "iso-8859-1",
        complete: function(results) {
          // Create a dictionary that matches gis-feature names
          results.dict = {};
          _(results.data).forEach(function(vd) {
            results.dict[vd.LAN + vd.KOM + vd.VALDIST] = vd;
          });
          resolve(results.dict);
        }
      });
    });



    function onEachFeature(feature, layer) {
      var sdProc = parseFloat(layer.feature.electionData["SD proc"].replace(',', '.'));
      var popupTitle = feature.properties.VD + ": " + feature.properties.VD_NAMN;

      layer.bindPopup(popupTitle + "<br />SD: " + sdProc + "%");
      if (sdProc > 8.0) {
        layer.options.fillColor = "blue";
        layer.options.fillOpacity = 0.5;
      }
    }

    electionData.then(function(electionData) {
      $http.get("/data/valkretsar.geojson").success(function(data, status) {
        _(data.features).forEach(function(f) {
          f.electionData = electionData[f.properties.VD];
        });

        angular.extend($scope, {
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
        });
      });
    });
  });
