define(function(require) {
  var $ = require('jquery');
  var urljoin = require('url-join');

  return function(client, globalAccessToken) {

    var validateJsonText = function(jsonText) {
      return parseJson('{' + jsonText + '}');
    };

    var parseJson = function(jsonStr) {
      try {
        return JSON.parse(jsonStr);
      } catch(e) {}
    };

    this['delegation'] = function() {
      var additional_parameters = validateJsonText($('#delegation-jsoneditor').val());
      if (!additional_parameters) {
        $('#delegation-result').text('Invalid additional parameters');
        $('#delegation-result').parent().addClass('error');
        return;
      }

      var data = additional_parameters;
      data.grant_type = $('#delegation-grant_type option:selected').val();
      data.target     = $('#delegation-target option:selected').val();
      data.client_id  = client.clientID;
      data.scope      = $('#delegation-scope option:selected').val();
      data.api_type   = $('#delegation-api_type option:selected').val();

      var token_type = $('#delegation-token-type option:selected').val();
      var token = $('#delegation-token').val();
      data[token_type] = token;

      var url = urljoin(client.namespace, '/delegation');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['offline'] = function() {

      var response_type = $('#offline-response_type option:selected').val();
      var connection = $('#offline-connection option:selected').val();
      var scope = $('#offline-scope').text();
      var device = $('#offline-device').val();

      var url = urljoin(client.namespace, '/authorize', '?response_type=' + response_type + '&client_id=' + client.clientID + '&redirect_uri=' + client.callback + '&scope=' + scope + '&device=' + device);

      if (connection) {
        url += '&connection=' + connection;
      }

      window.open(url, '_new');
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

      var additional_parameters = validateJsonText($('#oauth_access_token-jsoneditor').val());
      if (!additional_parameters) {
        $('#oauth_access_token-result').text('Invalid additional parameters');
        $('#oauth_access_token-result').parent().addClass('error');
        return;
      }

      var data = additional_parameters;
      data.client_id    = client.clientID;
      data.access_token = $('#oauth_access_token-access_token').val();
      data.connection   = $('#oauth_access_token-connection').val();
      data.scope        = $('#oauth_access_token-scope option:selected').val();

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

      var grant_type = $('#ro-grant_type option:selected').val();
      var data = grant_type === 'urn:ietf:params:oauth:grant-type:jwt-bearer' ? {
        client_id: client.clientID,
        id_token: $('#ro-id_token').val(),
        grant_type: grant_type,
        scope: $('#ro-scope option:selected').val(),
        device: $('#ro-device').val()
      } : {
        client_id: client.clientID,
        username: $('#ro-username').val(),
        password: $('#ro-password').val(),
        connection: $('#ro-connection option:selected').val(),
        grant_type: grant_type,
        scope: $('#ro-scope option:selected').val(),
        device: $('#ro-device').val()
      };

      var url = urljoin(client.namespace, '/oauth/ro');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['signup'] = function() {

      var data = {
        client_id: client.clientID,
        email: $('#signup-email').val(),
        password: $('#signup-password').val(),
        connection: $('#signup-connection option:selected').val()
      };

      var url = urljoin(client.namespace, '/dbconnections/signup');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['chpwd'] = function() {

      var data = {
        client_id: client.clientID,
        email: $('#chpwd-email').val(),
        password: $('#chpwd-password').val(),
        connection: $('#chpwd-connection option:selected').val()
      };

      var url = urljoin(client.namespace, '/dbconnections/change_password');
      return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        global: false
      });
    };

    this['passwordless-start-with_email'] = function() {

      var authParamsStr = $('#passwordless-start-with_email-authParams').val();
      var authParams = authParamsStr ? parseJson(authParamsStr) : {};
      if (!authParams) {
        $('#passwordless-start-with_email-result').text('Invalid authParams');
        $('#passwordless-start-with_email-result').parent().addClass('error');
        return;
      }

      var data = {
        client_id: client.clientID,
        connection: 'email',
        email: $('#passwordless-start-with_email-email').val(),
        send: $('#passwordless-start-with_email-send option:selected').val(),
        authParams: authParams
      };

      return $.ajax({
        type: 'POST',
        url: urljoin(client.namespace, '/passwordless/start'),
        data: data,
        global: false
      });
    };

    this['passwordless-start-with_sms'] = function() {

      var data = {
        client_id: client.clientID,
        connection: 'sms',
        phone_number: $('#passwordless-start-with_sms-phone_number').val()
      };

      return $.ajax({
        type: 'POST',
        url: urljoin(client.namespace, '/passwordless/start'),
        data: data,
        global: false
      });
    };

    this['passwordless_with_sms-ro'] = function() {

      var data = {
        client_id: client.clientID,
        username: $('#passwordless_with_sms-ro-username').val(),
        password: $('#passwordless_with_sms-ro-password').val(),
        connection: 'sms',
        grant_type: 'password',
        scope: $('#passwordless_with_sms-ro-scope option:selected').val()
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
      var client_id = $('#logout-client_id').val();

      var url = urljoin(client.namespace, '/logout', '?returnTo=' + returnTo, '&client_id=' + client_id);

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

