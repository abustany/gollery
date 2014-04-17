import $ = require('jquery');
import I18N = require('i18n');

class LoadingScreen {
	private static loading: number = 0;
	private static $screen: JQuery;
	private static $label: JQuery;

	private static init = (() => {
		LoadingScreen.$screen = $('#loading-screen');
		LoadingScreen.$screen.css('display', 'none');
		LoadingScreen.$screen.on('transitionend', () => {
			LoadingScreen.$screen.css('display', parseInt(LoadingScreen.$screen.css('opacity')) == 0 ? 'none' : 'table');
		});

		LoadingScreen.$label = $('#loading-screen > div');
	})();

	static push(): void {
		if (++LoadingScreen.loading == 1) {
			LoadingScreen.$screen.css('display', 'table');
			LoadingScreen.$screen.addClass('loading');
		}

		LoadingScreen.updateLabel();
	}

	static pop(): void {
		if (--LoadingScreen.loading === 0) {
			LoadingScreen.$screen.removeClass('loading');
		}

		LoadingScreen.updateLabel();
	}

	static updateLabel(): void {
		var label = I18N.G('Loading (%1 left)').replace('%1', '' + LoadingScreen.loading);
		LoadingScreen.$label.text(label);
	}
}

export = LoadingScreen;
