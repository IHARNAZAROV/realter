(function ($) {
  "use strict";

  // Кэшируем часто используемые элементы
  const $window = $(window);
  const $document = $(document);
  const $htmlBody = $("html, body");

  /* ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ================= */

  /**
   * Выравнивает высоту элементов в контейнере по наибольшему значению в каждой строке
   * @param {string} container - селектор элементов, которые нужно выровнять
   */
  function equalHeight(container) {

    const elements = $(container);
    if (!elements.length) return;

    elements.css("height", "auto");
    const groupedByRow = {};
    elements.each(function () {
      const topPosition = $(this).position().top;
      if (!groupedByRow[topPosition]) {
        groupedByRow[topPosition] = [];
      }
      groupedByRow[topPosition].push($(this));
    });

    for (const row in groupedByRow) {
      const rowElements = groupedByRow[row];
      let maxHeight = 0;
      rowElements.forEach((el) => {
        maxHeight = Math.max(maxHeight, el.height());
      });
      rowElements.forEach((el) => {
        el.height(maxHeight);
      });
    }
  }

  /**
   * Анимация увеличения-уменьшения элементов при фильтрации слайдера Owl Carousel
   */
  function owlAnimateFilter() {
    $(this).addClass("item-scale");
    window.setTimeout(() => {
      $(this).removeClass("item-scale");
    }, 500);
  }

  /**
   * Счётчик чисел, который запускается при появлении элемента в зоне видимости
   * @param {string} selector - селектор элементов с числовыми значениями
   * @param {object} options - настройки { delay, time }
   */
  function counterUp(selector, options) {
    const settings = {
      delay: 10,
      time: 4000,
      ...options
    };

    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      let finalValue = parseFloat(element.textContent.replace(/,/g, ''));
      let increment = finalValue / (settings.time / settings.delay);
      let current = 0;
      let isFloat = finalValue % 1 !== 0;

      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const counter = () => {
              current += increment;
              if (current >= finalValue) {
                current = finalValue;
                observer.unobserve(element);
              }

              element.textContent = isFloat ? current.toFixed(2) : Math.floor(current);

              if (current < finalValue) {
                setTimeout(counter, settings.delay);
              }
            };
            counter();
          }
        });
      }, { threshold: 0.5 });

      observer.observe(element);
    });
  }

  /**
   * Центрирование Bootstrap-модалок по вертикали
   */
  function repositionModals() {
    const $dialog = $(this).find(".modal-dialog");
    $(this).css("display", "block");
    $dialog.css("margin-top", Math.max(0, ($window.height() - $dialog.height()) / 2));
  }

  /**
   * Фиксированный футер с учётом высоты
   */
  function setFooterFixed() {
    const $footer = $(".site-footer");
    if ($footer.length) {
      $footer.css({ display: "block", height: "auto" });
      const footerHeight = $footer.outerHeight();
      $(".footer-fixed > .page-wraper").css("padding-bottom", footerHeight);
      $footer.css("height", footerHeight);
    }
  }

  /**
   * Изменение цвета шапки при скролле страницы
   */
  function initOnScrollFunctions() {
    const scroll = $window.scrollTop();
    if (scroll >= 100) {
      $(".is-fixed").addClass("color-fill");
    } else {
      $(".is-fixed").removeClass("color-fill");
    }
  }

  /* ================= ИНИЦИАЛИЗАЦИЯ DOM ================= */

  document.addEventListener("DOMContentLoaded", function () {
    // Аккордеон FAQ
    const accordionHeads = document.querySelectorAll(".acod-head");
    accordionHeads.forEach(function (head) {
      head.addEventListener("click", function () {
        const parent = this.closest(".faq-1");
        const allHeads = parent.querySelectorAll(".acod-head");
        const isCurrentlyActive = this.classList.contains("acc-actives");

        allHeads.forEach(function (otherHead) {
          otherHead.classList.remove("acc-actives");
        });

        if (!isCurrentlyActive) {
          this.classList.add("acc-actives");
        }
      });
    });

    // Липкая шапка сайта
    const stickyHeader = document.querySelector(".sticky-header");
    if (stickyHeader) {
      const headerOffset = stickyHeader.offsetTop;
      window.addEventListener("scroll", () => {
        if (window.scrollY > headerOffset) {
          stickyHeader.classList.add("is-stuck");
        } else {
          stickyHeader.classList.remove("is-stuck");
        }
      });
    }
  });

  /* ================= ИНИЦИАЛИЗАЦИЯ ОБЩИХ ФУНКЦИЙ ================= */

  function initCommonFunctions() {
    // Адаптивное видео
    $('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]').each(function () {
      $(this).wrap('<div class="ratio ratio-16x9"></div>');
    });

    // Галерея изображений
    $(".mfp-gallery").magnificPopup({
      delegate: ".mfp-link",
      type: "image",
      gallery: { enabled: true },
    });

    // Видеопопап
    $(".mfp-video").magnificPopup({ type: "iframe" });

    // Центровка модалок
    $(".modal").on("show.bs.modal", repositionModals);
    $window.on("resize", () => $(".modal:visible").each(repositionModals));

    // Кнопка прокрутки вверх
    $("button.scroltop").on("click", (e) => {
      e.preventDefault();
      $htmlBody.animate({ scrollTop: 0 }, 1000);
    });
    $window.on("scroll", () => {
      $("button.scroltop").fadeToggle($window.scrollTop() > 900 ? 1000 : 0);
    });

    // Фиксированный футер
    setFooterFixed();
    $window.on("resize", setFooterFixed);

    // Мобильное меню
    $(".sub-menu, .mega-menu").parent("li").addClass("has-child");
    $("<div class='fa fa-angle-right submenu-toogle'></div>").insertAfter(".has-child > a");
    $(".has-child a + .submenu-toogle").on("click", function (ev) {
      $(this)
        .parent()
        .siblings(".has-child")
        .children(".sub-menu, .mega-menu")
        .slideUp(500)
        .parent()
        .removeClass("nav-active");
      $(this)
        .next($(".sub-menu, .mega-menu"))
        .slideToggle(500)
        .parent()
        .toggleClass("nav-active");
      ev.stopPropagation();
    });

    // Боковое мобильное меню
    $("#mobile-side-drawer").on("click", () => {
      $(".mobile-sider-drawer-menu").toggleClass("active");
    });

    // Слайдеры Owl Carousel
    const carousels = [
      { selector: ".testimonial-home", loop: true, autoplay: true, margin: 30, nav: false, dots: true, responsive: { 0: { items: 1 }, 991: { items: 1 } } },
      { selector: ".testimonial-home-two", loop: true, autoplay: false, margin: 30, nav: true, dots: false, responsive: { 0: { items: 1 }, 991: { items: 2 } } },
      { selector: ".about-home", loop: true, autoplay: true, margin: 30, nav: true, dots: true, responsive: { 0: { items: 1 }, 991: { items: 1 } } },
      { selector: ".project-carousel4", loop: true, autoplay: false, center: false, items: 3, margin: 40, nav: true, dots: false, responsive: { 0: { items: 1, margin: 15 }, 640: { items: 2, margin: 15 }, 800: { items: 3, margin: 20 }, 1200: { items: 4 } } },
      { selector: ".project-carousel1", loop: true, autoplay: false, center: false, items: 3, margin: 40, nav: true, dots: true, responsive: { 0: { items: 1 }, 768: { items: 1 }, 991: { items: 1 } } },
    ];
    carousels.forEach(carousel => {
      $(carousel.selector).owlCarousel({
        ...carousel,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
      });
    });

    // Контактная панель
    $(".contact-slide-show").on("click", () => $(".contact-slide-hide").animate({ right: "0px" }));
    $(".contact_close").on("click", () => $(".contact-slide-hide").animate({ right: "100%" }));

    // Счётчик чисел
    window.onload = function () {
      counterUp('.counter', { delay: 10, time: 5000 });
    };
  }

  /* ================= ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ ================= */

  function initOnLoadFunctions() {
    // Masonry-сетка
    if ($.fn.isotope) {
      const $container = $(".masonry-outer");
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

    // Прелоадер
    const loadingArea = document.querySelector('.loading-area');

// Добавляем класс, который запустит анимацию
loadingArea.classList.add('faded-out');

    // Карусель с фильтром
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
      const filter_data = $(this).data("filter");
      if ($(this).hasClass("btn-active")) return;
      $(this).addClass("btn-active").siblings().removeClass("btn-active");
      owlFilter.owlFilter(filter_data, function (_owl) {
        $(_owl).find(".item").each(owlAnimateFilter);
      });
    });

    // Слайдер с эффектом затухания
    $(".owl-fade-slider-one").owlCarousel({
      loop: true,
      autoplay: true,
      autoplayTimeout: 2000,
      margin: 30,
      nav: true,
      navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
      items: 1,
      dots: false,
      animateOut: "fadeOut",
    });
  }

  /* ================= ПРИВЯЗКА СОБЫТИЙ ================= */

  $document.ready(function () {
    initCommonFunctions();
  });

  $window.on("load", function () {
    initOnLoadFunctions();
    equalHeight(".equal-wraper .equal-col");
  });

  $window.on("resize", function () {
    equalHeight(".equal-wraper .equal-col");
  });

  $window.on("scroll", function () {
    initOnScrollFunctions();
  });

})(jQuery);
