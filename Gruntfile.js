module.exports = function(grunt) {
    grunt.initConfig({
        jst : {
            compile : {
                files : {
                    'demo/jst.js' : ['templates/chat-entry.html']
                }
            }
        },

        concat: {
            dist: {
              src: ['src/core.js'],
              dest: 'target/majster.js',
            },
            'dist-underscore': {
              src: ['src/extension/underscore/*.js'],
              dest: 'target/majster.underscore.js',
            }
        },

        uglify: {
            options: {
              mangle: false
            },
            master: {
              files: {
                'target/majster.min.js': ['target/majster.js'],
                'target/majster.underscore.min.js': ['target/majster.underscore.js']
              }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['concat', 'uglify']);
};