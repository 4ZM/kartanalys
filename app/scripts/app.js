'use strict';

angular
  .module('kartanalysApp', [
    'ngAnimate',
    'ngRoute',
    'ngSanitize',
    'leaflet-directive',
    'ngProgress'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/map.html',
        controller: 'MapCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
