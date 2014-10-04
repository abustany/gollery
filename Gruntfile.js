module.exports = function (grunt) {
	var path = require('path');

	var sourceDir = path.join(__dirname, 'src/gollery/ui');
	var buildDir = path.join(__dirname, 'src/gollery/ui-build');
	var destDir = path.join(__dirname, 'src/gollery/static');

	var src = function(name) {
		return path.join(sourceDir, (name || ''));
	};

	var build = function(name) {
		return path.join(buildDir, (name || ''));
	};

	var dst = function(name) {
		return path.join(destDir, (name || ''));
	};


	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		compass: {
			options: {
				basePath: src(),
				sassDir: src('sass'),
				cssDir: build('css'),
				outputStyle: 'compressed'
			},
			build: {}
		},
		concat: {
			css: {
				src: [build('css/*.css'), dst('vendor/leaflet/leaflet.css')],
				dest: dst('style.css')
			}
		},
		copy: {
			html: {
				expand: true,
				cwd: src(),
				src: ['index.html', 'images/**', 'i18n/**'],
				dest: dst()
			}
		},
		requirejs: {
			options: {
				baseUrl: build('js/ui/typescript'),
				paths: {
					'hammer': dst('vendor/jquery-hammerjs/jquery.hammer'),
					'hammerjs': dst('vendor/hammerjs/hammer'),
					'leaflet-wrapper': dst('vendor/leaflet/leaflet-src'),
					'jquery': dst('vendor/jquery/jquery'),
					'jquery.cookie': dst('vendor/jquery-cookie/jquery.cookie')
				},
				insertRequire: ['main'],
				name: 'main',
				out: dst('index.js'),
				optimize: 'uglify2',
				generateSourceMaps: true,
				preserveLicenseComments: false
			},
			build: {}
		},
		typescript: {
			build: {
				src: src('typescript/*.ts'),
				dest: build('js'),
				options: {
					module: 'amd',
					basePath: 'src/gollery'
				}
			}
		},
		bower: {
			options: {
				targetDir: dst('vendor'),
				cleanup: true,
				layout: 'byComponent'
			},
			install: {
			}
		},
		watch: {
			sass: {
				files: [src('sass/*')],
				tasks: ['compass', 'concat:css']
			},
			js: {
				files: [build('js/**')],
				tasks: ['requirejs']
			},
			typescript: {
				files: [src('typescript/*.ts')],
				tasks: ['typescript']
			},
			html: {
				files: [src('index.html'), src('images/**'), src('i18n/**')],
				tasks: ['copy:html']
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
						'src/gollery/static/stylesheets',
						'src/gollery/static/vendor/leaflet/*.css',
						'src/gollery/static/vendor/requirejs/require.js',
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

	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-bower-task');

	grunt.registerTask('default', ['bower:install', 'compass', 'concat:css', 'typescript', 'requirejs', 'copy:html']);
	grunt.registerTask('package', ['default', 'shell:package']);
};
