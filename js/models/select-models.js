define(function (require) {

  var $ = require('jquery');

  return function selectModels(readOnly, clientsModel, clientConnectionsModel) {
    var getRules;
    var getDbConnections;
    var getConnections;
    var getConnectionsByName;
    var getClients;
    var findAllUsers;
    var findAllUsersById;
    var findAllUsersByMail;
    var findAllConnections;
    var findOnlySocials;
    var findOnlyStrictEnterpriseEnabled;
    var findOnlyEnterpriseCustomDbEnabled;

    getRules = function(tenantDomain, accessToken, clientID) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{name: '{my-rule}'}].map(function (r) { return r.name; }));
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
      }).then(function (rules) {
        return rules.map(function (c) { return encodeURIComponent(c.name); });
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
    
    getDbConnections = function(tenantDomain, accessToken, clientID) {
      return getConnections(tenantDomain, accessToken, clientID).then(function (connections) { return connections.filter(function (c) { return c.strategy === 'auth0'; }).map(function (c) { return c.name; }); });
    };

    getConnectionsByName = function (tenantDomain, accessToken, clientID) {
      return getConnections(tenantDomain, accessToken, clientID).then(function (connections) { return connections.map(function (c) { return c.name; }); });
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
    
    findAllUsersById = function (tenantDomain, accessToken) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{user_id: '{user-id}'}].map(function (r) { return r.user_id; }));
        }, 0);

        return d.promise();
      }
      return findAllUsers(tenantDomain, accessToken).then(function (users) { return users.map(function(u) { return u.user_id; }); });
    };

    findAllUsersByMail = function (tenantDomain, accessToken) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{user_email: '{user-email}'}].map(function (r) { return r.user_email; }));
        }, 0);

        return d.promise();
      }
      return findAllUsers(tenantDomain, accessToken).then(function (users) { return users.map(function(u) { return u.email;   }); });
    };


    findAllConnections = function (clientID) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{name: '{connection-name}'}].map(function (r) { return r.name; }));
        }, 0);

        return d.promise();
      }
      return clientConnectionsModel.findAllEnabled({ client: clientID }).then(function (connections) {
        return connections.map(function (c) { return c.name; });
      });
    };

    findOnlySocials = function (clientID) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{user_id: '{social-connection}'}].map(function (r) { return r.user_id; }));
        }, 0);

        return d.promise();
      }
      return clientConnectionsModel.findOnlySocials({ client: clientID }).then(function (connections) {
        return connections
        .filter(function (c) { return c.status; })
        .map(function (c) { return c.name; });
      });
    };

    findOnlyStrictEnterpriseEnabled = function (clientID) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{user_id: '{enterprise-connection}'}].map(function (r) { return r.user_id; }));
        }, 0);

        return d.promise();
      }
      return clientConnectionsModel.findOnlyStrictEnterpriseEnabled({ client: clientID })
      .then(function (connections) {
        return connections.map(function (e) {
          return e.name;
        });
      });
    };

    findOnlyEnterpriseCustomDbEnabled = function (clientID) {
      if (readOnly) {
        var d = $.Deferred();

        setTimeout(function () {
          d.resolve([{user_id: '{custom-db-connection}'}].map(function (r) { return r.user_id; }));
        }, 0);

        return d.promise();
      }
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
      findAllUsersById: findAllUsersById,
      findAllUsersByMail: findAllUsersByMail,
      findAllConnections:  findAllConnections,
      getDbConnections:   getDbConnections,
      findOnlySocials:  findOnlySocials,
      findOnlyStrictEnterpriseEnabled:  findOnlyStrictEnterpriseEnabled,
      findOnlyEnterpriseCustomDbEnabled:  findOnlyEnterpriseCustomDbEnabled,
      getConnectionsByName: getConnectionsByName
    };
  };
});
