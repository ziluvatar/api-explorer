define(function (require) {

  require('jquery');
  require('jquerymd');
  require('bootstrap');

  var loadApi = function(settings) {

    var $              = require('jquery');
    var urljoin        = require('url-join');

    var apiItemTemplate           = require('templates/sdk.api-method');
    var clientsModel              = require('js/models/clients');
    var clientConnectionsModel    = require('js/models/client-connections');
    var ApiExecutors              = require('js/sdk.ApiExecutors');
    var AuthApiExecutors          = require('js/sdk.AuthApiExecutors');

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
        $('#sdk-jsoneditor').html('');
        $('#sdk-patch-jsoneditor').html('');
        $('#sdk-create-jsoneditor').html('');

        $.each(users, function (i, u) {
          $('<option value=' + u.user_id + '>' + u.user_id + '</option>')
            .appendTo('.user-selector');
        });

        var options = {
          mode: 'text',
          search: false,
          history: false
        };

        // POST
        var createContainer = document.getElementById("sdk-create-jsoneditor");
        if (createContainer) {
          var createEditor = new jsoneditor.JSONEditor(createContainer, options);
          createEditor.set({ 'vip': true, 'birthdate': new Date(1980, 11, 23) });
          window.createJSONEditor = createEditor;

          // workaround to show extra attributes (metadata)
          var tmpVal = $('#sdk-create-jsoneditor textarea').val();
          $('#sdk-create-jsoneditor textarea').val(
            $.trim(tmpVal.replace(/[\{\}]/g,'').replace(/ +?/g, '')));
        }

        var updateContainer = document.getElementById("sdk-jsoneditor");
        if (updateContainer) {
          // PUT
          var updateEditor = new jsoneditor.JSONEditor(updateContainer, options);
          updateEditor.set({ 'Policy': '1238907654', 'Customer Id': '1234' });
          window.updateJSONEditor = updateEditor;
        }

        var updatePatchContainer = document.getElementById("sdk-patch-jsoneditor");
        // PATCH
        if (updatePatchContainer) {
          var updatePatchEditor = new jsoneditor.JSONEditor(updatePatchContainer, options);
          updatePatchEditor.set({ 'Policy': '1238907654', 'Customer Id': '1234' });
          window.updatePatchJSONEditor = updatePatchEditor;
        }
      });
    }

    function loadConnections (settings) {
      var clientID = $('.client-selector', target).val();

      $.ajax({
        url: 'https://' + settings.tenantDomain + '/api/connections',
        headers: {
          Authorization: 'Bearer ' + settings.accessToken
        },
        data: { client: clientID },
        cache: false
      }).done(function (connections) {
        // all connections
        $('.connection-selector, .optional-connection-selector').html('');

        $.each(connections, function (i, c) {
          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo('.connection-selector');

          $('<option value=' + c.name + '>&connection=' + c.name + '</option>')
            .appendTo('.optional-connection-selector');
        });

        // db connections
        var dbConnections = connections.filter(function (c) {
          return c.strategy === 'auth0';
        });

        $('#dbconn-signup-connection-selector, #dbconn-changePassword-connection-selector, #api-create-user-connection-selector, #api-user-sendverificationemail-selector, #dbconn-forgotPassword-connection-selector').html('');
    
        $.each(dbConnections, function (i, c) {
          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo('#dbconn-signup-connection-selector');

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo('#dbconn-changePassword-connection-selector');

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo('#api-create-user-connection-selector');

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo('#api-user-sendverificationemail-selector');

          $('<option value=' + c.name + '>' + c.name + '</option>')
            .appendTo('#dbconn-forgotPassword-connection-selector');
        });
      });

      $('.optional-connection-selector')
        .prepend('<option value="none"></option>');
    }

    function loadClients (settings) {
      $('.client-selector', target).html('');

      var r = clientsModel(settings).findAll().done(function (result) {
        clients = result;

        var nonGlobalClients = result.filter(function (c) { return !c.global; }); // ignore global client
        var globalClient = result.filter(function (c) { return c.global; })[0]; // global client

        $.each(nonGlobalClients, function (i, c) {
          $('<option value=' + c.clientID + '>' + (c.name || 'default') + '</option>')
            .appendTo($('.client-selector', target));
        });

        // [Auth
        $.each(nonGlobalClients, function (i, c) {
          $('<option value=' + c.clientID + '>' + c.clientID + ' (' + c.name + ')</option>')
            .appendTo($('.client-selector.with-id', target));
        });

        // Auth]

        $('<option class="global-client" value=' + globalClient.clientID + '>Global Client</option>')
          .appendTo($('.client-selector', target));

        $('.client-selector option[value=' + globalClient.clientID + ']', target)
          .prop('selected', true);

        $('.client-selector', target)
          .off('change')
          .on('change', withSettings(onClientChanged, settings));
      });

      return r;
    }

    function loadRules (settings) {
      var clientID = $('.client-selector', target).val();

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
      var clientID = $('.client-selector', target).val();
      selectedClient = clients.filter(function (c) {
        return c.clientID === clientID;
      })[0];

      $('.client_namespace', target).html('https://' + settings.tenantDomain + '/');
      $('.client_client_id', target).html(selectedClient.clientID);
      $('.client_callback', target).html(selectedClient.callback);
      $('.client_client_secret', target).html(selectedClient.clientSecret);
      $('.client_name', target).html(selectedClient.name);

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
        $('.client-selector', target).attr('disabled', 'disabled');
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
      var clientID = $('.client-selector', target).val();

      clientConnectionsModel(settings).findAllEnabled({ client: clientID }).done(function (connections) {

        $('.connection-selector', target).html('');
        $('<option value="">(none)</option>')
          .appendTo('.connection-selector.with-optional', target);

        $.each(connections, function (i, c) {
          $('<option value="' + c.name + '">' + c.name + '</option>')
              .appendTo('.connection-selector', target);
        });
      });
    };
    
    var loadSocialConnections = function (settings) {
      var clientID = $('.client-selector', target).val();

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
      var clientID = $('.client-selector', target).val();

      clientConnectionsModel(settings).findOnlyEnterprise({ client: clientID }).done(function (connections) {

        $('.db_connection-selector', target).html('');
        $('<option value="">(none)</option>')
          .appendTo('.db_connection-selector.with-optional', target);

        var dbConnections = connections.filter(function (c) {
          return usernamePasswordStrategies.indexOf(c.strategy) > -1;
        });

        $.each(dbConnections, function (i, c) {
          if (c.status) {
            $('<option value="' + c.name + '">' + c.name + '</option>')
              .appendTo('.db_connection-selector', target);
          }
        });
      });
    };

    var loadEnterpriseConnections = function (settings) {
      var clientID = $('.client-selector', target).val();

      clientConnectionsModel(settings).findOnlyEnterprise({ client: clientID }).done(function (connections) {

        $('.enterprise_connection-selector', target).html('');
        $('<option value="">(none)</option>')
          .appendTo('.enterprise_connection-selector.with-optional', target);

        var enterpriseConnections = connections.filter(function (c) {
          return usernamePasswordStrategies.indexOf(c.strategy) < 0;
        });

        $.each(enterpriseConnections, function (i, c) {
          if (c.status) {
            $('<option value="' + c.name + '">' + c.name + '</option>')
              .appendTo('.enterprise_connection-selector', target);
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
      $('.scope-selector', target).html('');
      $('<option value="">(none)</option>')
        .appendTo('.scope-selector.with-optional', target);

      $.each(['openid', 'openid profile'], function (i, c) {
        $('<option value="' + c + '">' + c + '</option>')
          .appendTo('.scope-selector', target);
      });
    };

    var loadResponseTypes = function () {
      $('.response_type-selector', target).html('');
      $('<option value="">(none)</option>')
        .appendTo('.response_type-selector.with-optional', target);

      $.each(['code', 'token'], function (i, c) {
        $('<option value="' + c + '">' + c + '</option>')
          .appendTo('.response_type-selector', target);
      });
    };

    var loadProtocols = function () {
      $('.protocol-selector', target).html('');
      $('<option value="">(none)</option>')
        .appendTo('.protocol-selector.with-optional', target);

      $.each(['oauth2', 'wsfed', 'wsfed-rms', 'samlp'], function (i, c) {
        $('<option value="' + c + '">' + c + '</option>')
          .appendTo('.protocol-selector', target);
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
      populateLists(settings);
      hookStrategySelector();
      hookJsonTogglers();
      loading(settings, false);
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


    loading(settings, true);

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
