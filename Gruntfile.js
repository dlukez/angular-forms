module.exports = function (grunt) {
  grunt.initConfig({
    bump: {
      options: {
        files: ['package.json'],
        commitFiles: ['release/', 'package.json'],
        tagName: '%VERSION%',
        push: false
      }
    },

    clean: {
      temp: 'temp',
      release: 'release'
    },

    concat: {
      release: {
        'src': [
          'module.prefix',
          'src/forms.js',
          'temp/form-templates.js',
          'temp/field-templates.js',
          'module.suffix'
        ],
        'dest': 'release/dz-forms.js'
      }
    },

    jshint: {
      release: ['release/dz-forms.js']
    },

    html2js: {
      options: {
        singleModule: true,
        base: 'src/'
      },
      form: {
        options: {
          module: 'dz.forms.templates'
        },
        src: 'src/*.tpl.html',
        dest: 'temp/form-templates.js'
      },
      fields: {
        options: {
          module: 'dz.forms.fields.templates'
        },
        src: 'src/fields/*.tpl.html',
        dest: 'temp/field-templates.js'
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      src: {
      },
      plain: {
        preprocessors: {},
        options: {
          files: [
            'test/lib/*.js',
            'release/dz-forms.js',
            'test/**/*.spec.js'
          ]
        }
      },
      min: {
        preprocessors: {},
        options: {
          files: [
            'test/lib/*.js',
            'release/dz-forms.min.js',
            'test/**/*.spec.js'
          ]
        }
      }
    },

    uglify: {
      options: {
        compress: true,
        sourceMap: true
      },
      release: {
        src: ['release/dz-forms.js'],
        dest: 'release/dz-forms.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', ['clean', 'karma:src', 'html2js', 'concat', 'jshint:release', 'uglify', 'clean:temp', 'karma:plain', 'karma:min']);
  grunt.registerTask('release', ['bump-only', 'default', 'changelog', 'bump-commit']);
};