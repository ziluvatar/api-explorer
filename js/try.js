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

      var runnerName = $(this).attr('data-runner'),
        resultPanel = $('#' + $(this).attr('data-result'), target);

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
      }).then(function () {
        buttonIcon.removeClass('icon-spinner');
        buttonIcon.addClass('icon-hand-right');
        button.removeAttr('disabled');

        $('html, body').animate({
          scrollTop: that.closest('.accordion-group').offset().top
        }, 'slow');
      });
    }

    if (readOnly) {
      $('.btn-tryme', target).attr('disabled', 'disabled');
      $('.btn-tryme', target).addClass('disabled');
    } else {
      $('.btn-tryme', target)
        .off('click')
        .on('click', executeTry);
    }

  };
});
