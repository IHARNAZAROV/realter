(function ($) {
  'use strict'

  // Кэшируем часто используемые элементы
  const $window = $(window)
  const $document = $(document)
  const $htmlBody = $('html, body')

  /* ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ================= */

  /**
   * Анимация увеличения-уменьшения элементов при фильтрации слайдера Owl Carousel
   */
  function owlAnimateFilter () {
    $(this).addClass('item-scale')
    window.setTimeout(() => {
      $(this).removeClass('item-scale')
    }, 500)
  }

  /**
   * Центрирование Bootstrap-модалок по вертикали
   */
  function repositionModals () {
    const $dialog = $(this).find('.modal-dialog')
    $(this).css('display', 'block')
    $dialog.css('margin-top', Math.max(0, ($window.height() - $dialog.height()) / 2))
  }

  /**
   * Изменение цвета шапки при скролле страницы
   */
  function initOnScrollFunctions () {
    const scroll = $window.scrollTop()
    if (scroll >= 100) {
      $('.is-fixed').addClass('color-fill')
    } else {
      $('.is-fixed').removeClass('color-fill')
    }
  }

  /* ================= ИНИЦИАЛИЗАЦИЯ DOM ================= */

  document.addEventListener('DOMContentLoaded', function () {
    // Аккордеон FAQ
    const accordionHeads = document.querySelectorAll('.acod-head')
    accordionHeads.forEach(function (head) {
      head.addEventListener('click', function () {
        const parent = this.closest('.faq-1')
        const allHeads = parent.querySelectorAll('.acod-head')
        const isCurrentlyActive = this.classList.contains('acc-actives')

        allHeads.forEach(function (otherHead) {
          otherHead.classList.remove('acc-actives')
        })

        if (!isCurrentlyActive) {
          this.classList.add('acc-actives')
        }
      })
    })

    // Липкая шапка сайта
    const stickyHeader = document.querySelector('.sticky-header')
    if (stickyHeader) {
      const headerOffset = stickyHeader.offsetTop
      window.addEventListener('scroll', () => {
        if (window.scrollY > headerOffset) {
          stickyHeader.classList.add('is-stuck')
        } else {
          stickyHeader.classList.remove('is-stuck')
        }
      })
    }
  })

  /* ================= ИНИЦИАЛИЗАЦИЯ ОБЩИХ ФУНКЦИЙ ================= */

  function initCommonFunctions () {
    // Адаптивное видео
    $('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]').each(function () {
      $(this).wrap('<div class="ratio ratio-16x9"></div>')
    })

    // Галерея изображений
    const lightbox = GLightbox({
      selector: '.mfp-link',
      touchNavigation: true,
      loop: true
    })

    // Видеопопап
    // Инициализация видео-попапа
    const videoLightbox = GLightbox({
      selector: '.mfp-video',
      touchNavigation: true,
      loop: true,
      autoplayVideos: true // Автовоспроизведение при открытии
    })

    // Центровка модалок
    $('.modal').on('show.bs.modal', repositionModals)
    $window.on('resize', () => $('.modal:visible').each(repositionModals))

    // Кнопка прокрутки вверх
    $('button.scroltop').on('click', (e) => {
      e.preventDefault()
      $htmlBody.animate({ scrollTop: 0 }, 1000)
    })
    $window.on('scroll', () => {
      $('button.scroltop').fadeToggle($window.scrollTop() > 900 ? 1000 : 0)
    })

    // Мобильное меню
    $('.sub-menu, .mega-menu').parent('li').addClass('has-child')
    $("<div class='fa fa-angle-right submenu-toogle'></div>").insertAfter('.has-child > a')
    $('.has-child a + .submenu-toogle').on('click', function (ev) {
      $(this)
        .parent()
        .siblings('.has-child')
        .children('.sub-menu, .mega-menu')
        .slideUp(500)
        .parent()
        .removeClass('nav-active')
      $(this)
        .next($('.sub-menu, .mega-menu'))
        .slideToggle(500)
        .parent()
        .toggleClass('nav-active')
      ev.stopPropagation()
    })

    // Боковое мобильное меню
    $('#mobile-side-drawer').on('click', () => {
      $('.mobile-sider-drawer-menu').toggleClass('active')
    })

    // Слайдеры Owl Carousel
    const carousels = [
      { selector: '.testimonial-home', loop: true, autoplay: true, margin: 30, nav: false, dots: true, responsive: { 0: { items: 1 }, 991: { items: 1 } } },
      { selector: '.testimonial-home-two', loop: true, autoplay: false, margin: 30, nav: true, dots: false, responsive: { 0: { items: 1 }, 991: { items: 2 } } },
      { selector: '.about-home', loop: true, autoplay: true, margin: 30, nav: true, dots: true, responsive: { 0: { items: 1 }, 991: { items: 1 } } },
      { selector: '.project-carousel4', loop: true, autoplay: false, center: false, items: 3, margin: 40, nav: true, dots: false, responsive: { 0: { items: 1, margin: 15 }, 640: { items: 2, margin: 15 }, 800: { items: 3, margin: 20 }, 1200: { items: 4 } } },
      { selector: '.project-carousel1', loop: true, autoplay: false, center: false, items: 3, margin: 40, nav: true, dots: true, responsive: { 0: { items: 1 }, 768: { items: 1 }, 991: { items: 1 } } }
    ]
    carousels.forEach(carousel => {
      $(carousel.selector).owlCarousel({
        ...carousel,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>']
      })
    })

    // Контактная панель
    $('.contact-slide-show').on('click', () => $('.contact-slide-hide').animate({ right: '0px' }))
    $('.contact_close').on('click', () => $('.contact-slide-hide').animate({ right: '100%' }))

    /* ================= ЗАМЕНА WAYPOINTS (СЧЕТЧИК ЧИСЕЛ) ================= */

    function initCounterUp () {
      const counters = document.querySelectorAll('.counter')
      if (!counters.length) return

      // Настройки: анимация сработает, когда элемент появится на 50% экрана
      const observerOptions = { root: null, rootMargin: '0px', threshold: 0.5 }

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target
            // Убираем запятые, если есть, и парсим число
            const finalValue = parseFloat(el.innerText.replace(/,/g, ''))
            const duration = 5000 // Длительность 5 секунды
            const start = performance.now()

            const animate = (currentTime) => {
              const elapsed = currentTime - start
              const progress = Math.min(elapsed / duration, 1)

              // Плавное замедление (Easing)
              const easeOutQuad = (t) => t * (2 - t)

              const currentVal = progress === 1
                ? finalValue
                : Math.floor(easeOutQuad(progress) * finalValue)

              el.innerText = currentVal

              if (progress < 1) {
                requestAnimationFrame(animate)
              } else {
                obs.unobserve(el) // Выключаем наблюдение после завершения
              }
            }
            requestAnimationFrame(animate)
          }
        })
      }, observerOptions)

      counters.forEach(counter => observer.observe(counter))
    }

    initCounterUp()
  }

  /* ================= ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ ================= */

  function initOnLoadFunctions () {
    // Masonry-сетка
    if ($.fn.isotope) {
      const $container = $('.masonry-outer')
      $container.isotope({
        itemSelector: '.masonry-item',
        transitionDuration: '1s',
        originLeft: true,
        stamp: '.stamp'
      })
      $('.masonry-filter li').on('click', function () {
        const selector = $(this).find('a').attr('data-filter')
        $('.masonry-filter li').removeClass('active')
        $(this).addClass('active')
        $container.isotope({ filter: selector })
        return false
      })
    }

    // Прелоадер
    const loadingArea = document.querySelector('.loading-area')

    // Добавляем класс, который запустит анимацию
    loadingArea.classList.add('faded-out')

    // Карусель с фильтром
    const owlFilter = $('.owl-carousel-filter').owlCarousel({
      loop: false,
      autoplay: false,
      margin: 30,
      nav: true,
      dots: false,
      navText: ['<', '>'],
      responsive: {
        0: { items: 1 },
        540: { items: 2 },
        768: { items: 3 },
        991: { items: 3 },
        1136: { items: 4 },
        1366: { items: 5 }
      }
    })
    $('.btn-filter-wrap').on('click', '.btn-filter', function () {
      const filter_data = $(this).data('filter')
      if ($(this).hasClass('btn-active')) return
      $(this).addClass('btn-active').siblings().removeClass('btn-active')
      owlFilter.owlFilter(filter_data, function (_owl) {
        $(_owl).find('.item').each(owlAnimateFilter)
      })
    })

    // Слайдер с эффектом затухания
    $('.owl-fade-slider-one').owlCarousel({
      loop: true,
      autoplay: true,
      autoplayTimeout: 2000,
      margin: 30,
      nav: true,
      navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
      items: 1,
      dots: false,
      animateOut: 'fadeOut'
    })
  }

  /* ================= ПРИВЯЗКА СОБЫТИЙ ================= */

  $document.ready(function () {
    initCommonFunctions()
  })

  $window.on('load', function () {
    initOnLoadFunctions()
  })

  $window.on('scroll', function () {
    initOnScrollFunctions()
  })
})(jQuery)
