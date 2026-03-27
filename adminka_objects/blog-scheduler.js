"use strict";

const STORAGE_KEY = "adminSaveToken";
const DATA_URL = "/data/blog-articles.json";
const SAVE_URL = "/adminka_objects/save-blog.php";

const publishAtEl = document.getElementById("publishAt");
const timezoneHintEl = document.getElementById("timezoneHint");
const articleJsonEl = document.getElementById("articleJson");
const addArticleBtn = document.getElementById("addArticleBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const setTokenBtn = document.getElementById("setTokenBtn");
const errorsEl = document.getElementById("errors");
const dirtyIndicatorEl = document.getElementById("dirtyIndicator");
const articleCountEl = document.getElementById("articleCount");
const articlesListEl = document.getElementById("articlesList");

let articles = [];
let isDirty = false;

function tzString() {
  const parts = Intl.DateTimeFormat().resolvedOptions();
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${parts.timeZone || "UTC"} (UTC${sign}${hh}:${mm})`;
}

function formatDdMmYyyy(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function formatLocalDateTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return String(isoString);
  return d.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function slugify(input) {
  const source = String(input || "").toLowerCase().trim();
  const cyrMap = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
  };

  return source
    .split("")
    .map((ch) => (cyrMap[ch] !== undefined ? cyrMap[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `article-${Date.now()}`;
}

function setDirty(value) {
  isDirty = Boolean(value);
  dirtyIndicatorEl.classList.toggle("is-visible", isDirty);
}

function showError(message) {
  errorsEl.textContent = message;
  errorsEl.style.display = "block";
}

function clearError() {
  errorsEl.textContent = "";
  errorsEl.style.display = "none";
}

function updateTokenButtonText() {
  const hasToken = !!(localStorage.getItem(STORAGE_KEY) || "").trim();
  setTokenBtn.textContent = hasToken ? "🔐 Токен задан" : "🔐 Ввести токен";
}

function askAndStoreAdminToken() {
  const currentToken = (localStorage.getItem(STORAGE_KEY) || "").trim();
  const typed = prompt(
    "Введите токен для сохранения на сервере.\nОставьте пустым, чтобы удалить токен.",
    currentToken
  );

  if (typed === null) return;

  const nextToken = typed.trim();
  if (!nextToken) {
    localStorage.removeItem(STORAGE_KEY);
    updateTokenButtonText();
    return;
  }

  localStorage.setItem(STORAGE_KEY, nextToken);
  updateTokenButtonText();
}

function normalizeArticle(article) {
  if (!article || typeof article !== "object" || Array.isArray(article)) {
    throw new Error("JSON статьи должен быть объектом");
  }

  const normalized = { ...article };
  normalized.title = String(normalized.title || "").trim();
  if (!normalized.title) {
    throw new Error("Поле title обязательно");
  }

  normalized.slug = String(normalized.slug || "").trim() || slugify(normalized.title);
  normalized.id = String(normalized.id || "").trim() || normalized.slug;
  normalized.date = String(normalized.date || "").trim();

  return normalized;
}

function validateArticles(list) {
  if (!Array.isArray(list)) {
    return "Массив статей поврежден";
  }

  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return `Статья #${i + 1}: ожидался объект`;
    }

    if (!String(item.title || "").trim()) {
      return `Статья #${i + 1}: поле title обязательно`;
    }

    if (!String(item.slug || "").trim()) {
      return `Статья #${i + 1}: поле slug обязательно`;
    }

    if (!String(item.date || "").trim()) {
      return `Статья #${i + 1}: поле date обязательно (DD.MM.YYYY)`;
    }

    if (!String(item.publishAt || "").trim()) {
      return `Статья #${i + 1}: поле publishAt обязательно`;
    }

    const publishDate = new Date(item.publishAt);
    if (Number.isNaN(publishDate.getTime())) {
      return `Статья #${i + 1}: publishAt имеет некорректный формат`;
    }
  }

  return null;
}

function renderArticles() {
  articlesListEl.innerHTML = "";
  articleCountEl.textContent = String(articles.length);

  if (!articles.length) {
    articlesListEl.innerHTML = '<p style="color:#94a3b8">Пока нет статей в плане.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  articles.forEach((article, index) => {
    const card = document.createElement("article");
    card.className = "article-card";

    const top = document.createElement("div");
    top.className = "article-top";

    const left = document.createElement("div");
    left.innerHTML = `
      <h3 class="article-title">${article.title}</h3>
      <p class="article-slug">/${article.slug}</p>
    `;

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.type = "button";
    delBtn.title = "Удалить статью";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => {
      articles.splice(index, 1);
      setDirty(true);
      renderArticles();
    });

    top.append(left, delBtn);

    const meta = document.createElement("div");
    meta.className = "article-meta";
    meta.innerHTML = `
      <div>Публикация: <strong>${formatLocalDateTime(article.publishAt)}</strong></div>
      <div>Дата в статье: ${article.date}</div>
    `;

    card.append(top, meta);
    fragment.appendChild(card);
  });

  articlesListEl.appendChild(fragment);
}

function onAddArticle() {
  clearError();

  if (!publishAtEl.value) {
    showError("Выберите дату и время публикации");
    return;
  }

  if (!articleJsonEl.value.trim()) {
    showError("Вставьте JSON статьи");
    return;
  }

  let rawObject;
  try {
    rawObject = JSON.parse(articleJsonEl.value);
  } catch (error) {
    showError(`Некорректный JSON: ${error.message}`);
    return;
  }

  let article;
  try {
    article = normalizeArticle(rawObject);
  } catch (error) {
    showError(error.message);
    return;
  }

  const publicationDate = new Date(publishAtEl.value);
  if (Number.isNaN(publicationDate.getTime())) {
    showError("Неверная дата публикации");
    return;
  }

  article.publishAt = publicationDate.toISOString();
  article.date = formatDdMmYyyy(publicationDate);

  articles.unshift(article);
  setDirty(true);
  renderArticles();

  articleJsonEl.value = "";
}

async function loadArticles() {
  clearError();
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Не удалось загрузить data/blog-articles.json");
  }

  const payload = await response.json();
  articles = Array.isArray(payload) ? payload : [];
}

function downloadCopy() {
  const blob = new Blob([JSON.stringify(articles, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "blog-articles.modified.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function saveArticlesToServer() {
  const validationError = validateArticles(articles);
  if (validationError) {
    throw new Error(validationError);
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  };

  const token = (localStorage.getItem(STORAGE_KEY) || "").trim();
  if (token) {
    headers["X-Admin-Token"] = token;
  }

  const response = await fetch(SAVE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(articles)
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    // ignore non-json payload
  }

  if (!response.ok || payload?.status !== "ok") {
    throw new Error(payload?.error || "Ошибка сохранения статей на сервер");
  }
}

async function handleSave() {
  clearError();
  saveBtn.disabled = true;
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "⏳ Сохраняем...";

  try {
    await saveArticlesToServer();
    setDirty(false);
    saveBtn.textContent = "✅ Сохранено";
  } catch (error) {
    showError(error.message);
    saveBtn.textContent = "❌ Ошибка";
  } finally {
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1200);
  }
}

function init() {
  timezoneHintEl.value = tzString();
  updateTokenButtonText();

  addArticleBtn.addEventListener("click", onAddArticle);
  saveBtn.addEventListener("click", handleSave);
  downloadBtn.addEventListener("click", downloadCopy);
  setTokenBtn.addEventListener("click", askAndStoreAdminToken);

  loadArticles()
    .then(() => renderArticles())
    .catch((error) => showError(error.message));
}

init();
