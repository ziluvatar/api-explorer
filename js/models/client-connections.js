define(function(require) {
  var model = require('./model');
  var clientsModel = require('./clients');
  var $ = require('jquery');

  var usernamePasswordStrategies = ['ad', 'auth0-adldap', 'auth0', 'adfs', 'waad', 'sms', 'email'];

  return function(promiseBag) {
    var actions = {
      findAll: 'GET /api/connections?client=:client',
      findOne: 'GET /api/connections/:name?client=:client',
      findOnlySocials: 'GET /api/connections?only_socials=true&client=:client',
      findOnlyEnterprise: 'GET /api/connections?only_enterprise=true&client=:client',
      findOnlyPasswordless: 'GET /api/connections?only_passwordless=true&client=:client',
      findOnlyStrictEnterpriseEnabled: function () {
        return this.findOnlyEnterprise.apply(this, arguments).then(function (connections) {
          return connections.filter(function (c) {
            return c.strategy !== 'auth0' && c.status;
          });
        });
      },
      findOnlyDbConnectionsEnabled: function () {
        return this.findOnlyEnterprise.apply(this, arguments).then(function (connections) {
          return connections.filter(function (c) {
            return c.strategy === 'auth0' && c.status;
          });
        });
      },
      findOnlyUserPassEnabled: function () {
        return this.findAll.apply(this, arguments).then(function (connections) {
          return connections.filter(function (c) {
            return usernamePasswordStrategies.indexOf(c.strategy) > -1 && c.status;
          });
        });
      },
      update: 'PUT /api/connections/:name?client=:!client',
      create: 'POST /api/connections/?client=:!client',
      changeStatus: 'PUT /api/connections/:name/status?client=:!client',
      findAllEnabled: function() {
        return this.findAll.apply(this, arguments).then(function(connections) {
          return connections.filter(function(c) {
            return c.status;
          });
        });
      },
      findAllNonGlobal: function() {
        var self = this;
        return clientsModel(settings).findAll().then(function(clients) {
          var clis = clients.map(function(client) {
            return self.findAll({
              client: client.clientID
            }).then(function(connections) {
              return connections.filter(function(connection) {
                return ! connection.global;
              });
            });
          });

          return $.when.apply($, clis).then(function() {
            var merged = [];
            return merged.concat.apply(merged, arguments);
          });
        });
      }
    };
    return model(actions, promiseBag);
  };
});
