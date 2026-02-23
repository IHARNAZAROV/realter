"use strict";

/* ======================================================
   STATE
====================================================== */
let objects = [];
let isDirty = false;
let currentFilter = "all";
let statsFilters = {
  rooms: null,  
  city: null,   
  priceRange: null 
};
let selectedDate = null;
let objectsListEl;
let currentSort = "new";
/* ===== MARKET SETTINGS ===== */
const MARKET = {
  Lida: {
    flat: 850,   // $/м²
    house: 420
  },
  default: {
    flat: 800,
    house: 400
  }
};

const METRICS_INFO = {
  price: {
    title: "Цена за м²",
    html: `
      <p><strong>Что это:</strong><br>
      Стоимость одного квадратного метра объекта.</p>

      <p><strong>Как считается:</strong></p>
      <ul>
        <li>Цена объекта / Общая площадь</li>
      </ul>

      <p><strong>Как интерпретировать:</strong></p>
      <ul>
        <li>Ниже рынка — выгодная цена</li>
        <li>В рынке — адекватная стоимость</li>
        <li>Выше рынка — возможен торг</li>
      </ul>
    `
  },

  liquidity: {
    title: "Индекс ликвидности",
    html: `
      <p><strong>Что это:</strong><br>
      Оценка того, насколько легко объект продаётся на рынке.</p>

      <p><strong>На что влияет:</strong></p>
      <ul>
        <li>Этаж</li>
        <li>Количество комнат</li>
        <li>Цена относительно рынка</li>
        <li>Район</li>
      </ul>

      <p><strong>Интерпретация:</strong></p>
      <ul>
        <li>0–40 — низкая</li>
        <li>40–70 — средняя</li>
        <li>70+ — высокая</li>
      </ul>
    `
  },

  layout: {
    title: "Коэффициент планировки",
    html: `
      <p><strong>Что это:</strong><br>
      Соотношение жилой площади к общей.</p>

      <p><strong>Формула:</strong></p>
      <ul>
        <li>Жилая / Общая площадь</li>
      </ul>

      <p><strong>Интерпретация:</strong></p>
      <ul>
        <li>&lt; 0.45 — слабая</li>
        <li>0.45–0.55 — хорошая</li>
        <li>&gt; 0.55 — отличная</li>
      </ul>
    `
  },

  resale: {
    title: "Потенциал перепродажи",
    html: `
      <p><strong>Что это:</strong><br>
      Прогноз возможности выгодной перепродажи.</p>

      <p><strong>Учитывается:</strong></p>
      <ul>
        <li>Ликвидность</li>
        <li>Цена</li>
        <li>Планировка</li>
      </ul>

      <p><strong>Значения:</strong></p>
      <ul>
        <li>Высокий — можно продать без дисконта</li>
        <li>Средний — возможен небольшой торг</li>
        <li>Ограниченный — сложная перепродажа</li>
      </ul>
    `
  }
};

const SCHEMA = {
  common: {
    title: { label: "Заголовок", type: "text" },
    priceBYN: { label: "Цена BYN", type: "number" },
    priceUSD: { label: "Цена USD", type: "number" },
    cardDescription: { label: "Описание карточки", type: "textarea" },
    description: { label: "Полное описание", type: "textarea" },
    recommended: { label: "Рекомендуемый", type: "checkbox" },
    contractNumber: { label: "Номер договора", type: "text" }
  },

  flat: {
    rooms: { label: "Количество комнат", type: "number" },
    roomsSeparate: { label: "Раздельных комнат", type: "number" },
    areaTotal: { label: "Площадь общая", type: "float" },
    areaLiving: { label: "Площадь жилая", type: "float" },
    yearBuilt: { label: "Год постройки", type: "number" },
    floor: { label: "Этаж", type: "number" },
    floorsTotal: { label: "Этажность", type: "number" },
    houseType: { label: "Тип дома", type: "text" },
    balcony: { label: "Балкон", type: "text" },
    renovation: { label: "Ремонт", type: "text" },
    bathroom: { label: "Санузел", type: "text" }
  },

  house: {
    areaPlot: { label: "Площадь участка", type: "number" },
    areaTotal: { label: "Площадь общая", type: "number" },
    areaLiving: { label: "Площадь жилая", type: "number" },
    houseMaterial: { label: "Материал стен", type: "text" },
    roofMaterial: { label: "Материал крыши", type: "text" },
    heating: { label: "Отопление", type: "text" },
    water: { label: "Вода", type: "text" },
    sewerage: { label: "Канализация", type: "text" },
    electricity: { label: "Электроснабжение", type: "text" },
    landStatus: { label: "Статус земли", type: "text" }
  }
};

const previewImages = {
  "dom-lidskiy-rayon-krupovo": "/images/objects/pic1.webp",
  "dom-lida-severnyy-gorodok-ul-govorova": "/images/objects/pic2.webp",
  "kvartira-lida-ul-zarechnaya-39": "/images/objects/pic3.webp",
  "dom-lidskiy-rayon-sheybaki": "/images/objects/pic4.webp",
  "kvartira-lida-yuzhnyy-gorodok": "/images/objects/pic5.webp",
  "dom-shchuchinskiy-rayon-rozhanka": "/images/objects/pic6.webp",
  "kvartira-lida-yuzhnyy-gorodok-d-19": "/images/objects/pic7.webp",
  "dom-dokudovo-2": "/images/objects/pic8.webp",
  "kvartira-lida-ul-varshavskaya-44": "/images/objects/pic9.webp",
  "kvartira-lida-ul-letnaya-8": "/images/objects/pic10.webp",
  "dom-lidskiy-rayon-melyashi": "/images/objects/pic11.webp",
  "kvartira-lida-ul-tuhachevskogo-65-k1": "/images/objects/pic12.webp",
  "kvartira-lida-ul-masherova-7-k2": "/images/objects/pic13.webp",
  "kvartira-lida-ul-masherova": "/images/objects/pic14.webp",
  "kvartira-lida-ul-tuhachevskogo": "/images/objects/pic15.webp",
  "dom-lidskiy-rayon-minoyty": "/images/objects/pic16.webp",
  "kvartira-lida-ul-kosmonavtov": "/images/objects/pic17.webp",
  "kvartira-lida-ul-zarechnaya-7": "/images/objects/pic18.webp",
  "dom-lidskiy-rayon-ostrovlya-novoselov": "/images/objects/pic19.webp",
  "kvartira-laykovshchina-lidskiy-rayon":"/images/objects/pic20.webp",
  "kvartira-lida-ul-prolygina-4": "/images/objects/pic21.webp",
  "dom-shchuchinskiy-rayon-skribovtsy":"/images/objects/pic22.webp",
  "dom-shchuchinskiy-rayon-boyary-zheludokskie":"/images/objects/pic23.webp",
  "kvartira-volkovysk-centr": "/images/objects/pic24.webp",
  "kvartira-lida-knyazya-gedimina-7":"/images/objects/pic25.webp",
  "sto-lida-ignatova-42-veras-avto":"/images/objects/pic26.webp",
  "kvartira-volkovysk-socialisticheskaya":"/images/objects/pic27.webp",
  "dom-lida-ul-shchedrina":"/images/objects/pic28.webp"
};

/* ======================================================
   DOM
====================================================== */
const container = document.getElementById("objects");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const dirtyIndicator = document.getElementById("dirtyIndicator");
const errorsBox = document.getElementById("errors");

/* ===== MODAL ===== */
const addModal = document.getElementById("addModal");
const openAddModal = document.getElementById("openAddModal");
const closeAddModal = document.getElementById("closeAddModal");
const cancelAdd = document.getElementById("cancelAdd");

/* ===== ADD FORM ===== */
const addForm = document.getElementById("addObjectForm");
const addType = document.getElementById("addType");
const addFlat = document.getElementById("addFlat");
const addHouse = document.getElementById("addHouse");
/* ===== EDIT MODAL ===== */
const editModal = document.getElementById("editModal");
const modalBody = document.getElementById("editModalBody");
const modalTitle = document.getElementById("editModalTitle");
const closeEditModal = document.getElementById("closeEditModal");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");


/* ======================================================
   LOAD DATA
====================================================== */
fetch("/data/objects.json")
  .then(r => r.json())
  .then(data => {
    objects = data;
    render();
  });



/* ======================================================
   DIRTY STATE + AUTOSAVE
====================================================== */
function setDirty(state = true) {
  isDirty = state;
  dirtyIndicator.classList.toggle("is-visible", isDirty);
}


objects.forEach(obj => {
  if (!obj.createdAt) {
    obj.createdAt = obj.publishedAt || new Date().toISOString();
    setDirty();
  }
});
/* ======================================================
   RENDER
====================================================== */
function render() {
  container.innerHTML = "";

// 1. применяем фильтры
let list = applyFilter(objects);

// 2. применяем сортировку из хедера
list = sortObjects(list);

// 🔥 2.1 РЕНДЕРИМ СТАТИСТИКУ ПОРТФЕЛЯ (НАД СПИСКОМ)
  renderPortfolioStats(list); 

// 3. рендерим
list.forEach(obj => {
  const index = objects.indexOf(obj);
  container.appendChild(renderObject(obj, index));
});

  bind();
  bindEditButtons();
  bindInlinePriceEdit();
  bindQuickActions();
  updateStats();
  bindDashboardFilters();
renderDashboardCharts();
bindDashboardFilters();
enableDragAndDrop(container, objects);
}

function enableDragAndDrop(container, dataArray) {
  if (!container) return;

  let draggedEl = null;

  container.querySelectorAll(".object").forEach((item) => {
    item.draggable = true;

    item.addEventListener("dragstart", () => {
      draggedEl = item;
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      draggedEl = null;
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!draggedEl || draggedEl === item) return;

      const fromIndex = Number(draggedEl.dataset.index);
      const toIndex = Number(item.dataset.index);
      if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;

      /* ===== 1. ДВИГАЕМ DOM (БЕЗ RENDER) ===== */
      const rect = item.getBoundingClientRect();
      const isAfter = e.clientY > rect.top + rect.height / 2;

      container.insertBefore(
        draggedEl,
        isAfter ? item.nextSibling : item
      );

      /* ===== 2. ОБНОВЛЯЕМ МАССИВ ===== */
      const moved = dataArray.splice(fromIndex, 1)[0];
      dataArray.splice(toIndex, 0, moved);

      /* ===== 3. ОБНОВЛЯЕМ data-index У ВСЕХ ===== */
      container.querySelectorAll(".object").forEach((el, i) => {
        el.dataset.index = i;
      });

      setDirty(); // или isDirty = true
    });
  });
}

function renderObject(obj, index) {
  const status = obj.status?.type || "active";
  const date = obj.status?.date || "";
  const previewSrc = resolvePreviewImage(obj);
  const metrics = calculateMetrics(obj);

  const div = document.createElement("div");
  div.className = `object ${obj.recommended ? "is-recommended" : ""} ${status === "sold" ? "is-sold" : ""}`;
  div.dataset.index = index;

  div.innerHTML = `
    <!-- ФОТО -->
    <div class="object-preview">
      ${previewSrc ? `<img src="${previewSrc}" alt="" loading="lazy">` : ""}
    </div>

    <!-- ИНФОРМАЦИЯ -->
    <div class="object-info">
<div class="object-header">
  <div class="object-title">${obj.title}</div>

  <div class="object-badges">
    <span
      class="badge badge-star recommend-toggle ${obj.recommended ? "" : "is-muted"}"
      data-index="${index}"
      title="Рекомендованный объект"
    >
      ⭐
    </span>

<span
  class="badge status-badge ${status === "sold" ? "badge--sold" : "badge--active"}"
  data-index="${index}"
  title="Изменить статус объекта"
>
  ${
    status === "sold"
      ? `Продано${date ? " • " + date : ""}`
      : "В продаже"
  }
</span>
  </div>
</div>

      <div class="object-price">
        ${obj.priceBYN?.toLocaleString()} BYN
        <span class="price-usd">/ ${obj.priceUSD?.toLocaleString()} $</span>
      </div>

      <div class="object-address">
        📍 ${obj.city || ""}${obj.address ? ", " + obj.address : ""}
      </div>
    </div>

    <!-- МЕТРИКИ -->
    ${
      metrics ? `
      <div class="object-metrics">

        <div class="metric"  data-metric="price" data-tooltip="Цена одного квадратного метра">
          <span class="metric-label">Цена / м²</span>
          <span class="metric-value">${metrics.pricePerM2} $</span>
          <span class="${metrics.deviation <= -7 ? "good" : metrics.deviation >= 7 ? "bad" : "neutral"}">
            ${metrics.deviation > 0 ? "+" : ""}${metrics.deviation}% от рынка
          </span>
        </div>

        <div class="metric" data-metric="liquidity" data-tooltip="Насколько легко объект продаётся">
          <span class="metric-label">Ликвидность</span>
          <div class="liquidity-bar">
            <span style="--value:${metrics.liquidity}"></span>
          </div>
          <span class="metric-sub">${metrics.liquidity} / 100</span>
        </div>

        <div class="metric" data-metric="layout" data-tooltip="Соотношение жилой площади">
          <span class="metric-label">Планировка</span>
          <span class="metric-value">${metrics.usefulRatio ?? "—"}</span>
        </div>

        <div class="metric" data-metric="resale" data-tooltip="Потенциал перепродажи">
          <span class="metric-label">Перепродажа</span>
          <span class="metric-value">${metrics.resale}</span>
        </div>

      </div>` : ""
    }

    <!-- КНОПКИ -->
    <div class="object-actions">
      <button class="edit-btn" data-index="${index}">✏️</button>
      <button class="view-btn" data-slug="${obj.slug}">👁</button>
    </div>
  `;

  return div;
}
/* ======================================================
   EVENTS (LIST)
====================================================== */
function bind() {

  container.querySelectorAll(".price").forEach(el => {
    el.addEventListener("input", e => {
      objects[e.target.dataset.index].priceBYN = Number(e.target.value);
      setDirty();
    });
  });

  container.querySelectorAll(".desc").forEach(el => {
    el.addEventListener("input", e => {
      objects[e.target.dataset.index].cardDescription = e.target.value.trim();
      setDirty();
    });
  });

  container.querySelectorAll(".recommended").forEach(el => {
    el.addEventListener("change", e => {
      objects[e.target.dataset.index].recommended = e.target.checked;
      setDirty();
      render();
    });
  });

  container.querySelectorAll(".status").forEach(el => {
    el.addEventListener("change", e => {
      const i = e.target.dataset.index;

      if (e.target.value === "sold") {
        objects[i].status = {
          type: "sold",
          date: new Date().toISOString().slice(0, 10)
        };
      } else {
        delete objects[i].status;
      }

      setDirty();
      render();
    });
  });

  container.querySelectorAll(".date").forEach(el => {
    el.addEventListener("change", e => {
      const i = e.target.dataset.index;
      if (objects[i].status) {
        objects[i].status.date = e.target.value;
        setDirty();
      }
    });
  });
}

/* ======================================================
   MODAL LOGIC
====================================================== */
if (openAddModal && addModal) {

openAddModal.addEventListener("click", () => {
  addModal.classList.add("is-open");
  document.body.style.overflow = "hidden";
});

function closeModal() {
  addModal.classList.remove("is-open");
  document.body.style.overflow = "";
}

closeAddModal.addEventListener("click", closeModal);
cancelAdd.addEventListener("click", closeModal);

addModal.addEventListener("click", e => {
  if (e.target === addModal) closeModal();
});

}

/* ======================================================
   ADD OBJECT FORM
====================================================== */
/* ======================================================
   ADD OBJECT FORM
====================================================== */
addType.addEventListener("change", () => {
  addFlat.hidden = addType.value !== "Квартира";
  addHouse.hidden = addType.value !== "Дом";
});

addForm.addEventListener("submit", e => {
  e.preventDefault();

  const fd = new FormData(addForm);

  const features = fd.getAll("feature").map(f => f.trim()).filter(Boolean);

  const obj = {
    id: "obj-" + Date.now(),
    slug: slugifyLatin(fd.get("title")),
    title: fd.get("title"),
    type: fd.get("type"),
    dealType: "Продажа",
    city: fd.get("city"),
    address: fd.get("address"),
    priceBYN: Number(fd.get("priceBYN")),
    priceUSD: Number(fd.get("priceUSD")),
    cardDescription: fd.get("cardDescription"),
    description: fd.get("description"),
    features,
    publishedAt: new Date().toISOString().slice(0, 10)
  };

  if (obj.type === "Квартира") {
    Object.assign(obj, {
      rooms: fd.get("rooms"),
      roomsSeparate: fd.get("roomsSeparate"),
      areaTotal: fd.get("areaTotal"),
      areaLiving: fd.get("areaLiving"),
      yearBuilt: fd.get("yearBuilt"),
      floor: fd.get("floor"),
      floorsTotal: fd.get("floorsTotal"),
      houseType: fd.get("houseType"),
      balcony: fd.get("balcony"),
      repair: fd.get("repair"),
      ceilingHeight: fd.get("ceilingHeight"),
      bathroom: fd.get("bathroom"),
      contractNumber: fd.get("contractNumber")
    });
  }

  if (obj.type === "Дом") {
    Object.assign(obj, {
      areaPlot: fd.get("areaPlot"),
      areaTotal: fd.get("areaTotal"),
      areaLiving: fd.get("areaLiving"),
      areaKitchen: fd.get("areaKitchen"),
      levels: fd.get("levels"),
      yearBuilt: fd.get("yearBuilt"),
      readyPercent: fd.get("readyPercent"),
      houseMaterial: fd.get("houseMaterial"),
      roofMaterial: fd.get("roofMaterial"),
      repair: fd.get("repair"),
      heating: fd.get("heating"),
      sewerage: fd.get("sewerage"),
      electricity: fd.get("electricity"),
      water: fd.get("water"),
      landStatus: fd.get("landStatus"),
      contractNumber: fd.get("contractNumber")
    });
  }

  downloadSingleObject(obj);
  closeModal();
});

/* ======================================================
   SAVE / DOWNLOAD
====================================================== */
function downloadJSON(filename) {
  const blob = new Blob(
    [JSON.stringify(objects, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
}

downloadBtn.addEventListener("click", () => {
  const errors = validateJSON(objects);
  showErrors(errors);
  if (errors.length) return;
  downloadJSON("objects.modified.json");
  setDirty(false);
});

saveBtn.addEventListener("click", () => {
  const errors = validateJSON(objects);
  showErrors(errors);
  if (errors.length) return;
  downloadJSON("objects.modified.json");
  setDirty(false);
});

/* ======================================================
   ERRORS UI
====================================================== */
function showErrors(errors) {
  if (!errors.length) {
    errorsBox.style.display = "none";
    return;
  }

  errorsBox.innerHTML = `
    <strong>Ошибки:</strong>
    <ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul>
  `;
  errorsBox.style.display = "block";
}

/* ======================================================
   HELPERS
====================================================== */
function slugifyLatin(text) {
  const map = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",
    й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",
    у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",
    ю:"yu",я:"ya"
  };

  return text
    .toLowerCase()
    .split("")
    .map(c => map[c] || c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadSingleObject(obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${obj.slug}.json`;
  a.click();
}

function generateFeaturesFromDescription(text, type) {
  if (!text) return [];

  const features = [];
  const t = text.toLowerCase();

  const common = [
    { re: /(\d+[,\.]?\d*)\s*м²/, f: v => `Площадь ${v} м²` },
    { re: /(центр|центре)/, f: () => "Центральный район" },
    { re: /(тихий|спокойный)/, f: () => "Тихий район" },
    { re: /(школ|сад|магазин)/, f: () => "Развитая инфраструктура" }
  ];

  const flatRules = [
    { re: /(\d+)[-\s]?комнат/, f: v => `${v}-комнатная` },
    { re: /этаж\s*(\d+)/, f: v => `Этаж ${v}` },
    { re: /(\d+)[-\s]?этажного/, f: v => `${v}-этажный дом` },
    { re: /(балкон|лоджия)/, f: v => `Есть ${v}` },
    { re: /(ремонт|отремонтирован)/, f: () => "Хорошее состояние" }
  ];

  const houseRules = [
    { re: /участ(ок|ке)/, f: () => "Собственный участок" },
    { re: /(отоплен|печ)/, f: () => "Отопление" },
    { re: /(вода|скважин)/, f: () => "Вода заведена" },
    { re: /(канализац)/, f: () => "Канализация" },
    { re: /(гараж)/, f: () => "Есть гараж" }
  ];

  const rules = [
    ...common,
    ...(type === "Квартира" ? flatRules : []),
    ...(type === "Дом" ? houseRules : [])
  ];

  rules.forEach(r => {
    const m = t.match(r.re);
    if (m) {
      const val = m[1] || m[0];
      const feat = r.f(val.toString().replace(",", "."));
      if (!features.includes(feat)) features.push(feat);
    }
  });

  const fallback = type === "Дом"
    ? [
        "Подходит для постоянного проживания",
        "Удобный подъезд",
        "Хорошее состояние",
        "Документы готовы",
        "Выгодная цена",
        "Перспективный район"
      ]
    : [
        "Удобная планировка",
        "Хорошее состояние",
        "Подходит для проживания",
        "Документы готовы",
        "Выгодное предложение",
        "Комфортный район"
      ];

  while (features.length < 6) {
    const next = fallback[features.length % fallback.length];
    if (!features.includes(next)) features.push(next);
  }

  return features.slice(0, 8);
}


const descriptionField = addForm.querySelector('[name="description"]');

descriptionField.addEventListener("blur", () => {
  const text = descriptionField.value;
  const features = generateFeaturesFromDescription(text);

  const featureInputs = addForm.querySelectorAll('input[name="feature"]');

  featureInputs.forEach((input, i) => {
    input.value = features[i] || "";
  });
});
const regenBtn = document.getElementById("regenFeatures");
const descField = addForm.querySelector('[name="description"]');

function applyFeatures(features) {
  const inputs = addForm.querySelectorAll('input[name="feature"]');

  inputs.forEach((input, i) => {
    if (features[i]) {
      input.value = features[i];
      input.dataset.auto = "1";
    } else {
      input.value = "";
      input.dataset.auto = "0";
    }
  });
}

function regenerateFeatures() {
  const text = descField.value;
  const type = addType.value;

  if (!text || !type) return;

  const features = generateFeaturesFromDescription(text, type);
  applyFeatures(features);
}

regenBtn.addEventListener("click", regenerateFeatures);

descField.addEventListener("blur", () => {
  regenerateFeatures();
});

addForm.querySelectorAll('input[name="feature"]').forEach(input => {
  input.addEventListener("input", () => {
    input.dataset.auto = "0";
  });
});

function renderField(key, config, value, onChange) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";

  const title = document.createElement("span");
  title.textContent = config.label;
  wrapper.appendChild(title);

  let input;

  if (config.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 3;
    input.value = value ?? "";
  } 
  else if (config.type === "checkbox") {
    input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!value;
  } 
  else if (config.type === "number") {
    input = document.createElement("input");
    input.type = "number";
    input.value = value ?? "";
  }
  else if (config.type === "float") {
    input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.placeholder = "например, 78,8";
    input.value = value ?? "";

    input.addEventListener("input", () => {
      const v = input.value.replace(",", ".");
      if (!isNaN(v)) {
        onChange(Number(v));
        setDirty();
      }
    });
  }
  else {
    input = document.createElement("input");
    input.type = "text";
    input.value = value ?? "";
  }

  // обычный обработчик (кроме float — он уже выше)
  if (config.type !== "float") {
    input.addEventListener("input", () => {
      const newValue =
        config.type === "checkbox"
          ? input.checked
          : config.type === "number"
          ? Number(input.value)
          : input.value;

      onChange(newValue);
      setDirty();
    });
  }

  wrapper.appendChild(input);
  return wrapper;
}


function renderObjectEditor(obj) {
  const container = document.createElement("div");
  container.className = "object-editor";

  /* ===== ОСНОВНОЕ ===== */
  container.appendChild(renderSection("Основное"));

  Object.entries(SCHEMA.common).forEach(([key, cfg]) => {
    if (key in obj) {
      const field = renderField(key, cfg, obj[key], val => (obj[key] = val));
      if (["title", "cardDescription", "description"].includes(key)) {
        field.classList.add("full");
      }
      container.appendChild(field);
    }
  });

  /* ===== ПАРАМЕТРЫ ===== */
  const typeKey = obj.type === "Квартира" ? "flat" : "house";

  container.appendChild(
    renderSection(
      obj.type === "Квартира"
        ? "Параметры квартиры"
        : "Параметры дома"
    )
  );

  Object.entries(SCHEMA[typeKey]).forEach(([key, cfg]) => {
    if (key in obj) {
      container.appendChild(
        renderField(key, cfg, obj[key], val => (obj[key] = val))
      );
    }
  });

  /* ===== ЮРИДИЧЕСКОЕ ===== */
  if ("contractNumber" in obj) {
    container.appendChild(renderSection("Юридическое"));

    container.appendChild(
      renderField(
        "contractNumber",
        SCHEMA.common.contractNumber,
        obj.contractNumber,
        val => (obj.contractNumber = val)
      )
    );
  }

  return container;
}


function bindEditButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      openEditModal(index);
    });
  });
}

function openEditModal(index) {
  const obj = objects[index];

  modalTitle.textContent = `Редактирование: ${obj.title}`;
  modalBody.innerHTML = "";
  modalBody.appendChild(renderObjectEditor(obj));

  editModal.classList.add("is-open");
document.body.style.overflow = "hidden";
}

function closeEdit() {
  editModal.classList.remove("is-open");
  document.body.style.overflow = "";
  modalBody.innerHTML = "";
}

closeEditModal.addEventListener("click", closeEdit);
cancelEdit.addEventListener("click", closeEdit);

editModal.addEventListener("click", e => {
  if (e.target === editModal) closeEdit();
});

function renderSection(title) {
  const wrap = document.createElement("div");
  wrap.className = "form-section";
  wrap.innerHTML = `<h3>${title}</h3>`;
  return wrap;
}


function bindQuickActions() {

  // 🔁 статус продажи
  document.querySelectorAll(".status-badge").forEach(badge => {
    badge.addEventListener("click", () => {
      const i = badge.dataset.index;
      const obj = objects[i];

      if (obj.status?.type === "sold") {
        delete obj.status;
      } else {
        obj.status = {
          type: "sold",
          date: new Date().toISOString().slice(0, 10)
        };
      }

      setDirty();
      render();
    });
  });

  // ⭐ рекомендованный
  document.querySelectorAll(".recommend-toggle").forEach(star => {
    star.addEventListener("click", () => {
      const i = star.dataset.index;
      objects[i].recommended = !objects[i].recommended;
      setDirty();
      render();
    });
  });
}

function bindInlinePriceEdit() {
  document.querySelectorAll(".editable-price").forEach(el => {
    el.addEventListener("click", () => {
      const i = el.dataset.index;
      const obj = objects[i];

      if (el.querySelector("input")) return;

      const input = document.createElement("input");
      input.type = "number";
      input.value = obj.priceBYN;
      input.className = "inline-input";

      el.innerHTML = "";
      el.appendChild(input);
      input.focus();

      function save() {
        obj.priceBYN = Number(input.value);
        setDirty();
        render();
      }

      input.addEventListener("keydown", e => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") render();
      });

      input.addEventListener("blur", save);
    });
  });
}

function updateStats() {
  const total = objects.length;
  const sold = objects.filter(o => o.status?.type === "sold").length;
  const active = total - sold;
  const recommended = objects.filter(o => o.recommended).length;

animateNumber(document.getElementById("statTotal"), total);
animateNumber(document.getElementById("statActive"), active);
animateNumber(document.getElementById("statSold"), sold);
animateNumber(document.getElementById("statRecommended"), recommended);
}


function renderDashboardCharts() {
  // ⏱ временная ось
  const publishedStats = groupByDate(objects, o => o.publishedAt);

  // 🔴 продажи
  const soldStats = groupByDate(objects, o => o.status?.date);

  // ⭐ рекомендованные
  const recommendedStats = groupByDate(
    objects.filter(o => o.recommended),
    o => o.publishedAt
  );

  const cards = document.querySelectorAll(".admin-stats .stat");

  cards.forEach((card, i) => {
    const canvas = card.querySelector("canvas");
    if (!canvas) return;

    let data = [];
    let color = "#3b82f6";

    switch (i) {
      case 0: // Всего
        data = publishedStats;
        color = "#3b82f6";
        break;

      case 1: // В продаже
        data = publishedStats.filter(d =>
          objects.some(o =>
            !o.status &&
            o.publishedAt?.startsWith(d.date)
          )
        );
        color = "#22c55e";
        break;

      case 2: // Продано
        data = soldStats;
        color = "#ef4444";
        break;

      case 3: // ⭐ Рекоменд.
        data = recommendedStats;
        color = "#f59e0b";
        break;
    }

    drawInteractiveDateChart(
      canvas,
      data,
      color,
      date => {
        selectedDate = selectedDate === date ? null : date;
        render();
      }
    );
  });
}
const createdStats = groupByDate(objects, o => o.createdAt);
const soldStats = groupByDate(objects, o => o.status?.date);

const canvases = document.querySelectorAll(".admin-stats canvas");


document
  .querySelectorAll(".admin-stats .stat")
  .forEach((card, i) => {
    const canvas = card.querySelector("canvas");
    if (!canvas) return;

    const colors = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b"];
    drawMiniChart(canvas, colors[i]);
  });

function bindDashboardFilters() {
  document.querySelectorAll(".admin-stats .stat").forEach(card => {
    card.addEventListener("click", () => {
      currentFilter = card.dataset.filter || "all";

      document
        .querySelectorAll(".admin-stats .stat")
        .forEach(c => c.classList.remove("is-active"));

      card.classList.add("is-active");
      render();
    });
  });
}

function drawMiniChart(canvas, color) {
  const ctx = canvas.getContext("2d");

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const points = Array.from({ length: 12 }, () =>
    Math.random() * canvas.height * 0.6 + 8
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  points.forEach((v, i) => {
    const x = (canvas.width / (points.length - 1)) * i;
    const y = canvas.height - v;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function animateNumber(el, to) {
  const from = Number(el.textContent) || 0;
  const duration = 600;
  const start = performance.now();

  function frame(time) {
    const progress = Math.min((time - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * progress);
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function groupByDate(objects, getter) {
  const map = {};

  objects.forEach(obj => {
    const date = getter(obj);
    if (!date) return;

    const day = date.slice(0, 10); // YYYY-MM-DD
    map[day] = (map[day] || 0) + 1;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function drawInteractiveDateChart(canvas, points, color, onPointClick) {
  const ctx = canvas.getContext("2d");
  const tooltip = document.getElementById("chartTooltip");

  // 🔥 ЯВНО ЗАДАЁМ РАЗМЕР
  const width = canvas.clientWidth;
  const height = 46;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  if (!points || points.length < 2) return;

  const max = Math.max(...points.map(p => p.value));
  const padding = 6;

  const coords = points.map((p, i) => {
    const x = (width / (points.length - 1)) * i;
    const y =
      height -
      (p.value / max) * (height - padding * 2) -
      padding;
    return { ...p, x, y };
  });

  // линия
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  coords.forEach((p, i) => {
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // tooltip
  canvas.onmousemove = e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    const nearest = coords.reduce((a, b) =>
      Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a
    );

    tooltip.textContent = `${nearest.date}: ${nearest.value}`;
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;
    tooltip.style.opacity = 1;
  };

  canvas.onmouseleave = () => {
    tooltip.style.opacity = 0;
  };

  canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    const nearest = coords.reduce((a, b) =>
      Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a
    );

    onPointClick(nearest.date);
  };
}

function applyFilter(list) {
  let result = list;

  /* ===== existing filters ===== */
  if (currentFilter === "active") {
    result = result.filter(o => !o.status);
  }

  if (currentFilter === "sold") {
    result = result.filter(o => o.status?.type === "sold");
  }

  if (currentFilter === "recommended") {
    result = result.filter(o => o.recommended);
  }

  if (selectedDate) {
    result = result.filter(o =>
      o.publishedAt?.startsWith(selectedDate) ||
      o.status?.date?.startsWith(selectedDate)
    );
  }

  /* ===== STATS FILTERS ===== */
  if (statsFilters.rooms) {
    result = result.filter(o => {
      if (!o.rooms) return false;
      return statsFilters.rooms === "4+"
        ? o.rooms >= 4
        : String(o.rooms) === statsFilters.rooms;
    });
  }

  if (statsFilters.city) {
    result = result.filter(o => o.city === statsFilters.city);
  }


  /* ===== PRICE RANGE FILTER ===== */
  if (statsFilters.priceRange) {
    result = result.filter(o => {
      const price = o.priceUSD;
      if (!price) return false;

      switch (statsFilters.priceRange) {
        case "<30000":
          return price < 30000;

        case "30000-50000":
          return price >= 30000 && price < 50000;

        case "50000-80000":
          return price >= 50000 && price < 80000;

        case "80000+":
          return price >= 80000;

        default:
          return true;
      }
    });
  } 

  return result;
}

function resolvePreviewImage(obj) {
  // 1. если есть явное поле в объекте
  if (obj.previewImage) {
    return obj.previewImage;
  }

  // 2. если есть mapping по slug — путь уже готовый
  if (typeof previewImages !== "undefined" && previewImages[obj.slug]) {
    return previewImages[obj.slug];
  }

  // 3. нет картинки
  return null;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".view-btn");
  if (!btn) return;

  const slug = btn.dataset.slug;
  if (!slug) return;

  window.open(
    `https://turko.by/object-detail?slug=${encodeURIComponent(slug)}`,
    "_blank",
    "noopener"
  );
});

function calculateMetrics(obj) {
  const area = Number(obj.areaTotal);
  const living = Number(obj.areaLiving);
  const price = Number(obj.priceUSD);

  if (!area || !price) return null;

  /* ===== MARKET BASE ===== */
  const typeKey = obj.type === "Дом" ? "house" : "flat";
  const cityKey = MARKET[obj.city] ? obj.city : "default";
  const marketPrice = MARKET[cityKey][typeKey];

  /* ===== BASIC CALCULATIONS ===== */
  const pricePerM2 = Math.round(price / area);

  const deviation = Math.round(
    ((pricePerM2 - marketPrice) / marketPrice) * 100
  );

  const usefulRatio =
    living && area ? Number((living / area).toFixed(2)) : null;

  /* ===== LIQUIDITY CORE ===== */
  let liquidity = 0;

  const explain = {
    total: 0,
    groups: {
      price: [],
      object: [],
      location: []
    },
    advice: []
  };

  /* =====================================================
     PRICE (для всех)
  ===================================================== */

  if (deviation <= -10) {
    liquidity += 30;
    explain.groups.price.push({ value: +30, label: "Цена значительно ниже рынка" });
  } 
  else if (deviation <= 0) {
    liquidity += 25;
    explain.groups.price.push({ value: +25, label: "Цена в рынке или ниже" });
  } 
  else if (deviation <= 5) {
    liquidity += 10;
    explain.groups.price.push({ value: +10, label: "Цена немного выше рынка" });
    explain.advice.push({
      label: "Снижение цены на 5% повысит ликвидность",
      delta: +12
    });
  } 
  else {
    liquidity -= 15;
    explain.groups.price.push({ value: -15, label: "Цена заметно выше рынка" });
    explain.advice.push({
      label: "Снижение цены на 5–7% резко повысит спрос",
      delta: +20
    });
  }

  /* =====================================================
     OBJECT — ОБЩИЕ ФАКТОРЫ
  ===================================================== */

  // --- Возраст постройки ---
  if (obj.yearBuilt) {
    const age = new Date().getFullYear() - obj.yearBuilt;
    if (age <= 20) {
      liquidity += 15;
      explain.groups.object.push({ value: +15, label: "Современная постройка" });
    } else {
      liquidity -= 10;
      explain.groups.object.push({ value: -10, label: "Старая постройка" });
    }
  }

  // --- Ремонт ---
  if (obj.repair === "Хороший") {
    liquidity += 10;
    explain.groups.object.push({ value: +10, label: "Можно заехать и жить" });
  }

  if (obj.repair === "Требует ремонта") {
    liquidity -= 15;
    explain.groups.object.push({
      value: -15,
      label: "Требуется ремонт — снижает спрос"
    });
    explain.advice.push({
      label: "Косметический ремонт или дисконт ускорят продажу",
      delta: +15
    });
  }

  /* =====================================================
     КВАРТИРЫ
  ===================================================== */

  if (obj.type === "Квартира") {

    // Комнаты
    if (obj.rooms && obj.rooms <= 2) {
      liquidity += 20;
      explain.groups.object.push({
        value: +20,
        label: "Самый востребованный формат (1–2 комнаты)"
      });
    } else if (obj.rooms) {
      liquidity -= 5;
      explain.groups.object.push({
        value: -5,
        label: "Многокомнатная квартира — спрос уже"
      });
    }

    // Этаж
    if (obj.floor) {
      if (obj.floor >= 3 && obj.floor <= 7) {
        liquidity += 15;
        explain.groups.object.push({ value: +15, label: "Удобный этаж (3–7)" });
      } else {
        liquidity -= 5;
        explain.groups.object.push({ value: -5, label: "Не самый востребованный этаж" });
      }
    }

    // Балкон
    if (obj.balcony) {
      liquidity += 5;
      explain.groups.object.push({ value: +5, label: "Есть балкон / лоджия" });
    } else {
      liquidity -= 5;
      explain.groups.object.push({ value: -5, label: "Отсутствие балкона" });
    }

    // Планировка
    if (usefulRatio !== null) {
      if (usefulRatio >= 0.55) {
        liquidity += 10;
        explain.groups.object.push({
          value: +10,
          label: "Удачная планировка"
        });
      } else if (usefulRatio < 0.45) {
        liquidity -= 10;
        explain.groups.object.push({
          value: -10,
          label: "Неудачная планировка"
        });
      }
    }
  }

  /* =====================================================
     ДОМА
  ===================================================== */

  if (obj.type === "Дом") {

    // Площадь участка
    if (obj.areaPlot) {
      if (obj.areaPlot >= 10) {
        liquidity += 15;
        explain.groups.object.push({
          value: +15,
          label: "Большой участок"
        });
      } else if (obj.areaPlot < 6) {
        liquidity -= 10;
        explain.groups.object.push({
          value: -10,
          label: "Маленький участок"
        });
      }
    }

    // Готовность (%)
    if (obj.readyPercent !== undefined) {
      if (obj.readyPercent >= 90) {
        liquidity += 15;
        explain.groups.object.push({
          value: +15,
          label: "Дом практически готов к проживанию"
        });
      } else if (obj.readyPercent < 70) {
        liquidity -= 15;
        explain.groups.object.push({
          value: -15,
          label: "Низкая степень готовности"
        });
        explain.advice.push({
          label: "Доведение готовности до 90% повысит ликвидность",
          delta: +15
        });
      }
    }

    // Коммуникации
    const comms = ["water", "electricity", "heating", "sewerage"];
    const connected = comms.filter(k => obj[k]).length;

    if (connected >= 3) {
      liquidity += 15;
      explain.groups.object.push({
        value: +15,
        label: "Подключены основные коммуникации"
      });
    } else if (connected <= 1) {
      liquidity -= 20;
      explain.groups.object.push({
        value: -20,
        label: "Отсутствуют ключевые коммуникации"
      });
      explain.advice.push({
        label: "Подведение коммуникаций резко повысит спрос",
        delta: +20
      });
    }
  }

  /* =====================================================
     LOCATION
  ===================================================== */

  if (obj.city === "Лида") {
    liquidity += 15;
    explain.groups.location.push({
      value: +15,
      label: "Активный локальный рынок (Лида)"
    });
  } else {
    liquidity -= 5;
    explain.groups.location.push({
      value: -5,
      label: "Менее активный рынок"
    });
  }

  const STRONG_DISTRICTS = ["Центр", "Южный", "Северный"];
  const WEAK_DISTRICTS = ["Окраина", "Промзона"];

  if (obj.district && STRONG_DISTRICTS.includes(obj.district)) {
    liquidity += 10;
    explain.groups.location.push({
      value: +10,
      label: `Сильный район (${obj.district})`
    });
  }

  if (obj.district && WEAK_DISTRICTS.includes(obj.district)) {
    liquidity -= 10;
    explain.groups.location.push({
      value: -10,
      label: `Слабый район (${obj.district})`
    });
  }

  /* =====================================================
     FINAL
  ===================================================== */

  liquidity = Math.max(0, Math.min(liquidity, 100));
  explain.total = liquidity;

  let resale = "Ограниченный";
  if (liquidity >= 70 && deviation <= 0) resale = "Высокий";
  else if (liquidity >= 55) resale = "Средний";

  return {
    pricePerM2,
    deviation,
    usefulRatio,
    liquidity,
    resale,
    liquidityExplain: explain
  };
}
const metricsInfoModal = document.getElementById("metricsModal");
const metricsInfoTitle = metricsInfoModal.querySelector(".metrics-modal__title");
const metricsInfoContent = metricsInfoModal.querySelector(".metrics-modal__content");

document.addEventListener("click", (e) => {
  const metricEl = e.target.closest(".metric");
  if (!metricEl) return;

  const metricKey = metricEl.dataset.metric;
  if (!metricKey) return;

  const objectEl = metricEl.closest(".object");
  const index = Number(objectEl?.dataset.index);
  const obj = objects[index];
  const metrics = calculateMetrics(obj);

  /* =========================================
     1️⃣ ЛИКВИДНОСТЬ — кастомный разбор
  ========================================= */
  if (metricKey === "liquidity" && metrics?.liquidityExplain) {
    const ex = metrics.liquidityExplain;

    metricsInfoTitle.textContent = "Индекс ликвидности — разбор";

    const renderGroup = (title, items) => `
      <h4>${title}</h4>
      <ul class="liquidity-explain">
        ${items.map(i => `
          <li class="${i.value > 0 ? "plus" : "minus"}">
            <span class="value">${i.value > 0 ? "+" : ""}${i.value}</span>
            <span>${i.label}</span>
          </li>
        `).join("")}
      </ul>
    `;

    metricsInfoContent.innerHTML = `
      <p><strong>Итог:</strong> ${ex.total} / 100</p>

      ${renderGroup("Цена", ex.groups.price)}
      ${renderGroup("Объект", ex.groups.object)}
      ${renderGroup("Локация", ex.groups.location)}

      ${
        ex.advice.length
          ? `<h4>Как повысить ликвидность</h4>
             <ul class="liquidity-advice">
               ${ex.advice.map(a => `
                 <li>💡 ${a.label}
                 <strong>(≈ +${a.delta} баллов)</strong></li>
               `).join("")}
             </ul>`
          : ""
      }
    `;

    metricsInfoModal.hidden = false;
    return;
  }

  /* =========================================
     2️⃣ ВСЕ ОСТАЛЬНЫЕ МЕТРИКИ — METRICS_INFO
  ========================================= */
  const info = METRICS_INFO[metricKey];
  if (!info) return;

  metricsInfoTitle.textContent = info.title;
  metricsInfoContent.innerHTML = info.html;
  metricsInfoModal.hidden = false;
});

metricsInfoModal.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("metrics-modal__overlay") ||
    e.target.classList.contains("metrics-modal__close")
  ) {
    metricsInfoModal.hidden = true;
  }
});

function sortObjects(list) {
  const arr = [...list];

  switch (currentSort) {
    case "price-desc":
      return arr.sort((a, b) => (b.priceUSD || 0) - (a.priceUSD || 0));

    case "price-asc":
      return arr.sort((a, b) => (a.priceUSD || 0) - (b.priceUSD || 0));

    case "new":
    default:
      return arr.sort((a, b) => {
        const da = new Date(a.publishedAt  || 0).getTime();
        const db = new Date(b.publishedAt  || 0).getTime();
        return db - da;
      });
  }
}

const sortSelect = document.getElementById("objectsSort");

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    render();
  });
}

function formatRoomsLabel(key) {
  switch (key) {
    case "1": return "Однокомнатные";
    case "2": return "Двухкомнатные";
    case "3": return "Трёхкомнатные";
    case "4+": return "4+ комнаты";
    default: return `${key}-комнатные`;
  }
}

function formatPriceRangeLabel(key) {
  switch (key) {
    case "<30000": return "Меньше 30 тыс. $";
    case "30000-50000": return "30–50 тыс. $";
    case "50000-80000": return "50–80 тыс. $";
    case "80000+": return "Более 80 тыс. $";
    default: return key;
  }
}


function renderPortfolioStats(objects) {
  const stats = PortfolioStatistics.calculate(objects);

  renderStatsCards("statsRooms", stats.rooms, "rooms");
  renderStatsCards("statsCities", stats.cities, "cities");
  renderStatsCards("statsPrices", stats.priceRanges, "prices");
  renderAvgPrice(stats.avgPricePerM2);
}

function renderStatsGroup(containerId, data) {
  const container = document.querySelector(`#${containerId} .stats-items`);
  if (!container) return;

  container.innerHTML = "";

  Object.entries(data).forEach(([key, value]) => {
    /* ===== HIDE EMPTY PRICE SEGMENTS ===== */
    if (
      containerId === "statsPrices" &&
      statsFilters.priceRange &&
      value === 0
    ) {
      return; // ❗ просто не рендерим
    }

    let label = key;
    let isActive = false;

    if (containerId === "statsRooms") {
      label = formatRoomsLabel(key);
      isActive = statsFilters.rooms === key;
    }

    if (containerId === "statsCities") {
      label = key;
      isActive = statsFilters.city === key;
    }

    if (containerId === "statsPrices") {
      label = formatPriceRangeLabel(key);
      isActive = statsFilters.priceRange === key;
    }

    const el = document.createElement("div");
    el.className = "stats-item";
    if (isActive) el.classList.add("is-active");

    el.textContent = `${label} — ${value} шт.`;

    el.addEventListener("click", () => {
      if (containerId === "statsRooms") {
        statsFilters.rooms =
          statsFilters.rooms === key ? null : key;
      }

      if (containerId === "statsCities") {
        statsFilters.city =
          statsFilters.city === key ? null : key;
      }

      if (containerId === "statsPrices") {
        statsFilters.priceRange =
          statsFilters.priceRange === key ? null : key;
      }

      render();
    });

    container.appendChild(el);
  });
}

function renderAvgPrice(data) {
  const footer = document.getElementById("statsAvgPrice");
  if (!footer) return;

  const parts = Object.entries(data).map(
    ([rooms, price]) =>
      `${formatRoomsLabel(rooms)} — ${price} $/м²`
  );

  footer.textContent = `Средняя цена за м²: ${parts.join(" | ")}`;
}


function formatRoomsLabel(v) {
  return {
    1: "Однокомнатные",
    2: "Двухкомнатные",
    3: "Трёхкомнатные",
    4: "4+ комнатные"
  }[v] || `${v} комнат`;
}

function formatPriceRangeLabel(key) {
  const map = {
    "<30000": "До 30 тыс. $",
    "30000-50000": "30–50 тыс. $",
    "50000-80000": "50–80 тыс. $",
    ">80000": "От 80 тыс. $"
  };
  return map[key] || key;
}


function renderStatsCards(containerId, data, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  Object.entries(data).forEach(([key, count]) => {
    if (count === 0) return;

    let label = key;
    let active = false;

    if (type === "rooms") {
      label = formatRoomsLabel(key);
      active = statsFilters.rooms === key;
    }

    if (type === "cities") {
      active = statsFilters.city === key;
    }

    if (type === "prices") {
      label = formatPriceRangeLabel(key);
      active = statsFilters.priceRange === key;
    }

    const card = document.createElement("div");
    card.className = `stats-card ${active ? "is-active" : ""}`;

    card.innerHTML = `
      <div class="stats-card__value">${count}</div>
      <div class="stats-card__label">${label}</div>
      <div class="stats-card__meta">шт.</div>
    `;

    card.addEventListener("click", () => {
      if (type === "rooms") {
        statsFilters.rooms = statsFilters.rooms === key ? null : key;
      }
      if (type === "cities") {
        statsFilters.city = statsFilters.city === key ? null : key;
      }
      if (type === "prices") {
        statsFilters.priceRange =
          statsFilters.priceRange === key ? null : key;
      }
      render();
    });

    container.appendChild(card);
  });
}