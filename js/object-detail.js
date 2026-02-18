(function () {
  "use strict";

  const DATA_URL = "/data/objects.json";
  const MAPTILER_KEY = "ZSZnUbPl4oOTpdLavjmE"

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

  // <title> в head
  document.title = `${title} — Ольга Турко`;

  // PAGE INTRO TITLE
  const h = document.querySelector("[data-page-title]");

  if (h) {
    h.textContent = title;
  }
}


function renderHeroBlock(obj) {
  const imagesWrap = document.querySelector("[data-hero-images]");
  if (!imagesWrap) return;

  const imgs = Array.isArray(obj.images) ? obj.images.slice(0, 4) : [];

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
      
        <div class="object-hero-image">
          <img loading="lazy" decoding="async" src="${src}" alt="">
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

  /* PRICE */
  if (typeof obj.priceBYN === "number") {
    priceWrap.innerHTML = `
      <div class="object-price-label">Цена</div>
      <div class="object-price-value">
        ${obj.priceBYN.toLocaleString("ru-RU")} BYN
      </div>
    `;
  }

  const has = (v) =>
    v !== null && v !== undefined && String(v).trim() !== "";

  const make = (icon, label, value, group) =>
    has(value) ? { icon, label, value, group } : null;

  let items = [];

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
        "Основное"
      ),
      make("fa-expand", "Общая площадь", obj.areaTotal && `${obj.areaTotal} м²`, "Площади"),
      make("fa-couch", "Жилая площадь", obj.areaLiving && `${obj.areaLiving} м²`, "Площади"),
      make("fa-ruler-combined", "Кухня", obj.areaKitchen && `${obj.areaKitchen} м²`, "Площади"),
      make("fa-bath", "Санузел", obj.bathroom, "Площади"),
      make("fa-calendar", "Год постройки", obj.yearBuilt, "Основное")
    );
  } else {
    items.push(
      make("fa-house", "Тип объекта", obj.type, "Основное"),
      make("fa-expand", "Площадь дома", obj.areaTotal && `${obj.areaTotal} м²`, "Площади"),
      make("fa-couch", "Жилая площадь", obj.areaLiving && `${obj.areaLiving} м²`, "Площади"),
      make("fa-tree", "Участок", obj.areaPlot && `${obj.areaPlot} соток`, "Площади"),
      make("fa-fire", "Отопление", obj.heating, "Коммуникации"),
      make("fa-faucet", "Вода", obj.water, "Коммуникации"),
      make("fa-toilet", "Канализация", obj.sewerage, "Коммуникации"),
      make("fa-calendar", "Год постройки", obj.yearBuilt, "Основное")
    );
  }

  items = items.filter(Boolean);

  const groups = {};
  items.forEach((i) => {
    if (!groups[i.group]) groups[i.group] = [];
    groups[i.group].push(i);
  });

  wrap.innerHTML = Object.entries(groups)
    .map(
      ([group, rows]) => `
        <div class="object-details-group">
          <h5 class="object-details-group-title">${group}</h5>
          <div class="object-details-list">
            ${rows
              .map(
                (r) => `
                <div class="object-detail-row">
                  <div class="object-detail-label">
                    <i class="fa-solid ${r.icon}"></i>
                    ${r.label}
                  </div>
                  <div class="object-detail-value">${r.value}</div>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `
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
  const track = document.querySelector("[data-sidebar-track]");
  if (!track) return;

  const items = pickSimilarObjects(currentObj, allObjects, 6);
  if (!items.length) return;

  let index = 0;
  let autoTimer = null;

  function renderSlides() {
    track.innerHTML = items
      .map((obj) => {
        const img =
          Array.isArray(obj.images) && obj.images[0]
            ? obj.images[0]
            : "/images/objects/pic1.webp";

        const price =
          typeof obj.priceBYN === "number"
            ? `${obj.priceBYN.toLocaleString("ru-RU")} BYN`
            : "";

        return `
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
      })
      .join("");
  }

  function updatePosition() {
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  function next() {
    index = (index + 1) % items.length;
    updatePosition();
  }

  function prev() {
    index = (index - 1 + items.length) % items.length;
    updatePosition();
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, 5000);
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
  }

  /* INIT */
  renderSlides();
  updatePosition();
  startAuto();

  /* HOVER PAUSE */
  track.addEventListener("mouseenter", stopAuto);
  track.addEventListener("mouseleave", startAuto);

  /* SWIPE */
  let startX = 0;

  track.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    stopAuto();
  });

  track.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      diff < 0 ? next() : prev();
    }
    startAuto();
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


function renderAmenities(obj) {
  const wrap = document.querySelector("[data-object-amenities]");
  const list = document.querySelector("[data-amenities-list]");

  if (!wrap || !list) return;

  if (!Array.isArray(obj.features) || !obj.features.length) {
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;

  list.innerHTML = obj.features
    .map(
      (item) => `
      <div class="amenity-item">
        <span class="amenity-icon">
          <i class="fa-solid fa-check"></i>
        </span>
        <span class="amenity-text">${item}</span>
      </div>
    `,
    )
    .join("");
}

function initRevealBlocks() {
  const blocks = document.querySelectorAll(".reveal");

  if (!blocks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // один раз
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  blocks.forEach(block => observer.observe(block));
}

document.addEventListener("DOMContentLoaded", initRevealBlocks);





function initObjectMap(obj) {
  if (!obj || !obj.location || !obj.location.lat || !obj.location.lng) {
    console.warn("Координаты объекта не найдены");
    return;
  }

  const mapEl = document.getElementById("objectMap");
  if (!mapEl) {
    console.warn("Контейнер #objectMap не найден");
    return;
  }

  const { lat, lng } = obj.location;

  const map = new maplibregl.Map({
    container: mapEl,
   style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`,
    center: [lng, lat],
    zoom: 15,
    attributionControl: true
    
  });


  map.on("load", () => {
  const layers = map.getStyle().layers;

  layers.forEach(layer => {
    if (
      layer.type === "symbol" &&
      layer.layout &&
      layer.layout["text-field"]
    ) {
      map.setLayoutProperty(layer.id, "text-field", [
        "coalesce",
        ["get", "name:ru"],
        ["get", "name"]
      ]);
    }
  });
});

  map.addControl(new maplibregl.NavigationControl(), "top-right");
  map.scrollZoom.disable(); // чтобы не мешала скроллу страницы
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

new maplibregl.Marker({
  color: "var(--color-primary)", 
  scale: 1.1
})
  .setLngLat([lng, lat])
  .addTo(map);
}



  /* =====================================================
     INIT
  ===================================================== */
async function init() {
  try {
    let slug = getSlugFromUrl();

    const objects = await fetchObjects();
    if (!Array.isArray(objects) || !objects.length) {
      renderNotFound(slug);
      return;
    }

    /* =========================
       DEBUG MODE (Live Server)
    ========================= */
    if (!isFilled(slug)) {
      const isLocal =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";

      if (isLocal) {
        console.warn("DEBUG MODE: slug не найден, берём первый объект");
        slug = objects[0].slug;
      }
    }

    const obj = objects.find((o) => o && o.slug === slug);
    if (!obj) {
      renderNotFound(slug);
      return;
    }

    /* =========================
       RENDER
    ========================= */
    renderTopTitle(obj);
    renderHeroBlock(obj);
    renderMeta(obj);
    renderRightText(obj);
    renderHeroMeta(obj);
    renderSidebarTitle(obj);
    renderObjectDetails(obj);
    renderSidebarFooter(obj);
    initSidebarSlider(obj, objects);
    renderSimilarSlider(obj, objects);
    animateAgentCardOnce();
    renderAmenities(obj);
    generateObjectSchema(obj);
    initObjectMap(obj);

  } catch (e) {
    console.error("INIT ERROR:", e);
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
