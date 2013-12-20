define([], function() {

function AlbumFrame(album, href) {
	var frame = document.createElement('div');
	frame.className = 'album-frame';

	var a = document.createElement('a');
	a.className = 'album-frame-inner';

	if (href) {
		a.href = href;
	}

	frame.appendChild(a);

	var img = document.createElement('img');
	img.src = AlbumFrame.DefaultCoverUrl;

	if (album.cover) {
		img.src = '/thumbnails/small/' + album.cover;
	}

	a.appendChild(img);

	var titleFrame = document.createElement('a');
	titleFrame.href = href;
	titleFrame.className = 'album-frame-title';
	frame.appendChild(titleFrame);

	titleFrame.appendChild(document.createTextNode(album.name));

	this.el = frame;
};

AlbumFrame.DefaultCoverUrl = '/images/camera-roll.png';

return AlbumFrame;

}); // define
