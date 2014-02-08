define(function (require) {
  var $ = require('jquery');
  
  /**
   * Ajax wrapper
   * @param {Object} actions: a set of functions or strings with the format
   *   "GET /path/to/endpoint"
   * @param {Object} settings: parameters to use when doing the $.ajax calls
   * @returns {Object} set of functions that makes call to endpoints
   */
  var Model = function (actions, settings) {
    var model = {};

    $.each(actions, function (method, fn) {
      if (typeof fn === 'function') {
        model[method] = fn;
      } else if (typeof fn === 'string') {
        var endpoint = fn.split(' '),
            type = endpoint[0],
            url = endpoint[1];

        model[method] = function (data) {
          var parsedUrl = url,
              tokens = parsedUrl.match(/(:[^(\/|\?)]*)/gi);

          $.each(tokens || [], function (idx, val) {
            var key = val.substr(1),
              deleteToken = false;
            
            if(key[0] === '!'){
              key = key.substr(1);
              deleteToken = true;
            }

            parsedUrl = data[key] ? parsedUrl.replace(val, data[key]) : parsedUrl;
            if (type === 'GET' || deleteToken) delete(data[key]);
          });

          return $.ajax({
            type: type,
            url: 'https://' + settings.tenantDomain + parsedUrl,
            headers: {
              Authorization: 'Bearer ' + settings.accessToken
            },
            dataType: type === 'DELETE' ? null : 'json',
            cache: false,
            contentType: type !== 'GET' ?'application/json' : null,
            data: type === 'GET' ? data : JSON.stringify(data)
          });
        };
      }
    });

    return model;
  };

  return Model;
});
