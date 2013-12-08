requirejs.config({
	baseUrl: 'js',
	paths: {
		'jquery': 'jquery-1.10.2.min'
	}
});

require(['app'], function(App){
	App.start();
});
