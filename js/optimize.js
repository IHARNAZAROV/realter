'use strict'

/**
 * =====================================================
 * DOM READY
 * =====================================================
 */
document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('loaded')

  initMenuActiveAndUnderline()
  initLightbox()
  initCarousels()
  initContactSlide()
  initCounterUp()
  wrapResponsiveIframes()
  initGlobalClickDelegation()
  initStickyHeader()
  initMasonryFilterAnimated()
  initMasonryFilter()
})

/**
 * =====================================================
 * Menu active + underline
 * =====================================================
 */
function initMenuActiveAndUnderline () {
  const links = document.querySelectorAll('.header-nav .navbar-nav li a')
  if (!links.length) return

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
  let activeLink = null

  links.forEach(link => {
    const li = link.closest('li')
    if (!li) return

    li.classList.remove('active')

    let href = link.getAttribute('href')
    if (!href) return
    href = href.replace(/\/$/, '') || '/'

    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      li.classList.add('active')
      activeLink = link
    }
  })

  function setUnderline (link, scale, x) {
    if (!link) return
    link.style.setProperty('--scale', scale)
    link.style.setProperty('--x', x)
  }

  if (activeLink) setUnderline(activeLink, 1, '50%')

  links.forEach(link => {
    link.addEventListener('mouseenter', e => {
      const rect = link.getBoundingClientRect()
      setUnderline(link, 1, e.clientX - rect.left + 'px')
      if (activeLink && activeLink !== link) setUnderline(activeLink, 0, '50%')
    })

    link.addEventListener('mouseleave', () => {
      setUnderline(link, 0, '50%')
      if (activeLink) setUnderline(activeLink, 1, '50%')
    })
  })
}

/**
 * =====================================================
 * GLightbox (mfp-link + mfp-video)
 * =====================================================
 */
function initLightbox () {
  if (typeof GLightbox !== 'function') return

  if (document.querySelector('.mfp-link')) {
    GLightbox({
      selector: '.mfp-link',
      touchNavigation: true,
      loop: true
    })
  }

  if (document.querySelector('.mfp-video')) {
    GLightbox({
      selector: '.mfp-video',
      touchNavigation: true,
      loop: true,
      autoplayVideos: true
    })
  }
}

/**
 * =====================================================
 * OwlCarousel (jQuery plugin)
 * =====================================================
 */
function initCarousels () {
  if (!window.jQuery || !jQuery.fn.owlCarousel) return

  const carousels = [
    {
      selector: '.testimonial-home',
      loop: true,
      autoplay: true,
      margin: 30,
      nav: false,
      dots: true,
      responsive: { 0: { items: 1 }, 991: { items: 1 } }
    },
    {
      selector: '.testimonial-home-two',
      loop: true,
      autoplay: false,
      margin: 30,
      nav: true,
      dots: false,
      responsive: { 0: { items: 1 }, 991: { items: 2 } }
    },
    {
      selector: '.about-home',
      loop: true,
      autoplay: true,
      margin: 30,
      nav: true,
      dots: true,
      responsive: { 0: { items: 1 }, 991: { items: 1 } }
    },
    {
      selector: '.project-carousel4',
      loop: true,
      autoplay: false,
      items: 3,
      margin: 40,
      nav: true,
      dots: false,
      responsive: {
        0: { items: 1, margin: 15 },
        640: { items: 2, margin: 15 },
        800: { items: 3, margin: 20 },
        1200: { items: 4 }
      }
    },
    {
      selector: '.project-carousel1',
      loop: true,
      autoplay: false,
      items: 3,
      margin: 40,
      nav: true,
      dots: true,
      responsive: { 0: { items: 1 }, 768: { items: 1 }, 991: { items: 1 } }
    }
  ]

  carousels.forEach(cfg => {
    const $el = jQuery(cfg.selector)
    if (!$el.length) return

    $el.owlCarousel({
      ...cfg,
      navText: [
        '<i class="fa fa-angle-left"></i>',
        '<i class="fa fa-angle-right"></i>'
      ]
    })
  })
}

/**
 * =====================================================
 * Contact slide
 * =====================================================
 */
function initContactSlide () {
  const panel = document.querySelector('.contact-slide-hide')
  if (!panel) return

  document.querySelector('.contact-slide-show')?.addEventListener('click', () => {
    panel.style.right = '0px'
  })

  document.querySelector('.contact_close')?.addEventListener('click', () => {
    panel.style.right = '100%'
  })
}

/**
 * =====================================================
 * CounterUp
 * =====================================================
 */
function initCounterUp () {
  const counters = document.querySelectorAll('.counter')
  if (!counters.length) return

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return

      const el = entry.target
      const finalValue = parseInt(el.innerText.replace(/\D/g, ''), 10)
      const start = performance.now()
      const duration = 5000

      function animate (time) {
        const progress = Math.min((time - start) / duration, 1)
        const eased = progress * (2 - progress)
        el.innerText = Math.floor(eased * finalValue)
        if (progress < 1) requestAnimationFrame(animate)
      }

      requestAnimationFrame(animate)
      observer.unobserve(el)
    })
  }, { threshold: 0.5 })

  counters.forEach(el => observer.observe(el))
}

/**
 * =====================================================
 * iframe wrap
 * =====================================================
 */
function wrapResponsiveIframes () {
  document.querySelectorAll(
    'iframe[src*="youtube.com"], iframe[src*="vimeo.com"]'
  ).forEach(iframe => {
    if (iframe.parentElement.classList.contains('ratio')) return
    const wrapper = document.createElement('div')
    wrapper.className = 'ratio ratio-16x9'
    iframe.parentNode.insertBefore(wrapper, iframe)
    wrapper.appendChild(iframe)
  })
}

/**
 * =====================================================
 * Global click delegation
 * =====================================================
 */
function initGlobalClickDelegation () {
  document.addEventListener('click', e => {
    handleAccordion(e)
    handleSubmenu(e)
    handleMobileDrawer(e)
  })
}

/**
 * =====================================================
 * Accordion
 * =====================================================
 */
function handleAccordion (e) {
  const head = e.target.closest('.acod-head')
  if (!head) return

  const faq = head.closest('.faq-1')
  if (!faq) return

  faq.querySelectorAll('.acod-head')
    .forEach(h => h.classList.remove('acc-actives'))

  head.classList.toggle('acc-actives')
}

/**
 * =====================================================
 * Mobile drawer
 * =====================================================
 */
function handleMobileDrawer (e) {
  const btn = e.target.closest('#mobile-side-drawer')
  if (!btn) return

  const drawer = document.querySelector('.mobile-sider-drawer-menu')
  if (!drawer) return

  e.preventDefault()
  drawer.classList.toggle('active')
}

/**
 * =====================================================
 * Sticky header
 * =====================================================
 */
function initStickyHeader () {
  const header = document.querySelector('.sticky-header')
  const fixed = document.querySelectorAll('.is-fixed')
  if (!header || !fixed.length) return

  const sentinel = document.createElement('div')
  header.before(sentinel)

  new IntersectionObserver(([entry]) => {
    const stuck = !entry.isIntersecting
    header.classList.toggle('is-stuck', stuck)
    fixed.forEach(el => el.classList.toggle('color-fill', stuck))
  }).observe(sentinel)
}
/**
 * =====================================================
 * Bootstrap modal vertical centering
 * =====================================================
 */
(function () {
  'use strict'

  function repositionModal (modal) {
    const dialog = modal.querySelector('.modal-dialog')
    if (!dialog) return

    modal.style.display = 'block'

    const dialogHeight = dialog.getBoundingClientRect().height
    const windowHeight = window.innerHeight

    const marginTop = Math.max(0, (windowHeight - dialogHeight) / 2)
    dialog.style.marginTop = marginTop + 'px'
  }

  document.addEventListener('shown.bs.modal', function (e) {
    const modal = e.target
    if (!modal.classList.contains('modal')) return
    repositionModal(modal)
  })

  window.addEventListener('resize', function () {
    const openedModal = document.querySelector('.modal.show')
    if (openedModal) {
      repositionModal(openedModal)
    }
  })
})()

/**
 * =====================================================
 * Submenu handler
 * =====================================================
 */
function handleSubmenu (e) {
  const toggle = e.target.closest('.submenu-toogle')
  if (!toggle) return

  const li = toggle.parentElement
  if (!li) return

  const submenu = li.querySelector(':scope > .sub-menu, :scope > .mega-menu')
  if (!submenu) return

  const isOpen = li.classList.contains('nav-active')

  // закрываем соседние пункты
  const siblings = li.parentElement.querySelectorAll('.has-child.nav-active')
  siblings.forEach(item => {
    if (item !== li) {
      item.classList.remove('nav-active')
      const sm = item.querySelector(':scope > .sub-menu, :scope > .mega-menu')
      if (sm) sm.style.display = 'none'
      const t = item.querySelector(':scope > .submenu-toogle')
      if (t) t.setAttribute('aria-expanded', 'false')
    }
  })

  // toggle текущий
  li.classList.toggle('nav-active', !isOpen)
  submenu.style.display = isOpen ? 'none' : 'block'
  toggle.setAttribute('aria-expanded', String(!isOpen))

  e.preventDefault()
}

function initMasonryFilter () {
  const container = document.querySelector('.masonry-outer')
  if (!container) return

  document.addEventListener('click', e => {
    const link = e.target.closest('.masonry-filter a')
    if (!link) return

    e.preventDefault()

    const filter = link.dataset.filter

    document
      .querySelectorAll('.masonry-filter li')
      .forEach(li => li.classList.remove('active'))

    link.parentElement.classList.add('active')

    container.querySelectorAll('.masonry-item').forEach(item => {
      if (filter === '*' || item.matches(filter)) {
        item.hidden = false
      } else {
        item.hidden = true
      }
    })

    // пересчитать masonry
  })
}

function initMasonryFilterAnimated () {
  const container = document.querySelector('.masonry-outer')
  if (!container) return

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-filter]')
    if (!btn) return

    e.preventDefault()
    const filter = btn.dataset.filter

    document
      .querySelectorAll('[data-filter]')
      .forEach(b => b.classList.remove('btn-active'))
    btn.classList.add('btn-active')

    const items = container.querySelectorAll('.masonry-item')

    items.forEach(item => {
      const match =
        filter === '*' ||
        item.classList.contains(filter.replace('.', ''))

      if (match) {
        item.classList.remove('is-hiding')
      } else {
        item.classList.add('is-hiding')
      }
    })
  })
}
