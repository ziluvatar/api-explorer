define(function (require) {

  var $ = require('jquery');
  var apiExplorer = require('./js/sdk.apiexplorer');
  var sdkAuthTemplate = require('rejs!./templates/sdk_auth');
  var sdkTemplate = require('rejs!./templates/sdk');

  return function (settings) {
    settings         = settings         || {};
    settings.el      = settings.el      || $('body');
    settings.isAuth  = settings.isAuth  || false;

    (function (settings) {
      var template;

      $(function () {
        template = settings.isAuth ? sdkAuthTemplate : sdkTemplate;

        var s = template(settings);
        $(settings.el).append(s);

        apiExplorer(settings);

      });
    }(settings));
  };
});
