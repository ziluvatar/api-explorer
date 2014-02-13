var fs     =  require('fs');
var mkdirp =  require('mkdirp');
var ejs    =  require('ejs');
var path   =  require('path');
var ejsamd =  require('ejs-amd');
var async  =  require('async');

// Inspired by ejs-amd npm module :)

function renderFile(grunt, settings, fromPath, toPath, callback) {
  fs.readFile(fromPath, 'utf8', function(err, str){
    if (err) { throw err; }

    var options = {
      client: true,
      filename: fromPath,
      compileDebug: settings.compileDebug === true
    };

    if (typeof settings.open === 'string'){
      options.open = settings.open;
    }

    if (typeof settings.close === 'string'){
      options.close = settings.close;
    }

    var fn = ejs.compile(str, options).toString();
    var dir = path.resolve(path.dirname(toPath));

    mkdirp(dir, 0755, function(err){
      if (err) { return callback(err); }
      var amdOutput = ejsamd.wrapAmd(fn);
      fs.writeFile(toPath, amdOutput, function(err){
        if (err) { return callback(err); }
        grunt.log.writeln('  \033[90mejs -> AMD js: \033[36m%s\033[0m', toPath);
        callback();
      });
    });
  });
}

module.exports = function (grunt) {
  grunt.registerMultiTask('ejs2amd', 'convert ejs template to amd compatible js.', function () {

    var done = this.async();

    var filesToRender = [];

    this.files.forEach(function (file) {
      file.src.forEach(function (f) {
        var suffixRe = /\.ejs$/;
        if ( suffixRe.test(f) ) {
          var toPath = path.resolve('.', file.dest, path.basename(f, '.ejs') + '.js');
          filesToRender.push((function (grunt, opts, from, to) {
            return function (callback) {
              renderFile(grunt, opts, from, to, callback);
            };
          })(grunt, {}, f, toPath));
        }
      });
    });

    async.parallel(filesToRender, function (err) {
      done(!err);
    });

    grunt.log.ok('ejs2amd finished');
  });
};
