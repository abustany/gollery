import $ = require('jquery');
import Album = require('album');
import AlbumFrame = require('albumframe');
import App = require('app');

class AlbumList {
	constructor(private app: App) {
	}

	update(albums: Album[]): void {
		var $list = $('#album-list');

		$list.html('');

		$.each(albums, (idx, album) => {
			var href = '#browse:' + album.name;
			var albumFrame = new AlbumFrame(this.app, album, href);

			$list.append(albumFrame.el);
		});
	}
}

export = AlbumList;
