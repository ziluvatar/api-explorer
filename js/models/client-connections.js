define(function(require) {
  var model = require('./model');
  var clientsModel = require('./clients');
  var $ = require('jquery');

  return function(settings) {
    var actions = {
      findAll: 'GET /api/connections?client=:client',
      findOne: 'GET /api/connections/:name?client=:client',
      findOnlySocials: 'GET /api/connections?only_socials=true&client=:client',
      findOnlyEnterprise: 'GET /api/connections?only_enterprise=true&client=:client',
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
    return model(actions, settings);
  };
});
