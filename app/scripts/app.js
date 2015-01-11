'use strict';

/**
 * @ngdoc overview
 * @name kartanalysApp
 * @description
 * # kartanalysApp
 *
 * Main module of the application.
 */
angular
  .module('kartanalysApp', [
    'ngAnimate',
    'ngRoute',
    'ngSanitize'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
