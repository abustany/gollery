import App = require('app');
import Common = require('common');
import LoadingScreen = require('loadingscreen');

class AlbumFrame {
	private static DefaultCoverUrl = '/images/camera-roll.png';

	public el: HTMLElement;

	constructor(app: App, album: any, href: string) {
		var frame = document.createElement('div');
		frame.className = 'album-frame';

		var a = document.createElement('a');
		a.className = 'album-frame-inner';

		if (href) {
			a.href = href;
		}

		frame.appendChild(a);

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

		a.appendChild(img);

		var titleFrame = document.createElement('a');
		titleFrame.href = href;
		titleFrame.className = 'album-frame-title';
		frame.appendChild(titleFrame);

		titleFrame.appendChild(document.createTextNode(album.name));

		this.el = frame;
	}
}

export = AlbumFrame;
