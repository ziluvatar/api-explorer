define(function (require) {
  var model = require('./model');

  var actions = {
    findAll: 'GET /api/clients',
    findOne: 'GET /api/clients/:clientID',
    remove:  'DELETE /api/clients/:clientID',
    update:  'PUT /api/clients/:clientID',
    findNonGlobal: function () {
      return this.findAll.apply(this, arguments)
        .then(function(clients) {
          return clients.filter(function(c) {
            return !c.global;
          });
        });
    },
    findGlobal: function () {
      return this.findAll.apply(this, arguments)
        .then(function(clients) {
          return clients.filter(function(c) {
            return c.global;
          })[0];
        });
    }
  };

  return function (tenantDomainPromise, accessTokenPromise) {
    return model(actions, tenantDomainPromise, accessTokenPromise);
  };
});
