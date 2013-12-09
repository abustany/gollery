requirejs.config({
	baseUrl: 'js',
	paths: {
		'jquery': 'jquery-1.10.2.min',
		'leaflet': 'leaflet-0.7.1'
	}
});

require(['app'], function(App){
	App.start();
});
