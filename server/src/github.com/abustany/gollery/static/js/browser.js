define(['jquery', 'leaflet'], function($, Leaflet) {

function Browser(app) {
	var browser = this;

	browser.app = app;

	Leaflet.Icon.Default.imagePath = '/images';

	var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
	});

	browser.map = Leaflet.map('map-view', {
		center: [52.5079, 13.4854],
		zoom: 13
	});

	osmLayer.addTo(browser.map);

	browser.markers = Leaflet.layerGroup();
	browser.markers.addTo(browser.map);

	$('#browser-map-button').click(function() {
		browser.toggleMap();
	});
}

Browser.prototype = {
	browse: function(album) {
		var browser = this;

		if (browser.album === album) {
			return;
		}

		browser.album = album;

		$('#picture-list').html('');

		if (!browser.album) {
			return;
		}

		var boundingBox = browser.calculateGpsBoundingBox(album);

		if (boundingBox !== null) {
			browser.map.fitBounds(boundingBox);
		}

		$('#content').toggleClass('browser-no-map', !boundingBox);

		browser.markers.clearLayers();

		$.each(album.pictures, function(idx, pic) {
			var g = pic.gpsCoords;

			if (g) {
				var thumbUrl = document.location.origin + '/thumbnails/small/' + album.name + '/' + pic.path;

				var iconHtml = '';
				iconHtml += '<a href="#view:' + album.name + '/' + pic.path + '">';
				iconHtml += '<img id="browser-img-' + idx + '" src="' + thumbUrl + '"/>';
				iconHtml += '</a>';

				var icon = Leaflet.divIcon({
					html: iconHtml,
					className: 'browser-map-icon'
				});

				var marker = Leaflet.marker(g, {
					icon: icon
				});

				marker.addTo(browser.markers);

				// If we can, use the EXIF metadata to compute the center of the picture,
				// and a better clip rectangle that from the top left
				if (pic.metadata) {
					var width = Number(pic.metadata['Exif.Photo.PixelXDimension']);
					var height = Number(pic.metadata['Exif.Photo.PixelYDimension']);

					if (width && height) {
						var max;
						var min;

						if (width > height) {
							max = width;
							min = height;
						} else {
							max = height;
							min = width;
						}

						var sz = 48;
						var scale = sz/min;
						var cx = width * scale / 2;
						var cy = height * scale / 2;
						var top = Math.round(cy - sz/2);
						var right = Math.round(cx + sz/2);
						var bottom = Math.round(cy + sz/2);
						var left = Math.round(cx - sz/2);

						$('#browser-img-' + idx).css('clip', 'rect(' + top + 'px, ' + right + 'px, ' + bottom + 'px, ' + left + 'px)');
					}
				}
			}

			browser.addPicture(pic);
		});
	},

	calculateGpsBoundingBox: function(album) {
		var min = function(a, b) {
			if (a === undefined) {
				return b;
			}

			return (a < b ? a : b);
		}

		var max = function(a, b) {
			if (a === undefined) {
				return b;
			}

			return (a > b ? a : b);
		}

		var pics = album.pictures;

		var minLat;
		var minLon;
		var maxLat;
		var maxLon;

		for (var i = 0; i < pics.length; ++i) {
			var p = pics[i];

			if (!p.gpsCoords) {
				continue;
			}

			var g = p.gpsCoords;

			minLat = min(minLat, g[0]);
			maxLat = max(maxLat, g[0]);
			minLon = min(minLon, g[1]);
			maxLon = max(maxLon, g[1]);
		}

		if (minLat === undefined || maxLat === undefined || minLon === undefined || maxLon === undefined) {
			return null;
		}

		return [[minLat, minLon], [maxLat, maxLon]];
	},

	addPicture: function(pic) {
		var frame = document.createElement('div');
		frame.className = 'frame';

		var a = document.createElement('a');
		a.className = 'frame-inner';
		a.href = '#view:' + this.album.name + '/' + pic.path;
		frame.appendChild(a);

		var img = document.createElement('img');
		img.src = document.location.origin + '/thumbnails/small/' + this.album.name + '/' + pic.path;
		a.appendChild(img);

		$('#picture-list').append(frame);
	},

	toggleMap: function() {
		var app = this.app;

		if (!app.route || app.route.action !== 'browse') {
			return;
		}

		var mapParam = (app.route.options.map ? '' : ',map');

		var newHash = 'browse' + mapParam + ':' + app.route.param;

		document.location.hash = newHash;
	}
};

return Browser;

}); // define
