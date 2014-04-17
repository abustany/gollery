requirejs.config({
	baseUrl: 'js',
	paths: {
		'hammer': 'jquery.hammer-full-1.0.6',
		'jquery': 'jquery-1.11.0'
	}
});

require(['app'], function(App){
	App.start();
});
