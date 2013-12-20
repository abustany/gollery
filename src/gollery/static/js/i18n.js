define(['jquery'], function($) {

var I18N = {
	setLocale: function(locale) {
		if (!locale) {
			return;
		}

		locale = String(locale).split('-').shift();

		// Messages are in english by default
		if (locale === 'en') {
			return;
		}

		$.getJSON('/i18n/' + locale + '.json', function(data) {
			console.log('Loaded i18n data for locale ' + locale);
			I18N._catalog = data;
			I18N.locale = locale;
			I18N.translateDocument();
		}).fail(function(jqXHR, errorText, error) {
			console.log('Could not load data for locale ' + locale + ': ' + error);
		});
	},

	G: function(str) {
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
	},

	translateDocument: function() {
		var catalog = I18N._catalog;
		var _ = I18N.G;

		var getValue = function(item) {
			switch (item.tagName) {
			case 'INPUT':
				return item.value;
			default:
				return item.textContent.trim();
			}
		};

		var setValue = function(item, val) {
			switch (item.tagName) {
			case 'INPUT':
				item.value = val;
				break;
			default:
				item.innerHTML = '';
				item.appendChild(document.createTextNode(val));
				break;
			}
		}

		var nNodes = 0;

		var translate = function(item) {
			var i18nKey = item.hasAttribute('data-i18n');

			if (i18nKey) {
				setValue(item, _(getValue(item)));
			}

			nNodes++;
			
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

				translate(c[i]);
			}
		};

		translate(document.body);
		console.log('Translation done, walked ' + nNodes + ' DOM nodes');
	},
};

return I18N;

}); // define
