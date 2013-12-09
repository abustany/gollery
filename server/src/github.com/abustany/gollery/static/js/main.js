requirejs.config({
	baseUrl: 'js',
	paths: {
		'hammer': 'jquery.hammer-1.0.5.min',
		'jquery': 'jquery-1.10.2.min',
		'leaflet': 'leaflet-0.7.1'
	}
});

require(['app'], function(App){
	App.start();
});
