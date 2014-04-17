import $ = require('jquery');

class Common {
	private static _preventDefaultEvent(e: any): void {
		e.preventDefault();
	}

	static dontScroll(selector: string): void {
		$(selector).each((idx: number, x: any) => {
			x.ontouchmove = Common._preventDefaultEvent;
		});
	}

	static hashRegex = /#/g;

	static pictureUrl(size: string, album: string, filename?: string): string {
		var url = '/thumbnails/';
		url += size;
		url += '/';
		url += album.replace(Common.hashRegex, '%23');

		if (filename) {
			url += '/';
			url += filename.replace(Common.hashRegex, '%23');
		}

		return url;
	}
}

export = Common;
