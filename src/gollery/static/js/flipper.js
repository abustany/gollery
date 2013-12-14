define(['jquery'], function($) {

function Flipper(selector) {
	this.$item = $(selector);
}

Flipper.prototype = {
	flip: function(val) {
		this.$item.toggleClass('widget-flipper-flipped', val);
	}
};

return Flipper;

}); // define
