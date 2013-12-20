define([], function() {

function PictureFrame(album, pic, href) {
	this.album = album;
	this.pic = pic;
	this.href = href;

	var url = '/thumbnails/small/' + album + '/' + pic.path;

	var frame = document.createElement('div');
	frame.className = 'picture-frame';

	var a = document.createElement('a');
	a.className = 'picture-frame-inner';

	if (href) {
		a.href = href;
	}

	frame.appendChild(a);

	var img = document.createElement('img');
	img.src = url;
	img.setAttribute('title', pic.path);
	a.appendChild(img);

	this.el = frame;
};

return PictureFrame;

}); // define
