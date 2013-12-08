define(['browser', 'jquery', 'sidebar'], function(Browser, $, Sidebar) {

var App = {
	start: function() {
		var app = this;

		console.log('Starting application');

		app.sidebar = new Sidebar();
		app.browser = new Browser();

		app.setUiMode('main');

		console.log('Application started');

		window.addEventListener('hashchange', function() {
			app.dispatchHash();
		});

		app.dispatchHash();
	},

	getUiMode: function() {
		$.each(document.body.className.split(' '), function(idx, val) {
			if (val.indexOf('ui-mode-') === 0) {
				return val.slice('ui-mode-'.length);
			}

			return null;
		});
	},

	setUiMode: function(mode) {
		var $this = $(this);
		var modeName = 'ui-mode-' + mode;
		var currentMode = this.getUiMode();

		if (this.uiMode) {
			if (currentMode === mode) {
				return;
			}

			$this.removeClass('ui-mode-' + currentMode);
		}

		$this.addClass(modeName);
	},

	dispatchHash: function() {
		var hash = document.location.hash;

		if (hash === '') {
			this.browseAlbum(null);
			return;
		}

		hash = hash.slice(1); // remove the leading #

		if (hash.indexOf('browse:') === 0) {
			this.browseAlbum(hash.slice('browse:'.length));
		}
	},

	browseAlbum: function(album) {
		this.browser.browse(album);
	}
};

return App;

}); // define
