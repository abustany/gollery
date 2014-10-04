import $ = require('jquery');

class Flipper {
	private $item: JQuery;

	constructor(selector: string) {
		this.$item = $(selector);
	}

	flip(val: boolean): void {
		this.$item.toggleClass('widget-flipper-flipped', val);
	}
}

export = Flipper;
