define(['albumframe', 'jquery'], function(AlbumFrame, $) {

function AlbumList() {
}

AlbumList.prototype = {
	update: function(albums) {
		var $list = $('#album-list');

		$list.html('');

		$.each(albums, function(idx, album) {
			var href = '#browse:' + album.name;
			var albumFrame = new AlbumFrame(album, href);

			$list.append(albumFrame.el);
		});
	}
};

return AlbumList;

}); // define
