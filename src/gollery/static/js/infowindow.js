define(['jquery'], function($) {
function InfoWindow() {
	var w = this;
	w.$window = $('#info-window');

	$('#top-bar-album-list-info').click(function() {
		w.show();
	})

	$('#info-window-close').click(function() {
		w.hide();
	});

	this.getStatus(function(data) {
		$('#info-window-version').text(data.version || '??');
	});

	$('#info-window').on('transitionend', function() {
		w.startStopRefreshing()
	});

	$('#info-window').on('webkitTransitionEnd', function() {
		w.startStopRefreshing()
	});
}

InfoWindow.prototype = {
	show: function() {
		this.$window.addClass('show-info');
	},

	hide: function() {
		this.$window.removeClass('show-info');
	},

	getStatus: function(cb) {
		$.getJSON('/status', function(data) {
			cb(data);
		});
	},

	startRefreshing: function() {
		if (this.refreshing) {
			return;
		}

		var w = this;

		this.refreshing = true;
		this.refreshData();
	},

	stopRefreshing: function() {
		this.refreshing = false;
		$('#info-window-stats td[id]').text('');
	},

	startStopRefreshing: function() {
		if ($('#info-window').hasClass('show-info')) {
			this.startRefreshing();
		} else {
			this.stopRefreshing();
		}
	},

	valueTransformFuncs: {
		'memory_allocated': function(val) {
			var units = ['KB', 'MB', 'GB', 'TB'];
			var unit = 'B';

			while (val > 1000) {
				val /= 1000;
				unit = units.shift();
			}

			return val.toFixed(2) + ' ' + unit;
		}
	},

	refreshData: function() {
		var idPrefix = 'info-window-';
		var w = this;

		this.getStatus(function(data) {
			if (!w.refreshing) {
				return;
			}

			$('#info-window-stats td[id]').each(function(idx, el) {
				if (el.id.indexOf(idPrefix) !== 0) {
					return;
				}

				var fieldName = el.id.slice(idPrefix.length).replace(/-/g, '_');
				var transformFunc = w.valueTransformFuncs[fieldName];
				var val = data[fieldName];
				val = transformFunc ? transformFunc(val) : val;


				$(el).text(val);
			});

			window.setTimeout(function() {
				w.refreshData();
			}, 2000);
		});
	}
};

return InfoWindow;
}); // define
