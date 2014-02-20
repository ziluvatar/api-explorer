define(function (require) {

  require('jquery');
  require('jquerymd');
  require('bootstrap');

  var loadApi = function(settings) {

    var $              = require('jquery');
    var urljoin        = require('url-join');

    var apiItemTemplate           = require('rejs!../templates/sdk.api-method');
    var clientsModel              = require('./models/clients');
    var clientConnectionsModel    = require('./models/client-connections');
    var ApiExecutors              = require('./sdk.ApiExecutors');
    var AuthApiExecutors          = require('./sdk.AuthApiExecutors');

    var usernamePasswordStrategies = ['ad', 'auth0-adldap', 'auth0'];
    var clients = [], selectedClient, target;
    var jsoneditor = require('jsoneditor');

    var withSettings = function (f, settings) {
      return function () {
        f(settings);
      };
    };

    var ie = (function(){
      var undef,
          v = 3,
          div = document.createElement('div'),
          all = div.getElementsByTagName('i');

      while (
          div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
          all[0]
      );

      return v > 4 ? v : undef;
    }());

    var loading = function(settings, l) {
      $('.loading-spin', settings.el).toggle(l);
    };

    var hookJsonTogglers = function () {
      $('pre code button[data-toggle="button"]', target).on('click', function () {
        $(this).html(!$(this).hasClass('active') ? 'true' : 'false');
      }).each(function () {
        $(this).html('false');
      });
    };


    function loadUsers (settings) {
      $.ajax({
        url: 'https://' + settings.tenantDomain + '/api/users',
        headers: {
          Authorization: 'Bearer ' + settings.accessToken
        },
        data: { perPage: 10 }
      }).done(function (users) {
        $('.user-selector').html('');
        $('.user-email-selector').html('');
        $('#sdk-jsoneditor').html('');
        $('#sdk-patch-jsoneditor').html('');

        $.each(users, function (i, u) {
          $('<option value=' + u.user_id + '>' + u.user_id + '</option>')
            .appendTo('.user-selector');
        });

        $.each(users, function (i, u) {
          $('<option value=' + u.email + '>' + u.email + '</option>')
            .appendTo('.user-email-selector');
        });

        $('#update-user-password-byemail-email-selector').change(function () {
          $('#api-update-user-password-byemail-email').val($(this).val());
        });

        $('#update-user-password-byemail-email-selector').trigger('change');

        var options = {
          mode: 'text',
          search: false,
          history: false
        };

        var updateContainer = document.getElementById('sdk-jsoneditor');
        if (updateContainer) {
          // PUT
          var updateEditor = new jsoneditor.JSONEditor(updateContainer, options);
          updateEditor.set({ 'Policy': '1238907654', 'Customer Id': '1234' });
          window.updateJSONEditor = updateEditor;
        }

        var updatePatchContainer = document.getElementById('sdk-patch-jsoneditor');
        // PATCH
        if (updatePatchContainer) {
          var updatePatchEditor = new jsoneditor.JSONEditor(updatePatchContainer, options);
          updatePatchEditor.set({ 'Policy': '1238907654', 'Customer Id': '1234' });
          window.updatePatchJSONEditor = updatePatchEditor;
        }
      });
    }

    function loadConnections (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      $.ajax({
        url: 'https://' + settings.tenantDomain + '/api/connections',
        headers: {
          Authorization: 'Bearer ' + settings.accessToken
        },
        data: { client: clientID },
        cache: false
      }).done(function (connections) {
        // all connections
        $('.connection-selector, .optional-connection-selector', target).html('');

        $.each(connections, function (i, c) {
          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo($('.connection-selector', target));

          $('<option value=' + c.name + '>&connection=' + c.name + '</option>')
            .appendTo($('.optional-connection-selector', target));
        });

        // db connections
        var dbConnections = connections.filter(function (c) {
          return c.strategy === 'auth0';
        });

        $('#dbconn-signup-connection-selector, #dbconn-changePassword-connection-selector, #api-create-user-connection-selector, #api-user-sendverificationemail-selector, #dbconn-forgotPassword-connection-selector, #api-update-user-password-byemail-connection-selector', target).html('');
    
        $.each(dbConnections, function (i, c) {
          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo($('#dbconn-signup-connection-selector', target));

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo($('#dbconn-changePassword-connection-selector', target));

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo($('#api-create-user-connection-selector', target));

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo($('#api-user-sendverificationemail-selector', target));

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo($('#dbconn-forgotPassword-connection-selector', target));

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo($('#api-update-user-password-byemail-connection-selector', target));
        });
      });

      $('.optional-connection-selector', target)
        .prepend('<option value="none"></option>');
    }

    function loadClients (settings) {
      $('select[name="client-list"]', target).html('');

      var r = clientsModel(settings).findAll().then(function (result) {
          clients = result;

          var nonGlobalClients = result.filter(function (c) { return !c.global; }); // ignore global client
          var globalClient = result.filter(function (c) { return c.global; })[0]; // global client

          $.each(nonGlobalClients, function (i, c) {
            $('<option value=' + c.clientID + '>' + (c.name || 'default') + '</option>')
              .appendTo($('select[name="client-list"]', target));
          });

          // [Auth
          $.each(nonGlobalClients, function (i, c) {
            $('<option value=' + c.clientID + '>' + c.clientID + ' (' + c.name + ')</option>')
              .appendTo($('select[name="client-list"].with-id', target));
          });

          // Auth]

          $('<option class="global-client" value=' + globalClient.clientID + '>Global Client</option>')
            .appendTo($('select[name="client-list"]', target));

          $('select[name="client-list"] option[value=' + globalClient.clientID + ']', target)
            .prop('selected', true);

          $('select[name="client-list"]', target)
            .off('change')
            .on('change', withSettings(onClientChanged, settings));

          loading(settings, false);
          target.fadeIn('slow');
      });

      return r;
    }

    function loadRules (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      $('.rule-selector, .optional-rule-selector').html('');

      $.ajax({
        url: 'https://' + settings.tenantDomain + '/api/rules',
        headers: {
          Authorization: 'Bearer ' + settings.accessToken
        },
        data:  {client: clientID},
        cache: false
      }).done(function (rules) {
        $.each(rules, function (i, c) {
          $('<option value=' + encodeURIComponent(c.name) + '>' + encodeURIComponent(c.name) + '</option>')
            .appendTo('.rule-selector');

          $('<option value=' + encodeURIComponent(c.name) + '>&rule=' + encodeURIComponent(c.name) + '</option>')
            .appendTo('.optional-rule-selector');
        });
      });

      $('.optional-rule-selector')
        .prepend('<option value="none"></option>');
    }

    function onClientChanged (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      selectedClient = clients.filter(function (c) {
        return c.clientID === clientID;
      })[0];

      $('.client_namespace', target).html('https://' + settings.tenantDomain + '/');
      $('.client_client_id', target).html(selectedClient.clientID);
      $('.client_callback', target).html(selectedClient.callback);
      $('.client_client_secret', target).html(selectedClient.clientSecret);
      $('.client_name', target).html(selectedClient.name);

      $('input[name="current-client-id"]', target).attr('value', selectedClient.clientID);
      $('input[name="current-client-secret"]', target).attr('value', selectedClient.clientSecret);

      selectedClient.namespace = 'https://' + settings.tenantDomain;
      var executors;

      if (settings.isAuth) {
        executors = new AuthApiExecutors(selectedClient, settings);
      } else {
        executors = new ApiExecutors(selectedClient, settings);
      }


      if (settings.readOnly) {
        $('.btn-tryme', target).attr('disabled', 'disabled');
        $('.btn-tryme', target).addClass('disabled');
        $('select[name="client-list"]', target).attr('disabled', 'disabled');
      } else {
        $('.btn-tryme', target)
          .off('click')
          .on('click', tryMeButton(executors));
      }

      loadAllConnections(settings);
      loadSocialConnections(settings);
      loadDbConnections(settings);
      loadEnterpriseConnections(settings);

      loadConnections(settings);
      loadRules(settings);
      loadUsers(settings);

      ensureClientAccessToken(settings);
    }

    var loadAllConnections = function (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      clientConnectionsModel(settings).findAllEnabled({ client: clientID }).done(function (connections) {
        var selector = $('.connection-selector', target)
        var optionalSelector = $('.connection-selector.with-optional', target);

        selector.html('');
        $('<option value="">(none)</option>')
          .appendTo(optionalSelector);

        $.each(connections, function (i, c) {
          $('<option value="' + c.name + '">' + c.name + '</option>')
              .appendTo(selector);
        });
      });
    };
    
    var loadSocialConnections = function (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      clientConnectionsModel(settings).findOnlySocials({ client: clientID }).done(function (connections) {

        $('.social_connection-selector', target).html('');
        $('<option value="">(none)</option>')
          .appendTo('.social_connection-selector.with-optional', target);

        $.each(connections, function (i, c) {
          if (c.status) {
            $('<option value="' + c.name + '">' + c.name + '</option>')
              .appendTo('.social_connection-selector', target);
          }
        });
      });
    };

    var loadDbConnections = function (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      clientConnectionsModel(settings).findOnlyEnterprise({ client: clientID }).done(function (connections) {
        var selector = $('.db_connection-selector', target);
        var optionalSelector = $('.db_connection-selector.with-optional', target);

        selector.html('');
        $('<option value="">(none)</option>')
          .appendTo(optionalSelector);

        var dbConnections = connections.filter(function (c) {
          return usernamePasswordStrategies.indexOf(c.strategy) > -1;
        });

        $.each(dbConnections, function (i, c) {
          if (c.status) {
            $('<option value="' + c.name + '">' + c.name + '</option>')
              .appendTo(selector);
          }
        });
      });
    };

    var loadEnterpriseConnections = function (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      clientConnectionsModel(settings).findOnlyEnterprise({ client: clientID }).done(function (connections) {
        var selector = $('.enterprise_connection-selector', target);
        var optionalSelector = $('.enterprise_connection-selector.with-optional', target);

        selector.html('');
        $('<option value="">(none)</option>')
          .appendTo(optionalSelector);

        var enterpriseConnections = connections.filter(function (c) {
          return usernamePasswordStrategies.indexOf(c.strategy) < 0;
        });

        $.each(enterpriseConnections, function (i, c) {
          if (c.status) {
            $('<option value="' + c.name + '">' + c.name + '</option>')
              .appendTo(selector);
          }
        });
      });
    };


    var ensureClientAccessToken = function () {
      var url = urljoin(selectedClient.namespace, '/oauth/token');

      $.post(url, {
        client_id:     selectedClient.clientID,
        client_secret: selectedClient.clientSecret,
        type:          'webserver',
        grant_type:    'client_credentials'
      }).done(function (credentials) {
        selectedClient.access_token = credentials ? credentials.access_token : '';
        $('.client_access_token', target).html(selectedClient.access_token);
      });
    };

    var loadScopes = function () {
      var selector = $('.scope-selector', target);
      var optionalSelector = $('.scope-selector.with-optional', target);

      selector.html('');
      $('<option value="">(none)</option>')
        .appendTo(optionalSelector);

      $.each(['openid', 'openid profile'], function (i, c) {
        $('<option value="' + c + '">' + c + '</option>')
          .appendTo(selector);
      });
    };

    var loadResponseTypes = function () {
      var selector = $('.response_type-selector', target);
      var optionalSelector = $('.response_type-selector.with-optional', target);

      selector.html('');
      $('<option value="">(none)</option>')
        .appendTo(optionalSelector);

      $.each(['code', 'token'], function (i, c) {
        $('<option value="' + c + '">' + c + '</option>')
          .appendTo(selector);
      });
    };

    var loadProtocols = function () {
      var selector = $('.protocol-selector', target);
      var optionalSelector = $('.protocol-selector.with-optional', target);

      selector.html('');
      $('<option value="">(none)</option>')
        .appendTo(optionalSelector);

      $.each(['oauth2', 'wsfed', 'wsfed-rms', 'samlp'], function (i, c) {
        $('<option value="' + c + '">' + c + '</option>')
          .appendTo(selector);
      });
    };

    function tryMeButton (executors) {
      return function (e) {
        e.preventDefault();

        var runnerName = $(this).attr('data-runner'),
          resultPanel = $('#' + $(this).attr('data-result'), target);

        var promise = executors[runnerName]();

        if (!promise) return;
        if(!resultPanel) return;

        if (ie < 10) {
          resultPanel.parents('pre').addClass('error');
          resultPanel.html("API Explorer is not supported in Internet Explorer 9 or lower");
          return;
        }

        promise.done(function(result) {
          resultPanel.parents('pre').removeClass('error');

          if (typeof result === 'object') {
            resultPanel.html(JSON.stringify(result, null, 2));
          }
          else {
            resultPanel.html(result);
          }
        }).fail(function(response){
          resultPanel.parents('pre').addClass('error');
          try{
            resultPanel.html(JSON.stringify(JSON.parse(response.responseText), null, 2));
          }catch (e) {
            resultPanel.html(response.responseText);
          }
        });
      };
    }

    function hookStrategySelector() {
      $('.create-connection-strategy-pane').hide();
      $('#create-connection-options-office365').show();

      $('#api-create-connection-strategy-selector').on('change', function () {
        $('.create-connection-strategy-pane').hide();
        var strategy = $('#api-create-connection-strategy-selector option:selected').val();
        $('#create-connection-options-' + strategy).show();
      });
    }

    function renderMarkdown() {
      if (!target.hasClass('converted')){
        var top = $('body').scrollTop();

        $('.markdown', target).each(function() {
          $(this).markdown();

          var path = $(this).data('path');
          if (path) {
            var markdown = $(this).html();
            var verb = $(this).data('verb');
            var desc = $(this).data('description');
            var path2 = $(this).data('path2'); // use for duplicated endpoints (path)
            $(this).html(apiItemTemplate({markdown: markdown, verb: verb, path: path, path2: path2, description: desc}));
          }
        });

        target.addClass('converted');
        $('body').scrollTop(top);
      }

    }

    function populateLists(settings) {
      if (settings.isAuth) {
        loadClients(settings).then(withSettings(onClientChanged, settings));
        loadScopes(settings);
        loadResponseTypes(settings);
        loadProtocols(settings);
      } else {
        loadClients(settings)
          .then(withSettings(onClientChanged, settings))
          .then(withSettings(loadConnections, settings))
          .then(withSettings(loadRules, settings))
          .then(withSettings(loadUsers, settings));
      }
    }


    function renderAndPopulate(settings) {
      renderMarkdown();
      $('input[name="current-client-id"]', target).click(function () {
        this.select();
      });
      $('input[name="current-client-secret"]', target).click(function () {
        this.select();
      });
      populateLists(settings);
      hookStrategySelector();
      hookJsonTogglers();
    }

    function returnAsPromise(l) {
      return function () {
        var deferred = $.Deferred();

        setTimeout(function () {
          deferred.resolve(l);
        }, 0);

        return deferred.promise();
      };
    }



    if (settings.readOnly) {
      var mockClients = [{global: true, clientID: 'GLOBAL_CLIENT_ID' },
          {global: false, clientID: 'APP_CLIENT_ID'}];

      clientsModel              = function () {
        return {
          findAll: returnAsPromise(mockClients),
        };
      };
      clientConnectionsModel    = function () {
        return {
          findAllEnabled: returnAsPromise(mockClients)
        };
      };
    }

    if (settings.isAuth) {
      target = $('#sdk-auth-api-content');
    } else {
      target = $('#sdk-api-content');
    }

    target.hide();

    loading(settings, true);

    var url = urljoin('https://' + settings.tenantDomain, '/oauth/token');
    $.ajax({
      url: url,
      type: 'POST',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      data: {
        client_id:     settings.clientId,
        client_secret: settings.clientSecret,
        grant_type:    'client_credentials'
      }
    })
    .error(function () {
      if (settings.readOnly) {
        renderAndPopulate(settings);
      } else {
        // TODO Log the error
      }
    })
    .success(function (token) {
      settings.accessToken = token.access_token;
      $('.tokenme').html(token.access_token);

      renderAndPopulate(settings);
    });
  };

  var routes;

  routes = {
    '/sdk/auth_api': loadApi,
    '/sdk/api': loadApi
  };

  return {
    routes: routes
  };

});
