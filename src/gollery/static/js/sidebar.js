define(['jquery'], function($) {

function Sidebar() {
	var sidebar = this;

	$('#sidebar-toggle-button').click(function() {
		sidebar.toggle();
	});

	sidebar.loadAlbums();
}

Sidebar.prototype = {
	toggle: function() {
		$(document.body).toggleClass('sidebar-toggled');
	},

	loadAlbums: function() {
		var sidebar = this;
		var albumList = $('#album-list');

		$.getJSON('/albums/', function(data) {
			data.sort(sidebar.albumCompareFunc);

			$.each(data, function(idx, album) {
				var li = document.createElement('li');
				var a = document.createElement('a');
				a.appendChild(document.createTextNode(album.name));
				a.href = '#browse:' + album.name;
				li.appendChild(a);
				albumList.append(li);
			});
		});
	},

	albumCompareFunc: function(a, b) {
		return a.name.localeCompare(b.name);
	}
};

return Sidebar;

}); // define
