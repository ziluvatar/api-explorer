define(function(require) {
  var $ = require('jquery');
  var urljoin = require('url-join');

  return function(client, globalAccessToken) {

    var validateJsonText = function(jsonText) {
      try {
        return JSON.parse('{' + jsonText + '}');
      } catch(e) {}
    };

    this['delegation'] = function() {

      var data = {
        grant_type: $('#delegation-grant_type option:selected').val(),
        id_token: $('#delegation-id_token').val(),
        target: $('#delegation-target option:selected').val(),
        client_id: client.clientID,
        scope: $('#delegation-scope option:selected').val()
      };

      var url = urljoin(client.namespace, '/delegation');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['impersonate'] = function() {

      var additional_parameters = validateJsonText($('#impersonate-additional_parameters').val());
      if (!additional_parameters) {
        $('#impersonate-result').text('Invalid additional parameters');
        $('#impersonate-result').parent().addClass('error');
        return;
      }

      var user_id = $('#impersonate-user_id option:selected').val();
      var data = {
        protocol: $('#impersonate-protocol option:selected').val(),
        impersonator_id: $('#impersonate-impersonator_id').text(),
        client_id: $('#impersonate-client_id option:selected').val(),
        additionalParameters: additional_parameters
      };

      var url = urljoin(client.namespace, 'users', encodeURIComponent(user_id), 'impersonate');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        headers: {
          Authorization: 'Bearer ' + globalAccessToken
        },
        global: false
      });
    };

    this['authorize_social'] = function() {

      var response_type = $('#authorize_social-response_type option:selected').val();
      var connection = $('#authorize_social-connection option:selected').val();
      var state = $('#authorize_social-state').val();
      var additional_parameters = $('#authorize_social-additional_parameters').val();

      var url = urljoin(client.namespace, '/authorize', '?response_type=' + response_type + '&client_id=' + client.clientID + '&redirect_uri=' + client.callback);

      if (connection) {
        url += '&connection=' + connection;
      }

      if (state) {
        url += '&state=' + state;
      }

      if (additional_parameters) {
        url += '&' + additional_parameters;
      }

      window.open(url, '_new');
    };

    this['oauth_access_token'] = function() {

      var data = {
        client_id:    client.clientID,
        access_token: $('#oauth_access_token-access_token').val(),
        connection:   $('#oauth_access_token-connection').val(),
        scope:        $('#oauth_access_token-scope option:selected').val()
      };

      var url = urljoin(client.namespace, '/oauth/access_token');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['authorize_db'] = function() {

      var response_type = $('#authorize_db-response_type option:selected').val();
      var connection = $('#authorize_db-connection option:selected').val();
      var state = $('#authorize_db-state').val();
      var additional_parameters = $('#authorize_db-additional_parameters').val();

      var url = urljoin(client.namespace, '/authorize', '?response_type=' + response_type + '&client_id=' + client.clientID + '&redirect_uri=' + client.callback);

      if (connection) {
        url += '&connection=' + connection;
      }

      if (state) {
        url += '&state=' + state;
      }

      if (additional_parameters) {
        url += '&' + additional_parameters;
      }

      window.open(url, '_new');
    };

    this['authorize_enterprise'] = function() {

      var response_type = $('#authorize_enterprise-response_type option:selected').val();
      var connection = $('#authorize_enterprise-connection option:selected').val();
      var state = $('#authorize_enterprise-state').val();
      var additional_parameters = $('#authorize_enterprise-additional_parameters').val();

      var url = urljoin(client.namespace, '/authorize', '?response_type=' + response_type + '&client_id=' + client.clientID + '&redirect_uri=' + client.callback);

      if (connection) {
        url += '&connection=' + connection;
      }

      if (state) {
        url += '&state=' + state;
      }

      if (additional_parameters) {
        url += '&' + additional_parameters;
      }

      window.open(url, '_new');
    };

    this['oauth-token'] = function() {

      var data = {
        client_id: client.clientID,
        client_secret: client.clientSecret,
        grant_type: $('#oauth-token-grant_type').text(),
        code: $('#oauth-token-code').val()
      };

      var url = urljoin(client.namespace, '/oauth/token');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['link'] = function() {

      var response_type = $('#link-response_type option:selected').val();
      var connection = $('#link-connection option:selected').val();
      var access_token = $('#link-access_token').val();

      var url = urljoin(client.namespace, '/authorize', '?response_type=' + response_type + '&client_id=' + client.clientID + '&redirect_uri=' + client.callback + '&access_token=' + access_token);

      if (connection) {
        url += '&connection=' + connection;
      }

      window.open(url, '_new');
    };

    this['unlink'] = function() {

      var data = {
        clientID: client.clientID,
        access_token: $('#unlink-access_token').val(),
        user_id: $('#unlink-user_id option:selected').val()
      };

      var url = urljoin(client.namespace, '/unlink');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['ro'] = function() {

      var data = {
        client_id: client.clientID,
        username: $('#ro-username').val(),
        password: $('#ro-password').val(),
        connection: $('#ro-connection option:selected').val(),
        grant_type: $('#ro-grant_type').text(),
        scope: $('#ro-scope option:selected').val()
      };

      var url = urljoin(client.namespace, '/oauth/ro');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['tokeninfo'] = function() {

      var data = {
        id_token: $('#tokeninfo-id_token').val()
      };

      var url = urljoin(client.namespace, '/tokeninfo');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['userinfo'] = function() {

      var access_token = $('#userinfo-access_token').val();
      var url = urljoin(client.namespace, '/userinfo');

      return $.ajax({
        type: 'GET',
        url: url,
        headers: {
          Authorization: 'Bearer ' + access_token
        },
        global: false
      });
    };

    this['logout'] = function() {

      var returnTo = $('#logout-returnTo').val();

      var url = urljoin(client.namespace, '/logout', '?returnTo=' + returnTo);

      window.open(url, '_new');
    };

    this['samlp'] = function() {

      var connection = $('#samlp-connection option:selected').val();
      var url = urljoin(client.namespace, 'samlp', client.clientID);

      if (connection) {
        url += '?connection=' + connection;
      }

      window.open(url, '_new');
    };

    this['samlp_metadata'] = function() {

      var url = urljoin(client.namespace, 'samlp/metadata', client.clientID);

      window.open(url, '_new');
    };

    this['wsfed'] = function() {

      var url = urljoin(client.namespace, 'wsfed', client.clientID);

      window.open(url, '_new');
    };

    this['wsfed_metadata'] = function() {

      var url = urljoin(client.namespace, 'wsfed/FederationMetadata/2007-06/FederationMetadata.xml');

      window.open(url, '_new');
    };
  };
});

