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
		var mode = null;

		$.each(document.body.className.split(' '), function(idx, val) {
			if (val.indexOf('ui-mode-') === 0) {
				mode = val.slice('ui-mode-'.length);
				return;
			}
		});

		return mode;
	},

	setUiMode: function(mode) {
		var $body = $(document.body);
		var modeName = 'ui-mode-' + mode;
		var currentMode = this.getUiMode();

		if (currentMode) {
			if (currentMode === mode) {
				return;
			}

			$body.removeClass('ui-mode-' + currentMode);
		}

		$body.addClass(modeName);
	},

	hashRoutes: {
		'browse': 'browseAlbum',
	},

	dispatchHash: function() {
		var hash = document.location.hash;

		if (hash === '') {
			this.browseAlbum(null);
			return;
		}

		hash = hash.slice(1); // remove the leading #

		for (x in this.hashRoutes) {
			var prefix = x + ':';

			if (hash.indexOf(prefix) !== 0) {
				continue;
			}

			var f = this[this.hashRoutes[x]];

			if (f === undefined) {
				console.log('Undefined route function: ' + this.hashRoutes[x]);
				return;
			}

			f.call(this, hash.slice(prefix.length));
		}
	},

	browseAlbum: function(album) {
		this.browser.browse(album);
	}
};

return App;

}); // define
