define(['browser', 'jquery', 'sidebar', 'viewer'], function(Browser, $, Sidebar, Viewer) {

var App = {
	start: function() {
		var app = this;

		console.log('Starting application');

		app.sidebar = new Sidebar();
		app.browser = new Browser();
		app.viewer = new Viewer(app);

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
		'view': 'viewPicture'
	},

	dispatchHash: function() {
		var hash = document.location.hash;

		if (hash === '') {
			this.browseAlbum(null);
			return;
		}

		hash = hash.slice(1); // remove the leading #

		var actionName;
		var actionParam;
		var actionOptions = {};

		var colIdx = hash.indexOf(':');

		if (colIdx == -1) {
			actionName = hash;
		} else {
			var tokens = hash.slice(0, colIdx).split(',');
			actionName = tokens.shift();

			$.each(tokens, function(idx, val) {
				actionOptions[val] = true;
			});

			actionParam = hash.slice(1 + colIdx);
		}

		for (x in this.hashRoutes) {
			if (x !== actionName) {
				continue;
			}

			var f = this[this.hashRoutes[x]];

			if (f === undefined) {
				console.log('Undefined route function: ' + this.hashRoutes[x]);
				return;
			}

			if (this.route) {
				this.previousRoute = this.route;
			}

			this.route = {
				action: actionName,
				param : actionParam,
				options: actionOptions
			};

			f.call(this, actionParam, actionOptions);
		}
	},

	sortPicturesByDate: function(pictures) {
		// For each picture, parse the EXIF date (if any)
		$.each(pictures, function(idx, pic) {
			if (!pic.metadata) {
				return;
			}

			var exifDate = pic.metadata['Exif.Photo.DateTimeOriginal'];

			if (!exifDate) {
				return;
			}

			// Format of the date is 2013:11:13 11:14:12

			if (exifDate.length != 19) {
				console.log('Cannot parse EXIF date ' + exifDate + ': invalid length');
				return;
			}

			var yearStr = exifDate.slice(0, 4);
			var monthStr = exifDate.slice(5, 7);
			var dayStr = exifDate.slice(8, 10);
			var hourStr = exifDate.slice(11, 13);
			var minuteStr = exifDate.slice(14, 16);
			var secondStr = exifDate.slice(17, 19);

			date = new Date(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);

			if (isNaN(date.getTime())) {
				console.log('Cannot parse EXIF date ' + exifDate);
				return;
			}

			pic.date = date;
		});

		pictures.sort(function (a, b) {
			// If we have no date at all, fallback on filename lexical sort
			if (!a.date && !b.date) {
				return (a.path === b.path ? 0 : (a.path < b.path ? -1 : 1));
			}

			if (a.date && !b.date) {
				return -1;
			}

			if (!a.date && b.date) {
				return 1;
			}

			var ta = a.date.getTime();
			var tb = b.date.getTime();

			return (ta === tb ? 0 : (ta < tb ? -1 : 1));
		});
	},

	loadAlbum: function(name, cb) {
		var app = this;

		if (this.album && this.album.name === name) {
			cb(this.album);
			return;
		}

		$.getJSON('/albums/' + name, function(data) {
			app.sortPicturesByDate(data.pictures);

			app.album = data;

			cb(data);
		});
	},

	browseAlbum: function(album) {
		var app = this;

		app.setUiMode('main');

		if (album) {
			app.loadAlbum(album, function(data) {
				app.browser.browse(data);
			});
		}
	},

	viewPicture: function(path) {
		var app = this;

		this.setUiMode('viewer');

		var idx = path.lastIndexOf('/');
		var album = path.slice(0, idx);
		var filename = path.slice(1+idx);

		app.loadAlbum(album, function(data) {
			app.viewer.view(data, filename);
		});
	},

	buildHash: function(route) {
		var hash = route.action;

		if (route.options) {
			for (o in route.options) {
				hash += ',';
				hash += o;
			}
		}

		hash += ':';
		hash += route.param;

		return hash;
	}
};

return App;

}); // define
