require.config({
  'appDir': '.',
  'baseUrl': '.',
  modules: [{
    name: 'api-explorer'
  }],
  dir: 'dist',
  'paths': {
    'jquery':           'bower_components/jquery/jquery',
    'jsoneditor':       'bower_components/jsoneditor/jsoneditor',
    'url-join':         'bower_components/url-join/lib/url-join',
    'bootstrap':        'bower_components/bootstrap/docs/assets/js/bootstrap-collapse',
    'jquerymd':         'js/jquery.markdown',
    'showdown':         'bower_components/showdown/compressed/showdown'
  },
  'shim': {
    'bootstrap':        [ 'jquery' ]
  }
});


