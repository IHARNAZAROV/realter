(function ($) {
  "use strict";

  const $window = $(window);
  const $document = $(document);

  function owlAnimateFilter() {
    $(this).addClass("item-scale");
    window.setTimeout(() => {
      $(this).removeClass("item-scale");
    }, 500);
  }

  /**
   * =====================================================
   * Isotope + OwlFilter + OwlFade
   * =====================================================
   */
  function initOnLoadFunctions() {

    // Isotope
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

    // Owl carousel filter
    if ($.fn.owlCarousel) {
      const owlFilter = $(".owl-carousel-filter").owlCarousel({
        loop: false,
        autoplay: false,
        margin: 30,
        nav: true,
        dots: false,
        navText: ["<", ">"],
        responsive: {
          0: { items: 1 },
          540: { items: 2 },
          768: { items: 3 },
          991: { items: 3 },
          1136: { items: 4 },
          1366: { items: 5 },
        },
      });

      $(".btn-filter-wrap").on("click", ".btn-filter", function () {
        const filterData = $(this).data("filter");
        if ($(this).hasClass("btn-active")) return;

        $(this).addClass("btn-active").siblings().removeClass("btn-active");

        owlFilter.owlFilter(filterData, function (_owl) {
          $(_owl).find(".item").each(owlAnimateFilter);
        });
      });
    }

    // Fade slider
    $(".owl-fade-slider-one").owlCarousel({
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

  $window.on("load", initOnLoadFunctions);

})(jQuery);
