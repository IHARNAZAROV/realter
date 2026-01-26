(function () {
  'use strict'

  const GTM_ID = 'GTM-WVJ6PL6L'
  const YM_ID = 105770392

  function getCookie (name) {
    const cookieStr = document.cookie || ''
    if (!cookieStr) return null

    const cookies = cookieStr.split('; ')
    for (let i = 0; i < cookies.length; i++) {
      const parts = cookies[i].split('=')
      const key = parts.shift()
      const val = parts.join('=')
      if (key === name) return val ? decodeURIComponent(val) : ''
    }
    return null
  }

  function parseConsent () {
    const raw = getCookie('cookieConsent')
    if (!raw) return null

    let decoded = raw
    try {
      decoded = decodeURIComponent(raw)
    } catch (e) {}

    try {
      const obj = JSON.parse(decoded)
      if (!obj || typeof obj !== 'object') return null

      return {
        necessary: true,
        analytics: !!obj.analytics,
        marketing: !!obj.marketing
      }
    } catch (e) {
      return null
    }
  }

  let gtmLoaded = false
  let ymLoaded = false

  function loadGTM (id) {
    if (gtmLoaded) return
    gtmLoaded = true

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })

    const s = document.createElement('script')
    s.async = true
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id)
    document.head.appendChild(s)
  }

  function loadYandexMetrika (id) {
    if (ymLoaded) return
    ymLoaded = true;

    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments)
        }
      m[i].l = 1 * new Date();
      (k = e.createElement(t)),
      (a = e.getElementsByTagName(t)[0]),
      (k.async = 1),
      (k.src = r),
      a.parentNode.insertBefore(k, a)
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym')

    window.ym(id, 'init', {
      webvisor: true,
      clickmap: true,
      accurateTrackBounce: true,
      trackLinks: true,
      ecommerce: 'dataLayer'
    })
  }

  function applyConsent (consent) {
    if (!consent || consent.necessary !== true) return

    if (consent.analytics) {
      loadGTM(GTM_ID)
      loadYandexMetrika(YM_ID)
    }
  }

  // Для баннера: применить прямо сейчас после клика
  window.__applyCookieConsent = function () {
    const consent = parseConsent()
    applyConsent(consent)
  }

  // Автоприменение при загрузке страницы (если согласие уже сохранено)
  window.addEventListener('load', function () {
    const consent = parseConsent()
    if (consent) applyConsent(consent)
  })
})()
