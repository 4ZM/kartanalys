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

    $scope.busy = false;

    // Parse CSV eleection data from file into a ["LAN + KOM + VALDIST"] dictionary
    var loadElectionData = function(file) {
      var deferred = $q.defer();

      var dict = {};

      // Parse local CSV file
      Papa.parse(file, {
        header: true,
        delimiter: ";",
        download: true,
        worker: true,
        step: function(row) {
          var data = row.data[0];
          dict[data.LAN + data.KOM + data.VALDIST] = data;
        },
        complete: function() {
          deferred.resolve(dict);
        }
      });

      return deferred.promise;
    };

    var loadGeoJson = function(electionData) {
      return $http.get("/data/valkretsar.geojson").then(function(res) {

        _(res.data.features).forEach(function(f) {
          f.electionData = electionData[f.properties.VD];
        });

        return res.data.features;
      });
    };

    var makeGeoJson = function(data) {
      var deferred = $q.defer();

      function onEachFeature(feature, layer) {
        var sdProc = parseFloat(layer.feature.electionData["SD proc"].replace(',', '.'));
        var popupTitle = feature.properties.VD + ": " + feature.properties.VD_NAMN;

        layer.bindPopup(popupTitle + "<br />SD: " + sdProc + "%");
        if (sdProc > 8.0) {
          layer.options.fillColor = "blue";
          layer.options.fillOpacity = 0.5;
        }
      }

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

      deferred.resolve(geoJson);

      return deferred.promise;
    };

    $scope.load = function() {
      $scope.busy = true;
      ngProgress.start();
      loadElectionData('/data/2014_riksdagsval_per_valdistrikt.skv')
        .then(loadGeoJson)
        .then(makeGeoJson)
        .then(function(geoJson) {
          ngProgress.complete();
          angular.extend($scope, geoJson);
          $scope.busy = false;
        });
    };
  });
