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
		uglify: {
			build: {
				files: {
					'src/gollery/static/js/leaflet-0.7.1.min.js': ['src/gollery/static/js/leaflet-0.7.1.js']
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
		},
		shell: {
			package: {
				command: function () {
					var filesToKeep = [
						'gollery',
						'run.sh',
						'src/gollery/app/views',
						'src/gollery/conf/app.conf.dist',
						'src/gollery/conf/routes',
						'src/gollery/static/i18n',
						'src/gollery/static/images',
						'src/gollery/static/index.html',
						'src/gollery/static/index.js',
						'src/gollery/static/index.js.map',
						'src/gollery/static/js/requirejs-?.?.?.js',
						'src/gollery/static/stylesheets',
						'src/github.com/robfig/revel/conf/mime-types.conf',
						'src/github.com/robfig/revel/modules/jobs/conf/routes',
						'src/github.com/robfig/revel/modules/testrunner/conf/routes',
						'src/github.com/robfig/revel/templates'
					];

					return [
						'unset GOPATH',
						'export GOLLERY_INSTALL_REVEL=1',
						'export GOLLERY_VERSION=$(git describe --always --dirty)',
						'source ./env.sh',
						'go get gollery/...',
						'./bin/revel package gollery',
						'mkdir gollery-$GOLLERY_VERSION',
						'tar -C gollery-$GOLLERY_VERSION -xf gollery.tar.gz -- ' + filesToKeep.join(' '),
						'tar cjf gollery-$GOLLERY_VERSION.tar.bz2 gollery-$GOLLERY_VERSION',
						'rm -fr gollery-$GOLLERY_VERSION gollery.tar.gz', // Bundles the whole source folder - not needed
						'echo -e "\\nFinal gollery archive ready in gollery-$GOLLERY_VERSION.tar.bz2"'
					].join('&&');
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['compass', 'uglify', 'typescript', 'requirejs']);
	grunt.registerTask('package', ['default', 'shell:package']);
};
