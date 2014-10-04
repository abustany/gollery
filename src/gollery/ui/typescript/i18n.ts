import $ = require('jquery');

class I18N {
	private static locale = 'en';
	private static _catalog: Object;

	static setLocale(locale: string): void {
		if (!locale) {
			return;
		}

		locale = String(locale).split('-').shift();

		// Messages are in english by default
		if (locale === 'en') {
			I18N.locale = 'en';
			return;
		}

		$.getJSON('/i18n/' + locale + '.json', (data) => {
			console.log('Loaded i18n data for locale ' + locale);
			I18N._catalog = data;
			I18N.locale = locale;
			I18N.translateDocument();
		}).fail((jqXHR, errorText, error) => {
			console.log('Could not load data for locale ' + locale + ': ' + error);
		});
	}

	static G(str: string): string {
		if (I18N._catalog === undefined) {
			if (I18N.locale !== 'en') {
				console.log('Locale catalog hasn\'t been loaded yet');
			}

			return str;
		}

		var t = I18N._catalog[str];

		if (t === undefined) {
			console.log('Missing translation for string \'' + str + '\' in locale ' + I18N.locale);
			return str;
		}

		return t;
	}

	private static getElementValue(item: HTMLElement): string {
		switch (item.tagName) {
		case 'INPUT':
			return (<HTMLInputElement>item).value;
		default:
			return item.textContent.trim();
		}
	}

	private static setElementValue(item: HTMLElement, val: string): void {
		switch (item.tagName) {
		case 'INPUT':
		(<HTMLInputElement>item).value = val;
			break;
		default:
			item.innerHTML = '';
			item.appendChild(document.createTextNode(val));
			break;
		}
	}

	private static translateElement(item: HTMLElement): void {
		var _ = I18N.G;
		var i18nKey = item.hasAttribute('data-i18n');

		if (i18nKey) {
			I18N.setElementValue(item, _(I18N.getElementValue(item)));
		}

		if (!item.children) {
			return;
		}

		var c = item.children;

		for (var i = 0; i < c.length; ++i) {
			var x = c[i];

			// Only consider Element DOM nodes
			if (x.nodeType != 1) {
				continue;
			}

			I18N.translateElement(<HTMLElement>c[i]);
		}
	}

	static translateDocument(): void {
		I18N.translateElement(document.body);
		console.log('Translation done');
	}
}

export = I18N;
