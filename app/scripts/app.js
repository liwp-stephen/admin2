'use strict';

/**
 * @ngdoc overview
 * @name dreamfactoryApp
 * @description
 * # dreamfactoryApp
 *
 * Main module of the application.
 */
angular
    .module('dreamfactoryApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'dfUtility',
        'dfDashboard',
        'dfSystemConfig',
        'dfUsers',
        'dfApps',
        'dfData',
        'dfServices',
        'dfRoles',
        'dfSchema',
        'dfUserManagement',
        'dfScripts',
        'dfProfile',
        'dfApplication',
        'dfHelp',
        'dfLaunchPad',
        'dfWidgets',
        'dfSwaggerEditor',
        'dfApiDocs',
        'dfFileManager',
        'dfPackageManager'
    ])

    // Set global url for this application
    .constant('DSP_URL', '')

    // Set app name(api key) for this application
    .constant('DSP_API_KEY', 'admin')

    // Set global header for calls made to DSP
    .config(['$httpProvider', 'DSP_API_KEY', function($httpProvider, DSP_API_KEY) {

        $httpProvider.defaults.headers.common['X-Dreamfactory-Application-Name'] = DSP_API_KEY;
    }])

    // Configure main app routing rules
    .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
        $routeProvider
            .when('/login', {
                controller: 'LoginCtrl',
                templateUrl: 'views/login.html',
                resolve: {

                    checkLoginRoute: ['dfApplicationData', '$location', function (dfApplicationData, $location) {

                        var currentUser = dfApplicationData.getCurrentUser();

                        if (currentUser && currentUser.is_sys_admin && currentUser.session_id) {

                            $location.url('/quickstart');
//                            $location.url('/dashboard');
                            return;
                        }

                        if (currentUser && !currentUser.is_sys_admin && currentUser.session_id) {
                            $location.url('/launchpad');
                            return;
                        }
                    }]
                }
            })
            .when('/logout', {
                templateUrl: 'views/logout.html',
                controller: 'LogoutCtrl'
            })
            .when('/register', {
                templateUrl: 'views/register.html',
                controller: 'RegisterCtrl',
                resolve: {

                    checkRegisterRoute: ['SystemConfigDataService', 'dfApplicationData', '$location', function (SystemConfigDataService, dfApplicationData, $location) {

                        var sysConfig = SystemConfigDataService.getSystemConfig(),
                            currentUser = dfApplicationData.getCurrentUser();

                        // No guest users and no open registration
                        if (!currentUser && !sysConfig.allow_open_registration) {
                            $location.url('/login');
                            return;
                        }

                        // User is guest or not an admin and we don't allow open registration
                        if (currentUser && !currentUser.is_sys_admin && !sysConfig.allow_open_registration) {
                            $location.url('/launchpad');
                            return;
                        }

                        // we have a user and that user is an admin
                        if (currentUser && currentUser.is_sys_admin) {
                            $location.url('/quickstart');
//                            $location.url('/dashboard');
                            return;
                        }


                    }]
                }
            })
            .when('/register-complete', {
                templateUrl: 'views/register-complete.html',
                controller: 'RegisterCompleteCtrl',
                resolve: {

                    checkRegisterConfirmRoute: ['SystemConfigDataService', 'dfApplicationData', '$location', function (SystemConfigDataService, dfApplicationData, $location) {

                        var sysConfig = SystemConfigDataService.getSystemConfig(),
                            currentUser = dfApplicationData.getCurrentUser();

                        if (!currentUser && !sysConfig.allow_open_registration) {
                            $location.url('/login');
                            return;
                        }

                        if (currentUser && currentUser.is_sys_admin) {
                            $location.url('/quickstart');
//                            $location.url('/dashboard');
                            return;
                        }

                        if (currentUser && !currentUser.is_sys_admin) {
                            $location.url('/launchpad');
                            return;
                        }
                    }]
                }
            })
            .when('/register-confirm', {
                templateUrl: 'views/register-confirm.html',
                controller: "RegisterConfirmCtrl",
                resolve: {

                    checkRegisterConfirmRoute: ['SystemConfigDataService', 'dfApplicationData', '$location', function (SystemConfigDataService, dfApplicationData, $location) {

                        var sysConfig = SystemConfigDataService.getSystemConfig(),
                            currentUser = dfApplicationData.getCurrentUser();

                        if (!currentUser && !sysConfig.allow_open_registration) {
                            $location.url('/login');
                            return;
                        }

                        if (currentUser && currentUser.is_sys_admin) {
                            $location.url('/quickstart');
//                            $location.url('/dashboard');
                            return;
                        }

                        if (currentUser && !currentUser.is_sys_admin) {
                            $location.url('/launchpad');
                            return;
                        }
                    }]
                }
            })
            .when('/reset-password', {
                templateUrl: 'views/reset-password-email.html',
                controller: 'ResetPasswordEmailCtrl',
                resolve: {

                    checkRegisterConfirmRoute: ['SystemConfigDataService', 'dfApplicationData', '$location', function (SystemConfigDataService, dfApplicationData, $location) {

                        var sysConfig = SystemConfigDataService.getSystemConfig(),
                            currentUser = dfApplicationData.getCurrentUser();

                        if (!currentUser && !sysConfig.allow_open_registration) {
                            $location.url('/login');
                            return;
                        }

                        if (currentUser && currentUser.is_sys_admin) {
                            $location.url('/quickstart');
//                            $location.url('/dashboard');
                            return;
                        }

                        if (currentUser && !currentUser.is_sys_admin) {
                            $location.url('/launchpad');
                            return;
                        }
                    }]

                }

            })
            .otherwise({
                redirectTo: '/launchpad'
            });

        // $httpProvider.interceptors.push('httpVerbInterceptor');
        $httpProvider.interceptors.push('httpValidSession');
    }])

    // Configure Error handling
    .config(['$provide', function($provide) {

        $provide.decorator('$exceptionHandler', ['$delegate', '$injector', function($delegate, $injector) {

            return function(exception) {

                // Was this error thrown explicitly by a module
                if (exception.provider && (exception.provider === 'dreamfactory')) {

                    $injector.invoke(['dfNotify', function(dfNotify) {

                        var messageOptions = {
                            module: exception.module,
                            type: exception.type,
                            provider: exception.provider,
                            message: exception.exception
                        };

                        dfNotify.error(messageOptions);
                    }]);
                }

                else {

                    // Continue on to normal error handling
                    return $delegate(exception);
                }
            }
        }]);
    }])

    // Get the System Configuration and set in SystemConfigDataService
    // This is a synchronous call because we need the system config before
    // anything else should happen
    .run(['SystemConfigDataService',
        function(SystemConfigDataService) {

            var SystemConfig = SystemConfigDataService.getSystemConfigFromServerSync();

            SystemConfigDataService.setSystemConfig(SystemConfig);
    }]);
