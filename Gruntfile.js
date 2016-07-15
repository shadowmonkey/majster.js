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
              dest: 'target/master.js',
            },
            'dist-underscore': {
              src: ['src/core.js', 'src/extension/underscore/*.js'],
              dest: 'target/master.underscore.js',
            }
        },

        uglify: {
            options: {
              mangle: false
            },
            master: {
              files: {
                'target/master.min.js': ['target/master.js'],
                'target/master.underscore.min.js': ['target/master.underscore.js']
              }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
};