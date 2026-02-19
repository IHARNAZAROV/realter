"use strict";

/* ======================================================
   STATE
====================================================== */
let objects = [];
let isDirty = false;
let autosaveTimer = null;

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
  if (isDirty) scheduleAutosave();
}

function scheduleAutosave(delay = 3000) {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (!isDirty) return;
    downloadJSON("objects.autosave.json");
    setDirty(false);
  }, delay);
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
}

function renderObject(obj, index) {
  const status = obj.status?.type || "active";
  const date = obj.status?.date || "";

  const div = document.createElement("div");
  div.className = "object";

  div.innerHTML = `
    <div class="object-main">
      <div class="object-title">
        ${obj.title}${obj.recommended ? " ⭐" : ""}
      </div>

      <label>
        Цена BYN
        <input type="number" class="price" data-index="${index}" value="${obj.priceBYN}">
      </label>

      <label>
        Описание карточки
        <textarea class="desc" data-index="${index}">${obj.cardDescription || ""}</textarea>
      </label>
    </div>

    <div class="object-meta">
      <label>
        Статус
        <select class="status" data-index="${index}">
          <option value="active" ${status === "active" ? "selected" : ""}>В продаже</option>
          <option value="sold" ${status === "sold" ? "selected" : ""}>Продана</option>
        </select>
      </label>

      <label>
        Дата продажи
        <input type="date" class="date" data-index="${index}" value="${date}" ${status !== "sold" ? "disabled" : ""}>
      </label>

      <label>
        <input type="checkbox" class="recommended" data-index="${index}" ${obj.recommended ? "checked" : ""}>
        Рекомендуемый
      </label>
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
