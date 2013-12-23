define(['jquery'], function($) {
var Common = {
	_preventDefaultEvent: function(e) {
		e.preventDefault();
	},

	// Disables scrolling on touchscreens for specific elements
	dontScroll: function(selector) {
		$(selector).each(function(idx, x) {
			x.ontouchmove = Common._preventDefaultEvent;
		});
	},

	hashRegex: /#/g,

	pictureUrl: function(size, album, filename) {
		var url = '/thumbnails/';
		url += size;
		url += '/';
		url += album.replace(Common.hashRegex, '%23');

		if (filename) {
			url += '/';
			url += filename.replace(Common.hashRegex, '%23');
		}

		return url;
	}
};

return Common;

}); // define
