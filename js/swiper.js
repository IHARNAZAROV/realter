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

  /* ── ABOUT SLIDER ────────────────────────────────────── */
  const ABOUT_DELAY = 5000;

  const aboutEl = document.querySelector('.about-home-swiper');
  if (aboutEl) {
    const progressBar = aboutEl.querySelector('.about-swiper-bar');

    function startProgress() {
      if (!progressBar) return;
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.transition = 'width ' + ABOUT_DELAY + 'ms linear';
          progressBar.style.width = '100%';
        });
      });
    }

    function resetProgress() {
      if (!progressBar) return;
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
    }

    const aboutSwiper = new Swiper('.about-home-swiper', {
      slidesPerView: 1,
      speed: 700,
      loop: true,
      grabCursor: true,
      touchRatio: 1,
      navigation: {
        nextEl: '.about-swiper-next',
        prevEl: '.about-swiper-prev',
        disabledClass: 'swiper-button-disabled',
      },
      autoplay: {
        delay: ABOUT_DELAY,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      on: {
        init: startProgress,
        slideChangeTransitionStart: resetProgress,
        slideChangeTransitionEnd: startProgress,
        autoplayPause: resetProgress,
        autoplayResume: startProgress,
      },
    });
  }

})();
