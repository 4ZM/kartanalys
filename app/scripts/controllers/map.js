'use strict';

angular.module('kartanalysApp')
  .controller('MapCtrl', function ($scope, $http) {

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
      }
    });

    function onEachFeature(feature, layer) {
      layer.bindPopup(feature.properties.VD + ": " + feature.properties.VD_NAMN);
    }

    $http.get("/data/valkretsar.geojson").success(function(data, status) {
      angular.extend($scope, {
        geojson: {
          data: data,
          style: {
            fillColor: "green",
            weight: 1,
            opacity: 1,
            color: 'red',
            fillOpacity: 0.0
          },
          onEachFeature: onEachFeature,
          resetStyleOnMouseout: true
        }
      });
    });
  });
