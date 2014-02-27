define(function (require) {

  require('jquerymd');
  require('bootstrap');

  var loadApi = function(settings) {
    var $              = require('jquery');
    var urljoin        = require('url-join');

    var apiItemTemplate           = require('rejs!../templates/sdk.api-method');
    var ApiExecutors              = require('./sdk.ApiExecutors');
    var AuthApiExecutors          = require('./sdk.AuthApiExecutors');

    var models                    = require('./model-factory')(settings.readOnly);

    var tenantDomainPromise       = $.Deferred();
    var accessTokenPromise        = $.Deferred();

    var clientsModel            = models.clientsModel(tenantDomainPromise, accessTokenPromise);
    var clientConnectionsModel  = models.clientConnectionsModel(tenantDomainPromise, accessTokenPromise);

    var tryMeButton             = require('./try');

    var clients = [], selectedClient, target;

    var withSettings = function (f, settings) {
      return function () {
        f(settings);
      };
    };

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
        });
      });
    }

    function onClientChanged (settings) {
      var clientID;
      if (settings.isAuth) {
        clientID = $('.client-selector select[name="client-list-without-global"]', target).val();
      } else {
        clientID = $('.client-selector select[name="client-list"]', target).val();
      }

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
        accessTokenPromise.then(function (accessToken) {
          executors = new AuthApiExecutors(selectedClient, accessToken);
        });
      } else {
        executors = new ApiExecutors(selectedClient);
      }

      if (settings.readOnly) {
        $('select[name="client-list"]', target).attr('disabled', 'disabled');
      }

      tryMeButton(settings.readOnly, target, executors);

      loadAllConnections(clientID);
      loadSocialConnections(clientID);
      loadDbConnections(clientID);
      loadEnterpriseConnections(clientID);


      loadConnections(settings);
      loadRules(settings);
      loadUsers(settings);

      ensureClientAccessToken(settings);
    }

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

    /**
     * Populates a <select>
     *
     * @param   list      elements of the list
     * @param   options   object that must contain 'selector' property with a jQuery
     *                    selector representing where the <select> element is. An additional
     *                    'optionalSelector' property may added which indicates another selector
     *                    to populate with the same list plus a 'none' element.
     */
    var populateList = function (list, options) {
      options.selector.html('');

      if (options.optionalSelector) {
        $('<option value="">(none)</option>')
          .appendTo(options.optionalSelector);
      }

      $.each(list, function (i, c) {
        //is c an array?
        if( Object.prototype.toString.call(c) === '[object Array]' && c.length === 2 ) {
          $('<option value="' + c[0] + '">' + (c[1] || 'default') + '</option>')
            .appendTo(options.selector);
        } else {
          $('<option value="' + c + '">' + c + '</option>')
            .appendTo(options.selector);
        }
      });
    };

    var loadFromPromise = function (promise, options) {
      promise(options).done(function (list) {
        populateList(list, options);
      });
    };

    var loadGenerator = function (f, obj, selector, optionalSelector) {
      return function (clientId) {
        var parent = target;
        if (optionalSelector) {
          optionalSelector = $(optionalSelector, parent);
        }
        f(obj, {selector: $(selector, parent), optionalSelector: optionalSelector, clientId: clientId});
      };
    };

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
        populateList(connections.map(function (c) { return c.name; }), {selector: $('.connection-selector', target)});

        // db connections
        var dbConnections = connections.filter(function (c) {
          return c.strategy === 'auth0';
        }).map(function (c) {
          return c.name;
        });

        populateList(dbConnections, {selector: $('#dbconn-signup-connection-selector', target)});
        populateList(dbConnections, {selector: $('#dbconn-changePassword-connection-selector', target)});
        populateList(dbConnections, {selector: $('#api-create-user-connection-selector', target)});
        populateList(dbConnections, {selector: $('#api-user-sendverificationemail-selector', target)});
        populateList(dbConnections, {selector: $('#dbconn-forgotPassword-connection-selector', target)});
        populateList(dbConnections, {selector: $('#api-update-user-password-byemail-connection-selector', target)});

      });

      $('.optional-connection-selector', target)
        .prepend('<option value="none"></option>');
    }

    function loadClients (settings) {
      if (settings.isAuth) {
        $('select[name="client-list-without-global"]', target).html('');
      } else {
        $('select[name="client-list"]', target).html('');
      }

      var r = clientsModel.findAll().then(function (result) {
        clients = result;

        populateList(result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.name]; }), {selector: $('select[name="client-list"]', target)});

        populateList(result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.name]; }), {selector: $('select[name="client-list-without-global"]', target)});

        populateList(result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.clientID + ' (' + c.name + ')']; }), {selector: $('select[name="client-list-without-global"].with-id', target)});

        var globalClient = result.filter(function (c) { return c.global; })[0]; // global client
        $('<option class="global-client" value=' + globalClient.clientID + '>Global Client</option>')
          .appendTo($('select[name="client-list"]', target));

        $('select[name="client-list"] option[value=' + globalClient.clientID + ']', target)
          .prop('selected', true);

        $('select[name="client-list-without-global"]', target)
          .off('change')
          .on('change', withSettings(onClientChanged, settings));

        $('select[name="client-list"]', target)
          .off('change')
          .on('change', withSettings(onClientChanged, settings));

      });

      return r;
    }

    function findAllUsers(settings) {
      return $.ajax({
        url: 'https://' + settings.tenantDomain + '/api/users',
        headers: {
          Authorization: 'Bearer ' + settings.accessToken
        },
        data: { perPage: 10 }
      });
    }

    function loadUsers (settings) {
      findAllUsers(settings).done(function (users) {

        populateList(users.map(function(u) { return u.user_id; }), {selector: $('.user-selector', target)});
        populateList(users.map(function(u) { return u.email;   }), {selector: $('.user-email-selector', target)});

        $('#update-user-password-byemail-email-selector').change(function () {
          $('#api-update-user-password-byemail-email').val($(this).val());
        });

        $('#update-user-password-byemail-email-selector').trigger('change');

      });
    }

    function findAllConnections(clientID) {
      return clientConnectionsModel.findAllEnabled({ client: clientID }).then(function (connections) {
        return connections.map(function (c) { return c.name; });
      });
    }

    function findOnlySocials(clientID) {
      return clientConnectionsModel.findOnlySocials({ client: clientID }).then(function (connections) {
        return connections
          .filter(function (c) { return c.status; })
          .map(function (c) { return c.name; });
      });
    }

    function findOnlyStrictEnterpriseEnabled(clientID) {
      return clientConnectionsModel.findOnlyStrictEnterpriseEnabled({ client: clientID })
        .then(function (connections) {
        return connections.map(function (e) {
          return e.name;
        });
      });
    }

    function findOnlyEnterpriseCustomDbEnabled(clientID) {
      return clientConnectionsModel.findOnlyEnterpriseCustomDbEnabled({ client: clientID })
        .then(function (connections) {
        return connections.map(function (e) {
          return e.name;
        });
      });
    }

    var loadAllConnections = loadGenerator(loadFromPromise, findAllConnections, '.connection-selector', '.connection-selector.with-optional');

    var loadSocialConnections = loadGenerator(loadFromPromise, findOnlySocials, '.social_connection-selector', '.social_connection-selector.with-optional');

    var loadEnterpriseConnections = loadGenerator(loadFromPromise, findOnlyStrictEnterpriseEnabled, '.enterprise_connection-selector','.enterprise_connection-selector.with-optional');

    var loadDbConnections = loadGenerator(loadFromPromise, findOnlyEnterpriseCustomDbEnabled,'.db_connection-selector', '.db_connection-selector.with-optional');

    var staticLists = {
      scopes:         ['openid', 'openid profile'],
      responseTypes:  ['code', 'token'],
      protocols:      ['oauth2', 'wsfed', 'wsfed-rms', 'samlp']
    };

    var staticListGenerators = [
      [populateList, staticLists.scopes,       '.scope-selector',        '.scope-selector.with-optional'],
      [populateList, staticLists.responseTypes,'.response_type-selector','.response_type-selector.with-optional'],
      [populateList, staticLists.protocols,    '.protocol-selector',     '.protocol-selector.with-optional']
    ];


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
            $(this).html(apiItemTemplate({
              markdown: markdown,
              verb: verb,
              path: path,
              path2: path2,
              description: desc
            }));
          }
        });

        target.addClass('converted');
        $('body').scrollTop(top);
      }

    }

    function populateLists(settings) {
      if (settings.isAuth) {
        loadClients(settings)
        .then(function () {loading(settings, false); })
        .then(function () { target.animate({opacity: 1}, 'slow'); })
        .then(withSettings(onClientChanged, settings));
        staticListGenerators.map(function (listGenerator) {
          loadGenerator.apply(null, listGenerator)(settings);
        });
      } else {
        loadClients(settings)
          .then(function () {loading(settings, false); })
          .then(function () { target.animate({opacity: 1}, 'slow'); })
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

      if (!settings.anchors) {
        $('a.header-anchor').hide();
      }
    }

    if (settings.isAuth) {
      target = $('#sdk-auth-api-content');
    } else {
      target = $('#sdk-api-content');
    }

    target.css('opacity', 0);
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
      accessTokenPromise.resolve(token.access_token);
      tenantDomainPromise.resolve(settings.tenantDomain);
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
