define(['i18n', 'jquery'], function(I18N, $) {

var _  = I18N.G;

function LoadingScreen() {
	var that = this;

	this.loading = 0;
	this.$screen = $('#loading-screen');
	this.$screen.css('display', 'none');
	this.$screen.on('transitionend', function() {
		that.$screen.css('display', that.$screen.css('opacity') == 0 ? 'none' : 'table');
	});

	this.$label = $('#loading-screen > div');
}

LoadingScreen.prototype = {
	push: function() {
		if (++this.loading === 1) {
			this.$screen.css('display', 'table');
			this.$screen.addClass('loading');
		}

		this.updateLabel();
	},

	pop: function() {
		if (--this.loading === 0) {
			this.$screen.removeClass('loading');
		}

		this.updateLabel();
	},

	updateLabel: function() {
		var label = _('Loading (%1 left)').replace('%1', this.loading);
		this.$label.text(label);
	}
};

var s = new LoadingScreen();

return s;

}); // define
