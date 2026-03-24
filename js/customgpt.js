"use strict";

(function () {
  let serviceSwiperInstance = null;

  function initServiceSlider() {
    const sliderEl = document.querySelector(".swiper-service-slider");
    if (!sliderEl) return;

    const wrapper = sliderEl.querySelector(".swiper-wrapper");
    if (!wrapper || !wrapper.children.length) return;

    if (serviceSwiperInstance) {
      serviceSwiperInstance.destroy(true, true);
      serviceSwiperInstance = null;
    }

    serviceSwiperInstance = new Swiper(sliderEl, {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 15,
      speed: 700,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      navigation: {
        prevEl: sliderEl.querySelector(".service-slider-prev"),
        nextEl: sliderEl.querySelector(".service-slider-next"),
      },
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 15 },
        991: { slidesPerView: 3, spaceBetween: 15 },
        1200: { slidesPerView: 3, spaceBetween: 15 },
      },
    });
  }

  function init() {
    initServiceSlider();
    window.addEventListener("recommended-slider-ready", initServiceSlider);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
