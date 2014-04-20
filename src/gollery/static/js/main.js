requirejs.config({
	baseUrl: 'js',
	paths: {
		'hammer': 'jquery.hammer-full-1.0.6',
		'leaflet-wrapper': 'leaflet-0.7.1',
		'jquery': 'jquery-1.11.0'
	}
});

require(['app'], function(App){
	App.start();
});
