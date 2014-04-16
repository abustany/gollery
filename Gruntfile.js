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
				out: 'src/gollery/static/index.js',
				optimize: 'uglify2',
				generateSourceMaps: true,
				preserveLicenseComments: false
			},
			build: {}
		},
		typescript: {
			build: {
				src: ['src/gollery/static/typescript/*.ts'],
				dest: 'src/gollery/static/js',
				options: {
					module: 'amd',
					basePath: 'src/gollery/static/typescript'
				}
			}
		},
		watch: {
			sass: {
				files: ['src/gollery/static/sass/*'],
				tasks: ['compass']
			},
			js: {
				files: ['src/gollery/static/js/*'],
				tasks: ['requirejs']
			},
			typescript: {
				files: ['src/gollery/static/typescript/*.ts'],
				tasks: ['typescript']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['compass', 'typescript', 'requirejs']);
};
