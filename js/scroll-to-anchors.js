define(function (require) {

  var $ = require('jquery');

  function scrollToAnchors(enabled, target) {
    if (!enabled) {
      $('a.header-anchor').hide();
    } else {
      var selectedElement = document.location.hash;
      var selector = $(selectedElement, target);

      // If elements matching selectors where found
      if (selector.length) {

        var elementToScroll = {
          // if h2/h3 scroll to itself
          h2:   selector.offset().top,
          h3:   selector.offset().top,

          // if div (accordion-body) scroll to parent 
          div:  selector.parent().offset().top
        };

        selector.collapse('show');
        $('html, body').animate({
          scrollTop: elementToScroll[selector.prop('tagName').toLowerCase()] || selector.offset().top
        });
      }
    }

  }

  return scrollToAnchors;

});
