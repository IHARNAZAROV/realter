"use strict";

/* =========================================================
   GLOBAL STATE
========================================================= */
let allObjects = [];

/* =========================================================
   LOAD MORE STATE
========================================================= */
const OBJECTS_STEP = 6;
let visibleCount = OBJECTS_STEP;
let lastRenderedList = [];
let isAppendMode = false;

const loadMoreBtn = document.getElementById("loadMoreBtn");
let loadMoreAppearedOnce = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */
const sortSelect = document.getElementById("sortSelect");
const typeSelect = document.getElementById("typeSelect");
const roomsSelect = document.getElementById("roomsSelect");
const priceFromInput = document.getElementById("priceFrom");
const priceToInput = document.getElementById("priceTo");
const locationSelect = document.getElementById("locationSelect");
const objectsList = document.getElementById("objectsList");
const resetBtn = document.getElementById("resetFilters");
const VIEW_STORAGE_KEY = "objectsViewMode";
const FAVORITES_VIEW_KEY = "favoritesViewMode";

/* =========================================================
   PREVIEW IMAGES (static mapping)
========================================================= */
const previewImages = {
  "dom-lidskiy-rayon-krupovo": "images/objects/pic1.webp",
  "dom-lida-severnyy-gorodok-ul-govorova": "images/objects/pic2.webp",
  "kvartira-lida-ul-zarechnaya-39": "images/objects/pic3.webp",
  "dom-lidskiy-rayon-sheybaki": "images/objects/pic4.webp",
  "kvartira-lida-yuzhnyy-gorodok": "images/objects/pic5.webp",
  "dom-shchuchinskiy-rayon-rozhanka": "images/objects/pic6.webp",
  "kvartira-lida-yuzhnyy-gorodok-d-19": "images/objects/pic7.webp",
  "dom-dokudovo-2": "images/objects/pic8.webp",
  "kvartira-lida-ul-varshavskaya-44": "images/objects/pic9.webp",
  "kvartira-lida-ul-letnaya-8": "images/objects/pic10.webp",
  "dom-lidskiy-rayon-melyashi": "images/objects/pic11.webp",
  "kvartira-lida-ul-tuhachevskogo-65-k1": "images/objects/pic12.webp",
  "kvartira-lida-ul-masherova-7-k2": "images/objects/pic13.webp",
  "kvartira-lida-ul-masherova": "images/objects/pic14.webp",
  "kvartira-lida-ul-tuhachevskogo": "images/objects/pic15.webp",
  "dom-lidskiy-rayon-minoyty": "images/objects/pic16.webp",
  "kvartira-lida-ul-kosmonavtov": "images/objects/pic17.webp",
  "kvartira-lida-ul-zarechnaya-7": "images/objects/pic18.webp",
  "dom-lidskiy-rayon-ostrovlya-novoselov": "images/objects/pic19.webp",
  "kvartira-laykovshchina-lidskiy-rayon":"images/objects/pic20.webp",
  "kvartira-lida-ul-prolygina-4": "images/objects/pic21.webp"
};

/* =========================================================
   HELPERS
========================================================= */
function formatPrice(v) {
  return v ? Number(v).toLocaleString("ru-RU") : "";
}

function parsePrice(v) {
  return v ? Number(String(v).replace(/\s/g, "")) : 0;
}

function debounce(fn, delay = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}


/* =========================================================
   FAVORITES
========================================================= */
const FAVORITES_KEY = "favoriteObjects";

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function isFavorite(slug) {
  return getFavorites().includes(slug);
}

function toggleFavorite(slug) {
  let favs = getFavorites();

  if (favs.includes(slug)) {
    favs = favs.filter((s) => s !== slug);
  } else {
    favs.push(slug);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}


function isFavoritesMode() {
  return localStorage.getItem(FAVORITES_VIEW_KEY) === "on";
}

function setFavoritesMode(state) {
  localStorage.setItem(FAVORITES_VIEW_KEY, state ? "on" : "off");
}
/* =========================================================
   SAFE AREA PARSER
========================================================= */
function getObjectArea(obj) {
  const raw = obj.area ?? obj.areaTotal ?? obj.totalArea ?? obj.square ?? null;

  if (!raw) return null;

  const area = Number(
    String(raw)
      .replace(",", ".")
      .replace(/[^\d.]/g, ""),
  );

  return area > 0 ? area : null;
}

/* =========================================================
   INIT
========================================================= */
const debouncedApply = debounce(applyFiltersAndSort);

document.addEventListener("DOMContentLoaded", () => {
  fetch("/data/objects.json")
    .then((r) => r.json())
    .then((data) => {
      allObjects = data;
      updateRoomsState();
      loadFiltersFromStorage();
      applyFiltersAndSort();
    });

  bindEvents();
  initViewSwitcher();

if (isFavoritesMode()) {
  document
    .getElementById("favoritesFilterCounter")
    ?.classList.add("is-active");
}

});
/* =========================================================
   EVENTS
========================================================= */
function bindEvents() {
  sortSelect.addEventListener("change", applyFiltersAndSort);

  typeSelect.addEventListener("change", () => {
    updateRoomsState();
    applyFiltersAndSort();
  });

  roomsSelect.addEventListener("change", applyFiltersAndSort);
  locationSelect.addEventListener("change", applyFiltersAndSort);

  priceFromInput.addEventListener("input", handlePriceInput);
  priceToInput.addEventListener("input", handlePriceInput);

  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters);
  }
}

/* =========================================================
   RESET FILTERS
========================================================= */
function resetFilters() {
  sortSelect.value = "recommended";
  typeSelect.value = "all";
  roomsSelect.value = "all";
  roomsSelect.disabled = true;
  priceFromInput.value = "";
  priceToInput.value = "";
  locationSelect.value = "all";

  localStorage.removeItem(FILTERS_STORAGE_KEY);
  applyFiltersAndSort();
}

/* =========================================================
   ROOMS STATE
========================================================= */
function updateRoomsState() {
  const isFlat = typeSelect.value === "Квартира";
  roomsSelect.disabled = !isFlat;
  if (!isFlat) roomsSelect.value = "all";
}

/* =========================================================
   PRICE INPUTS
========================================================= */
function handlePriceInput() {
  let from = parsePrice(priceFromInput.value);
  let to = parsePrice(priceToInput.value);

  if (from && to && from > to) to = from;

  priceFromInput.value = formatPrice(from);
  priceToInput.value = formatPrice(to);

  debouncedApply();
}

/* =========================================================
   FILTER + SORT
========================================================= */
function applyFiltersAndSort() {
  let result = [...allObjects];

  /* =========================================
     ONLY FAVORITES MODE
  ========================================= */
  if (isFavoritesMode()) {
    const favs = getFavorites();
    result = result.filter((o) => favs.includes(o.slug));
  }

  /* =========================================
     TYPE FILTER
  ========================================= */
  if (typeSelect.value !== "all") {
    result = result.filter((o) => o.type === typeSelect.value);
  }

  /* =========================================
     ROOMS FILTER (ONLY FOR FLATS)
  ========================================= */
  if (typeSelect.value === "Квартира" && roomsSelect.value !== "all") {
    result = result.filter((o) =>
      roomsSelect.value === "4"
        ? o.rooms >= 4
        : o.rooms === Number(roomsSelect.value)
    );
  }

  /* =========================================
     PRICE FILTER
  ========================================= */
  const from = parsePrice(priceFromInput.value);
  const to = parsePrice(priceToInput.value);

  if (from) result = result.filter((o) => o.priceBYN >= from);
  if (to) result = result.filter((o) => o.priceBYN <= to);

  /* =========================================
     LOCATION FILTER
  ========================================= */
  if (locationSelect.value !== "all") {
    result = result.filter((o) => {
      if (locationSelect.value === "lida") {
        return o.city === "Лида";
      }
      if (locationSelect.value === "district") {
        return o.city === "Лидский район";
      }
      return o.city !== "Лида" && o.city !== "Лидский район";
    });
  }

  /* =========================================
     SORTING
  ========================================= */
  switch (sortSelect.value) {
    case "cheap":
      result.sort((a, b) => a.priceBYN - b.priceBYN);
      break;

    case "expensive":
      result.sort((a, b) => b.priceBYN - a.priceBYN);
      break;

    case "new":
      result.sort(
        (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
      );
      break;

    case "pricePerMeter":
      result.sort((a, b) => {
        const aArea = getObjectArea(a);
        const bArea = getObjectArea(b);

        if (!aArea) return 1;
        if (!bArea) return -1;

        return a.priceBYN / aArea - b.priceBYN / bArea;
      });
      break;

    default:
      result.sort(
        (a, b) => (b.recommended || 0) - (a.recommended || 0)
      );
  }

  /* =========================================
     COUNTER
  ========================================= */
  updateObjectsCounter(result.length);

  /* =========================================
     LOAD MORE RESET (ВАЖНО)
  ========================================= */
isAppendMode = false;
visibleCount = OBJECTS_STEP;
lastRenderedList = result;

  /* =========================================
     RENDER
  ========================================= */
  renderObjects(result);

  /* =========================================
     UI STATE
  ========================================= */
  updateActiveFilters();
  saveFiltersToStorage();
}

/* =========================================================
   RENDER
========================================================= */
function renderObjects(list) {
  /* =========================================
     EMPTY STATE
  ========================================= */
  if (!list.length) {
    objectsList.innerHTML =
      "<li class='object-item'><p>Объекты не найдены</p></li>";
    updateShownCounter(0, 0);
    toggleLoadMore(false);
    return;
  }

  /* =========================================
     CLEAR ONLY ON NEW SEARCH
  ========================================= */
  if (!isAppendMode) {
    objectsList.innerHTML = "";
  }

  /* =========================================
     CALCULATE RANGE
  ========================================= */
  const alreadyRendered = objectsList.children.length;
  const nextItems = list.slice(alreadyRendered, visibleCount);

  /* =========================================
     APPEND NEW ITEMS ONLY
  ========================================= */
  nextItems.forEach((obj, index) => {
    const li = document.createElement("li");
    li.className = "object-item";

    const imgSrc =
      previewImages[obj.slug] || "images/objects/placeholder.webp";

    const area = getObjectArea(obj);
    const pricePerMeter = area ? Math.round(obj.priceBYN / area) : null;
    const contractNumber = obj.contractNumber || null;
    const badgesHTML = renderBadges(obj);

    li.innerHTML = `
      <div class="project-mas hover-shadow">

        <a
          href="/object-detail?slug=${obj.slug}"
          class="card-link-overlay"
          aria-label="Открыть объект ${obj.title}"
        ></a>

        <div class="image-effect-one">

          <div
            class="favorite-btn ${isFavorite(obj.slug) ? "is-active" : ""}"
            data-slug="${obj.slug}"
            aria-label="${
              isFavorite(obj.slug)
                ? "Убрать из избранного"
                : "Добавить в избранное"
            }"
          >
            <i class="fa-${
              isFavorite(obj.slug) ? "solid" : "regular"
            } fa-heart"></i>
          </div>

          ${badgesHTML}

          <img loading="lazy" src="${imgSrc}" alt="${obj.title}">
        </div>

        <div class="project-info p-a20 bg-gray">
          <h4 class="sx-tilte m-t0">
            <a href="/object-detail?slug=${obj.slug}">
              ${obj.title}
            </a>
          </h4>

          ${obj.cardDescription ? `<p>${obj.cardDescription}</p>` : ""}

          <div class="object-meta">
            <span class="object-price">
              ${formatPrice(obj.priceBYN)} BYN
            </span>

            ${
              pricePerMeter
                ? `<span>${formatPrice(pricePerMeter)} BYN / м²</span>`
                : ""
            }

            ${
              contractNumber
                ? `<span class="object-contract">${contractNumber}</span>`
                : ""
            }
          </div>

          <a href="/object-detail?slug=${obj.slug}">
            <i class="link-plus bg-primary"></i>
          </a>
        </div>
      </div>
    `;

    objectsList.appendChild(li);

    /* =========================================
       APPEAR ANIMATION (ONLY FOR NEW ITEMS)
    ========================================= */
    requestAnimationFrame(() => {
 requestAnimationFrame(() => {
    li.classList.add("is-visible");
  });
    });
  });

  /* =========================================
     COUNTERS & LOAD MORE STATE
  ========================================= */
  updateShownCounter(
    Math.min(visibleCount, list.length),
    list.length
  );

  toggleLoadMore(visibleCount < list.length);
}




function toggleLoadMore(canLoadMore, isLoading = false) {

  if (!loadMoreAppearedOnce && canLoadMore) {
  loadMoreBtn.classList.add("is-appear");
  loadMoreAppearedOnce = true;

  loadMoreBtn.addEventListener(
    "animationend",
    () => loadMoreBtn.classList.remove("is-appear"),
    { once: true }
  );
}
  if (!loadMoreBtn) return;

  const total = lastRenderedList.length;
  const shown = Math.min(visibleCount, total);

  if (!canLoadMore) {
    loadMoreBtn.innerHTML = `
      <span class="load-more-done">✓ Все объекты загружены</span>
      <span class="load-more-counter">
        · Показано ${shown} из ${total}
      </span>
    `;
    loadMoreBtn.disabled = true;
    loadMoreBtn.classList.add("is-complete");
    loadMoreBtn.classList.remove("is-loading");
    return;
  }

  loadMoreBtn.innerHTML = `
    <span class="load-more-spinner ${isLoading ? "is-visible" : ""}"></span>
    <span class="load-more-text">Показать ещё</span>
    <span class="load-more-counter">
      · Показано ${shown} из ${total}
    </span>
  `;

  loadMoreBtn.disabled = false;
  loadMoreBtn.classList.remove("is-complete");
  loadMoreBtn.classList.toggle("is-loading", isLoading);
}



function renderBadges(obj) {
  let html = "";

  if (obj.recommended === true) {
    html += `<span class="badge badge-featured">Рекомендуемый</span>`;
  }

  if (isNewObject(obj)) {
    html += `<span class="badge badge-new">Новинка</span>`;
  }

  if (!html) return "";

  return `<div class="object-badges">${html}</div>`;
}

function isNewObject(obj, days = 7) {
  if (!obj.publishedAt) return false;

  const now = new Date();
  const published = new Date(obj.publishedAt);

  return (now - published) / 86400000 <= days;
}

/* =========================================================
   Избранное
========================================================= */
objectsList.addEventListener("click", (e) => {
  const btn = e.target.closest(".favorite-btn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const slug = btn.dataset.slug;
  toggleFavorite(slug);

  btn.classList.toggle("is-active");
btn.setAttribute(
  "aria-label",
  btn.classList.contains("is-active")
    ? "Убрать из избранного"
    : "Добавить в избранное"
);
  const icon = btn.querySelector("i");
  icon.classList.toggle("fa-solid");
  icon.classList.toggle("fa-regular");
  btn.classList.remove("is-pulse");
void btn.offsetWidth; 
btn.classList.add("is-pulse");
updateFavoritesFilterCounter(true);
});



const favoritesCounter = document.getElementById("favoritesFilterCounter");

if (favoritesCounter) {
  favoritesCounter.addEventListener("click", () => {
    const isActive = isFavoritesMode();

    setFavoritesMode(!isActive);
    applyFiltersAndSort();
    updateFavoritesFilterCounter();

    favoritesCounter.classList.toggle("is-active", !isActive);
  });
}

function updateFavoritesFilterCounter(pulse = false) {
  const el = document.getElementById("favoritesFilterCounter");
  if (!el) return;

  const countEl = el.querySelector(".count");
  const favs = getFavorites();

  countEl.textContent = favs.length;
  el.classList.toggle("is-empty", favs.length === 0);

  if (pulse) {
    el.classList.remove("is-pulse");
    void el.offsetWidth; // reflow
    el.classList.add("is-pulse");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  updateFavoritesFilterCounter();
});

/* =========================================================
   Счетчик
========================================================= */
function pluralizeObject(count) {
  if (count % 10 === 1 && count % 100 !== 11) return "объект";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100))
    return "объекта";
  return "объектов";
}

function updateObjectsCounter(count) {
  const counter = document.getElementById("objectsCounter");
  const row = counter?.closest(".filters-reset-row");

  if (!counter || !row) return;

  const priceFrom = parsePrice(priceFromInput.value);
  const priceTo = parsePrice(priceToInput.value);

  // EMPTY STATE
  if (count === 0) {
    let hint = "";

    if (priceFrom > 0) {
      hint = `<span class="price-hint">
        Попробуйте снизить минимальную цену
      </span>`;
    }

    counter.innerHTML = `
      По заданным параметрам ничего не найдено
      ${hint}
    `;

    counter.classList.add("is-empty");
    row.classList.add("is-empty");
    return;
  }

  // NORMAL STATE
  counter.innerHTML = `
    Найдено <strong>${count}</strong> ${pluralizeObject(count)}
  `;

  counter.classList.remove("is-empty");
  row.classList.remove("is-empty");
}

function updateActiveFilters() {
  const fields = [
    sortSelect,
    typeSelect,
    roomsSelect,
    locationSelect,
    priceFromInput,
    priceToInput,
  ];

  fields.forEach((field) => {
    if (!field) return;

    const isActive =
      (field.tagName === "SELECT" && field.value !== "all") ||
      (field.tagName === "INPUT" && field.value.trim() !== "");

    field.classList.toggle("is-active", isActive);
  });
}

const FILTERS_STORAGE_KEY = "objectsFilters";

function saveFiltersToStorage() {
  const data = {
    sort: sortSelect.value,
    type: typeSelect.value,
    rooms: roomsSelect.value,
    priceFrom: priceFromInput.value,
    priceTo: priceToInput.value,
    location: locationSelect.value,
  };

  localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(data));
}

function loadFiltersFromStorage() {
  const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    sortSelect.value = data.sort ?? "recommended";
    typeSelect.value = data.type ?? "all";
    roomsSelect.value = data.rooms ?? "all";
    priceFromInput.value = data.priceFrom ?? "";
    priceToInput.value = data.priceTo ?? "";
    locationSelect.value = data.location ?? "all";

    updateRoomsState();
  } catch (e) {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  }
}

function initViewSwitcher() {
  const buttons = document.querySelectorAll(".view-btn");
  if (!buttons.length) return;

  const savedView = localStorage.getItem(VIEW_STORAGE_KEY) || "grid";

  setViewMode(savedView);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      setViewMode(view);
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    });
  });
}

function setViewMode(mode) {
  objectsList.classList.remove("view-grid", "view-compact");
  objectsList.classList.add(`view-${mode}`);

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === mode);
  });
}

function updateShownCounter(shown, total) {
  const el = document.getElementById("objectsShownCounter");
  if (!el) return;

  el.textContent = `Показано ${shown} из ${total}`;
}

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    if (visibleCount >= lastRenderedList.length) return;

    isAppendMode = true;
    toggleLoadMore(true, true); // spinner ON

    requestAnimationFrame(() => {
      visibleCount += OBJECTS_STEP;
      renderObjects(lastRenderedList);
    });
  });
}

(function () {
  const wrap = document.querySelector(".objects-load-more-wrap");
  if (!wrap) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const currentY = window.scrollY;

    // только мобилки
    if (window.innerWidth > 768) return;

    if (currentY > lastScrollY + 10) {
      // скролл вниз → показываем кнопку
      wrap.classList.remove("is-hidden");
    } else if (currentY < lastScrollY - 10) {
      // скролл вверх → прячем кнопку
      wrap.classList.add("is-hidden");
    }

    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  });
})();


