define(function (require) {

  var $ = require('jquery');

  function returnAsPromise(l) {
    return function () {
      var deferred = $.Deferred();

      setTimeout(function () {
        deferred.resolve(l);
      }, 0);

      return deferred.promise();
    };
  }

  return function (useFixtures) {
    var clientsModel, clientConnectionsModel;

    if (useFixtures) {
      var mockClients = [
        {global: true, clientID: 'GLOBAL_CLIENT_ID' },
        {global: false, clientID: 'APP_CLIENT_ID'}
      ];

      clientsModel              = function () {
        return {
          findAll: returnAsPromise(mockClients),
        };
      };
      clientConnectionsModel    = function () {
        return {
          findAllEnabled: returnAsPromise(mockClients)
        };
      };
    } else {
      clientsModel              = require('./models/clients');
      clientConnectionsModel    = require('./models/client-connections');
    }

    return {
      clientsModel:           clientsModel,
      clientConnectionsModel: clientConnectionsModel
    };
  };
});
