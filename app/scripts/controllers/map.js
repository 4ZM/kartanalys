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
        lat : 59.326142,
        lng : 17.9820525,
        zoom : 11
      }
    };

    $scope.busy = false;
    $scope.lowLevel = 5.0;
    $scope.highLevel = 15.0;
    $scope.party = "SD";
    $scope.lockHiLow = false;

    $scope.minMax = {
      SD : { min : 100.0, max : 0.0 },
      V  : { min : 100.0, max : 0.0 },
      S  : { min : 100.0, max : 0.0 },
      MP : { min : 100.0, max : 0.0 },
      FI : { min : 100.0, max : 0.0 },
      C  : { min : 100.0, max : 0.0 },
      FP : { min : 100.0, max : 0.0 },
      M  : { min : 100.0, max : 0.0 },
      KD : { min : 100.0, max : 0.0 }
    };

    var partyColor = {
      SD : 'blue',
      V  : 'red',
      S  : 'red',
      MP : 'green',
      FI : '#808',
      C  : 'blue',
      FP : 'blue',
      M  : 'blue',
      KD : 'blue'
    };

    var atof = function(str) {
      return parseFloat(str.replace(',', '.'));
    };

    var updateMinMax = function(party, data) {
      var proc = atof(data[party + ' proc']);
      $scope.minMax[party]['min'] = Math.min($scope.minMax[party]['min'], proc);
      $scope.minMax[party]['max'] = Math.max($scope.minMax[party]['max'], proc);
    };

    // Parse CSV eleection data from file into a ["LAN + KOM + VALDIST"] dictionary
    var loadElectionData = function(file) {

      var deferred = $q.defer();

      var dict = {};

      // Parse local CSV file
      Papa.parse(file, {
        header: true,
        delimiter: ";",
        download: true,
        // Disabled due to minification problems: worker: true,
        step: function(row) {
          var data = row.data[0];
          dict[data.LAN + data.KOM + data.VALDIST] = data;

          // Only look at shlm data
          if (data.LAN === "01" && data.KOM === "80") {
            updateMinMax('SD', data);
            updateMinMax('V', data);
            updateMinMax('S', data);
            updateMinMax('MP', data);
            updateMinMax('FI', data);
            updateMinMax('C', data);
            updateMinMax('FP', data);
            updateMinMax('M', data);
            updateMinMax('KD', data);
          }
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

    var makeGeoJson = function(party, data) {
      var deferred = $q.defer();

      function onEachFeature(feature, layer) {
        if (!$scope.lockHiLow) {
          $scope.lowLevel = $scope.minMax[party].min;
          $scope.highLevel = $scope.minMax[party].max;
        }

        var partyProc = atof(layer.feature.electionData[party + " proc"]);
        var popupTitle = feature.properties.VD + ": " + feature.properties.VD_NAMN;

        var val = (partyProc - $scope.lowLevel) / ($scope.highLevel - $scope.lowLevel);
        val = Math.pow(val, 1.3);
        var opacity = partyProc < $scope.lowLevel ? 0 : 0.9 * Math.min(1.0, val);

        var statsString = function(party) {
          var partyStr = party.length === 1 ? "&nbsp;" + party : party;
          var formatFloat = function(val) {
            return val < 10.0 ? "&nbsp;" + val.toFixed(2) : "" + val.toFixed(2);
          };
          return "<br />" +
            (party === $scope.party ? "<b>" : "") +
            partyStr  + ": " +
            formatFloat(atof(layer.feature.electionData[party + " proc"])) + "% " +
            "(" + formatFloat($scope.minMax[party]['min']) + "% - " +
            formatFloat($scope.minMax[party]['max']) + "%)" +
            (party === $scope.party ? "</b>" : "") ;
        };

        layer.bindPopup('<span style="font-family:monospace;">' + popupTitle +
                        statsString("SD") +
                        statsString("V") +
                        statsString("S") +
                        statsString("MP") +
                        statsString("FI") +
                        statsString("C") +
                        statsString("FP") +
                        statsString("M") +
                        statsString("KD") + '</span>');
        if (val > 0.2) {
          layer.options.fillColor = partyColor[party];
          layer.options.fillOpacity = opacity;
        }
      }

      var geoJson = {
        data: data,
        style: {
          weight: 1,
          opacity: 0.3,
          color: 'red',
          fillOpacity: 0
          },
        onEachFeature: onEachFeature,
        resetStyleOnMouseout: true
      };

      deferred.resolve(geoJson);

      return deferred.promise;
    };

    $scope.load = function() {
      $scope.busy = true;
      ngProgress.start();
      var csv = loadElectionData('/data/2014_riksdagsval_per_valdistrikt.skv');
      var g1 = csv.then(loadGeoJson).then(_.partial(makeGeoJson, $scope.party))
          .then(function(geoJson) {
            angular.extend($scope, { geoJsonVar: geoJson });
          });
      var g2 = csv.then(loadGeoJson).then(_.partial(makeGeoJson, 'SD'))
          .then(function(geoJson) {
            angular.extend($scope, { geoJsonSD: geoJson });
          });

      $q.all([g1, g2])
        .then(function(res) {
          ngProgress.complete();
          $scope.busy = false;
        });
    };
  });
