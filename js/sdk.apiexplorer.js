define(function (require) {

  var $              = require('jquery');
  var urljoin        = require('url-join');

  require('jquerymd');
  require('bootstrap');

  var loadApi = function(settings) {

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

    var populateSelectFromPromise = function (promise, options) {
      promise(options).done(function (list) {
        populateSelect(list, options);
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

    var dinamicListGenerators = [
      [populateSelectFromPromise, findAllConnections, '.connection-selector', '.connection-selector.with-optional'],
      [populateSelectFromPromise, findOnlySocials, '.social_connection-selector', '.social_connection-selector.with-optional'],
      [populateSelectFromPromise, findOnlyStrictEnterpriseEnabled, '.enterprise_connection-selector','.enterprise_connection-selector.with-optional'],
      [populateSelectFromPromise, findOnlyEnterpriseCustomDbEnabled,'.db_connection-selector', '.db_connection-selector.with-optional']
    ];

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

    function getRules(tenantDomain, accessToken, clientID, readOnly) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{name: '{my-rule}'}]);
        }, 0);

        return d.promise();
      }

      return $.ajax({
        url: 'https://' + settings.tenantDomain + '/api/rules',
        headers: {
          Authorization: 'Bearer ' + settings.accessToken
        },
        data:  {client: clientID},
        cache: false
      });
    }

    function loadRules (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      getRules(settings.tenantDomain, settings.accessToken, clientID, settings.readOnly).done(function (rules) {
        populateSelect(rules.map(function (c) { return encodeURIComponent(c.name); }), {selector: $('.rule-selector', target)});
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

      dinamicListGenerators.map(function (listGenerator) {
        if ( settings.readOnly ) {
          var d = $.Deferred();
          setTimeout(function () {
            d.resolve([
              '{connection}'
            ]);
          });
          listGenerator[1] = function () {
            return d.promise();
          };
          loadGenerator.apply(null, listGenerator)(clientID);
        } else {
          loadGenerator.apply(null, listGenerator)(clientID);
        }
      });


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


    function getConnections(tenantDomain, accessToken, clientID, readOnly) {

      if (readOnly) {
        var d = $.Deferred();
        setTimeout(function () {
          d.resolve([{
            name: '{connection-name}',
            strategy: 'auth0'
          }]);
        }, 0);
        return d.promise();
      }

      return  $.ajax({
        url: 'https://' + settings.tenantDomain + '/api/connections',
        headers: {
          Authorization: 'Bearer ' + settings.accessToken
        },
        data: { client: clientID },
        cache: false
      });
    }

    function loadConnections (settings) {
      var clientID = $('select[name="client-list"]', target).val();

      getConnections(settings.tenantDomain, settings.accessToken, clientID, settings.readOnly).done(function (connections) {
        populateSelect(connections.map(function (c) { return c.name; }), {selector: $('.connection-selector', target)});

        // db connections
        var dbConnections = connections.filter(function (c) {
          return c.strategy === 'auth0';
        }).map(function (c) {
          return c.name;
        });

        populateSelect(dbConnections, {selector: $('#dbconn-signup-connection-selector', target)});
        populateSelect(dbConnections, {selector: $('#dbconn-changePassword-connection-selector', target)});
        populateSelect(dbConnections, {selector: $('#api-create-user-connection-selector', target)});
        populateSelect(dbConnections, {selector: $('#api-user-sendverificationemail-selector', target)});
        populateSelect(dbConnections, {selector: $('#dbconn-forgotPassword-connection-selector', target)});
        populateSelect(dbConnections, {selector: $('#api-update-user-password-byemail-connection-selector', target)});

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

      var clientsPromise;

      if (settings.readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{
            clientID: '{client-id}',
            name: '{client-name}',
            clientSecret: '{client-secret}',
            callback: 'http://localhost/callback',
            global: false
          },
          {
            clientID: '{global-client-id}',
            clientSecret: '{global-client-secret}',
            name: '{global-client-name}',
            callback: 'http://localhost/callback',
            global: true
          }
          ]);
        }, 0);

        clientsPromise = d.promise();
      } else {
        clientsPromise = clientsModel.findAll();
      }

      var r = clientsPromise.then(function (result) {
        clients = result;

        var nonGlobalClients = result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.name]; });
        var nonGlobalClientsWithBrackets = result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.clientID + ' (' + c.name + ')']; })
        var globalClient = result.filter(function (c) { return c.global; })[0]; // global client

        populateSelect(nonGlobalClients, {selector: $('select[name="client-list"]', target)});
        populateSelect(nonGlobalClients, {selector: $('select[name="client-list-without-global"]', target)});
        populateSelect(nonGlobalClientsWithBrackets, {selector: $('select[name="client-list-without-global"].with-id', target)});

        $('<option class="global-client" value="' + globalClient.clientID + '">Global Client</option>')
          .appendTo($('select[name="client-list"]', target));

        $('select[name="client-list"] option[value="' + globalClient.clientID + '"]', target)
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

      if (settings.readOnly) {
        var d = $.Deferred();
        d.resolve([{
          user_id: '{user-id}',
          email: '{email}'
        }]);
        return d.promise();
      }

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

        populateSelect(users.map(function(u) { return u.user_id; }), {selector: $('.user-selector', target)});
        populateSelect(users.map(function(u) { return u.email;   }), {selector: $('.user-email-selector', target)});

        $('#update-user-password-byemail-email-selector').change(function () {
          $('#api-update-user-password-byemail-email').val($(this).val());
        });

        $('#update-user-password-byemail-email-selector').trigger('change');
      });
    }

    var staticLists = {
      scopes:         ['openid', 'openid profile'],
      responseTypes:  ['code', 'token'],
      protocols:      ['oauth2', 'wsfed', 'wsfed-rms', 'samlp']
    };

    var staticListGenerators = [
      [populateSelect, staticLists.scopes,       '.scope-selector',        '.scope-selector.with-optional'],
      [populateSelect, staticLists.responseTypes,'.response_type-selector','.response_type-selector.with-optional'],
      [populateSelect, staticLists.protocols,    '.protocol-selector',     '.protocol-selector.with-optional']
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

    function populateSelects(settings) {
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

      if (settings.readOnly) {
        $('select').attr('disabled', 'disabled');
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
      populateSelects(settings);
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
