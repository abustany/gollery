import Picture = require('picture');

class Album {
	constructor(public name: string, public cover: string, public pictures: Picture[]) {
	}
}

export = Album;
