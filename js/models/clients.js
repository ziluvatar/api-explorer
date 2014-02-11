define(function (require) {
  var Model = require('js/models/model');

  var actions = {
    findAll: 'GET /api/clients',
    findOne: 'GET /api/clients/:clientID',
    remove:  'DELETE /api/clients/:clientID',
    update:  'PUT /api/clients/:clientID',
    findNonGlobal: function () {
      return this.findAll.apply(this, arguments)
        .pipe(function(clients) {
          return clients.filter(function(c) {
            return !c.global;
          });
        });
    },
    findGlobal: function () {
      return this.findAll.apply(this, arguments)
        .pipe(function(clients) {
          return clients.filter(function(c) {
            return c.global;
          })[0];
        });
    }
  };

  return function (settings) {
    return Model(actions, {
      tenantDomain: settings.tenantDomain,
      accessToken: settings.accessToken
    });
  };
});
