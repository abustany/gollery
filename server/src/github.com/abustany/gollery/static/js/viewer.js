define(['zepto'], function($) {

function Viewer(app) {
	var viewer = this;
	this.app = app;

	$('#viewer-quit-button').click(function() {
		viewer.goBackToAlbums();
	});
}

Viewer.prototype = {
	goBackToAlbums: function() {
		this.app.setUiMode('main');
	}
};

return Viewer;

}); // define
