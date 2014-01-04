define(['albumframe', 'jquery'], function(AlbumFrame, $) {

function AlbumList(app) {
	this.app = app;
}

AlbumList.prototype = {
	update: function(albums) {
		var albumList = this;
		var $list = $('#album-list');

		$list.html('');

		$.each(albums, function(idx, album) {
			var href = '#browse:' + album.name;
			var albumFrame = new AlbumFrame(albumList.app, album, href);

			$list.append(albumFrame.el);
		});
	}
};

return AlbumList;

}); // define
