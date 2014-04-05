module.exports = function(grunt) {

	// configure the tasks
	grunt.initConfig({

		copy: {
			build: {
				cwd: 'src',
				src: [ 'css/*.css', 'js/*.js' ],
				dest: 'build',
				expand: true
			},
		},

		clean: {
			build: {
				src: [ 'build' ]
			},
			stylesheets: {
				src: [ 'build/**/*.css' ]
			},
			scripts: {
				src: [ 'build/**/*.js' ]
			},
		},

	});

	// load the tasks
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask(
	                   'build', 
	                   'Compiles all of the assets and copies the files to the build directory.', 
	                   [ 'clean:build', 'copy' ]
	                   );
};