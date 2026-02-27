(function () {
  "use strict";

  if (typeof window.Swiper !== "function") return;

  function initAboutSwiper() {
    const el = document.querySelector(".about-home-swiper");
    if (!el) return;

    const dotsEl = el.querySelector(".owl-dots");
    const autoplayDelay = 5000;

    function resetProgress() {
      if (!dotsEl) return;
      dotsEl.style.setProperty("--progress-transition", "0ms");
      dotsEl.style.setProperty("--progress-width", "0%");
    }

    function startProgress() {
      if (!dotsEl) return;
      resetProgress();
      requestAnimationFrame(() => {
        dotsEl.style.setProperty("--progress-transition", `${autoplayDelay}ms`);
        dotsEl.style.setProperty("--progress-width", "100%");
      });
    }

    const swiper = new Swiper(el, {
      loop: true,
      speed: 700,
      autoplay: {
        delay: autoplayDelay,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: el.querySelector(".owl-next"),
        prevEl: el.querySelector(".owl-prev"),
      },
      pagination: {
        el: dotsEl,
        clickable: true,
        renderBullet(index, className) {
          return `<button class="owl-dot ${className}" type="button" aria-label="Слайд ${index + 1}"><span></span></button>`;
        },
      },
      on: {
        init: startProgress,
        slideChangeTransitionStart: resetProgress,
        slideChangeTransitionEnd: startProgress,
      },
    });

    el.addEventListener("mouseenter", () => {
      swiper.autoplay.stop();
      resetProgress();
    });

    el.addEventListener("mouseleave", () => {
      swiper.autoplay.start();
      startProgress();
    });
  }

  function initTestimonialSwiper() {
    const el = document.querySelector(".testimonial-home-swiper");
    if (!el) return;

    new Swiper(el, {
      loop: true,
      speed: 600,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: el.querySelector(".owl-dots"),
        clickable: true,
        renderBullet(index, className) {
          return `<button class="owl-dot ${className}" type="button" aria-label="Отзыв ${index + 1}"><span></span></button>`;
        },
      },
      slidesPerView: 1,
      spaceBetween: 30,
    });
  }

  function initServiceSwiper() {
    const el = document.querySelector(".service-slider-swiper");
    if (!el) return;

    new Swiper(el, {
      loop: true,
      speed: 700,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      navigation: {
        nextEl: el.querySelector(".owl-next"),
        prevEl: el.querySelector(".owl-prev"),
      },
      slidesPerView: 1,
      spaceBetween: 15,
      breakpoints: {
        768: { slidesPerView: 2 },
        991: { slidesPerView: 3 },
        1200: { slidesPerView: 3 },
      },
    });
  }

  function init() {
    initAboutSwiper();
    initTestimonialSwiper();
    initServiceSwiper();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
