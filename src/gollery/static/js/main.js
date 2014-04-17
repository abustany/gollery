requirejs.config({
	baseUrl: 'js',
	paths: {
		'hammer': 'jquery.hammer-1.0.5',
		'jquery': 'jquery-1.11.0'
	}
});

require(['app'], function(App){
	App.start();
});
