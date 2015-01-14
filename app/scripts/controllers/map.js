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
    $scope.lowLevel = 5.0;
    $scope.highLevel = 15.0;
    $scope.party = "SD";

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
        var partyProc = parseFloat(layer.feature.electionData[$scope.party + " proc"].replace(',', '.'));
        var popupTitle = feature.properties.VD + ": " + feature.properties.VD_NAMN;

        var val = (partyProc - $scope.lowLevel) / ($scope.highLevel - $scope.lowLevel);
        var opacity = partyProc < $scope.lowLevel ? 0 : 0.8 * Math.min(1.0, val);

        layer.bindPopup(popupTitle + "<br />" + $scope.party + ": " + partyProc + "%");
        if (partyProc > 8.0) {
          layer.options.fillColor = "blue";
          layer.options.fillOpacity = opacity;
        }
      }

      var geoJson = {
        geojson: {
          data: data,
          style: {
            weight: 1,
            opacity: 0.3,
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
