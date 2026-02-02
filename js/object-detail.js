(function () {
  "use strict";

  const DATA_URL = "/data/objects.json";

  /* =====================================================
     HELPERS
  ===================================================== */
  const qs = (s, r = document) => r.querySelector(s);

  const isFilled = (v) =>
    v !== null && v !== undefined && String(v).trim() !== "";

  const safeJoin = (parts, sep = " • ") => parts.filter(isFilled).join(sep);

  const formatPrice = (v) =>
    typeof v === "number" ? v.toLocaleString("ru-RU") : "";

  function getSlugFromUrl() {
    const url = new URL(window.location.href);

    const qsSlug = url.searchParams.get("slug");
    if (isFilled(qsSlug)) return qsSlug.trim();

    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length === 2 && parts[0] === "object") return parts[1];

    return "";
  }

  async function fetchObjects() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Ошибка загрузки objects.json");
    return res.json();
  }

  function getObjectArea(obj) {
    const raw =
      obj.area ?? obj.areaTotal ?? obj.totalArea ?? obj.square ?? null;

    if (!raw) return null;

    const n = Number(
      String(raw)
        .replace(",", ".")
        .replace(/[^\d.]/g, ""),
    );
    return n > 0 ? n : null;
  }

  /* =====================================================
     JSON-LD SCHEMA (DYNAMIC)
  ===================================================== */
  function insertSchema(schema) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(s);
  }

  function generateObjectSchema(obj) {
    if (!obj) return;

    const isFlat = String(obj.type).toLowerCase() === "квартира";
    const area = getObjectArea(obj);

    const images =
      Array.isArray(obj.images) && obj.images.length
        ? obj.images.slice(0, 5)
        : ["https://example.com/images/objects/placeholder.webp"];

    const schema = {
      "@context": "https://schema.org",
      "@type": "Offer",
      name: obj.title,
      url: window.location.href,
      image: images,
      price: String(obj.priceBYN),
      priceCurrency: "BYN",
      priceValidUntil: "2030-12-31",
      availability: "https://schema.org/InStock",
      datePosted: obj.publishedAt || new Date().toISOString().split("T")[0],

      seller: {
        "@type": "RealEstateAgent",
        name: "Ольга Турко",
        url: "https://turko.by",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Лида",
          addressCountry: "BY",
        },
      },

      itemOffered: {
        "@type": isFlat ? "Apartment" : "House",
        name: obj.title,
        address: {
          "@type": "PostalAddress",
          addressLocality: obj.city || "Лида",
          addressCountry: "BY",
        },
      },
    };

    // Площадь
    if (area) {
      schema.itemOffered.floorSize = {
        "@type": "QuantitativeValue",
        value: area,
        unitCode: "MTK",
      };
    }

    // Комнаты
    if (isFlat && obj.rooms) {
      schema.itemOffered.numberOfRooms = obj.rooms;
    }

    // Гео-координаты (если есть)
    if (obj.lat && obj.lng) {
      schema.itemOffered.geo = {
        "@type": "GeoCoordinates",
        latitude: obj.lat,
        longitude: obj.lng,
      };
    }

    insertSchema(schema);

    /* =========================
     BREADCRUMBS
  ========================= */
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Главная",
          item: "https://turko.by/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Объекты недвижимости",
          item: "https://turko.by/objects",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: obj.title,
          item: window.location.href,
        },
      ],
    };

    insertSchema(breadcrumbs);
  }

  /* =====================================================
     RENDER BLOCKS
  ===================================================== */
  function renderTopTitle(obj) {
    const title = obj?.title || "Детали объекта";
    document.title = `${title} — Ольга Турко`;

    const h = qs("[data-page-title]") || qs(".banner-title-name h2.m-tb0");

    if (h) h.textContent = title;
  }

function renderHeroBlock(obj) {
  const imagesWrap = document.querySelector("[data-hero-images]");
  if (!imagesWrap) return;

  const imgs = Array.isArray(obj.images) ? obj.images.slice(0, 2) : [];

const desc = document.querySelector("[data-hero-description]");

if (desc && obj.description) {
  const text = obj.description.trim();


  const paragraphs = text
    .split(/\n\s*\n|\.\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

 
  const highlightNumbers = (str) =>
    str.replace(
      /(\d+[.,]?\d*\s?(м²|м2|кв\.м|кв\. м)?|\d+-этажного|\d+\s?этаж|\d+\s?комнат)/gi,
      "<strong>$1</strong>"
    );

  desc.innerHTML = paragraphs
    .map(p => `<p>${highlightNumbers(p)}</p>`)
    .join("");
}
  imagesWrap.innerHTML = imgs
    .map(
      (src) => `
      <div class="col-6">
        <div class="object-hero-image">
          <img loading="lazy" decoding="async" src="${src}" alt="">
        </div>
      </div>
    `,
    )
    .join("");



    
  // META
  const title = document.querySelector("[data-hero-title]");
  const location = document.querySelector("[data-hero-location]");
  const published = document.querySelector("[data-published]");
  const dealType = document.querySelector("[data-deal-type]");
  const featured = document.querySelector("[data-featured]");

  if (title) title.textContent = obj.title || "";

  if (location)
    location.textContent = [obj.city, obj.address].filter(Boolean).join(", ");

  if (published) {
    published.textContent = obj.publishedAt
      ? new Date(obj.publishedAt).toLocaleDateString("ru-RU")
      : "";
  }

  if (dealType) dealType.textContent = obj.dealType || "Продажа";

  if (featured && obj.recommended) {
    featured.hidden = false;
  }
}


function getAreaTotal(obj) {
  return obj.areaTotal ?? obj.totalArea ?? null;
}

function getAreaLiving(obj) {
  return obj.areaLiving ?? obj.livingArea ?? null;
}

function getAreaKitchen(obj) {
  return obj.areaKitchen ?? obj.kitchenArea ?? null;
}

function renderObjectDetails(obj) {
  const wrap = document.querySelector("[data-object-details]");
  const priceWrap = document.querySelector("[data-object-price]");
  if (!wrap || !priceWrap) return;

  const isFlat = String(obj.type || "").toLowerCase().includes("квартир");

  /* ======================
     PRICE
  ====================== */
  if (typeof obj.priceBYN === "number") {
    priceWrap.innerHTML = `
      <div class="object-price-label">Цена</div>
      <div class="object-price-value">
        ${obj.priceBYN.toLocaleString("ru-RU")} BYN
      </div>
    `;
  }

  /* ======================
     HELPERS
  ====================== */
  const has = (v) =>
    v !== null && v !== undefined && String(v).trim() !== "";

  const make = (icon, label, value, group) =>
    has(value) ? { icon, label, value, group } : null;

  let items = [];

  /* ======================
     PRIMARY — КЛЮЧЕВЫЕ
  ====================== */

  if (isFlat) {
    items.push(
      make("fa-house", "Тип объекта", obj.type, "Основное"),
      make("fa-door-open", "Комнат", obj.rooms, "Основное"),
      make(
        "fa-layer-group",
        "Этаж",
        obj.floor && obj.floorsTotal
          ? `${obj.floor} из ${obj.floorsTotal}`
          : obj.floor,
        "Основное",
      ),
      make(
  "fa-expand",
  "Общая площадь",
  getAreaTotal(obj) && `${getAreaTotal(obj)} м²`,
  "Площади",
),
make(
  "fa-couch",
  "Жилая площадь",
  getAreaLiving(obj) && `${getAreaLiving(obj)} м²`,
  "Площади",
),
make(
  "fa-ruler-combined",
  "Площадь кухни",
  getAreaKitchen(obj) && `${getAreaKitchen(obj)} м²`,
  "Площади",
),
      make("fa-bath", "Санузел", obj.bathroom, "Площади"),
      make("fa-calendar", "Год постройки", obj.yearBuilt, "Основное"),
    );
  } else {
  // ДОМ
  items.push(
    make("fa-house", "Тип объекта", obj.type, "Основное"),

    // ⬇️ ПЛОЩАДИ (КЛЮЧЕВО!)
    make(
      "fa-expand",
      "Площадь дома",
      getAreaTotal(obj) && `${getAreaTotal(obj)} м²`,
      "Площади",
    ),
    make(
      "fa-couch",
      "Жилая площадь",
      getAreaLiving(obj) && `${getAreaLiving(obj)} м²`,
      "Площади",
    ),
    make(
      "fa-tree",
      "Площадь участка",
      obj.areaPlot && `${obj.areaPlot} соток`,
      "Площади",
    ),

    // ⬇️ КОММУНИКАЦИИ
    make("fa-fire", "Отопление", obj.heating, "Коммуникации"),
    make("fa-faucet", "Вода", obj.water, "Коммуникации"),
    make("fa-toilet", "Канализация", obj.sewerage, "Коммуникации"),
    make("fa-bolt", "Электричество", obj.electricity, "Коммуникации"),

    // ⬇️ ОСНОВНОЕ
    make("fa-calendar", "Год постройки", obj.yearBuilt, "Основное"),
  );
}
  

  /* ======================
     SECONDARY — ДОБИВАЮЩИЕ
  ====================== */
  const fallback = [
    make("fa-bolt", "Электричество", obj.electricity, "Коммуникации"),
    make("fa-gas-pump", "Газ", obj.gas, "Коммуникации"),
    make("fa-city", "Тип дома", obj.houseType, "Основное"),
    make("fa-door-closed", "Балкон / лоджия", obj.balcony, "Площади"),
    make("fa-couch", "Мебель", obj.furniture, "Основное"),
    make("fa-wrench", "Состояние", obj.condition, "Основное"),
  ];

  items = items.filter(Boolean);

  for (const f of fallback) {
    if (items.length >= 10) break;
    if (f) items.push(f);
  }

  // Гарантируем минимум 8
  items = items.slice(0, 10);
  if (items.length < 8) {
    // это почти невозможно, но защита
    console.warn("Мало параметров для объекта:", obj.slug);
  }

  /* ======================
     GROUP BY SECTION
  ====================== */
  const groups = {};
  items.forEach((i) => {
    if (!groups[i.group]) groups[i.group] = [];
    groups[i.group].push(i);
  });

  /* ======================
     RENDER
  ====================== */
  wrap.innerHTML = Object.entries(groups)
    .map(
      ([group, rows]) => `
      <div class="object-details-group">
        <h5 class="object-details-group-title">${group}</h5>
        <div class="object-details-list">
${rows
  .map(
    (r, idx) => `
  <div class="object-detail-row" style="animation-delay:${idx * 60}ms">
    <div class="object-detail-label">
      <i class="fa-solid ${r.icon}"></i>
      ${r.label}
    </div>
    <div class="object-detail-value">${r.value}</div>
  </div>
`,
  )
  .join("")}
        </div>
      </div>
    `,
    )
    .join("");
}




  function renderMeta(obj) {
    const meta = qs("[data-meta-list]");
    if (!meta) return;

    const rows = [];

    if (obj.type) rows.push(["Тип объекта", obj.type]);
    if (obj.city || obj.address)
      rows.push(["Локация", safeJoin([obj.city, obj.address], ", ")]);
    if (obj.rooms) rows.push(["Комнат", obj.rooms]);
    if (obj.areaTotal) rows.push(["Площадь", `${obj.areaTotal} м²`]);
    if (obj.yearBuilt) rows.push(["Год", obj.yearBuilt]);

    if (typeof obj.priceBYN === "number")
      rows.push(["Цена", `${formatPrice(obj.priceBYN)} BYN`]);

    if (!rows.length) return;

    meta.innerHTML = rows
      .map(
        ([l, v]) => `
        <li style="display:flex;justify-content:space-between">
          <span style="font-weight:700;color:#155945">${l}</span>
          <span>${v}</span>
        </li>`,
      )
      .join("");
  }

  function renderRightText(obj) {
    const titleEl = qs("[data-object-title]");
    const subEl = qs("[data-object-subtitle]");
    const descEl = qs("[data-object-description]");

    if (titleEl) titleEl.textContent = obj.title;

    const typeLower = String(obj.type || "").toLowerCase();

    if (subEl) {
      const line =
        typeLower === "дом"
          ? safeJoin(
              [
                obj.areaPlot && `Участок ${obj.areaPlot} соток`,
                obj.water && `Вода: ${obj.water}`,
                obj.heating && `Отопление: ${obj.heating}`,
              ],
              " • ",
            )
          : safeJoin(
              [
                obj.type,
                obj.areaTotal && `${obj.areaTotal} м²`,
                obj.priceBYN && `${formatPrice(obj.priceBYN)} BYN`,
              ],
              " • ",
            );

      if (line) subEl.textContent = line;
    }

    if (descEl) {
      const blocks = [];

      if (obj.description) blocks.push(`<p>${obj.description}</p>`);

      if (Array.isArray(obj.features) && obj.features.length) {
        blocks.push(`
          <p><b>Преимущества:</b></p>
          <ul>${obj.features.map((f) => `<li>${f}</li>`).join("")}</ul>
        `);
      }

      blocks.push(`
        <p style="margin-top:14px">
          📍 Агентство недвижимости «ГермесГрупп»<br>
          г. Лида, б-р Князя Гедимина, 12, пом. 9.
        </p>
      `);

      descEl.innerHTML = blocks.join("");
    }
  }

  function renderNotFound(slug) {
    renderTopTitle({ title: "Объект не найден" });
    const box = qs(".project-detail-containt-2 .bg-white");
    if (!box) return;

    box.innerHTML = `
      <h4>Объект не найден</h4>
      <p>slug: <b>${slug || "—"}</b></p>
    `;
  }


function renderSidebarFooter(obj) {
  const box = document.querySelector("[data-sidebar-footer]");
  if (!box) return;

  const contract = obj.contractNumber
    ? `<div class="sidebar-contract">${obj.contractNumber}</div>`
    : "";

  box.innerHTML = `
    <div class="sidebar-agency">
      <div class="sidebar-agency-title">
        📍 Агентство недвижимости «ГермесГрупп»
      </div>
      <div class="sidebar-agency-address">
        г. Лида, б-р Князя Гедимина, дом 12, помещение 9.
      </div>
      ${contract}
    </div>
  `;
}


  /* =====================================================
   SIMILAR OBJECTS (Похожие варианты)
===================================================== */

  function getObjectPrice(obj) {
    if (typeof obj.priceBYN === "number" && obj.priceBYN > 0)
      return obj.priceBYN;

    if (typeof obj.priceUSD === "number" && obj.priceUSD > 0) {
      const USD_TO_BYN = 3.3;
      return Math.round(obj.priceUSD * USD_TO_BYN);
    }

    return null;
  }

  function normalizeText(v) {
    return String(v || "")
      .trim()
      .toLowerCase();
  }

  function scoreSimilar(current, candidate) {
    let score = 0;

    // Тип объекта — самый важный
    if (normalizeText(current.type) !== normalizeText(candidate.type)) {
      score += 100000;
    }

    // Город
    if (normalizeText(current.city) !== normalizeText(candidate.city)) {
      score += 10000;
    }

    // Цена
    const p1 = getObjectPrice(current);
    const p2 = getObjectPrice(candidate);

    if (typeof p1 === "number" && typeof p2 === "number") {
      score += Math.abs(p1 - p2);
    } else {
      score += 5000;
    }

    return score;
  }

  function pickSimilarObjects(currentObj, allObjects, limit = 6) {
    return allObjects
      .filter((o) => o && o.slug && o.slug !== currentObj.slug)
      .map((o) => ({ obj: o, score: scoreSimilar(currentObj, o) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map((x) => x.obj);
  }

  function renderSimilarItem(obj) {
    const img =
      Array.isArray(obj.images) && obj.images[0]
        ? obj.images[0]
        : "/images/objects/pic1.webp";

    const title = obj.title || "Объект недвижимости";
    const link = `/object-detail?slug=${encodeURIComponent(obj.slug)}`;

    return `
    <div class="item">
      <div class="project-mas m-a30">
      
        <div class="image-effect-one">
          <img loading="lazy" decoding="async" src="${img}" alt="${title}">
        </div>
        <div class="project-info p-t20">
          <h4 class="sx-tilte m-t0">
            <a href="${link}">${title}</a>
          </h4>
          <a href="${link}">
            <i class="link-plus bg-primary"></i>
          </a>
        </div>
      </div>
    </div>
  `;
  }

  function rebuildOwlCarousel(carouselEl) {
    if (
      !window.jQuery ||
      !window.jQuery.fn ||
      typeof window.jQuery.fn.owlCarousel !== "function"
    ) {
      console.warn("OwlCarousel не найден");
      return;
    }

    const $c = window.jQuery(carouselEl);

    if ($c.hasClass("owl-loaded")) {
      $c.trigger("destroy.owl.carousel");
      $c.removeClass("owl-loaded");
      $c.find(".owl-stage-outer").children().unwrap();
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
        '<i class="fa-solid fa-chevron-right"></i>',
      ],
      dots: false,
      responsive: {
        0: { items: 1 },
        768: { items: 2 },
        1200: { items: 3 },
      },
    });
  }

  function renderSimilarSlider(currentObj, allObjects) {
    const carousel = document.querySelector("#similarCarousel");
    if (!carousel) return;

    const similar = pickSimilarObjects(currentObj, allObjects, 6);

    if (!similar.length) {
      carousel.innerHTML = "";
      return;
    }

    carousel.innerHTML = similar.map(renderSimilarItem).join("");
    rebuildOwlCarousel(carousel);
  }


/* =====================================================
   FAVORITES (localStorage)
===================================================== */

const FAVORITES_KEY = "favoriteObjects";

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function isFavorite(slug) {
  return getFavorites().includes(slug);
}

function toggleFavorite(slug) {
  const favs = getFavorites();
  const idx = favs.indexOf(slug);

  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(slug);
  }

  saveFavorites(favs);
  return favs.includes(slug);
}



function renderHeroMeta(obj) {
  const title = document.querySelector("[data-hero-title]");
  const location = document.querySelector("[data-hero-location]");
  const published = document.querySelector("[data-published]");
  const dealType = document.querySelector("[data-deal-type]");
  const featured = document.querySelector("[data-featured]");

  if (title) title.textContent = obj.title || "";
  if (location)
    location.textContent = [obj.city, obj.address].filter(Boolean).join(", ");

  if (published) {
    const d = obj.publishedAt
      ? new Date(obj.publishedAt).toLocaleDateString("ru-RU")
      : "";
    published.textContent = d;
  }

  if (dealType) dealType.textContent = obj.dealType || "Продажа";

  if (featured && obj.recommended) {
    featured.hidden = false;
  }
}


function renderSidebarTitle(obj) {
  const title = document.querySelector("[data-sidebar-title]");
  if (title) title.textContent = obj.title || "";
}


function initSidebarSlider(currentObj, allObjects) {
  const container = document.querySelector("[data-sidebar-slider]");
  if (!container) return;

  const items = pickSimilarObjects(currentObj, allObjects, 6);
  if (!items.length) return;

  let index = 0;
  let interval = null;
  let isPaused = false;

  function renderSlide(obj) {
    const img =
      Array.isArray(obj.images) && obj.images[0]
        ? obj.images[0]
        : "/images/objects/pic1.webp";

    const price =
      typeof obj.priceBYN === "number"
        ? `${obj.priceBYN.toLocaleString("ru-RU")} BYN`
        : "";

    container.innerHTML = `
      <a href="/object-detail?slug=${obj.slug}" class="sidebar-slide">
        <div class="sidebar-slide-image">
          <img src="${img}" alt="${obj.title}">
        </div>

        <div class="sidebar-slide-content">
          <h6>${obj.title}</h6>
          <div class="sidebar-slide-location">
            <i class="fa-solid fa-location-dot"></i>
            ${[obj.city, obj.address].filter(Boolean).join(", ")}
          </div>
          <div class="sidebar-slide-price">${price}</div>
        </div>
      </a>
    `;
  }

  function next() {
    index = (index + 1) % items.length;
    animateChange();
  }

  function prev() {
    index = (index - 1 + items.length) % items.length;
    animateChange();
  }

  function animateChange() {
    container.classList.add("fade-out");
    setTimeout(() => {
      renderSlide(items[index]);
      container.classList.remove("fade-out");
    }, 250);
  }

  function startAuto() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!isPaused) next();
    }, 5000);
  }

  // INIT
  renderSlide(items[index]);
  startAuto();

  /* ======================
     PAUSE ON HOVER
  ====================== */
  container.addEventListener("mouseenter", () => {
    isPaused = true;
  });

  container.addEventListener("mouseleave", () => {
    isPaused = false;
  });

  /* ======================
     SWIPE (MOBILE)
  ====================== */
  let startX = 0;
  let diffX = 0;

  container.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  container.addEventListener("touchmove", (e) => {
    diffX = e.touches[0].clientX - startX;
  });

  container.addEventListener("touchend", () => {
    if (Math.abs(diffX) > 50) {
      diffX < 0 ? next() : prev();
    }
    startX = 0;
    diffX = 0;
  });
}



function animateAgentCardOnce() {
  const card = document.querySelector(".agent-card");
  if (!card) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        card.classList.add("is-visible");
        observer.disconnect(); // ⬅️ только один раз
      }
    },
    {
      threshold: 0.3,
    },
  );

  observer.observe(card);
}

  /* =====================================================
     INIT
  ===================================================== */
  async function init() {
    try {
      const slug = getSlugFromUrl();
      if (!isFilled(slug)) {
        renderNotFound("");
        return;
      }

      const objects = await fetchObjects();
      if (!Array.isArray(objects)) {
        renderNotFound(slug);
        return;
      }

      const obj = objects.find((o) => o && o.slug === slug);
      if (!obj) {
        renderNotFound(slug);
        return;
      }

    
      renderTopTitle(obj);
      renderHeroBlock(obj);
      renderMeta(obj);
      renderRightText(obj);
renderHeroMeta(obj);
initSidebarSlider(obj, objects);
renderSidebarTitle(obj);
animateAgentCardOnce();
      renderSimilarSlider(obj, objects);
renderObjectDetails(obj);
renderSidebarFooter(obj);
   
      generateObjectSchema(obj);
    } catch (e) {
      console.error(e);
      renderNotFound(getSlugFromUrl());
    }
  }

  function rebuildOwlCarousel(carouselEl) {
    if (
      !window.jQuery ||
      !window.jQuery.fn ||
      typeof window.jQuery.fn.owlCarousel !== "function"
    ) {
      console.warn(
        "OwlCarousel не найден. Проверь подключение jquery + owl.carousel.js",
      );
      return;
    }

    const $c = window.jQuery(carouselEl);

    if ($c.hasClass("owl-loaded")) {
      $c.trigger("destroy.owl.carousel");
      $c.removeClass("owl-loaded");
      $c.find(".owl-stage-outer").children().unwrap();
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
        '<i class="fa-solid fa-chevron-right"></i>',
      ],
      dots: false,
      responsive: {
        0: { items: 1 },
        768: { items: 2 },
        1200: { items: 3 },
      },
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
