import Album = require('album');
import AlbumList = require('albumlist');
import Browser = require('browser');
import Flipper = require('flipper');
import I18N = require('i18n');
import InfoWindow = require('infowindow');
import $ = require('jquery');
import LoadingScreen = require('loadingscreen');
import Picture = require('picture');
import Route = require('route');
import Viewer = require('viewer');
import jqueryCookie = require('jquery.cookie')

class App {
	private albumList: AlbumList;
	private browser: Browser;
	private infoWindow: InfoWindow;
	private listMapFlipper: Flipper;
	private viewer: Viewer;
	private navigateSilent: boolean;
	public currentRoute: Route;
	public previousRoute: Route;
	private currentAlbum: Album;
	private oopsed: boolean;

	private static HashRoutes: Object = {
		'browse': 'browseAlbum',
		'view': 'viewPicture'
	}

	constructor() {
	}

	start(): void {
		console.log('Starting application');

		// Force the jquery.cookie module to be imported
		var jqCookie = jqueryCookie;

		// Looks up any access token in the URL and saves them in the right cookie
		this.saveTokens();

		this.albumList = new AlbumList(this);
		this.browser = new Browser(this);
		this.infoWindow = new InfoWindow();
		this.listMapFlipper = new Flipper('#browser-content-flipper');
		this.viewer = new Viewer(this);

		this.loadAlbums();

		this.setUiMode('album-list');

		I18N.setLocale(window.navigator.language);

		console.log('Application started');

		window.addEventListener('hashchange', () => {
			this.dispatchHash();
		});

		this.dispatchHash();
	}

	saveTokens(): void {
		var CookieName = 'gollery_tokens';
		var queryParams = this.parseQuery();

		if (queryParams['tokens'] === undefined) {
			return;
		}

		var newTokens = queryParams['tokens'].split(',');

		var savedTokens: {[index:string]: boolean} = {};

		$.each(($.cookie(CookieName) || '').split(','), (idx, val) => {
			if (val !== '') {
				savedTokens[val] = true;
			}
		});

		$.each(newTokens, (idx, val) => { savedTokens[val] = true; });

		$.cookie(CookieName, Object.keys(savedTokens).join(','));
	}

	parseQuery(): {[name: string]: string} {
		var result: {[name: string]: string} = {};
		var params = document.location.search.slice(1).split('&');
		$.each(params, (zz, val) => {
			var idx = val.indexOf('=');

			if (idx === -1) {
				result[val] = ''
			} else {
				var name = val.slice(0, idx);
				var value = decodeURIComponent(val.slice(idx + 1));

				result[name] = value;
			}
		});

		return result;
	}

	getUiMode(): string {
		var mode = null;

		$.each(document.body.className.split(' '), function(idx, val) {
			if (val.indexOf('ui-mode-') === 0) {
				mode = val.slice('ui-mode-'.length);
				return;
			}
		});

		return mode;
	}

	setUiMode(mode: string): void {
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
	}

	dispatchHash(): void {
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
				actionOptions[val] = true;
			});

			actionParam = hash.slice(1 + colIdx);
		}

		for (var x in App.HashRoutes) {
			if (x !== actionName) {
				continue;
			}

			var f = this[App.HashRoutes[x]];

			if (f === undefined) {
				console.log('Undefined route function: ' + App.HashRoutes[x]);
				return;
			}

			if (this.currentRoute) {
				this.previousRoute = this.currentRoute;
			}

			this.currentRoute = {
				action: actionName,
				param : actionParam,
				options: actionOptions
			};

			f.call(this, actionParam, actionOptions);
		}
	}

	navigate(route: string, silent: boolean = false): void {
		this.navigateSilent = !!silent;

		document.location.hash = route;
	}

	// Wrapper arround $.getJSON that handles the logging screen
	loadJSON(url: string, callback: any): JQueryXHR {
		LoadingScreen.push();

		var jqxhr = $.getJSON(url, () => {
			LoadingScreen.pop();

			var args = Array.prototype.slice.apply(arguments);
			callback.apply(this, args);
		});

		jqxhr.fail((xhr, status, error) => {
			this.oops(error);
		});

		return jqxhr;
	}

	loadAlbums(): void {
		var albumList = $('#album-list');

		this.loadJSON('/albums/', (data) => {
			data.sort(App.albumCompareFunc);
			this.albumList.update(data);
		});
	}

	static albumCompareFunc(a: Album, b: Album): number {
		return a.name.localeCompare(b.name);
	}

	static sortPicturesByDate(pictures: Picture[]): void {
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

			var date = new Date(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);

			if (isNaN(date.getTime())) {
				console.log('Cannot parse EXIF date ' + exifDate);
				return;
			}

			pic.date = date;
		});

		pictures.sort((a, b) => {
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
	}

	static parseGpsMetadata(pictures: Picture[]) {
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

		$.each(pictures, (idx, pic) => {

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
	}

	loadAlbum(name: string, cb: any): void {
		// FIXME: The decoding of the hash token seems to behave differently
		// in Chrome and Firefox (Firefox does the decoding already). As
		// long as we don't have any % in the album name, doing an extra
		// decode is harmless.
		if (this.currentAlbum && this.currentAlbum.name === decodeURIComponent(name)) {
			cb(this.currentAlbum);
			return;
		}

		this.loadJSON('/albums/' + name, (data) => {
			App.sortPicturesByDate(data.pictures);
			App.parseGpsMetadata(data.pictures);

			this.currentAlbum = data;

			cb(data);
		});
	}

	browseAlbum(album: string, options: Object): void {
		var $content_flipper = $('#browser-content-flipper');

		this.setUiMode('browser');

		$content_flipper.toggleClass('browser-no-album', !album);

		var currentBrowserAlbum = this.browser.currentAlbum();

		if (album && currentBrowserAlbum && currentBrowserAlbum.name !== album) {
			this.browser.browse(null);
		}

		if (album) {
			this.loadAlbum(album, (data) => {
				this.browser.browse(data);
			});

			var $toggleViewButton = $('#browser-map-button');

			if (options['map']) {
				this.listMapFlipper.flip(true);
				$toggleViewButton.attr('value', I18N.G('List view'));
			} else {
				this.listMapFlipper.flip(false);
				$toggleViewButton.attr('value', I18N.G('Map view'));
			}
		} else {
			this.browser.browse(null);
		}
	}

	viewPicture(path: string): void {
		var wasInViewerMode = (this.getUiMode() === 'viewer');

		this.setUiMode('viewer');

		var idx = path.lastIndexOf('/');
		var album = path.slice(0, idx);
		var filename = path.slice(1+idx);

		this.loadAlbum(album, (data) => {
			this.viewer.view(data, filename);

			if (!wasInViewerMode) {
				this.viewer.popupToolbar();
			}
		});
	}

	buildHash(route: Route): string {
		var hash = route.action;

		if (route.options) {
			for (var o in route.options) {
				hash += ',';
				hash += o;
			}
		}

		hash += ':';
		hash += route.param;

		return hash;
	}

	oops(message: string): void {
		if (this.oopsed) {
			return;
		}

		this.oopsed = true;

		$('#oops-screen-error').text(message);
		$('#oops-screen').css('display', 'table');
	}
}

export = App
