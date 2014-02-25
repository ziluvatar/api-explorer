define(function (require) {

  var jsoneditor = require('jsoneditor');
  var $          = require('jquery');

  function update(target) {
    var options = {
      mode: 'text',
      search: false,
      history: false
    };

    var el = $('.sdk-jsoneditor', target);

    el.html('');
    if (el[0]) {
      // PUT
      var updateEditor = new jsoneditor.JSONEditor(el[0], options);
      updateEditor.set({ 'Policy': '1238907654', 'Customer Id': '1234' });
      window.updateJSONEditor = updateEditor;
    }

    el = $('.sdk-patch-jsoneditor', target);

    el.html('');
    // PATCH
    if (el[0]) {
      var updatePatchEditor = new jsoneditor.JSONEditor(el[0], options);
      updatePatchEditor.set({ 'Policy': '1238907654', 'Customer Id': '1234' });
      window.updatePatchJSONEditor = updatePatchEditor;
    }
  }

  return {
    update: update
  };

});
