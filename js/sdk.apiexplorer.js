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

  var selectModels              = require('./models/select-models');
  var getRules;
  var getConnections;
  var getClients;
  var findAllUsers;

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
    [populateSelect, staticLists.protocols,    '.protocol-selector',     '.protocol-selector.with-optional']
  ];

  var dynamicListGenerators = [
    [populateSelectFromPromise, 'findAllConnections', '.connection-selector', '.connection-selector.with-optional'],
    [populateSelectFromPromise, 'findOnlySocials', '.social_connection-selector', '.social_connection-selector.with-optional'],
    [populateSelectFromPromise, 'findOnlyStrictEnterpriseEnabled', '.enterprise_connection-selector','.enterprise_connection-selector.with-optional'],
    [populateSelectFromPromise, 'findOnlyEnterpriseCustomDbEnabled','.db_connection-selector', '.db_connection-selector.with-optional']
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

  var loading = function(el, l) {
    $('.loading-spin', el).toggle(l);
  };


  function getSelectedClient(target, clients) {
    var clientID;

    clientID = $('.client-selector select[name="client-list"]', target).val();

    if (!clientID) {
      clientID = $('.client-selector select[name="client-list-without-global"]', target).val();
    }

    var selectedClient = clients.filter(function (c) {
      return c.clientID === clientID;
    })[0];


    return selectedClient;
  }

  function loadConnections (connectionsPromise, target) {
    connectionsPromise.done(function (connections) {
      // db connections
      var dbConnections = connections
      .filter(function (c) {
        return c.strategy === 'auth0';
      }).map(function (c) {
        return c.name;
      });
      
      populateSelect(connections.map(function (c) { return c.name; }), {selector: $('.connection-selector', target)});
      populateSelect(dbConnections, {selector: $('#api-create-user-connection-selector', target)});
      populateSelect(dbConnections, {selector: $('#api-user-sendverificationemail-selector', target)});
      populateSelect(dbConnections, {selector: $('#api-update-user-password-byemail-connection-selector', target)});
    });
  }

  function loadRules (rulesPromise, target) {
    rulesPromise.done(function (rules) {
      populateSelect(rules.map(function (c) { return encodeURIComponent(c.name); }), {selector: $('.rule-selector', target)});
    });
  }

  function loadUsers (usersPromise, target) {
    usersPromise.done(function (users) {
      populateSelect(users.map(function(u) { return u.user_id; }), {selector: $('.user-selector', target)});
      populateSelect(users.map(function(u) { return u.email;   }), {selector: $('.user-email-selector', target)});
    });
  }

  function loadClients(clientsPromise, target) {
    var r = clientsPromise.then(function (result) {
      var nonGlobalClients = result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.name]; });
      var nonGlobalClientsWithBrackets = result.filter(function (c) { return !c.global; }).map(function (c) { return [c.clientID, c.clientID + ' (' + c.name + ')']; });
      var globalClient = result.filter(function (c) { return c.global; })[0];

      populateSelect(nonGlobalClients, {selector: $('select[name="client-list"]', target)});
      populateSelect(nonGlobalClients, {selector: $('select[name="client-list-without-global"]', target)});
      populateSelect(nonGlobalClientsWithBrackets, {selector: $('select[name="client-list-without-global"].with-id', target)});

      $('<option class="global-client" value="' + globalClient.clientID + '">Global Client</option>')
      .appendTo($('select[name="client-list"]', target));

      $('select[name="client-list"] option[value="' + globalClient.clientID + '"]', target)
      .prop('selected', true);

      return result;
    });

    return r;
  }


  var generateListFactory = function (readOnly, loadGenerator, dynamicListGeneratorsWithModel) {
    return function (selectedClient) {
      dynamicListGeneratorsWithModel.forEach(function (listGenerator) {
        if (readOnly) {
          var d = $.Deferred();
          setTimeout(function () {
            d.resolve([ '{connection}' ]);
          });
          listGenerator[1] = function () {
            return d.promise();
          };
        }
        loadGenerator.apply(null, listGenerator)(selectedClient.clientID);
      });
    };
  };
    
  function onClientChanged (tenantDomain, isAuth, readOnly, target, selectedClient, populateDynamicSelects) {
    $('.client_namespace', target).html('https://' + tenantDomain + '/');
    $('.client_client_id', target).html(selectedClient.clientID);
    $('.client_callback', target).html(selectedClient.callback);
    $('.client_client_secret', target).html(selectedClient.clientSecret);
    $('.client_name', target).html(selectedClient.name);

    $('input[name="current-client-id"]', target).attr('value', selectedClient.clientID);

    var currentClientSecret = $('input[name="current-client-secret"]', target);
    currentClientSecret.addClass('secret btn');
    currentClientSecret.attr('value', '(click to show)');
    currentClientSecret.off('click.secret');
    currentClientSecret.on('click.secret', function (e) {
      e.preventDefault();
      currentClientSecret.attr('value', selectedClient.clientSecret);
      currentClientSecret.off('click.secret');
      currentClientSecret.removeClass('secret btn');
      return false;
    });

    selectedClient.namespace = 'https://' + tenantDomain;
    var executors;

    if (isAuth) {
      accessTokenPromise.then(function (accessToken) {
        executors = new AuthApiExecutors(selectedClient, accessToken);
      });
    } else {
      executors = new ApiExecutors(selectedClient);
    }

    tryMeButton(readOnly, target, executors);
  

    populateDynamicSelects(selectedClient);

    accessTokenPromise.always(function (accessToken) {
      loadConnections(getConnections(tenantDomain, accessToken, selectedClient.clientID));
      $('.optional-connection-selector', target).prepend('<option value="none"></option>');
      loadRules(getRules(tenantDomain, accessToken, selectedClient.clientID), target);
      loadUsers(findAllUsers(tenantDomain, accessToken), target);
      $('#update-user-password-byemail-email-selector').change(function () {
        $('#api-update-user-password-byemail-email').val($(this).val());
      });

      $('#update-user-password-byemail-email-selector').trigger('change');
    });

  }
  function populateSelects(isAuth, readOnly, tenantDomain, target, populateDynamicSelects) {
    var clientsLoadedPromise = loadClients(getClients(isAuth, target), target);
    clientsLoadedPromise.then(function (clients) {
      var onClientChangedListener = function (event) {
        var clientID = $(event.target).val();
        var selectedClient = clients.filter(function (c) { return c.clientID === clientID; })[0];
        onClientChanged(tenantDomain, isAuth, readOnly, target, selectedClient, populateDynamicSelects);
      };

      $('select[name="client-list-without-global"]', target)
      .off('change')
      .on('change', onClientChangedListener);

      $('select[name="client-list"]', target)
      .off('change')
      .on('change', onClientChangedListener);

      
      var selectedClient = getSelectedClient(target, clients);
      onClientChanged(tenantDomain, isAuth, readOnly, target, selectedClient, populateDynamicSelects);
      return selectedClient;
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

      getRules = loadedSelectModels.getRules;
      getConnections = loadedSelectModels.getConnections;
      getClients = loadedSelectModels.getClients;
      findAllUsers = loadedSelectModels.findAllUsers;

      var dynamicListGeneratorsWithModel = dynamicListGenerators.map(function (listGenerator) {
        var parameters = listGenerator.slice(0);
        parameters[1] = loadedSelectModels[parameters[1]];
        return parameters;
      });
      var loadGenerator = loadGeneratorFactory(target);
      var populateDynamicSelects = generateListFactory(settings.readOnly, loadGenerator, dynamicListGeneratorsWithModel);
      staticListGenerators.map(function (listGenerator) {
        loadGenerator.apply(null, listGenerator)();
      });
      populateSelects(settings.isAuth, settings.readOnly, settings.tenantDomain, target, populateDynamicSelects);

      if (settings.readOnly) {
        $('select', target).attr('disabled', 'disabled');
        $('select[name="client-list"]', target).attr('disabled', 'disabled');
      }
      loading(settings.el, false);
      target.animate({opacity: 1}, 'slow');
      hookStrategySelector(target);

      scrollToAnchors(settings.anchors, target);
    }

    if (settings.isAuth) {
      target = $('#sdk-auth-api-content');
    } else {
      target = $('#sdk-api-content');
    }

    target.css('opacity', 0);
    loading(settings.el, true);

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
