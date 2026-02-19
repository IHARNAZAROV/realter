"use strict";

/* =====================================================
   STATE
===================================================== */

let objects = [];
let isDirty = false;

const container = document.getElementById("objects");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const dirtyIndicator = document.getElementById("dirtyIndicator");
const errorsBox = document.getElementById("errors");

/* ===== EDIT MODAL ===== */
const editModal = document.getElementById("editModal");
const modalBody = document.getElementById("editModalBody");
const modalTitle = document.getElementById("editModalTitle");
const closeEditModal = document.getElementById("closeEditModal");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");

/* =====================================================
   SCHEMA
===================================================== */

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
    rooms: { label: "Комнат", type: "number" },
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
    areaPlot: { label: "Площадь участка", type: "float" },
    areaTotal: { label: "Площадь общая", type: "float" },
    areaLiving: { label: "Площадь жилая", type: "float" },
    houseMaterial: { label: "Материал стен", type: "text" },
    roofMaterial: { label: "Материал крыши", type: "text" },
    heating: { label: "Отопление", type: "text" },
    water: { label: "Вода", type: "text" },
    sewerage: { label: "Канализация", type: "text" },
    electricity: { label: "Электроснабжение", type: "text" },
    landStatus: { label: "Статус земли", type: "text" }
  }
};

/* =====================================================
   HELPERS
===================================================== */

function setDirty(val = true) {
  isDirty = val;
  dirtyIndicator.style.display = isDirty ? "inline-block" : "none";
}

function showErrors(errors) {
  errorsBox.innerHTML = "";
  if (!errors.length) return;

  const ul = document.createElement("ul");
  errors.forEach(err => {
    const li = document.createElement("li");
    li.textContent = err;
    ul.appendChild(li);
  });

  errorsBox.appendChild(ul);
}

function renderSection(title) {
  const div = document.createElement("div");
  div.className = "form-section";
  div.innerHTML = `<h3>${title}</h3>`;
  return div;
}

/* =====================================================
   FIELD RENDER
===================================================== */

function renderField(key, cfg, value, onChange) {
  const wrap = document.createElement("label");
  wrap.className = "field";

  const title = document.createElement("span");
  title.textContent = cfg.label;
  wrap.appendChild(title);

  let input;

  if (cfg.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 3;
    input.value = value ?? "";
  } 
  else if (cfg.type === "checkbox") {
    input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!value;
  } 
  else if (cfg.type === "number") {
    input = document.createElement("input");
    input.type = "number";
    input.value = value ?? "";
  } 
  else if (cfg.type === "float") {
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

  if (cfg.type !== "float") {
    input.addEventListener("input", () => {
      const newValue =
        cfg.type === "checkbox"
          ? input.checked
          : cfg.type === "number"
          ? Number(input.value)
          : input.value;

      onChange(newValue);
      setDirty();
    });
  }

  wrap.appendChild(input);
  return wrap;
}

/* =====================================================
   OBJECT EDITOR
===================================================== */

function renderObjectEditor(obj) {
  const editor = document.createElement("div");
  editor.className = "object-editor";

  editor.appendChild(renderSection("Основное"));

  Object.entries(SCHEMA.common).forEach(([key, cfg]) => {
    if (key in obj) {
      const field = renderField(key, cfg, obj[key], v => (obj[key] = v));
      if (["title", "cardDescription", "description"].includes(key)) {
        field.classList.add("full");
      }
      editor.appendChild(field);
    }
  });

  const typeKey = obj.type === "Квартира" ? "flat" : "house";
  editor.appendChild(
    renderSection(obj.type === "Квартира" ? "Параметры квартиры" : "Параметры дома")
  );

  Object.entries(SCHEMA[typeKey]).forEach(([key, cfg]) => {
    if (key in obj) {
      editor.appendChild(
        renderField(key, cfg, obj[key], v => (obj[key] = v))
      );
    }
  });

  return editor;
}

/* =====================================================
   MODAL
===================================================== */

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

closeEditModal.onclick = cancelEdit.onclick = closeEdit;
saveEdit.onclick = closeEdit;

/* =====================================================
   LIST RENDER
===================================================== */

function bindEditButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      openEditModal(Number(btn.dataset.index));
    });
  });
}

function render() {
  container.innerHTML = "";

  const sorted = [...objects].sort(
    (a, b) => (b.recommended === true) - (a.recommended === true)
  );

  sorted.forEach(obj => {
    const index = objects.indexOf(obj);

    const div = document.createElement("div");
    div.className = "object";

    div.innerHTML = `
      <div class="object-main">
        <div class="object-title">${obj.title}</div>
      </div>

      <div class="object-meta">
        <button class="edit-btn" data-index="${index}">
          ✏️ Редактировать
        </button>
      </div>
    `;

    container.appendChild(div);
  });

  bindEditButtons();
}

/* =====================================================
   SAVE TO SERVER
===================================================== */

async function saveToServer() {
  const errors = validateJSON(objects);
  showErrors(errors);
  if (errors.length) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "⏳ Сохранение...";

  try {
    const res = await fetch("/adminka_objects/save.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(objects)
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Ошибка");

    setDirty(false);
    alert("✅ Изменения сохранены");

  } catch (e) {
    alert("❌ " + e.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 Сохранить изменения";
  }
}

saveBtn.addEventListener("click", saveToServer);

/* =====================================================
   INIT
===================================================== */

const DATA_URL = '/data/objects.json';

fetch(DATA_URL, { cache: 'no-store' })
  .then(res => {
    if (!res.ok) {
      throw new Error('JSON не загрузился: ' + res.status);
    }
    return res.json();
  })
  .then(data => {
    console.log('JSON загружен:', data);
    objects = data;
    renderObjects();
  })
  .catch(err => {
    console.error(err);
    showError('Не удалось загрузить objects.json');
  });