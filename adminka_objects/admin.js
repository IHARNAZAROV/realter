"use strict";

/* ======================================================
   STATE
====================================================== */
let objects = [];
let isDirty = false;
let currentFilter = "all";
let selectedDate = null;
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

/* ======================================================
   RENDER
====================================================== */
function render() {
  container.innerHTML = "";

  const sorted = [...objects].sort(
    (a, b) => (b.recommended === true) - (a.recommended === true)
  );

  sorted.forEach(obj => {
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
}

function renderObject(obj, index) {
  const status = obj.status?.type || "active";
  const date = obj.status?.date || "";

  const div = document.createElement("div");
  div.className = "object";

div.innerHTML = `
  <div class="object-main">

    <div class="object-header">
      <div class="object-title">
        ${obj.title}
      </div>

      <div class="object-badges">
       ${obj.recommended
  ? `<span class="badge badge-star recommend-toggle" data-index="${index}" title="Убрать из рекомендованных">⭐</span>`
  : `<span class="badge badge-star recommend-toggle is-muted" data-index="${index}" title="Добавить в рекомендованные">☆</span>`
}
<span
  class="badge ${obj.status?.type === "sold" ? "badge-sold" : "badge-active"} status-badge"
  data-index="${index}"
>
  ${obj.status?.type === "sold"
    ? `Продано${obj.status?.date ? " • " + obj.status.date : ""}`
    : "В продаже"}
</span>
      </div>
    </div>

<div
  class="object-price editable-price"
  data-index="${index}"
>
  <span class="price-view">
    ${obj.priceBYN?.toLocaleString()} BYN
    <span class="price-usd">
      / ${obj.priceUSD?.toLocaleString()} $
    </span>
  </span>
</div>

    <div class="object-address">
      📍 ${obj.city || ""}${obj.address ? ", " + obj.address : ""}
    </div>

  </div>

  <div class="object-controls">
    <button
      class="edit-btn"
      data-index="${index}"
      title="Редактировать объект"
    >
      ✏️
    </button>
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

  return result;
}