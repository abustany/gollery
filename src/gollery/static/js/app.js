define(['albumlist', 'browser', 'flipper', 'i18n', 'infowindow', 'jquery', 'loadingscreen', 'viewer'], function(AlbumList, Browser, Flipper, I18N, InfoWindow, $, LoadingScreen, Viewer) {

var _ = I18N.G;

var App = {
	start: function() {
		var app = this;

		console.log('Starting application');

		app.albumList = new AlbumList(app);
		app.browser = new Browser(app);
		app.infoWindow = new InfoWindow();
		app.listMapFlipper = new Flipper('#browser-content-flipper');
		app.viewer = new Viewer(app);
		app.albumTokens = {};

		app.loadAlbums();

		app.setUiMode('album-list');

		I18N.setLocale(window.navigator.language);

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

		if (this.navigateSilent) {
			this.navigateSilent = false;
			return;
		}

		if (hash === '') {
			this.setUiMode('album-list');
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
				var idx = val.indexOf('=');

				if (idx === -1) {
					actionOptions[val] = true;
				} else {
					actionOptions[val.slice(0, idx)] = val.slice(1 + idx);
				}
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

	navigate: function(route, silent) {
		this.navigateSilent = !!silent;

		document.location.hash = route;
	},

	// Wrapper arround $.getJSON that handles the logging screen
	loadJSON: function(url, callback) {
		var app = this;

		LoadingScreen.push();

		var jqxhr = $.getJSON(url, function() {
			LoadingScreen.pop();

			var args = Array.prototype.slice.apply(arguments);
			callback.apply(app, args);
		});

		jqxhr.fail(function(xhr, status, error) {
			app.oops(error);
		});

		return jqxhr;
	},

	loadAlbums: function() {
		var app = this;
		var albumList = $('#album-list');

		app.loadJSON('/albums/', function(data) {
			data.sort(app.albumCompareFunc);
			app.albumList.update(data);
		});
	},

	albumCompareFunc: function(a, b) {
		return a.name.localeCompare(b.name);
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

	parseGpsMetadata: function(pictures) {
		var parseRational = function(data) {
			var idx = data.indexOf('/');

			if (idx === -1) {
				return null;
			}

			var a = Number(data.slice(0, idx));
			var b = Number(data.slice(1 + idx));

			if (isNaN(a) || isNaN(b)) {
				return null;
			}

			return a/b;
		};

		var parseCoord = function(data) {
			if (!data) {
				return null;
			}

			var tokens = data.split(' ');

			if (tokens.length !== 3) {
				return null;
			}

			var deg = parseRational(tokens[0]);
			var min = parseRational(tokens[1]);
			var sec = parseRational(tokens[2]); // we'll ignore this for now

			if (deg === null || min === null || sec === null) {
				return null;
			}

			return deg + min / 60 + sec / 3600;
		};

		var parse = function(data, keyName) {
			var coord = parseCoord(data[keyName]);

			if (coord === null) {
				return null;
			}

			var ref = data[keyName + 'Ref'];

			switch (ref) {
			case 'N':
			case 'E':
				return coord;
			case 'S':
			case 'W':
				return -coord;
			}

			return null;
		};

		$.each(pictures, function(idx, pic) {

			if (!pic.metadata) {
				return;
			}

			var lat = parse(pic.metadata, 'Exif.GPSInfo.GPSLatitude');
			var lon = parse(pic.metadata, 'Exif.GPSInfo.GPSLongitude');

			if (!lat || !lon) {
				return;
			}

			pic.gpsCoords = [lat, lon];
		});
	},

	loadAlbum: function(name, cb) {
		var app = this;

		// FIXME: The decoding of the hash token seems to behave differently
		// in Chrome and Firefox (Firefox does the decoding already). As
		// long as we don't have any % in the album name, doing an extra
		// decode is harmless.
		if (this.album && this.album.name === decodeURIComponent(name)) {
			cb(this.album);
			return;
		}

		var albumUrl = '/albums/' + name;

		var albumToken = app.albumTokens[name];

		if (albumToken) {
			albumUrl += '?token=' + albumToken;
		}

		app.loadJSON(albumUrl, function(data) {
			app.sortPicturesByDate(data.pictures);
			app.parseGpsMetadata(data.pictures);

			app.album = data;

			cb(data);
		});
	},

	browseAlbum: function(album, options) {
		var app = this;
		var $content_flipper = $('#browser-content-flipper');

		app.setUiMode('browser');

		$content_flipper.toggleClass('browser-no-album', !album);

		if (album && app.browser.album && app.browser.album.name !== album) {
			app.browser.browse(null);
		}

		if (album) {
			if (options.token) {
				app.albumTokens[album] = options.token;
			}

			app.loadAlbum(album, function(data) {
				app.browser.browse(data);
			});

			var $toggleViewButton = $('#browser-map-button');

			if (options.map) {
				app.listMapFlipper.flip(true);
				$toggleViewButton.attr('value', _('List view'));
			} else {
				app.listMapFlipper.flip(false);
				$toggleViewButton.attr('value', _('Map view'));
			}
		} else {
			app.browser.browse(null);
		}
	},

	viewPicture: function(path) {
		var app = this;

		var wasInViewerMode = (this.getUiMode() === 'viewer');

		this.setUiMode('viewer');

		var idx = path.lastIndexOf('/');
		var album = path.slice(0, idx);
		var filename = path.slice(1+idx);

		app.loadAlbum(album, function(data) {
			app.viewer.view(data, filename);

			if (!wasInViewerMode) {
				app.viewer.popupToolbar();
			}
		});
	},

	buildHash: function(route) {
		var hash = route.action;

		if (route.options) {
			for (o in route.options) {
				hash += ',';
				hash += o;

				var optVal = route.options[o];

				if (typeof(optVal) !== 'boolean') {
					hash += '=';
					hash += optVal;
				}
			}
		}

		hash += ':';
		hash += route.param;

		return hash;
	},

	oops: function(message) {
		if (this.oopsed) {
			return;
		}

		this.oopsed = true;

		$('#oops-screen-error').text(message);
		$('#oops-screen').css('display', 'table');
	}
};

return App;

}); // define
