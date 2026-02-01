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

  function renderGallery(images) {
    const wrap = qs("[data-gallery]");
    if (!wrap) return;

    const imgs =
      Array.isArray(images) && images.length
        ? images.filter(isFilled)
        : ["/images/objects/pic1.webp"];

    wrap.innerHTML = imgs
      .slice(0, 12)
      .map(
        (src) => `
        <div class="col-md-6">
          <div class="project-detail-pic m-b30">
            <div class="sx-media">
              <img loading="lazy" decoding="async" src="${src}" alt="">
            </div>
          </div>
        </div>`,
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

      // 🔹 Основной контент
      renderTopTitle(obj);
      renderGallery(obj.images);
      renderMeta(obj);
      renderRightText(obj);

      // 🔹 Похожие объекты (ВОЗВРАЩАЕМ)
      renderSimilarSlider(obj, objects);

      // 🔹 Schema.org
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
