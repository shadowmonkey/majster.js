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
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-concat');
};