module.exports = function(grunt) {
    grunt.initConfig({
        jst : {
            compile : {
                files : {
                    'demo/jst.js' : ['templates/chat-entry.html']
                }
            }
        },

        uglify: {
            options: {
              mangle: false
            },
            master: {
              files: {
                'target/majster.min.js': ['target/majster.js'],
                'target/majster.underscore.min.js': ['target/majster.underscore.js'],
                'target/majster.websockets.min.js': ['target/majster.websockets.js']
              }
            }
        },

        coffee : {
            master : {
                options : {
                    join : true,
                },
                files : {
                    'target/majster.js' : ['src/coffee/utils.coffee', 'src/coffee/majster.coffee', 'src/coffee/functions/*.coffee'],
                    'target/majster.underscore.js' : 'src/coffee/extensions/ui-underscore.coffee',
                    'target/majster.websockets.js' : 'src/coffee/extensions/websockets.coffee',
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-coffee');

    grunt.registerTask('default', ['coffee', 'uglify']);
};