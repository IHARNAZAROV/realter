(function () {
  'use strict'

  const DATA_URL = '/data/objects.json'

  // =========================
  // HELPERS
  // =========================
  function qs (selector, root = document) {
    return root.querySelector(selector)
  }

  function isFilled (value) {
    return value !== null && value !== undefined && String(value).trim() !== ''
  }

  function safeJoin (parts, sep = ' • ') {
    return parts.filter(isFilled).join(sep)
  }

  function formatPrice (value) {
    if (typeof value !== 'number') return ''
    return value.toLocaleString('ru-RU')
  }

  function getSlugFromUrl () {
    const url = new URL(window.location.href)

    // 1) обычный вариант: ?slug=...
    const slugFromQuery = url.searchParams.get('slug')
    if (slugFromQuery && slugFromQuery.trim()) return slugFromQuery.trim()

    // 2) ЧПУ вариант: /object/slug
    const path = url.pathname.replace(/^\/+|\/+$/g, '') // убираем / в начале/конце
    const parts = path.split('/')

    if (parts.length === 2 && parts[0] === 'object' && parts[1]) {
      return parts[1].trim()
    }

    return ''
  }

  async function fetchObjects () {
    const res = await fetch(DATA_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error('Не удалось загрузить JSON объектов')
    return await res.json()
  }

  function setTextIfExists (el, text) {
    if (!el) return

    if (!isFilled(text)) {
      el.style.display = 'none'
      return
    }

    el.style.display = ''
    el.textContent = text
  }

  function setHtmlIfExists (el, html) {
    if (!el) return

    if (!isFilled(html)) {
      el.style.display = 'none'
      return
    }

    el.style.display = ''
    el.innerHTML = html
  }

  // =========================
  // TOP TITLE (H2)
  // =========================
  function renderTopTitle (obj) {
    const title = obj && obj.title ? obj.title : 'Детали объекта'

    const topTitleEl = qs('[data-page-title]')
    if (topTitleEl) {
      topTitleEl.textContent = title
      return
    }

    const fallbackH2 = qs('.banner-title-name h2.m-tb0')
    if (fallbackH2) {
      fallbackH2.textContent = title
      return
    }

    console.warn(
      'Не найден заголовок страницы ни по [data-page-title], ни по .banner-title-name h2.m-tb0'
    )
  }

  // =========================
  // DOCUMENT TITLE
  // =========================
  function setDocumentTitle (obj) {
    if (obj && obj.title) {
      document.title = `${obj.title} — ГермесГрупп`
    }
  }

  // =========================
  // GALLERY
  // =========================
  function renderGallery (images) {
    const galleryWrap = qs('[data-gallery]')
    if (!galleryWrap) return

    const safeImages = Array.isArray(images) ? images.filter(isFilled) : []
    const finalImages = safeImages.length
      ? safeImages
      : ['/images/objects/pic1.webp']

    galleryWrap.innerHTML = finalImages
      .slice(0, 12)
      .map((src) => {
        return `
          <div class="col-md-6">
            <div class="project-detail-pic m-b30">
              <div class="sx-media">
                <img src="${src}" alt="">
              </div>
            </div>
          </div>
        `
      })
      .join('')
  }

  // =========================
  // META LIST (верхний список справа)
  // =========================
  function renderMeta (obj) {
    const metaList = qs('[data-meta-list]')
    if (!metaList) return

    const rows = []

    if (isFilled(obj.type)) { rows.push({ label: 'Тип объекта', value: obj.type }) }

    const location = [obj.city, obj.address].filter(isFilled).join(', ')
    if (isFilled(location)) rows.push({ label: 'Локация', value: location })

    if (isFilled(obj.rooms)) { rows.push({ label: 'Количество комнат', value: String(obj.rooms) }) }
    if (isFilled(obj.areaTotal)) { rows.push({ label: 'Площадь', value: `${obj.areaTotal} м²` }) }

    if (isFilled(obj.floor) && isFilled(obj.floorsTotal)) {
      rows.push({ label: 'Этаж', value: `${obj.floor}/${obj.floorsTotal}` })
    }

    if (isFilled(obj.yearBuilt)) { rows.push({ label: 'Год', value: String(obj.yearBuilt) }) }

    // Цена (если есть)
    const priceParts = []
    if (typeof obj.priceBYN === 'number') { priceParts.push(`${formatPrice(obj.priceBYN)} BYN`) }
    if (typeof obj.priceUSD === 'number') { priceParts.push(`${formatPrice(obj.priceUSD)} USD`) }
    if (priceParts.length) { rows.push({ label: 'Цена', value: priceParts.join(' • ') }) }

    if (!rows.length) {
      metaList.innerHTML = ''
      const block = metaList.closest('.product-block')
      if (block) block.style.display = 'none'
      return
    }

    const block = metaList.closest('.product-block')
    if (block) block.style.display = ''

    metaList.innerHTML = rows
      .map((row) => {
        return `
<li style="display:flex; justify-content:space-between; gap:12px;">
        <span style="font-weight:800;color:#155945">${row.label}</span>
        <span>${row.value}</span>
      </li>
        `
      })
      .join('')
  }

  // =========================
  // RIGHT PANEL TEXT
  // =========================
  function renderRightText (obj) {
    const titleEl = qs('[data-object-title]')
    const subtitleEl = qs('[data-object-subtitle]')
    const descEl = qs('[data-object-description]')

    // 1) Заголовок справа
    setTextIfExists(titleEl, obj.title || '')

    // Заголовок: на всю ширину + по центру (железно)
    if (titleEl) {
      titleEl.style.setProperty('display', 'block', 'important')
      titleEl.style.setProperty('width', '100%', 'important')
      titleEl.style.setProperty('text-align', 'center', 'important')
      titleEl.style.setProperty('margin', '0 0 10px 0', 'important')
      titleEl.style.setProperty('padding', '0', 'important')
      titleEl.style.setProperty('font-weight', '700', 'important')
      titleEl.style.setProperty('line-height', '1.25', 'important')
    }

    // 2) Подзаголовок (разный для Дом / Квартира)
    const typeLower = String(obj.type || '')
      .trim()
      .toLowerCase()

    if (subtitleEl) {
      subtitleEl.style.setProperty('display', 'block', 'important')
      subtitleEl.style.setProperty('width', '100%', 'important')
      subtitleEl.style.setProperty('text-align', 'center', 'important')
      subtitleEl.style.setProperty('margin', '0 0 14px 0', 'important')
      subtitleEl.style.setProperty('padding', '0', 'important')
      subtitleEl.style.setProperty('opacity', '0.9', 'important')
    }

    // Для домов: Участок • Вода • Отопление
    if (typeLower === 'дом') {
      const plotPart = isFilled(obj.areaPlot)
        ? `Участок ${obj.areaPlot} соток`
        : ''
      const waterPart = isFilled(obj.water) ? `Вода: ${obj.water}` : ''
      const heatingPart = isFilled(obj.heating)
        ? `Отопление: ${obj.heating}`
        : ''

      const houseLine = safeJoin([plotPart, waterPart, heatingPart], ' • ')
      setTextIfExists(subtitleEl, houseLine)

      if (!isFilled(houseLine) && subtitleEl) {
        subtitleEl.style.display = 'none'
      }
    } else {
      // Для квартир: Тип • Площадь • Цена
      const typePart = isFilled(obj.type) ? obj.type : ''
      const areaPart = isFilled(obj.areaTotal) ? `${obj.areaTotal} м²` : ''

      let pricePart = ''
      if (typeof obj.priceBYN === 'number') {
        pricePart = `${formatPrice(obj.priceBYN)} BYN`
      } else if (typeof obj.priceUSD === 'number') {
        pricePart = `${formatPrice(obj.priceUSD)} USD`
      }

      const flatLine = safeJoin([typePart, areaPart, pricePart], ' • ')
      setTextIfExists(subtitleEl, flatLine)

      if (!isFilled(flatLine) && subtitleEl) {
        subtitleEl.style.display = 'none'
      }
    }

    // 3) Остальной контент ниже
    const blocks = []

    // Описание
    if (isFilled(obj.description)) {
      blocks.push(`<p>${obj.description}</p>`)
    }

    // Преимущества
    const features = Array.isArray(obj.features)
      ? obj.features.filter(isFilled)
      : []
    if (features.length) {
      blocks.push(`
      <p><b>Преимущества:</b></p>
      <ul style="margin: 0 0 12px 18px;">
        ${features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    `)
    }

    // Дополнительные строения
    const addBuild = Array.isArray(obj.additionalBuildings)
      ? obj.additionalBuildings.filter(isFilled)
      : []
    if (addBuild.length) {
      blocks.push(`
      <p><b>Дополнительно:</b></p>
      <ul style="margin: 0 0 12px 18px;">
        ${addBuild.map((b) => `<li>${b}</li>`).join('')}
      </ul>
    `)
    }

    // Подпись агентства (всегда)
    blocks.push(`
    <p style="margin-top: 14px;">
      📍 Агентство недвижимости «ГермесГрупп»<br>
      г. Лида, б-р Князя Гедимина, 12, пом. 9.
    </p>
  `)

    // Номер договора (только если есть)
    if (isFilled(obj.contractNumber)) {
      blocks.push(
        `<p style="margin-top: 10px;"><small>${obj.contractNumber}</small></p>`
      )
    }

    setHtmlIfExists(descEl, blocks.join(''))
  }

  // =========================
  // NOT FOUND
  // =========================
  function renderNotFound (slug) {
    renderTopTitle({ title: 'Объект не найден' })

    const rightBlock = qs('.project-detail-containt-2 .bg-white')
    if (!rightBlock) return

    rightBlock.innerHTML = `
      <div class="bg-white text-black p-a20 shadow">
        <h4>Объект не найден</h4>
        <p>В ссылке нет правильного <b>slug</b> или объект отсутствует в базе.</p>
        <p><b>slug:</b> ${isFilled(slug) ? slug : '—'}</p>
        <p style="margin-top: 14px;">
          📍 Агентство недвижимости «ГермесГрупп»<br>
          г. Лида, б-р Князя Гедимина, 12, пом. 9.
        </p>
      </div>
    `
  }
  // Owl Slider

  function getObjectPrice (obj) {
    if (typeof obj.priceBYN === 'number' && obj.priceBYN > 0) return obj.priceBYN

    // fallback: если вдруг попадётся объект только с USD
    if (typeof obj.priceUSD === 'number' && obj.priceUSD > 0) {
      const USD_TO_BYN = 3.3 // фиксированный курс для сортировки
      return Math.round(obj.priceUSD * USD_TO_BYN)
    }

    return null
  }

  function normalizeText (v) {
    return String(v || '').trim().toLowerCase()
  }

  function getCardText (obj) {
  // показываем ТОЛЬКО короткое описание
    if (isFilled(obj.cardDescription)) return String(obj.cardDescription).trim()

    // fallback, если не заполнено
    if (isFilled(obj.description)) {
      const txt = String(obj.description).replace(/\s+/g, ' ').trim()
      return txt.length > 140 ? txt.slice(0, 140) + '…' : txt
    }

    return ''
  }

  function scoreSimilar (current, candidate) {
  // Чем меньше score — тем объект более похожий
    let score = 0

    // 1) Тип объекта (самое важное)
    const sameType = normalizeText(current.type) === normalizeText(candidate.type)
    if (!sameType) score += 100000

    // 2) Город
    const sameCity = normalizeText(current.city) === normalizeText(candidate.city)
    if (!sameCity) score += 10000

    // 3) Цена (чем ближе — тем лучше)
    const p1 = getObjectPrice(current)
    const p2 = getObjectPrice(candidate)

    if (typeof p1 === 'number' && typeof p2 === 'number') {
      score += Math.abs(p1 - p2)
    } else {
      score += 5000
    }

    return score
  }

  function pickSimilarObjects (currentObj, allObjects, limit = 6) {
    return allObjects
      .filter((o) => o && o.slug && o.slug !== currentObj.slug)
      .map((o) => ({ obj: o, score: scoreSimilar(currentObj, o) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map((x) => x.obj)
  }

  function renderSimilarItem (obj) {
    const img =
    Array.isArray(obj.images) && isFilled(obj.images[0])
      ? obj.images[0]
      : '/images/objects/pic1.webp'

    const title = isFilled(obj.title) ? obj.title : 'Объект недвижимости'
    const text = getCardText(obj)
    const link = `/object-detail?slug=${encodeURIComponent(obj.slug)}`

    return `
    <div class="item">
      <div class="project-mas m-a30">
        <div class="image-effect-one">
          <img src="${img}" alt="${title}">
          <div class="figcaption"></div>
        </div>

        <div class="project-info p-t20">
          <h4 class="sx-tilte m-t0">
            <a href="${link}">${title}</a>
          </h4>
          <p>${text}</p>
          <a href="${link}"><i class="link-plus bg-primary"></i></a>
        </div>
      </div>
    </div>
  `
  }

  function rebuildOwlCarousel (carouselEl) {
    if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.owlCarousel) {
      console.warn('OwlCarousel не найден. Проверь подключение jquery + owl.carousel.js')
      return
    }

    const $c = window.jQuery(carouselEl)

    if ($c.hasClass('owl-loaded')) {
      $c.trigger('destroy.owl.carousel')
      $c.removeClass('owl-loaded')
      $c.find('.owl-stage-outer').children().unwrap()
    }

    $c.owlCarousel({
      loop: true,
      margin: 30,
      nav: true,
      autoplay: true,
      autoplayTimeout: 3500,
      autoplayHoverPause: true,
      smartSpeed: 700,
      navText: [
        '<i class="fa-solid fa-chevron-left"></i>',
        '<i class="fa-solid fa-chevron-right"></i>'
      ],
      dots: false,
      responsive: {
        0: { items: 1 },
        768: { items: 2 },
        1200: { items: 3 }
      }
    })
  }

  function renderSimilarSlider (currentObj, allObjects) {
    const carousel = qs('#similarCarousel')
    if (!carousel) return

    const similar = pickSimilarObjects(currentObj, allObjects, 6)

    if (!similar.length) {
      carousel.innerHTML = ''
      return
    }

    carousel.innerHTML = similar.map(renderSimilarItem).join('')
    rebuildOwlCarousel(carousel)
  }

  // =========================
  // INIT
  // =========================
  async function init () {
    try {
      const slug = getSlugFromUrl()

      if (!isFilled(slug)) {
        renderNotFound('')
        return
      }

      const objects = await fetchObjects()

      if (!Array.isArray(objects)) {
        console.error('objects.json должен быть массивом объектов!')
        renderNotFound(slug)
        return
      }

      const obj = objects.find((o) => o && o.slug === slug)

      if (!obj) {
        renderNotFound(slug)
        return
      }

      renderTopTitle(obj)
      setDocumentTitle(obj)

      renderGallery(obj.images)
      renderMeta(obj)
      renderSimilarSlider(obj, objects)
      renderRightText(obj)
    } catch (e) {
      console.error(e)
      renderNotFound(getSlugFromUrl())
    }
  }

  document.addEventListener('DOMContentLoaded', init)
})()
