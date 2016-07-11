module.exports = function(grunt) {
    grunt.initConfig({
        jst : {
            compile : {
                files : {
                    'demo/jst.js' : ['templates/chat-entry.html']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jst');
};