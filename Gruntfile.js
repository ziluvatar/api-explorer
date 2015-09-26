var pkg = require('./package');

var minorVersion = pkg.version.replace(/\.(\d)*$/, '');
var majorVersion = pkg.version.replace(/\.(\d)*\.(\d)*$/, '');
var path = require('path');

function  renameRelease (v) {
  return function (d, f) {
    var dest = path.join(d, f.replace(/(\.min)?\.js$/, '-'+ v + '$1.js'));
    return dest;
  };
}

module.exports = function (grunt) {

  if (!process.env.MYAUTH0_CLIENT_ID || !process.env.MYAUTH0_CLIENT_SECRET) {
    grunt.log.error('Warning: Environment variables MYAUTH0_CLIENT_ID or MYAUTH0_CLIENT_SECRET were not found');
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
        'showdown':         'bower_components/showdown/compressed/Showdown'

      },
      out: 'dist/api-explorer.js'
    }
  };

  var requireJSConfigDev = JSON.parse(JSON.stringify(requireJSConfig));
  requireJSConfigDev.options.optimize = 'none';

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
          clientId:     process.env.MYAUTH0_CLIENT_ID,
          clientSecret: process.env.MYAUTH0_CLIENT_SECRET,
          isAuth:       process.env.AUTH0_AUTH_API || false,
          readOnly:     false
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
    aws_s3: {
      options: {
        key:    process.env.S3_KEY,
        secret: process.env.S3_SECRET,
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION,
        uploadConcurrency: 5,
        access: 'public-read',
        headers: {
          'Cache-Control':  'public, max-age=300'
        }
      },
      clean: {
        del: [
          { src: 'api-explorer/api-explorer.js', },
          { src: 'api-explorer/api-explorer.css', },
        ]
      },
      publish: {
        upload: [
          { src:    'dist/*', dest:   'api-explorer/', gzip: true }
        ]
      }
    },
    http: {
      'purge-js': {
        options: {
          url:    process.env.CDN_ROOT + '/api-explorer/api-explorer.js',
          method: 'DELETE'
        }
      },
      'purge-css': {
        options: {
          url:    process.env.CDN_ROOT + '/api-explorer/api-explorer.css',
          method: 'DELETE'
        }
      }
    }
  });

  grunt.registerTask('build', ['clean', 'template', 'less','requirejs:min']);

  grunt.registerTask('build-dev', ['clean', 'template', 'less','requirejs:dev']);

  grunt.registerTask('default', ['build', 'connect', 'watch']);

  grunt.registerTask('dev', ['build-dev', 'connect:dev', 'watch:dev']);

  grunt.registerTask('purge-cdn', ['http:purge-js', 'http:purge-css']);
  grunt.registerTask('cdn', ['build', 'aws_s3:clean', 'aws_s3:publish', 'purge-cdn']);
};
