(function () {
  if (typeof Swiper === 'undefined') {
      return;
  }

  const heroSwiper = new Swiper('.swiper', {
    slidesPerView: 1,
    speed: 1200,
    loop: false,
    parallax: true,
    grabCursor: true,
    simulateTouch: true,
    allowTouchMove: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    }
  });

})();
