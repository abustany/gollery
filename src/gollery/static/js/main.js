requirejs.config({
	baseUrl: 'js',
	paths: {
		'hammer': 'jquery.hammer-1.0.5',
		'jquery': 'jquery-1.11.0',
		'leaflet': 'leaflet-0.7.1'
	}
});

require(['app'], function(App){
	App.start();
});
