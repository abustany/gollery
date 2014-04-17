import $ = require('jquery');
import AlbumFrame = require('albumframe');

class AlbumList {
	constructor(private app: any) {
	}

	update(albums: any[]): void {
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
