define(function (require) {
  require('jquerymd');
  require('bootstrap');

  var $              = require('jquery');
  var urljoin        = require('url-join');

  var populateSelect            = require('./populate-select').populateSelect;
  var populateSelectFromPromise = require('./populate-select').populateSelectFromPromise;
  var loadGeneratorFactory      = require('./populate-select').loadGeneratorFactory;

  var ApiExecutors              = require('./sdk.ApiExecutors');
  var AuthApiExecutors          = require('./sdk.AuthApiExecutors');

  var tryMeButton               = require('./try');
  var scrollToAnchors           = require('./scroll-to-anchors');

  var logsSelects               = require('./models/logs-selects');
  var selectModels              = require('./models/select-models');
  
  var getRules;
  var getLogs;
  var getConnections;
  var getClients;
  var findAllUsers;
  var findAllUsersById;
  var findAllUsersByMail;
  var getDbConnections;
  var getConnectionsByName;
  var findAllConnections;
  var findOnlySocials;
  var findOnlyStrictEnterpriseEnabled;
  var findOnlyEnterpriseCustomDbEnabled;

  var apiItemTemplate           = require('rejs!../templates/sdk.api-method');

  var tenantDomainPromise       = $.Deferred();
  var accessTokenPromise        = $.Deferred();

  var staticLists = {
    scopes:         ['openid', 'openid profile'],
    responseTypes:  ['code', 'token'],
    protocols:      ['oauth2', 'wsfed', 'wsfed-rms', 'samlp']
  };

  var staticListGenerators = [
    [populateSelect, staticLists.scopes,       '.scope-selector',        '.scope-selector.with-optional'],
    [populateSelect, staticLists.responseTypes,'.response_type-selector','.response_type-selector.with-optional'],
    [populateSelect, staticLists.protocols,    '.protocol-selector',     '.protocol-selector.with-optional'],
    [ populateSelect,  logsSelects.pages,  '.logs-page-selector' ],
    [ populateSelect,  logsSelects.items,  '.logs-per-page-selector' ],
    [ populateSelect,  logsSelects.fields,  '#logs-get-field-selector' ],
    [ populateSelect, logsSelects.directions,  '#logs-get-sort-direction-selector' ],
    [ populateSelect, logsSelects.exclude_fields,  '#logs-get-exclude-fields-selector' ],
  ];

  function hookStrategySelector(target) {
      var strategyPane = $('.create-connection-strategy-pane', target);
      var strategySelector = $('#api-create-connection-strategy-selector', target);
      strategyPane.hide();
      $('#create-connection-options-office365', target).show();

      strategySelector.on('change', function () {
        strategyPane.hide();
        var strategy = $('option:selected', strategySelector).val();
        $('#create-connection-options-' + strategy, target).show();
      });
    }
    
  function renderApiMethods(target) {
    if (!target.hasClass('converted')){

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
    }
  }

  function getSelectedClient(target, clients) {
    var clientID;

    clientID = $('.client-selector select[name="client-list"]', target).val();

    if (!clientID) {
      clientID = $('.client-selector select[name="client-list-without-global"]', target).val();
    }

    var selectedClient = clients.filter(function (c) { return c.clientID === clientID; })[0];

    return selectedClient;
  }

  function renderClientSecret(clientSecret, target) {
    var currentClientSecret = $('input[name="current-client-secret"]', target);
    currentClientSecret.addClass('secret btn btn-primary');
    currentClientSecret.attr('value', 'Click to show');
    currentClientSecret.off('click.secret');
    currentClientSecret.on('click.secret', function (e) {
      e.preventDefault();
      currentClientSecret.attr('value', clientSecret);
      currentClientSecret.off('click.secret');
      currentClientSecret.removeClass('secret btn btn-primary');
      return false;
    });

  }
    
  function onClientChanged (tenantDomain, isAuth, readOnly, target, selectedClient) {
    $('.client_namespace', target).html('https://' + tenantDomain + '/');
    $('.client_client_id', target).html(selectedClient.clientID);
    $('.client_callback', target).html(selectedClient.callback);
    $('.client_client_secret', target).html(selectedClient.clientSecret);
    $('.client_name', target).html(selectedClient.name);

    $('input[name="current-client-id"]', target).attr('value', selectedClient.clientID);

    renderClientSecret(selectedClient.clientSecret, target);

    selectedClient.namespace = 'https://' + tenantDomain;
    var executors;

    if (isAuth) {
      accessTokenPromise.then(function (accessToken) {
        $('.global_client_access_token').text(accessToken);
        executors = new AuthApiExecutors(selectedClient, accessToken);
      });
    } else {
      executors = new ApiExecutors(selectedClient);
    }

    tryMeButton(readOnly, target, executors);
  
    return accessTokenPromise.always(function (accessToken) {
      // Load Connections
      var dbConnections       = getDbConnections(tenantDomain, accessToken, selectedClient.clientID);
      var connectionsByName   = getConnectionsByName(tenantDomain, accessToken, selectedClient.clientID);
      
      // Load Rules
      var rulesPromise        = getRules(tenantDomain, accessToken, selectedClient.clientID);
      
      // Load Logs
      var logsPromise         = getLogs(tenantDomain, accessToken);

      // Load Users
      var usersMappedUserId   = findAllUsersById(tenantDomain, accessToken);
      var usersMappedEmail    = findAllUsersByMail(tenantDomain, accessToken);
      
      var selectsToPopulate = [
        [findAllConnections, '.connection-selector',
          '.connection-selector.with-optional'],
        [findOnlySocials, '.social_connection-selector',
          '.social_connection-selector.with-optional'],
        [findOnlyStrictEnterpriseEnabled, '.enterprise_connection-selector',
          '.enterprise_connection-selector.with-optional'],
        [findOnlyEnterpriseCustomDbEnabled,'.db_connection-selector',
          '.db_connection-selector.with-optional'],

        [ connectionsByName,  '.connection-selector' ],
        [ dbConnections,      '#api-create-user-connection-selector' ],
        [ dbConnections,      '#api-update-user-password-byemail-connection-selector' ],
        [ dbConnections,      '#api-user-sendverificationemail-selector' ],

        [ rulesPromise,       '.rule-selector' ],
        [ logsPromise,       '.logs-selector' ],

        [ usersMappedEmail,   '.user-email-selector' ],
        [ usersMappedUserId,  '.user-selector' ]
      ];

      /* Populate each of the selects and returns an array with promises to each of
       * the elements */
      var selectPopulatePromises = selectsToPopulate.map(function (selectToPopulate) {
        var args = [selectToPopulate[0], {selector: $(selectToPopulate[1], target)}];

        if (selectToPopulate[2]) {
          args[1].optionalSelector = $(selectToPopulate[2], target);
        }
        return populateSelectFromPromise.apply(null, args);
      });

      /* After all the selects are populate execute this */
      return $.when.apply($, selectPopulatePromises).then(function () {
        var updateUserPasswordByEmailEmailSelector = $('#update-user-password-byemail-email-selector');

        updateUserPasswordByEmailEmailSelector.change(function () {
          $('#api-update-user-password-byemail-email').val($(this).val());
        });

        updateUserPasswordByEmailEmailSelector.trigger('change');
      });
    });

  }
  function populateSelects(isAuth, readOnly, tenantDomain, target) {
    var clientsPromise = getClients(target);

    // Load Clients
    var nonGlobalClients = clientsPromise.then(function (result) { return result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.name]; }); });

    var nonGlobalClientsWithBrackets = clientsPromise.then(function (result) { return result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.clientID + ' (' + c.name + ')']; }); });
    
    var globalClient = clientsPromise.then(function (result) { return result.filter(function (c) { return c.global; })[0]; });

    var selectsToPopulate = [
      [ nonGlobalClients,             'select[name="client-list"]' ],
      [ nonGlobalClients,             'select[name="client-list-without-global"]' ],
      [ nonGlobalClientsWithBrackets, 'select[name="client-list-without-global"].with-id' ]
    ];
    
    selectsToPopulate.forEach(function (selectToPopulate) {
      populateSelectFromPromise(selectToPopulate[0], {selector: $(selectToPopulate[1], target)});
    });

    globalClient.then(function (globalClient) {
      $('<option class="global-client">Global Client</option>')
      .val(globalClient.clientID)
      .appendTo($('select[name="client-list"]', target));

      $('select[name="client-list"] option[value="' + globalClient.clientID + '"]', target)
      .val(globalClient.clientID)
      .prop('selected', true);
    });

    return clientsPromise.then(function (clients) {
      var onClientChangedListener = function (event) {
        var clientID = $(event.target).val();
        var selectedClient = clients.filter(function (c) { return c.clientID === clientID; })[0];
        onClientChanged(tenantDomain, isAuth, readOnly, target, selectedClient);
      };

      var clientListSelector = $('.client-selector select[name="client-list-without-global"]', target);

      if (clientListSelector.length === 0) {
        clientListSelector = $('select[name="client-list"]', target);
      }

      clientListSelector.off('change')
      .on('change', onClientChangedListener);
      
      clientListSelector.trigger('change');
      return getSelectedClient(target, clients);
    });
  }

  function getAccessToken(tenantDomain, clientId, clientSecret, readOnly) {
    if (readOnly) {
      var deferred = $.Deferred();
      setTimeout(function () {
        deferred.reject({});
      }, 0);
      return deferred.promise();
    }
    var url = urljoin('https://' + tenantDomain, '/oauth/token');
    return $.ajax({
      url: url,
      type: 'POST',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      data: {
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    'client_credentials'
      }
    });
  }

  var loadApi = function(settings) {
    var models = require('./model-factory')(settings.readOnly);
    var target;

    function renderAndPopulate(settings) {
      renderApiMethods(target);
      var selectContentOnClick = function () { this.select(); };
      $('input[name="current-client-id"]', target).click(selectContentOnClick);
      $('input[name="current-client-secret"]', target).click(selectContentOnClick);

      var clientsModel = models.clientsModel(tenantDomainPromise, accessTokenPromise);
      var clientConnectionsModel  = models.clientConnectionsModel(tenantDomainPromise, accessTokenPromise);
      var loadedSelectModels = selectModels(settings.readOnly, clientsModel, clientConnectionsModel);

      getRules                            = loadedSelectModels.getRules;
      getLogs                            = loadedSelectModels.getLogs;

      findAllConnections                  = loadedSelectModels.findAllConnections;
      findOnlySocials                     = loadedSelectModels.findOnlySocials;
      findOnlyStrictEnterpriseEnabled     = loadedSelectModels.findOnlyStrictEnterpriseEnabled;
      findOnlyEnterpriseCustomDbEnabled   = loadedSelectModels.findOnlyEnterpriseCustomDbEnabled;
      getConnections                      = loadedSelectModels.getConnections;
      getConnectionsByName                = loadedSelectModels.getConnectionsByName;
      getDbConnections                    = loadedSelectModels.getDbConnections;

      getClients                          = loadedSelectModels.getClients;

      findAllUsers                        = loadedSelectModels.findAllUsers;
      findAllUsersById                    = loadedSelectModels.findAllUsersById;
      findAllUsersByMail                  = loadedSelectModels.findAllUsersByMail;

      var loadGenerator = loadGeneratorFactory(target);
      staticListGenerators.map(function (listGenerator) {
        loadGenerator.apply(null, listGenerator)();
      });
      populateSelects(settings.isAuth, settings.readOnly, settings.tenantDomain, target);

      if (settings.readOnly) {
        $('select', target).attr('disabled', 'disabled');
        $('select[name="client-list"]', target).attr('disabled', 'disabled');
      }
      target.closest('.api-explorer').removeClass('loading');
      hookStrategySelector(target);

      scrollToAnchors(settings.anchors, target);
    }

    if (settings.isAuth) {
      target = $('#sdk-auth-api-content');
    } else {
      target = $('#sdk-api-content');
    }

    target.closest('.api-explorer').addClass('loading');

    getAccessToken(settings.tenantDomain, settings.clientId, settings.clientSecret,
                   settings.readOnly)
    .then(function (token) {
      accessTokenPromise.resolve(token.access_token);
      tenantDomainPromise.resolve(settings.tenantDomain);
      settings.accessToken = token.access_token;
      $('.tokenme').html(token.access_token);

      renderAndPopulate(settings);
    },
    function () {
      accessTokenPromise.reject();
      if (settings.readOnly) {
        renderAndPopulate(settings);
      } else {
        console.log('Error fetching access token. Is Auth0 up?');
      }
    });
  };

  return loadApi;

});
