define(function (require) {

  var showdown   = require("showdown");
  var extensions = require("js/showdown.extensions");
  var $          = require('jquery');

  $.fn.markdown = function (context) {
    context = context || {};

    var extensionsContext = [];

    for(var i in extensions) {
      if (typeof extensions[i] === 'function') {
        extensionsContext.push(extensions[i](context));
      }
    }

    var converter = new showdown.converter({ extensions: extensionsContext});

    this.each(function(){
      var md = $(this).get(0).innerHTML.replace(/&amp;/g, '&');
      $(this).html(converter.makeHtml(md));
    });

    return $(this);
  };

});

