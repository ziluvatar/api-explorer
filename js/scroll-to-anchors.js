define(function (require) {

  var $ = require('jquery');

  function scrollToAnchors(enabled, target) {
    if (!enabled) {
      var headerAnchor = $('a.header-anchor', target);

      // Hide link icons
      $('i', headerAnchor).hide();

      // Prevent clicking on titles
      headerAnchor.click(function () {
        return false;
      });

      return;
    }

    var selectedElement = document.location.hash;

    // Restore the anchor to the selected API Method
    if (selectedElement.indexOf('#!') === 0) {
      selectedElement = selectedElement.slice(2);
    }

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

    var accordionBody =  $('.accordion-body', target);
    accordionBody.on('show', function() {
      var accordionGroup = $(this).closest('.accordion-group');
      var accordionToggle = $('.accordion-toggle', accordionGroup);

      // Add #! to the begining of each of the API Methods to prevent following the
      // link to the anchor when clicking on it.
      window.location.hash = '!'+ accordionToggle.attr('href');
    });


  }

  return scrollToAnchors;

});
