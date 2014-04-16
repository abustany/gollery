module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		compass: {
			options: {
				config: 'src/gollery/static/config.rb',
				basePath: 'src/gollery/static'
			},
			build: {}
		},
		requirejs: {
			options: {
				baseUrl: 'src/gollery/static/js',
				mainConfigFile: 'src/gollery/static/js/main.js',
				name: 'main',
				out: 'src/gollery/static/index.js'
			},
			build: {}
		},
		watch: {
			sass: {
				files: ['src/gollery/static/sass/*'],
				tasks: ['compass']
			},
			js: {
				files: ['src/gollery/static/js/*'],
				tasks: ['requirejs']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['compass', 'requirejs']);
};
