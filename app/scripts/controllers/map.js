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
          resetStyleOnMouseout: true
        }
      });
    });
  });
