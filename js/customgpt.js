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
   * Masonry + OwlCarousel (filters, fade slider, service slider)
   * =====================================================
   */
  function initOnLoadFunctions() {
    // =========================
    // MASONRY (VANILLA)
    // =========================
    const container = document.querySelector(".masonry-outer");

    if (container && window.Masonry) {
      const items = Array.from(container.querySelectorAll(".masonry-item"));
      const masonry = new Masonry(container, {
        itemSelector: ".masonry-item",
        percentPosition: true,
      });

      document.addEventListener("click", (e) => {
        const link = e.target.closest(".masonry-filter a");
        if (!link) return;

        e.preventDefault();
        const filter = link.dataset.filter || "*";

        document
          .querySelectorAll(".masonry-filter li")
          .forEach((li) => li.classList.remove("active"));
        link.parentElement?.classList.add("active");

        items.forEach((item) => {
          item.style.display =
            filter === "*" || item.matches(filter) ? "" : "none";
        });

        masonry.reloadItems();
        masonry.layout();
      });
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

      // Service slider
      const $serviceSlider = $(".service-slider");
      if ($serviceSlider.length) {
        $serviceSlider.owlCarousel({
          loop: true,
          autoplay: true,
          autoplayTimeout: 4000, // каждые 4 секунды
          autoplayHoverPause: true, // пауза при наведении мышью
          smartSpeed: 700, // плавность анимации
          center: false,
          margin: 15,
          nav: true,
          dots: false,
          navText: [
            `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
               <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`,
            `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
               <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`,
          ],
          responsive: {
            0: { items: 1 },
            768: { items: 2 },
            991: { items: 3 },
            1200: { items: 3 },
          },
        });
      }
    }
  }

  $window.on("load", initOnLoadFunctions);
})(jQuery);
