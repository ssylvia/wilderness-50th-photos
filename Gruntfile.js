module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),
		advSettings: grunt.file.readYAML('data/advancedSettings.yml'),

		jshint: {
			files: ['source/app/javascript/**/*.js'],
			options: {jshintrc: '.jshintrc'}
		},

		clean: {

			build: ['deploy/app/javascript/*'],
			jsLib: ['deploy/lib'],
			buildTools: ['deploy/resources/buildTools'],
			tempData: ['source/resources/buildTools/data/tempData']

		},

		uglify: {
		},

		concat: {
			options: {
				separator: ';'
			},
			libIE: {
				src: ['source/lib/oldIE/**/*.js'],
				dest: 'deploy/app/javascript/oldIE.min.js'
			}
		},

		copy: {
			map: {
				files: [
					{
						expand: true,
						flatten: true,
						cwd: '',
						src: ['source/lib/**/*.map'],
						dest: 'deploy/app/javascript/'
					}
				]
			}
		},

		requirejs: {
			viewer: {
				options: {
					baseUrl: "source",
					paths: {
						'dojo': 'empty:',
						'esri': 'empty:',
						'dijit': 'empty:',
						'dojox': 'empty:',
						'storymaps': 'app/javascript',
						'lib': 'lib'
					},
					name: 'resources/buildTools/config/ConfigViewer',
					out: 'deploy/app/javascript/<%= advSettings.appIdentifier %>-viewer.min.js'
				}
			}
		},

		compress: {
			user: {
				options: {
					archive: '<%= advSettings.appIdentifier %>.zip'
				},
				files: [
					{
						expand: true,
						src: ['deploy/**','samples/**','Readme.pdf','license.txt'],
						dest: ''
					}
				]
			},
			dev: {
				options: {
					archive: '<%= advSettings.appIdentifier %>_DevloperDownload.zip'
				},
				files: [
					{
						expand: true,
						src: ['source/**','data/**','samples/**','Readme.pdf','license.txt','.gitignore','config.rb','Gemfile','Gruntfile.js','package.json'],
						dest: ''
					}
				]
			}
		},

		convert: {
			options: {
				explicitArray: false
			},
			photos: {
				src: ['source/resources/buildTools/data/photos.csv'],
				dest: 'source/resources/buildTools/data/tempData/photos.json'
			},
			wildernessText: {
				src: ['source/resources/buildTools/data/wildernessDescription.csv'],
				dest: 'source/resources/buildTools/data/tempData/wildernessDescriptions.json'
			}
		},

		exec: {
			json2amd: {
				cmd: 'node source/resources/buildTools/data/json2amd.js'
			}
		}

	});

	// Load plugins.
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-convert');
	grunt.loadNpmTasks('grunt-exec');

	// Default task(s).
	grunt.registerTask('default', [

		//Update Data
		'convert',
		'exec',
		'clean:tempData',

		'jshint',
		'clean:build',

		// Concat external libraries
		'concat:libIE',

		/*
		* Minify project JS using require.js
		* - require.js output a .js for with only the viewer and a .js with viewer and builder
		* - concat those .js with lib's JS
		* - perform production mode replacement in JS files
		*/
		'requirejs',
		'copy',
		'clean:jsLib',
		'clean:buildTools',

		// Zip downloads
		// 'compress'

	]);

	grunt.registerTask('updateData', [
		'convert',
		'exec',
		'clean:tempData'
	]);

};