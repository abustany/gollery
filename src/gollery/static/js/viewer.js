define(['common', 'hammer', 'jquery'], function(Common, Hammer, $) {

function Viewer(app) {
	var viewer = this;

	viewer.app = app;

	$('#viewer-quit-button').click(function() {
		viewer.goBackToAlbums();
	});

	$('#viewer-prev-button').click(function() {
		viewer.viewSibling(-1);
	});

	$('#viewer-next-button').click(function() {
		viewer.viewSibling(1);
	});

	$(document).keyup(function(ev) {
		// Don't do anything if we're not watching pictures
		if (!viewer.filename) {
			return;
		}

		switch (ev.keyCode) {
		case 27: // Escape
			viewer.goBackToAlbums();
			break;
		case 37: // Left
			viewer.viewSibling(-1);
			break;
		case 39: // Right
			viewer.viewSibling(1);
			break;
		}
	});

	var h = $('#viewer-inner').hammer();

	h.on('swiperight', function() {
		viewer.viewSibling(-1);
	});

	h.on('swipeleft', function() {
		viewer.viewSibling(1);
	});

	Common.dontScroll('#viewer');

	if (viewer.supportsFullscreen()) {
		$fullscreen_button = $('#viewer-fullscreen-button');
		$fullscreen_button.css('display', 'inline-block');

		$fullscreen_button.click(function() {
			viewer.goFullscreen();
		});
	}

	var $viewer_img = $('#viewer-img');

	$viewer_img.load(function() {
		viewer.loadSiblings();
	});

	$viewer_img.on('error', function() {
		app.oops('Cannot load image ' + $viewer_img.prop('src'));
	});
}

Viewer.emptyPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

Viewer.prototype = {
	goBackToAlbums: function() {
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
	},

	view: function(album, filename) {
		this.album = album;
		this.filename = filename;

		if (this.app.previousRoute && this.app.previousRoute.action !== 'view') {
			this.previousRoute = this.app.previousRoute;
		}

		$('#viewer-img').attr('src', Viewer.emptyPixel);
		$('#viewer-img').attr('src', this.pictureUrl(filename));
	},

	popupToolbar: function() {
		$('#viewer-toolbar-inner').removeClass('viewer-toolbar-autohide');

		setTimeout(function() {
			$('#viewer-toolbar-inner').toggleClass('viewer-toolbar-autohide', true);
		}, 1000);
	},

	pictureUrl: function(path) {
		return Common.pictureUrl('large', this.album.name, path);
	},

	// Clamps an index to the album size
	pictureIndex: function(idx) {
		var pics = this.album.pictures;

		if (idx >= pics.length) {
			idx -= pics.length;
		}

		if (idx < 0) {
			idx += pics.length;
		}

		return idx;
	},

	loadSiblings: function() {
		var pics = this.album.pictures;
		var filename = this.filename;

		var idx = -1;

		for (i = 0; i < pics.length; ++i) {
			if (pics[i].path === filename) {
				idx = i;
				break;
			}
		}

		if (idx === -1) {
			console.log('Cannot find ' + filename + ' in pictures of album ' + album.name);
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
	},

	viewSibling: function(direction) {
		// We can't use this.prevImg or nextImg here, since this function might
		// get invoked before they are defined (we only do preloading *after*
		// the main image is loaded)
		direction = (direction > 0 ? 1 : -1);

		var pics = this.album.pictures;
		var filename = this.filename;

		var idx = -1;

		for (i = 0; i < pics.length; ++i) {
			if (pics[i].path === filename) {
				idx = i;
				break;
			}
		}

		if (idx === -1) {
			console.log('Cannot find ' + filename + ' in pictures of album ' + album.name);
			return;
		}

		idx = this.pictureIndex(idx + direction);

		this.app.navigate('view:' + encodeURIComponent(this.album.name) + '/' + pics[idx].path);
	},

	supportsFullscreen: function() {
		return document.documentElement.requestFullscreen ||
			document.documentElement.mozRequestFullScreen ||
			document.documentElement.webkitRequestFullscreen;
	},

	goFullscreen: function() {
		// Stolen from https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	}
};

return Viewer;

}); // define
