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

  function createFixtures() {
    var d = {};

    var mockClients = [
      {global: true, clientID: 'GLOBAL_CLIENT_ID', clientSecret: 'GLOBAL_CLIENT_SECRET' },
      {global: false, clientID: 'APP_CLIENT_ID'}
    ];

    var mockSocials = [
      {name: 'social-connection'}
    ];

    var mockUserPassDB = [
      {name: 'custom-db-connection'}
    ];

    var mockDB = [
      {name: 'db-connection'}
    ];

    var enterprise = [
      {name: 'enterpise-connection'}
    ];

    d.clientsModel = function () {
      return {
        findAll: returnAsPromise(mockClients)
      };
    };
    d.clientConnectionsModel = function () {
      return {
        findAllEnabled:                     returnAsPromise(mockClients),
        findOnlySocials:                    returnAsPromise(mockSocials),
        findOnlyUserPassEnabled:            returnAsPromise(mockUserPassDB),
        findOnlyStrictEnterpriseEnabled:    returnAsPromise(enterprise),
        findOnlyDbConnectionsEnabled:       returnAsPromise(mockDB)
      };
    };

    return d;
  }

  return function (useFixtures) {
    var d;
    if (useFixtures) {
      d = createFixtures();
    } else {
      d = {
        clientsModel            :   require('./models/clients'),
        clientConnectionsModel  :   require('./models/client-connections')
      };
    }

    return d;
  };
});
