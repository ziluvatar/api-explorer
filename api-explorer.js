define(function (require) {

  var $ = require('jquery');
  var apiExplorer = require('./js/sdk.apiexplorer');
  var sdkAuth = require('rejs!./templates/sdk_auth');
  var sdk = require('rejs!./templates/sdk');

  return function (settings) {
    settings         = settings         || {};
    settings.el      = settings.el      || $('body');
    settings.isAuth  = settings.isAuth  || false;

    (function (settings) {
      $(function () {
        if (settings.isAuth) {
          sdk         = sdkAuth;
        }

        var s = sdk(settings);
        $(settings.el).append(s);

        $('.tokenme').html(settings.accessToken);

        if (settings.isAuth) {
          apiExplorer.routes['/sdk/auth_api'](settings);
        } else {
          apiExplorer.routes['/sdk/api'](settings);
        }

      });
    }(settings));
  };
});
