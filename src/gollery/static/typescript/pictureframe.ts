import App = require('app');
import Common = require('common');
import LoadingScreen = require('loadingscreen');
import Picture = require('picture');

class PictureFrame {
	public el: HTMLElement;

	constructor(app: App, public album: string, public pic: Picture, public href: string) {
		var url = Common.pictureUrl('small', album, pic.path);

		var frame = document.createElement('div');
		frame.className = 'picture-frame';

		var a = document.createElement('a');
		a.className = 'picture-frame-inner';

		if (href) {
			a.href = href;
		}

		frame.appendChild(a);

		LoadingScreen.push();

		var img = document.createElement('img');

		img.addEventListener('load', () => {
			LoadingScreen.pop();
		});

		img.addEventListener('error', () => {
			app.oops('Cannot load image ' + img.src);
		});

		img.src = url;
		img.setAttribute('title', pic.path);

		a.appendChild(img);

		this.el = frame;
	}
}

export = PictureFrame;
