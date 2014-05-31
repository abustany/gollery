import Album = require('album');
import App = require('app');
import Common = require('common');
import $ = require('jquery');
import Hammer = require('hammer');
import Route = require('route');

/// <reference path="hammerjs.d.ts"/>

class Viewer {
	private static emptyPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

	private previousRoute: Route;
	private filename: string;
	private album: Album;
	private prevImg: HTMLImageElement;
	private nextImg: HTMLImageElement;

	constructor(private app: App) {
		var x = Hammer;
		$('#viewer-quit-button').click(() => {
			this.goBackToAlbums();
		});

		$('#viewer-prev-button').click(() => {
			this.viewSibling(-1);
		});

		$('#viewer-next-button').click(() => {
			this.viewSibling(1);
		});

		$(document).keyup((ev) => {
			// Don't do anything if we're not watching pictures
			if (!this.filename) {
				return;
			}

			switch (ev.keyCode) {
			case 27: // Escape
				this.goBackToAlbums();
				break;
			case 37: // Left
				this.viewSibling(-1);
				break;
			case 39: // Right
				this.viewSibling(1);
				break;
			}
		});

		var h = $('#viewer-inner').hammer();

		h.on('swiperight', () => {
			this.viewSibling(-1);
		});

		h.on('swipeleft', () => {
			this.viewSibling(1);
		});

		Common.dontScroll('#viewer');

		if (this.supportsFullscreen()) {
			var $fullscreen_button = $('#viewer-fullscreen-button');
			$fullscreen_button.css('display', 'inline-block');

			$fullscreen_button.click(() => {
				this.goFullscreen();
			});
		}

		var $viewer_img = $('#viewer-img');

		$viewer_img.load(() => {
			this.loadSiblings();
		});

		$viewer_img.on('error', () => {
			app.oops('Cannot load image ' + $viewer_img.prop('src'));
		});

		$('#viewer-inner').click(() => {
			this.popupToolbar();
		});
	}

	goBackToAlbums(): void {
		if (!this.album) {
			this.app.navigate('');
			return;
		}

		if (this.previousRoute) {
			this.app.navigate(this.app.buildHash(this.previousRoute));
			this.previousRoute = null;
			return;
		}

		this.app.navigate('#browse:' + this.album.name);

		this.album = null;
		this.filename = null;
	}

	view(album: Album, filename: string): void {
		this.album = album;
		this.filename = filename;

		if (this.app.previousRoute && this.app.previousRoute.action !== 'view') {
			this.previousRoute = this.app.previousRoute;
		}

		$('#viewer-img').attr('src', Viewer.emptyPixel);
		$('#viewer-img').attr('src', this.pictureUrl(filename));
	}

	popupToolbar(): void {
		$('#viewer-toolbar-inner').removeClass('viewer-toolbar-autohide');

		setTimeout(() => {
			$('#viewer-toolbar-inner').toggleClass('viewer-toolbar-autohide', true);
		}, 1000);
	}

	pictureUrl(path: string): string {
		return Common.pictureUrl('large', this.album.name, path);
	}

	// Clamps an index to the album size
	pictureIndex(idx: number): number {
		var pics = this.album.pictures;

		if (idx >= pics.length) {
			idx -= pics.length;
		}

		if (idx < 0) {
			idx += pics.length;
		}

		return idx;
	}

	loadSiblings(): void {
		var pics = this.album.pictures;
		var filename = this.filename;

		var idx = -1;

		for (var i = 0; i < pics.length; ++i) {
			if (pics[i].path === filename) {
				idx = i;
				break;
			}
		}

		if (idx === -1) {
			console.log('Cannot find ' + filename + ' in pictures of album ' + this.album.name);
			return;
		}

		var prevIdx = this.pictureIndex(idx - 1);
		var nextIdx = this.pictureIndex(idx + 1);

		this.prevImg = new Image();
		this.nextImg = new Image();

		var prevUrl = this.pictureUrl(pics[prevIdx].path);
		var nextUrl = this.pictureUrl(pics[nextIdx].path);

		this.prevImg.src = this.pictureUrl(pics[prevIdx].path);
		this.nextImg.src = this.pictureUrl(pics[nextIdx].path);
	}

	viewSibling(direction: number): void {
		// We can't use this.prevImg or nextImg here, since this function might
		// get invoked before they are defined (we only do preloading *after*
		// the main image is loaded)
		direction = (direction > 0 ? 1 : -1);

		var pics = this.album.pictures;
		var filename = this.filename;

		var idx = -1;

		for (var i = 0; i < pics.length; ++i) {
			if (pics[i].path === filename) {
				idx = i;
				break;
			}
		}

		if (idx === -1) {
			console.log('Cannot find ' + filename + ' in pictures of album ' + this.album.name);
			return;
		}

		idx = this.pictureIndex(idx + direction);

		this.app.navigate('view:' + encodeURIComponent(this.album.name) + '/' + pics[idx].path);
	}

	supportsFullscreen(): boolean {
		// Typescript does not know requestFullscreen
		var de = <any>document.documentElement;

		return de.requestFullscreen || de.mozRequestFullScreen || de.webkitRequestFullscreen;
	}

	goFullscreen(): void {
		// Stolen from https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode

		// Typescript does not know requestFullscreen
		var de = <any>document.documentElement;

		if (de.requestFullscreen) {
			de.requestFullscreen();
		} else if (de.mozRequestFullScreen) {
			de.mozRequestFullScreen();
		} else if (de.webkitRequestFullscreen) {
			de.webkitRequestFullscreen((<any>Element).ALLOW_KEYBOARD_INPUT);
		}
	}
}

export = Viewer;
