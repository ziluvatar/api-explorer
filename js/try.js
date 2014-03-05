define(function (require) {

  var $ = require('jquery');

  var ie = (function(){
    var undef,
        v = 3,
        div = document.createElement('div'),
        all = div.getElementsByTagName('i');

    while (
        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
        all[0]
    ) {

    }

    return v > 4 ? v : undef;
  }());

  return function (readOnly, target, executors) {
    function executeTry(e) {
      e.preventDefault();

      var that = $(this);

      var runnerName = $(this).attr('data-runner');
      var resultPanel = $('#' + $(this).attr('data-result'), target);

      var promise = executors[runnerName]();

      if (!promise) { return; }
      if(!resultPanel) { return; }

      if (ie < 10) {
        resultPanel.parents('pre').addClass('error');
        resultPanel.html('API Explorer is not supported in Internet Explorer 9 or lower');
        return;
      }

      resultPanel.html('');

      var button = $(this);
      var buttonIcon = $('i', this);

      buttonIcon.addClass('icon-spinner');
      buttonIcon.removeClass('icon-hand-right');
      button.attr('disabled', 'disabled');

      promise.then(function(result) {
        resultPanel.parents('pre').removeClass('error');

        if (typeof result === 'object') {
          resultPanel.html(JSON.stringify(result, null, 2));
        }
        else {
          resultPanel.html(result);
        }
      }, function(response){
        resultPanel.parents('pre').addClass('error');
        try{
          resultPanel.html(JSON.stringify(JSON.parse(response.responseText), null, 2));
        }catch (e) {
          resultPanel.html(response.responseText);
        }
      }).always(function () {
        buttonIcon.removeClass('icon-spinner');
        buttonIcon.addClass('icon-hand-right');
        button.removeAttr('disabled');

        $('html, body').animate({
          scrollTop: that.closest('.accordion-group').offset().top
        }, 'slow');
      });
    }

    if (readOnly) {
      var fixtures = {};

      // Yes, I would like to make this a list too but RequireJS won't parse it >:(
      var users = require('text!../fixtures/get--api-users.json');

      fixtures['get--api-users']                                              = users;
      fixtures['get--api-users--user_id-']                                    = users;
      fixtures['get--api-connections--connection--users']                     = users;
      fixtures['get--api-connections--connection--users-search--criteria-']   = users;
      fixtures['get--api-enterpriseconnections-users']                        = users;
      fixtures['get--api-enterpriseconnections-users']                        = users;
      fixtures['get--api-socialconnections-users']                            = users;
      fixtures['get--api-clients--client-id--users']                          = users;

      var connections = require('text!../fixtures/get--api-connections.json');

      fixtures['get--api-connections']                   = connections;
      fixtures['get--api-connections--connection-name-'] = connections;

      fixtures['get--api-clients']      = require('text!../fixtures/get--api-clients.json');

      fixtures['get--api-rules']        = require('text!../fixtures/get--api-rules.json');

      Object.keys(fixtures).forEach(function (fixtureKey) {
        fixtures[fixtureKey] = JSON.parse(fixtures[fixtureKey]);
      });

      $('.btn-tryme', target).each(function (index, e) {
        // We look for id attributes matching the fixture name so we don't disable those
        var btnTryMe = $(e);
        var accordionBody = $(btnTryMe.closest('div.accordion-body'));
        var matchingFixture = fixtures[accordionBody.attr('id')];

        if ( matchingFixture ) {
          btnTryMe.off('click');
          executors[btnTryMe.data('runner')] = function () {
            var deferred = $.Deferred();

            setTimeout(function () {
              deferred.resolve(matchingFixture);
            }, 0);

            return deferred.promise();
          };
          btnTryMe.on('click', executeTry);
        } else {
          btnTryMe.attr('disabled', 'disabled');
          btnTryMe.addClass('disabled');
        }
      });
    } else {
      $('.btn-tryme', target)
        .off('click')
        .on('click', executeTry);
    }

  };
});
