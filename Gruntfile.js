module.exports = function (grunt) {

  if (!process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
    grunt.log.error('Warning: Environment variables AUTH0_CLIENT_ID or AUTH0_CLIENT_SECRET were not found');
  }

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


  var filesToWatch = [
    'js/**/*.js',
    'templates/**/*.ejs',
    'less/**/*.less',
    'api-explorer.js',
    'Gruntfile.js',
    'index.jade'
  ];

  var requireJSConfig = {
    options: {
      almond: true,
      baseUrl: '.',
      'shim': {
        'bootstrap':        [ 'jquery' ],
        ejs: {
          exports: 'ejs'
        }
      },
      include: ['api-explorer'],
      generateSourceMaps: true,
      preserveLicenseComments: false,
      optimize: 'uglify2',
      replaceRequireScript: [{
        files: ['dist/index.html'],
        module: 'main',
        modulePath: '/js/api-explorer'
      }],
      paths: {
        'text':             'bower_components/requirejs-text/text',
        'ejs':              'bower_components/ejs/ejs',
        'rejs':             'bower_components/requirejs-ejs/index',

        'jquery':           'js/jquery.wrapper',
        'url-join':         'bower_components/url-join/lib/url-join',
        'bootstrap':        'bower_components/bootstrap/docs/assets/js/bootstrap-collapse',
        'jquerymd':         'vendor/jquery.markdown',
        'showdown':         'bower_components/showdown/compressed/showdown'

      },
      out: 'dist/api-explorer.js'
    }
  };

  var requireJSConfigDev = JSON.parse(JSON.stringify(requireJSConfig));
  requireJSConfigDev.options.options = 'none';

  grunt.initConfig({
    clean: [
      'dist/'
    ],
    watch: {
      min: {
        options: {
          livereload: true
        },
        files: filesToWatch,
        tasks: ['build']
      },
      dev: {
        options: {
          livereload: true
        },
        files: filesToWatch,
        tasks: ['build-dev']
      },
    },
    template: {
      production: {
        src: 'index.jade',
        dest: 'dist/index.html',
        variables: {
          clientId:     process.env.AUTH0_CLIENT_ID,
          clientSecret: process.env.AUTH0_CLIENT_SECRET,
          isAuth:       process.env.AUTH0_AUTH_API || false
        }
      }
    },
    connect: {
      dev: {
        options: {
          port: 8443,
          hostname: '0.0.0.0',
          base: 'dist',
          livereload: true,
          protocol: 'http',
          passphrase: ''
        }
      },
      min: {
        options: {
          port: 8443,
          hostname: '0.0.0.0',
          base: 'dist',
          livereload: true,
          protocol: 'https',
          passphrase: ''
        },
      },
    },
    less: {
      production: {
        options: {
          paths: ['assets/css'],
          cleancss: true,
          customFumctions: {
            'baseLineHeight': function () {
              return '20px';
            }
          }
        },
        files: {
          'dist/api-explorer.css': 'less/api-explorer.less'
        }
      }
    },
    requirejs: {
      dev: requireJSConfigDev,
      min: requireJSConfig
    },
    s3: {
      options: {
        key:    process.env.S3_KEY,
        secret: process.env.S3_SECRET,
        bucket: process.env.S3_BUCKET,
        access: 'public-read',
        headers: {
          'Cache-Control':  'public, max-age=300'
        }
      },
      clean: {
        del: [{
          src: 'api-explorer/hello.txt'
        }],
      },
      publish: {
        upload: [{
          src:    'dist/*',
          dest:   'api-explorer/',
          options: { gzip: true }
        }]
      }
    },
    invalidate_cloudfront: {
      options: {
        key:            process.env.S3_KEY,
        secret:         process.env.S3_SECRET,
        distribution:   process.env.CDN_DISTRIBUTION
      },
      production: {
        files: [{
          expand:   true,
          cwd:      './dist/',
          src:      ['**/*'],
          filter:   'isFile',
          dest:     'api-explorer/'
        }]
      }
    }
  });

  grunt.registerTask('build', ['clean', 'template', 'less','requirejs:min']);
  grunt.registerTask('build-dev', ['clean', 'template', 'less','requirejs:dev']);
  grunt.registerTask('default', ['build', 'connect', 'watch']);
  grunt.registerTask('dev', ['build-dev', 'connect:dev', 'watch:dev']);
  grunt.registerTask('cdn', ['build', 's3:clean', 's3:publish', 'invalidate_cloudfront:production']);
};
