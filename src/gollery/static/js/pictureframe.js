define(['common', 'loadingscreen'], function(Common, LoadingScreen) {

function PictureFrame(app, album, pic, href) {
	this.album = album;
	this.pic = pic;
	this.href = href;

	var url = Common.pictureUrl(app, 'small', album, pic.path);

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

	img.addEventListener('load', function() {
		LoadingScreen.pop();
	});

	img.addEventListener('error', function() {
		app.oops('Cannot load image ' + img.src);
	});

	img.src = url;
	img.setAttribute('title', pic.path);

	a.appendChild(img);

	this.el = frame;
};

return PictureFrame;

}); // define
