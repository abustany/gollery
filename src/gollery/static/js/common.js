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
	}
};

return Common;

}); // define
