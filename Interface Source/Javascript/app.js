/* global angular, $ */
var currentVersion = "v3.2";

var app = angular.module('weebIrc', ['ngRoute', 'ngSanitize', 'ui.materialize','angular.filter']);

$().ready(function() {
    $(".sidenav-activator").sideNav({
        closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
    });
    $('.collapsible').collapsible({
      accordion : false// A setting that changes the collapsible behavior to expandable instead of the default accordion style
    });
});

// ROUTES ==================================================================== #
            
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/settings', {
            templateUrl: '/Partials/settings.html',
            controller: 'settingsCtrl'
        }).
        when('/video', {
            templateUrl: '/Partials/video.html',
            controller: 'videoCtrl'
        }). 
        when('/player', {
            templateUrl: '/Partials/player.html',
            controller: 'playerCtrl'
        }).
        when('/download', {
            templateUrl: '/Partials/download.html',
            controller: 'downloadCtrl'
        }).
        when('/chat', {
            templateUrl: '/Partials/chat.html',
            controller: 'chatCtrl'
        }).
        when('/history', {
            templateUrl: '/Partials/history.html',
            controller: 'historyCtrl'
        }).
        when('/anime', {
            templateUrl: '/Partials/anime.html',
            controller: 'animeCtrl'
        }).
        when('/seasons', {
            templateUrl: '/Partials/seasons.html',
            controller: 'seasonsCtrl'
        }).
        when('/home', {
            templateUrl: '/Partials/home.html',
            controller: 'homeCtrl'
        }).
        when('/serverdownload', {
            templateUrl: '/Partials/serverdownload.html',
            controller: 'serverDownloadCtrl'
        }). 
        when('/about', {
            templateUrl: '/Partials/about.html',
            controller: 'aboutCtrl'
        }).
        otherwise({
            // IRC Settings modal & currentseason view
            redirectTo: '/home'
        });
}]);

app.config(function($sceDelegateProvider) {
 $sceDelegateProvider.resourceUrlWhitelist([
   // Allow same origin resource loads.
   'self',
   // Allow loading from our assets domain.  Notice the difference between * and **.
   'http://cdn*.myanimelist.net/images/anime/**', 'https://myanimelist.cdn-dena.com/images/anime/**']);
 })
// GLOBAL CONFIG ============================================================= #

// app.constant('config', {
//     appName: 'My App',
//     appVersion: 2.0
// });

// SERVICES ================================================================== #

    
app.config(function ($httpProvider) {
    $httpProvider.defaults.transformRequest = function(data){
        if (data === undefined) {
            return data;
        }
        return $.param(data);
    }
});

//loading dynamic html
app.directive('dynamic', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.dynamic, function(html) {
        ele.html(html);
        $compile(ele.contents())(scope);
      });
    }
  };
});   
    
// DIRECTIVES ================================================================ #

app.directive('focusMe', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        if(value === true) { 
          $timeout(function() {
            element[0].focus(); 
          });
        }
      });
      // on blur event:
      element.bind('blur', function() {
         scope.$apply(model.assign(scope, false));
      });
    }
  };
});


// GLOBAL FUNCTIONS  ======================================================== #

app.run(function($rootScope) {
    //inserts a loader in a certain elemtn with a certain id
    $rootScope.insertLoader = function(size, loaderID, idToAppendTo) {
        $(idToAppendTo).append('<div id="loader_' + loaderID + '"><img src="Image/loading.svg" width="' + size + '" /></div>');
        console.log("INSERTING LOADER");
    };
    
    //removes said loader
    $rootScope.removeLoader = function(id){
        $("#loader_" + id).remove();
    };
});


// GLOBAL CONTROLLERS ======================================================== #

app.controller('rootCtrl', ['$rootScope', '$scope', '$http', '$location', '$sce', 'comServer', 'storage', 'serverDetection', 'status', function ($rootScope, $scope, $http, $location,  $sce, comServer, storage, serverDetection, status) {
    
    //default page
    $scope.config = {
        pageTitle: 'WeebIRC',
        navbarTitle: 'WeebIRC',
        navbarColor: 'indigo'
    };
    
    // ON FIRST LOAD LOGICS =========================================================== # 
    
    

    //function to detect servers available on local network, runs when in the first launch model the first next button is being clicked
    $scope.runServerDetection = function(){
        serverDetection.detectServers();
        $rootScope.insertLoader(64, 'waitingforzeservers', 'waitingforzeservers');
    }

    //event based, shows the found servers by the discovery, removes the loader
    $rootScope.$on('FoundServers', function (event, args) {
        console.log("Foundservers event fired!");

        var serversParsed = [];
        $.each(args, function(i, val){
            if(val.version != currentVersion ){
                var serverInfoToStore = {name: val.name + " Old Version (" + val.version + ")", ip: val.ip, color: "red" };
                serversParsed.push(serverInfoToStore);
                
            } else {
                var serverInfoToStore = {name: val.name, ip: val.ip, color: "text-blue" };
                serversParsed.push(serverInfoToStore);
            }
        })
        if(JSON.stringify(serversParsed).indexOf('"color":"red"') > -1){
            $scope.newVersion = $sce.trustAsHtml("Your running an older version of WeebIRC! <br> Please download the newer version <a href=\"/FileDownload/WeebIRCServer.exe\">here</a> for the best experience!");
        }
        $rootScope.removeLoader('waitingforzeservers');
        $scope.servers = serversParsed;
        $scope.$apply();
        console.log(serversParsed);
    });  


    $rootScope.$on('LocalFiles', function (event, args) {
        console.log(args);
        storage.resetStorage('local_files', args);
    });    
    
    $rootScope.$on('downloaddirreceived', function () {
        $scope.Directory = storage.retreiveFromStorage('download_directory');
        $scope.$apply();
    });  
    //functions below are to set the ip to default server
    var customButtonIp = "";
    $scope.setAsDefaultServer = function(button, value){
        $.each($scope.servers, function(i, val){
           if(button == i){
               $('#server_' + button).addClass('blue');
           } else {
               $('#server_' + button).removeClass('blue');
           }
        });
        customButtonIp = value;
        $scope.customIp = value;
    }
    $scope.customIp = storage.retreiveFromStorage('weebirc_server_address');
    $scope.checkIfCustomIpIsSet = function(){
        if($scope.customIp.length > -1){
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test($scope.customIp))  
            {  
                storage.resetStorage('weebirc_server_address', 'http://' + $scope.customIp);
                $('.slider').slider('next');
                Materialize.toast("Server address " + $scope.customIp + " is valid!", 4000);
            } 
            else if(/(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test($scope.customIp)) 
            {
                if($scope.customIp.indexOf("http") > -1){
                    storage.resetStorage('weebirc_server_address', $scope.customIp);
                } else {
                    storage.resetStorage('weebirc_server_address', 'http://' + $scope.customIp);
                }
                $('.slider').slider('next');
                Materialize.toast("Server address " + $scope.customIp + " is valid!", 4000);
            } else {
                Materialize.toast("Server address " + $scope.customIp + " is not valid!", 4000);
            }
        } else {
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(customButtonIp))  
            {  
                storage.resetStorage('weebirc_server_address', 'http://' + customButtonIp);
                $('.slider').slider('next');
                Materialize.toast("Server address " + customButtonIp + " is valid!", 4000);
            } 
            else if(customButtonIp.match(/http\:\/\/www\.mydomain\.com\/version\.php/i)) 
            {
                storage.resetStorage('weebirc_server_address','http://' + customButtonIp);
                $('.slider').slider('next');
                 Materialize.toast("Server address " + customButtonIp + " is valid!", 4000);
            } else {
                Materialize.toast("Server address " + customButtonIp + " is not valid!", 4000);
            }
        }

        //run the communication server, as the server setup is done
        comServer.startComServer();
        localServer.startLocalServer();
    }
       
    
    //read settings from stroage database   
    var settings = storage.retreiveFromStorage('settings')[0];
    $scope.server = settings.server;
    $scope.channels = settings.channels;
    $scope.username = settings.username;
    $scope.autoConnect = settings.autoConnect;
    $scope.Directory = settings.download_directory;

    
    //sets the settings storage with corresponding information, ask server to connect to the irc server of choice
    $scope.saveAndConnectIRC = function(){
        $('#firstLaunch').closeModal();
        storage.createStorage('firstlaunch', {firstlaunch: false});
        $scope.$emit('ShowLoading', '<span class="white><h5> Waiting for irc connection! </h5></span>');
        var server = $scope.server;
        var channels = $scope.channels;
        var username = $scope.username;
        var autoConnect = $scope.autoConnect;
        
        var newSettings = {
            autoConnect: autoConnect,
            server: server,
            channels: channels,
            username: username
        }
        
        storage.resetStorage('settings', newSettings);
        comServer.setupIrcClient(server, channels, username);       
        comServer.getCurrentSeason();

        if(storage.retreiveFromStorage('firstlaunch')[0].firstlaunch){
            storage.resetStorage('firstlaunch', {firstlaunch : false});
        }
        comServer.getCurrentSeason();

        $('#connectToIrc').closeModal();    
    }

    $scope.setDownloadDirectory = function(){    
        
        if($scope.Directory !== undefined && $scope.Directory !== ""){
            if(!storage.doesStorageExist('download_directory')){
                storage.createStorage('download_directory', $scope.Directory);
            } else {
                storage.resetStorage('download_directory', $scope.Directory);
            }
            console.log("Custom dir: " + $scope.Directory);
            Materialize.toast("Download Directory: " + $scope.Directory + " succesfully saved!");
            comServer.setDownloadDirectory($scope.Directory);
        } else {
            Materialize.toast("Download Directory set to default!");
        }
    }

    
    $scope.$on('changeConfig', function (event, args) {
        $scope.config = args;
    });

    // Three loose event handlers for individual parameters
    $scope.$on('changePageTitle', function (event, args) {
        $scope.config.pageTitle = args;
    });

    $scope.$on('changeNavbarColor', function (event, args) {
        $scope.config.navbarColor = args;
    });

    $scope.$on('changeNavbarTitle', function (event, args) {
        $scope.config.navbarTitle = args;
    });

    // MENU ITEMS ============================================================ #
    
    $scope.menuItems = [{
        url: '/#/home',
        icon: 'home',
        text: 'Home'
    }, {
        url: '/#/anime',
        icon: 'remove_red_eye',
        text: 'Current Anime'
    }, {
        url: '/#/history',
        icon: 'history',
        text: 'History'
    }, {
        url: '/#/seasons',
        icon: 'date_range',
        text: 'Seasons'
    }, {
        url: '/#/settings',
        icon: 'local_movies',
        text: 'Settings'
    }, {
        url: '/#/chat',
        icon: 'chat',
        text: 'Chat'
    }, {
        url: '/#/download',
        icon: 'file_download',
        text: 'Downloads'
    },{
        url: '/#/serverdownload',
        icon: 'computer',
        text: 'WeebIRC Download'
    },{
        url: '/#/about',
        icon: 'info',
        text: 'About'
    }];

    // FUNCTIONS ============================================================= #
    
    $scope.searchButtonClicked = function () {
        if ($scope.searching) {
            $scope.searching = false;
        } else {
            $scope.searching = true;
            angular.element('#searchField').focus();
        }
    };
    
    //on enter press, will request data from server by sending url to parse
    $scope.startSearch= function(keyEvent) {
      if (keyEvent.which === 13){
        var searchInput = $scope.searchinput.text;
        comServer.searchAnime(searchInput);
          
        $scope.$emit('changeConfig', {
            pageTitle: 'Search | ' + searchInput,
            navbarTitle: 'Search | ' + searchInput,
            navbarColor: 'red'
        });

        $rootScope.$emit('searching');
            
        //make sure that homepage on return keeps search title if thats the last thing youve done
        if(!storage.doesStorageExist('isSearched')){
            storage.createStorage('isSearched', {
                isSearched: true,
                pageTitle: 'Search | ' + searchInput,
                navbarTitle: 'Search | ' + searchInput,
                navbarColor: 'red'});
        } else {
            storage.resetStorage('isSearched', {
                isSearched: true,
                pageTitle: 'Search | ' + searchInput,
                navbarTitle: 'Search | ' + searchInput,
                navbarColor: 'red'});
        }
      }
    }   
}]);