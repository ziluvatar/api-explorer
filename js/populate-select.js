define(function (require) {

  var $ = require('jquery');

  function isArray(c) {
    return Object.prototype.toString.call(c) === '[object Array]';
  }

  /**
   * Populates a <select>
   *
   * @param   list      elements of the list
   * @param   options   object that must contain 'selector' property with a jQuery
   *                    selector representing where the <select> element is. An additional
   *                    'optionalSelector' property may added which indicates another selector
   *                    to populate with the same list plus a 'none' element.
   */
  var populateSelect = function (list, options) {
    options.selector.html('');

    if (options.optionalSelector) {
      $('<option value="">(none)</option>')
        .appendTo(options.optionalSelector);
    }

    $.each(list, function (i, c) {
      var option = '<option value="' + c + '">' + c + '</option>';
      if( isArray(c) && c.length === 2 ) {
        option = '<option value="' + c[0] + '">' + (c[1] || 'default') + '</option>'
        $()
          .appendTo(options.selector);
      }

      $(option).appendTo(options.selector);
    });
  };

  /**
   * Populates a <select> with the result of a promise
   *
   * @param   promise   promise that will resolve into a list
   * @param   options   object that contains same options as populateSelect
   *
   * @returns a promise that returns when the select gets populated
   */
  var populateSelectFromPromise = function (promise, options) {
    // if it's not a jquery promise execute it an assign its value to itself
    if (!promise.then) {
      promise = promise(options);
    }
    return promise.then(function (list) {
      populateSelect(list, options);
    });
  };

  /**
   * Creates a function that allows parametrization of the data needed to populate a select.
   */
  var loadGeneratorFactory = function (target) {
    return function (f, obj, selector, optionalSelector) {
      return function (clientId) {
        var parent = target;
        if (optionalSelector) {
          optionalSelector = $(optionalSelector, parent);
        }
        f(obj, {selector: $(selector, parent), optionalSelector: optionalSelector, clientId: clientId});
      };
    };
  };

  return {
    populateSelect: populateSelect,
    populateSelectFromPromise: populateSelectFromPromise,
    loadGeneratorFactory: loadGeneratorFactory
  };
});
