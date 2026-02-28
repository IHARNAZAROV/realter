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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAboutSwiper);
  } else {
    initAboutSwiper();
  }
})();
