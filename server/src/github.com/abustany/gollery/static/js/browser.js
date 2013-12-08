define(['jquery'], function($) {

function Browser() {
}

Browser.prototype = {
	browse: function(album) {
		var browser = this;

		browser.album = album;

		$('#content').html('');

		$.each(album.pictures, function(idx, pic) {
			browser.addPicture(pic);
		});
	},

	addPicture: function(pic) {
		var frame = document.createElement('div');
		frame.className = 'frame';

		var a = document.createElement('a');
		a.className = 'frame-inner';
		a.href = '#view:' + this.album.name + '/' + pic.path;
		frame.appendChild(a);

		var img = document.createElement('img');
		img.src = document.location.origin + '/thumbnails/small/' + this.album.name + '/' + pic.path;
		a.appendChild(img);

		$('#content').append(frame);
	}
};

return Browser;

}); // define
