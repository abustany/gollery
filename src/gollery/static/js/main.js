requirejs.config({
	baseUrl: 'js',
	paths: {
		'hammer': '../vendor/jquery-hammerjs/jquery.hammer',
		'hammerjs': '../vendor/hammerjs/hammer',
		'leaflet-wrapper': '../vendor/leaflet/leaflet-src',
		'jquery': '../vendor/jquery/jquery'
	}
});

require(['app'], function(App){
	(new App()).start();
});
