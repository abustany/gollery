import $ = require('jquery');
import PictureFrame = require('pictureframe');

/// <reference path="leaflet.d.ts" />

class Browser {
	private init = (() => {
		L.Icon.Default.imagePath = '/images';
	})();

	private static osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
	});

	private map: L.Map;
	private markers: L.LayerGroup;
	private album: any;

	constructor(private app: any) {
		$('#top-bar-browser-back-button').click(() => {
			this.app.navigate('');
		});

		this.map = L.map('browser-map-view', {
			center: L.latLng([52.5079, 13.4854]),
			zoom: 13
		});

		Browser.osmLayer.addTo(this.map);

		this.markers = L.layerGroup();
		this.markers.addTo(this.map);

		$('#browser-map-button').click(() => {
			this.toggleMap();
		});
	}

	browse(album: any): void {
		if (this.album === album) {
			return;
		}

		this.album = album;

		$('#picture-list').html('');

		$('#top-bar-browser-album-title').text(album ? album.name : '');

		if (!this.album) {
			return;
		}

		var boundingBox = this.calculateGpsBoundingBox(album);

		if (boundingBox !== null) {
			this.map.fitBounds(boundingBox);
		}

		$('#browser-content').toggleClass('browser-no-map', !boundingBox);

		this.markers.clearLayers();

		$.each(album.pictures, (idx, pic) => {
			var g = pic.gpsCoords;

			if (g) {
				var thumbUrl = '/thumbnails/small/' + album.name + '/' + pic.path;

				var iconHtml = '';
				iconHtml += '<a href="#view:' + album.name + '/' + pic.path + '">';
				iconHtml += '<img id="browser-img-' + idx + '" src="' + thumbUrl + '"/>';
				iconHtml += '</a>';

				var icon = L.divIcon({
					html: iconHtml,
					className: 'browser-map-icon'
				});

				var marker = L.marker(g, {
					icon: icon
				});

				this.markers.addLayer(marker);

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

			this.addPicture(pic);
		});
	}

	calculateGpsBoundingBox(album: any): L.LatLngBounds {
		var min = (a, b) => {
			if (a === undefined) {
				return b;
			}

			return (a < b ? a : b);
		}

		var max = (a, b) => {
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

		return L.latLngBounds(L.latLng([minLat, minLon]), L.latLng([maxLat, maxLon]));
	}

	addPicture(pic: any): void {
		var href = '#view:' + this.album.name + '/' + pic.path;
		var frame = new PictureFrame(this.app, this.album.name, pic, href);

		$('#picture-list').append(frame.el);
	}

	toggleMap(): void {
		var app = this.app;

		if (!app.route || app.route.action !== 'browse') {
			return;
		}

		var mapParam = (app.route.options.map ? '' : ',map');

		var newHash = 'browse' + mapParam + ':' + app.route.param;

		app.navigate(newHash);
	}
}

export = Browser;
