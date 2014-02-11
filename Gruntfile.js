module.exports = function (grunt) {
  grunt.initConfig({
    s3: {
      options: {
        key:    process.env.S3_KEY,
        secret: process.env.S3_SECRET,
        bucket: process.env.S3_BUCKET,
        access: 'public-read',
        headers: {
          'Cache-Control':  'public, max-age=300',
          'Content-Type':   'application/javascript; charset=UTF-8'
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

  // Loading dependencies
  for (var key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
  }

  grunt.registerTask("cdn", [/*"build", "copy:release", */"s3:clean", "s3:publish", "invalidate_cloudfront:production"]);
};
