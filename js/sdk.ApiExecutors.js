define(function(require) {
  var $ = require('jquery');
  var urljoin = require('url-join');

  return function(client) {
    var executors = this;

    this['accesstoken'] = function(skipchangeTokenme) {
      var url = urljoin(client.namespace, '/oauth/token');
      return $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          client_id: client.clientID,
          client_secret: client.clientSecret,
          grant_type: 'client_credentials'
        })
      }).then(function(token) {
        if (!skipchangeTokenme) {
          $('.tokenme').html(token.access_token);
        }
        return token;
      });
    };

    /**
     * return a token promise, this will either fetch a token
     * or use one already fetched.
     * @return {[type]} [description]
     */
    function getToken() {
      var tknpromise;

      if ($('.tokenme').html() !== '{token}') {
        tknpromise = $.when({
          access_token: $('.tokenme').html()
        });
      } else {
        tknpromise = executors['accesstoken'](true);
      }

      return tknpromise;
    }

    var validateJsonText = function(jsonText) {
      try {
        return JSON.parse('{' + jsonText + '}');
      } catch(e) {}
    };

    this['allusers'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['allusers-search'] = function() {
      return getToken().then(function(token) {
        var search = $('#allusers-search_search').val();
        var url = urljoin(client.namespace, '/api/users?connection=All&search=' + search);
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['user-by-id'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/', $('#user-by-id-users-selector').val());
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['allconnections'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/connections');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['oneconnection'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/connections/', $('#connection-get-selector option:selected').val(), '');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };
    
    var connectionUsers = function (perPageId, urlPath){
      return function(search){
        return getToken().then(function(token) {
          var perPage = $('#' + perPageId).val();

          var url = urljoin(client.namespace, '/api/' + urlPath + '/users');

          if (perPage) {
            url += '?per_page=' + perPage;
            url += '&search=' + search;
          }

          return $.ajax({
            url: url,
            headers: {
              Authorization: 'Bearer ' + token.access_token
            },
            type: 'GET'
          });
        });
      };
    }
    
    var enterpriseConnectionUsers = connectionUsers('enterpriseconn-users-per-page', 'enterpriseconnections', true);
    
    this['enterpriseconn-users'] = function() {
      
      var search = $('#enterprise-users-search-query').val();
      
      var element = document.getElementById('enterprise-users-search-query');
      
      if (!search) { return; }
      
      return enterpriseConnectionUsers(search);
    };
    
    var socialConnectionUsers = connectionUsers('socialconn-users_per-page', 'socialconnections', false);
    
    this['socialconn-users'] = function(){
      var search = $('#socialconn-users-search-query').val();
      
      return socialConnectionUsers(search);
    }

    this['connection-users'] = function() {
      return getToken().then(function(token) {
        var perPage = $('#connection-users_per-page').val();
        var url = urljoin(client.namespace, '/api/connections/', $('#connection-users-selector option:selected').val(), '/users');

        if (perPage) {
          url += '?per_page=' + perPage;
        }

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['connection-users-search'] = function() {
      return getToken().then(function(token) {
        var search = $('#connection-users-search_search').val();
        var perPage = $('#connection-users-search_per-page').val();

        var url = urljoin(client.namespace, '/api/connections/', $('#connection-users-search-selector option:selected').val(), '/users');

        if (search) {
          url += '?search=' + search;
        }

        if (perPage) {
          if (search) {
            url += '&per_page=' + perPage;
          } else {
            url += '?per_page=' + perPage;
          }
        }

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['clientusers'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/clients/', client.clientID, '/users');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['connectiondelete'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/connections/', $('#connection-delete-selector option:selected').val(), '');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'DELETE'
        });
      });
    };

    this['connectioncreate'] = function() {
      var strategy = $('#api-create-connection-strategy-selector option:selected').val();
      var connection = {
        name: $('#api-create-connection-name').val(),
        strategy: strategy,
        options: {}
      };

      $('input, textarea', '#create-connection-options-' + strategy).each(function() {
        connection.options[$(this).attr('data-field')] = $(this).val();
      });

      $('#create-connection-options-' + strategy + ' button').each(function() {
        connection.options[$(this).attr('data-field')] = $(this).hasClass('active');
      });

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/connections', '');
        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(connection)
        });

      });
    };

    this['websitelogin'] = function() {

      var connection = $('#connection-weblogin-selector option:selected').val();

      var url = urljoin(client.namespace, '/authorize', '?response_type=code&client_id=' + client.clientID + '&redirect_uri=' + client.callback);
      if (connection !== 'none') {
        url += '&connection=' + connection;
      }

      window.open(url, '_blank');
    };

    this['nativelogin'] = function() {

      var connection = $('#connection-nativelogin-selector option:selected').val();

      var url = urljoin(client.namespace, '/authorize', '?response_type=token&client_id=' + client.clientID + '&redirect_uri=' + client.callback);
      if (connection !== 'none') {
        url += '&connection=' + connection;
      }

      window.open(url, '_blank');
    };

    this['allclients'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/clients');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['clientcreate'] = function() {
      var valid = $('#create-client-form')[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var callbacks = $.map($('#api-create-client-callbacks').val().split(','), function(c) {
        return c.trim();
      });

      var newClient = {
        name: $('#api-create-client-name').val().trim(),
        callbacks: callbacks
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/clients/', '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(newClient)
        });

      });
    };

    function clientUpdate(nameId, callbacksIds){
      var clientID = client.clientID;
      var callbacks = $.map($('#' + callbacksIds).val().split(','), function(c) {
          return c.trim();
      });

      var updatedClient = {
          name: $('#' + nameId).val().trim(),
          callback: callbacks[0],
          callbacks: callbacks.splice(1)
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/clients/' + clientID, '');

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(updatedClient)
        });
      });
    }

    this['clientupdate'] = function() {
      return clientUpdate('api-update-client-name', 'api-update-client-callbacks');
    };

    this['clientpatch'] = function() {
      return clientUpdate('api-patch-client-name', 'api-patch-client-callbacks');
    };

    this['usercreate'] = function() {
      var connection = $('#api-create-user-connection-selector option:selected').val();

      var metadata = validateJsonText($('#sdk-create-jsoneditor').val());
      if (!metadata) {
        $('#usercreate-result').text('Wrong extra attributes');
        $('#usercreate-result').parent().addClass('error');
        return;
      }

      var user = {
        email: $('#api-create-user-email').val(),
        password: $('#api-create-user-password').val(),
        connection: connection,
        email_verified: $('#api-create-user-email-verified-selector option:selected').val() === 'true'
      };

      user = $.extend(user, metadata);

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users', '');
        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(user)
        });

      });
    };

    this['user-sendverificationemail'] = function() {
      var user_id = $('#user-id-selector-for-sendverificationemail option:selected').val();

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/send_verification_email');
        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({})
        });

      });
    };

    this['user-verificationticket'] = function() {
      var user_id = $('#user-id-selector-for-verificationticket option:selected').val();
      var body = {
        resultUrl: $('#api-user-verificationticket-resultUrl').val()
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/verification_ticket');
        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(body)
        });

      });
    };

    this['user-changepasswordticket'] = function() {
      var user_id = $('#user-id-selector-for-changepasswordticket option:selected').val();

      var body = {
        newPassword: $('#api-user-changepasswordticket-newPassword').val(),
        resultUrl: $('#api-user-changepasswordticket-resultUrl').val()
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/change_password_ticket', '');
        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(body)
        });

      });
    };

    this['usermetadataupdate'] = function() {
      var user_id = $('#user-id-selector option:selected').val();
      var metadata = {};

      try {
        metadata = validateJsonText($('#sdk-jsoneditor-user-metadata').val());
      } catch(err) {
        $('#usermetadataupdate-result').text('Wrong body');
        $('#usermetadataupdate-result').parent().addClass('error');
        return;
      }

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/metadata', '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(metadata)
        });

      });
    };

    this['usermetadatapatch'] = function() {
      var user_id = $('#user-patch-selector option:selected').val();
      var metadata = {};

      try {
        metadata = validateJsonText($('#sdk-patch-jsoneditor').val());
      } catch(err) {
        $('#usermetadatapatch-result').text('Wrong body');
        $('#usermetadatapatch-result').parent().addClass('error');
        return;
      }

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/metadata', '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'PATCH',
          contentType: 'application/json',
          data: JSON.stringify(metadata)
        });

      });
    };

    this['userpasswordupdate'] = function() {
      var user_id = $('#update-user-id-selector option:selected').val();

      var user = {
        password: $('#api-update-user-password').val(),
        verify: $('#api-update-user-password-verify-selector option:selected').val() === 'true'
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/password', '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(user)
        });

      });
    };

    this['userpasswordupdatebyemail'] = function() {
      var user = {
        email: $('#update-user-password-byemail-email-selector option:selected').val(),
        password: $('#api-update-user-password-byemail-newpassword').val(),
        connection: $('#api-update-user-password-byemail-connection-selector option:selected').val(),
        verify: $('#api-update-user-password-byemail-verify-selector option:selected').val() === 'true'
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user.email + '/password');

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(user)
        });

      });
    };

    this['useremailupdate'] = function() {
      var user_id = $('#update-user-id-selector-for-changeemail option:selected').val();

      var user = {
        email: $('#api-update-user-email').val(),
        verify: $('#api-update-user-email-verify-selector option:selected').val() === 'true'
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/email', '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          global: false,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(user)
        });

      });
    };

    this['usersdelete'] = function() {
      return getToken().then(function (token) {
        var url = urljoin(client.namespace, '/api/users');
        
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'DELETE'
        });
      });
    };

    this['userdelete'] = function() {
      var user_id = $('#user-id-selector-for-delete option:selected').val();

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id, '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'DELETE',
          success: function() {
            $('#user-id-selector-for-delete option:selected').remove();
          }
        });
      });
    };

    this['refreshtokendelete'] = function() {
      var user_id = $('#user-id-selector-for-delete-refresh-token option:selected').val();
      var refresh_token = $('#refreshtokendelete-token').val();

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/refresh_tokens/' + refresh_token);

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'DELETE'
        });
      });
    };
    
    this['allrules'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/rules');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };

    this['rulecreate'] = function() {
      var valid = $('#create-rule-form')[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var newRule = {
        name: $('#api-create-rule-name').val().trim(),
        status: $('#api-create-rule-status').val() === 'true',
        script: $('#api-create-rule-script').val().trim()
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/rules/', '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(newRule)
        });

      });
    };

    this['ruleupdate'] = function() {
      var valid = $('#update-rule-form')[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var name = $('#rules-put-selector').val().trim();
      var updatedRule = {
        status: $('#api-update-rule-status').val() === 'true',
        script: $('#api-update-rule-script').val().trim()
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/rules/' + name, '');

        return $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(updatedRule)
        });

      });
    };

    this['ruledelete'] = function() {
      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/rules/', $('#rule-delete-selector option:selected').val(), '');
        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'DELETE'
        });
      });
    };
    
    this['logsget'] = function() {
      var query = {
        sort: $('#logs-get-field-selector').val().trim() + ':' + $('#logs-get-sort-direction-selector').val().trim(),
        page: $('#logs-get-page-selector').val().trim(),
        per_page: $('#logs-get-items-selector').val().trim(),
        fields: $('#logs-get-fields').val().trim(),
        exclude_fields: $('#logs-get-exclude-fields-selector').val().trim()
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/logs?' + $.param(query));

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    };
    
    this['logget'] = function(){
      var id = $('#log-get-id-selector').val().trim();

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/logs/' + id);

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    }
    
    this['user-logs-get'] = function(){
      var user_id = $('#logs-by-user-id-selector').val().trim();

      var query = {
        page: $('#logs-by-user-id-page-selector').val().trim(),
        per_page: $('#logs-by-user-id-items-selector').val().trim(),
      };

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/users/' + user_id + '/logs?' + $.param(query));

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    }

    this['logs-search'] = function(){
      var search = $('#logs-search-query').val().trim();

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/logs?search=' + search);

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    }

    this['logs-checkpoint'] = function(){
      var from = $('#logs-checkpoint-from').val().trim();
      var take = $('#logs-checkpoint-take-selector').val().trim();

      return getToken().then(function(token) {
        var url = urljoin(client.namespace, '/api/logs?from=' + from + '&take=' + take);

        return $.ajax({
          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'GET'
        });
      });
    }


    this['dbconn-changePassword'] = function() {
      var valid = $('#dbconn-changePassword-form')[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var user = {
        email: $('#dbconn-changePassword-email').val().trim(),
        password: $('#dbconn-changePassword-password').val().trim(),
        connection: $('#dbconn-changePassword-connection-selector').val(),
        debug: $('#dbconn-changePassword-debug').val() === 'true'
      };

      var url = urljoin(client.namespace, '/dbconnections/change_password');

      return getToken().then(function(token) {
        $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          global: false,
          contentType: 'application/json',
          data: JSON.stringify(user)
        });
      });
    };

    this['dbconn-forgotPassword'] = function() {
      var valid = $('#dbconn-forgotPassword-form')[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var user = {
        email: $('#dbconn-forgotPassword-email').val().trim(),
        password: $('#dbconn-forgotPassword-password').val().trim(),
        connection: $('#dbconn-forgotPassword-connection-selector').val(),
        credentials: {
          id: $('#dbconn-forgotPassword-credentials-id').text().trim(),
          key: $('#dbconn-forgotPassword-credentials-key').text().trim(),
          algorithm: 'sha256'
        },
        debug: $('#dbconn-forgotPassword-debug').val() === 'true'
      };

      var url = urljoin(client.namespace, '/dbconnections/forgot_password');

      return getToken().then(function(token) {
        $.ajax({

          url: url,
          headers: {
            Authorization: 'Bearer ' + token.access_token
          },
          type: 'POST',
          global: false,
          contentType: 'application/json',
          data: JSON.stringify(user)
        });
      });
    };
  };
});
