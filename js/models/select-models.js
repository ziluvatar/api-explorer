define(function (require) {

  var $ = require('jquery');

  return function selectModels(readOnly, clientsModel, clientConnectionsModel) {
    var getRules;
    var getConnections;
    var getClients;
    var findAllUsers;
    var findAllConnections;
    var findOnlySocials;
    var findOnlyStrictEnterpriseEnabled;
    var findOnlyEnterpriseCustomDbEnabled;

    getRules = function(tenantDomain, accessToken, clientID) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{name: '{my-rule}'}]);
        }, 0);

        return d.promise();
      }

      return $.ajax({
        url: 'https://' + tenantDomain + '/api/rules',
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        data:  {client: clientID},
        cache: false
      });
    };

    getConnections = function(tenantDomain, accessToken, clientID) {
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
        url: 'https://' + tenantDomain + '/api/connections',
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        data: { client: clientID },
        cache: false
      });
    };

    getClients = function(target) {
      var clientSelectorSelect = $('.client-selector select[name="client-list-without-global"]', target);

      if (!clientSelectorSelect.length) {
        clientSelectorSelect = $('.client-selector select[name="client-list"]', target);
      }

      clientSelectorSelect.html('');

      var clientsPromise;

      if (readOnly) {
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

      return clientsPromise;
    };

    findAllUsers = function(tenantDomain, accessToken) {
      if (readOnly) {
        var d = $.Deferred();
        d.resolve([{
          user_id: '{user-id}',
          email: '{email}'
        }]);
        return d.promise();
      }

      return $.ajax({
        url: 'https://' + tenantDomain + '/api/users',
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        data: { perPage: 10 }
      });
    };

    findAllConnections = function (clientID) {
      return clientConnectionsModel.findAllEnabled({ client: clientID }).then(function (connections) {
        return connections.map(function (c) { return c.name; });
      });
    };

    findOnlySocials = function (clientID) {
      return clientConnectionsModel.findOnlySocials({ client: clientID }).then(function (connections) {
        return connections
        .filter(function (c) { return c.status; })
        .map(function (c) { return c.name; });
      });
    };

    findOnlyStrictEnterpriseEnabled = function (clientID) {
      return clientConnectionsModel.findOnlyStrictEnterpriseEnabled({ client: clientID })
      .then(function (connections) {
        return connections.map(function (e) {
          return e.name;
        });
      });
    };

    findOnlyEnterpriseCustomDbEnabled = function (clientID) {
      return clientConnectionsModel.findOnlyEnterpriseCustomDbEnabled({ client: clientID })
      .then(function (connections) {
        return connections.map(function (e) {
          return e.name;
        });
      });
    };

    return {
      getRules:  getRules,
      getConnections:  getConnections,
      getClients:  getClients,
      findAllUsers:  findAllUsers,
      findAllConnections:  findAllConnections,
      findOnlySocials:  findOnlySocials,
      findOnlyStrictEnterpriseEnabled:  findOnlyStrictEnterpriseEnabled,
      findOnlyEnterpriseCustomDbEnabled:  findOnlyEnterpriseCustomDbEnabled,
    };
  };
});
