(function ($) {
  "use strict";

  const $window = $(window);

  function owlAnimateFilter() {
    $(this).addClass("item-scale");
    window.setTimeout(() => {
      $(this).removeClass("item-scale");
    }, 500);
  }

  /**
   * =====================================================
   * Isotope + OwlCarousel (filters, fade slider, service slider)
   * =====================================================
   */
  function initOnLoadFunctions() {
    // =========================
    // ISOTOPE
    // =========================
    if ($.fn.isotope) {
      const $container = $(".masonry-outer");

      if ($container.length) {
        $container.isotope({
          itemSelector: ".masonry-item",
          transitionDuration: "1s",
          originLeft: true,
          stamp: ".stamp",
        });

        $(".masonry-filter li").on("click", function () {
          const selector = $(this).find("a").attr("data-filter");
          $(".masonry-filter li").removeClass("active");
          $(this).addClass("active");
          $container.isotope({ filter: selector });
          return false;
        });
      }
    }

    // =========================
    // OWL CAROUSEL
    // =========================
    if ($.fn.owlCarousel) {
      
      // Fade slider
      const $fadeSlider = $(".owl-fade-slider-one");
      if ($fadeSlider.length) {
        $fadeSlider.owlCarousel({
          loop: true,
          autoplay: true,
          autoplayTimeout: 2000,
          margin: 30,
          nav: true,
          navText: [
            '<i class="fa fa-angle-left"></i>',
            '<i class="fa fa-angle-right"></i>',
          ],
          items: 1,
          dots: false,
          animateOut: "fadeOut",
        });
      }

    }
  }

  $window.on("load", initOnLoadFunctions);
})(jQuery);
