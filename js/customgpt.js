(function ($) {
  'use strict'
  const $window = $(window)
  const $document = $(document)
  const $htmlBody = $('html, body')
  function owlAnimateFilter () {
    $(this).addClass('item-scale')
    window.setTimeout(() => { $(this).removeClass('item-scale') }, 500)
  }
  function repositionModals () {
    const $dialog = $(this).find('.modal-dialog')
    $(this).css('display', 'block')
    $dialog.css('margin-top', Math.max(0, ($window.height() - $dialog.height()) / 2))
  }
  function initOnScrollFunctions () {
    const scroll = $window.scrollTop()
    if (scroll >= 100) { $('.is-fixed').addClass('color-fill') } else { $('.is-fixed').removeClass('color-fill') }
  }
  document.addEventListener('DOMContentLoaded', function () {
    const accordionHeads = document.querySelectorAll('.acod-head')
    accordionHeads.forEach(function (head) {
      head.addEventListener('click', function () {
        const parent = this.closest('.faq-1')
        const allHeads = parent.querySelectorAll('.acod-head')
        const isCurrentlyActive = this.classList.contains('acc-actives')
        allHeads.forEach(function (otherHead) { otherHead.classList.remove('acc-actives') })
        if (!isCurrentlyActive) { this.classList.add('acc-actives') }
      })
    })
    const stickyHeader = document.querySelector('.sticky-header')
    if (stickyHeader) {
      const headerOffset = stickyHeader.offsetTop
      window.addEventListener('scroll', () => { if (window.scrollY > headerOffset) { stickyHeader.classList.add('is-stuck') } else { stickyHeader.classList.remove('is-stuck') } })
    }
  })
  function initCommonFunctions () {
    $('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]').each(function () { $(this).wrap('<div class="ratio ratio-16x9"></div>') })
    const lightbox = GLightbox({ selector: '.mfp-link', touchNavigation: !0, loop: !0 })
    const videoLightbox = GLightbox({ selector: '.mfp-video', touchNavigation: !0, loop: !0, autoplayVideos: !0 })
    $('.modal').on('show.bs.modal', repositionModals)
    $window.on('resize', () => $('.modal:visible').each(repositionModals))
    $('button.scroltop').on('click', (e) => {
      e.preventDefault()
      $htmlBody.animate({ scrollTop: 0 }, 1000)
    })
    $window.on('scroll', () => { $('button.scroltop').fadeToggle($window.scrollTop() > 900 ? 1000 : 0) })
    $('.sub-menu, .mega-menu').parent('li').addClass('has-child')
    $("<div class='fa fa-angle-right submenu-toogle'></div>").insertAfter('.has-child > a')
    $('.has-child a + .submenu-toogle').on('click', function (ev) {
      $(this).parent().siblings('.has-child').children('.sub-menu, .mega-menu').slideUp(500).parent().removeClass('nav-active')
      $(this).next($('.sub-menu, .mega-menu')).slideToggle(500).parent().toggleClass('nav-active')
      ev.stopPropagation()
    })
    $('#mobile-side-drawer').on('click', () => { $('.mobile-sider-drawer-menu').toggleClass('active') })
    const carousels = [{ selector: '.testimonial-home', loop: !0, autoplay: !0, margin: 30, nav: !1, dots: !0, responsive: { 0: { items: 1 }, 991: { items: 1 } } }, { selector: '.testimonial-home-two', loop: !0, autoplay: !1, margin: 30, nav: !0, dots: !1, responsive: { 0: { items: 1 }, 991: { items: 2 } } }, { selector: '.about-home', loop: !0, autoplay: !0, margin: 30, nav: !0, dots: !0, responsive: { 0: { items: 1 }, 991: { items: 1 } } }, { selector: '.project-carousel4', loop: !0, autoplay: !1, center: !1, items: 3, margin: 40, nav: !0, dots: !1, responsive: { 0: { items: 1, margin: 15 }, 640: { items: 2, margin: 15 }, 800: { items: 3, margin: 20 }, 1200: { items: 4 } } }, { selector: '.project-carousel1', loop: !0, autoplay: !1, center: !1, items: 3, margin: 40, nav: !0, dots: !0, responsive: { 0: { items: 1 }, 768: { items: 1 }, 991: { items: 1 } } }]
    carousels.forEach(carousel => { $(carousel.selector).owlCarousel({ ...carousel, navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'] }) })
    $('.contact-slide-show').on('click', () => $('.contact-slide-hide').animate({ right: '0px' }))
    $('.contact_close').on('click', () => $('.contact-slide-hide').animate({ right: '100%' }))
    function initCounterUp () {
      const counters = document.querySelectorAll('.counter')
      if (!counters.length) return
      const observerOptions = { root: null, rootMargin: '0px', threshold: 0.5 }
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target
            const finalValue = parseFloat(el.innerText.replace(/,/g, ''))
            const duration = 5000
            const start = performance.now()
            const animate = (currentTime) => {
              const elapsed = currentTime - start
              const progress = Math.min(elapsed / duration, 1)
              const easeOutQuad = (t) => t * (2 - t)
              const currentVal = progress === 1 ? finalValue : Math.floor(easeOutQuad(progress) * finalValue)
              el.innerText = currentVal
              if (progress < 1) { requestAnimationFrame(animate) } else { obs.unobserve(el) }
            }
            requestAnimationFrame(animate)
          }
        })
      }, observerOptions)
      counters.forEach(counter => observer.observe(counter))
    }
    initCounterUp()
  }
  function initOnLoadFunctions () {
    if ($.fn.isotope) {
      const $container = $('.masonry-outer')
      $container.isotope({ itemSelector: '.masonry-item', transitionDuration: '1s', originLeft: !0, stamp: '.stamp' })
      $('.masonry-filter li').on('click', function () {
        const selector = $(this).find('a').attr('data-filter')
        $('.masonry-filter li').removeClass('active')
        $(this).addClass('active')
        $container.isotope({ filter: selector })
        return !1
      })
    }
    const owlFilter = $('.owl-carousel-filter').owlCarousel({ loop: !1, autoplay: !1, margin: 30, nav: !0, dots: !1, navText: ['<', '>'], responsive: { 0: { items: 1 }, 540: { items: 2 }, 768: { items: 3 }, 991: { items: 3 }, 1136: { items: 4 }, 1366: { items: 5 } } })
    $('.btn-filter-wrap').on('click', '.btn-filter', function () {
      const filter_data = $(this).data('filter')
      if ($(this).hasClass('btn-active')) return
      $(this).addClass('btn-active').siblings().removeClass('btn-active')
      owlFilter.owlFilter(filter_data, function (_owl) { $(_owl).find('.item').each(owlAnimateFilter) })
    })
    $('.owl-fade-slider-one').owlCarousel({ loop: !0, autoplay: !0, autoplayTimeout: 2000, margin: 30, nav: !0, navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'], items: 1, dots: !1, animateOut: 'fadeOut' })
  }
  $document.ready(function () { initCommonFunctions() })
  $window.on('load', function () { initOnLoadFunctions() })
  $window.on('scroll', function () { initOnScrollFunctions() })
})(jQuery)
