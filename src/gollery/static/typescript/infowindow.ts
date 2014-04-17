import $ = require('jquery');

class InfoWindow {
	private $window: JQuery;
	private refreshing: boolean = false;
	private valueTransformFuncs = {
		'memory_allocated': (val: number) => {
			var units = ['KB', 'MB', 'GB', 'TB'];
			var unit = 'B';

			while (val > 1000) {
				val /= 1000;
				unit = units.shift();
			}

			return val.toFixed(2) + ' ' + unit;
		}
	};

	constructor() {
		this.$window = $('#info-window');

		$('#top-bar-album-list-info').click(() => {
			this.show();
		})

		$('#info-window-close').click(() => {
			this.hide();
		});

		this.getStatus((data: any) => {
			$('#info-window-version').text(data.version || '??');
		});

		$('#info-window').on('transitionend', () => {
			this.startStopRefreshing()
		});

		$('#info-window').on('webkitTransitionEnd', () => {
			this.startStopRefreshing()
		});
	}

	show(): void {
		this.$window.addClass('show-info');
	}

	hide(): void {
		this.$window.removeClass('show-info');
	}

	getStatus(cb: (data: any) => void): void {
		$.getJSON('/status', (data) => {
			cb(data);
		});
	}

	startRefreshing(): void {
		if (this.refreshing) {
			return;
		}

		this.refreshing = true;
		this.refreshData();
	}

	stopRefreshing(): void {
		this.refreshing = false;
		$('#info-window-stats td[id]').text('');
	}

	startStopRefreshing(): void {
		if ($('#info-window').hasClass('show-info')) {
			this.startRefreshing();
		} else {
			this.stopRefreshing();
		}
	}

	refreshData(): void {
		var idPrefix = 'info-window-';

		this.getStatus((data) => {
			if (!this.refreshing) {
				return;
			}

			$('#info-window-stats td[id]').each((idx, el) => {
				var hel = <HTMLElement>el;

				if (hel.id.indexOf(idPrefix) !== 0) {
					return;
				}

				var fieldName = hel.id.slice(idPrefix.length).replace(/-/g, '_');
				var transformFunc = this.valueTransformFuncs[fieldName];
				var val = data[fieldName];
				val = transformFunc ? transformFunc(val) : val;


				$(hel).text(val);
			});

			window.setTimeout(() => {
				this.refreshData();
			}, 2000);
		});
	}
}

export = InfoWindow;
