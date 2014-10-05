import Album = require('album');
import App = require('app');
import Common = require('common');
import LoadingScreen = require('loadingscreen');

class AlbumFrame {
	private static DefaultCoverUrl = '/images/camera-roll.png';

	public el: HTMLElement;

	constructor(app: App, album: Album, href: string) {
		var frame = document.createElement('div');
		frame.className = 'album-frame';

		frame.appendChild(this.makeImg(app, album, href));
		frame.appendChild(this.makeTitle(album, href));

		this.el = frame;
	}

	private makeImg(app: App, album: Album, href: string): HTMLElement {
		var imgDiv = document.createElement('div');
		imgDiv.className = 'album-frame-inner';

		LoadingScreen.push();

		var img = document.createElement('img');

		img.addEventListener('load', function() {
			LoadingScreen.pop();
		});

		img.addEventListener('error', function() {
			app.oops('Cannot load image ' + img.src);
		});

		img.src = AlbumFrame.DefaultCoverUrl;

		if (album.cover) {
			img.src = Common.pictureUrl('small', album.cover);
		}

		var a = document.createElement('a');

		if (href) {
			a.href = href;
		}

		a.appendChild(img);
		imgDiv.appendChild(a);

		return imgDiv;
	}

	private makeTitle(album: Album, href: string): HTMLElement {
		var a = document.createElement('a');
		a.className = 'album-frame-title';

		if (href) {
			a.href = href;
		}

		a.appendChild(document.createTextNode(album.name));

		return a;
	}
}

export = AlbumFrame;
