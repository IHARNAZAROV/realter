"use strict";

/* =========================================================
   GLOBAL STATE
========================================================= */
let allObjects = [];

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
"kvartira-lida-ul-zarechnaya-7":"images/objects/pic18.webp"
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

  if (typeSelect.value !== "all") {
    result = result.filter((o) => o.type === typeSelect.value);
  }

  if (typeSelect.value === "Квартира" && roomsSelect.value !== "all") {
    result = result.filter((o) =>
      roomsSelect.value === "4"
        ? o.rooms >= 4
        : o.rooms === Number(roomsSelect.value)
    );
  }

  const from = parsePrice(priceFromInput.value);
  const to = parsePrice(priceToInput.value);

  if (from) result = result.filter((o) => o.priceBYN >= from);
  if (to) result = result.filter((o) => o.priceBYN <= to);

  if (locationSelect.value !== "all") {
    result = result.filter((o) => {
      if (locationSelect.value === "lida") return o.city === "Лида";
      if (locationSelect.value === "district")
        return o.city === "Лидский район";
      return o.city !== "Лида" && o.city !== "Лидский район";
    });
  }

  switch (sortSelect.value) {
    case "cheap":
      result.sort((a, b) => a.priceBYN - b.priceBYN);
      break;
    case "expensive":
      result.sort((a, b) => b.priceBYN - a.priceBYN);
      break;
    case "new":
      result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
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
      result.sort((a, b) => (b.recommended || 0) - (a.recommended || 0));
  }

  updateObjectsCounter(result.length);
  renderObjects(result);
  updateActiveFilters();
  saveFiltersToStorage();
}


/* =========================================================
   RENDER
========================================================= */
function renderObjects(list) {
  objectsList.innerHTML = "";

  if (!list.length) {
    objectsList.innerHTML =
      "<li class='object-item'><p>Объекты не найдены</p></li>";
    return;
  }

  const isFirstRender = !objectsList.hasChildNodes();
  list.forEach((obj, index) => {
    const li = document.createElement("li");
    li.className = "object-item";

    const imgSrc = previewImages[obj.slug] || "images/objects/placeholder.webp";
    const area = getObjectArea(obj);
    const pricePerMeter = area ? Math.round(obj.priceBYN / area) : null;
    const contractNumber = obj.contractNumber || null;
const delay = isFirstRender ? index * 50 : index * 20;

requestAnimationFrame(() => {
  setTimeout(() => {
    li.classList.add("is-visible");
  }, delay);
});
    li.innerHTML = `
      <div class="project-mas hover-shadow">
        <div class="image-effect-one">
          <img loading="lazy" src="${imgSrc}" alt="${obj.title}">
        </div>
        <div class="project-info p-a20 bg-gray">
          <h4 class="sx-tilte m-t0">
            <a href="/object-detail?slug=${obj.slug}" target="_blank" rel="noopener noreferrer">
              ${obj.title}
            </a>
          </h4>
          <p>${obj.cardDescription || ""}</p>
<div class="object-meta">
  <span class="object-price">${formatPrice(obj.priceBYN)} BYN</span>

  ${pricePerMeter
    ? `<span>${formatPrice(pricePerMeter)} BYN / м²</span>`
    : ""}

  ${contractNumber
    ? `<span class="object-contract">${contractNumber}</span>`
    : ""}
</div>
          <a href="/object-detail?slug=${obj.slug}">
            <i class="link-plus bg-primary"></i>
          </a>
        </div>
      </div>
    `;

    objectsList.appendChild(li);

requestAnimationFrame(() => {
  setTimeout(() => {
    li.classList.add("is-visible");
  }, index * 50);
});
  });
}


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
