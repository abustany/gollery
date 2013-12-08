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

		var innerFrame = document.createElement('div');
		innerFrame.className = 'frame-inner';
		frame.appendChild(innerFrame);

		var img = document.createElement('img');
		img.src = document.location.origin + '/thumbnails/small/' + this.album + '/' + pic.path;
		innerFrame.appendChild(img);

		$('#content').append(frame);
	}
};

return Browser;

}); // define
