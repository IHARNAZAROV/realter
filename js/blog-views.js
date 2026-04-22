"use strict";

/* =========================================================
   BLOG VIEWS COUNTER
   Хранит просмотры статей блога в localStorage.
   Структура спроектирована так, чтобы её можно было
   легко заменить на backend (просто переопределите
   методы getViews / incrementViews / getAllViews).
   ========================================================= */

(function (global) {
  const STORAGE_KEY = "blog_post_views";

  /* ------- LocalStorage helpers (с защитой) ------- */
  function hasStorage() {
    try {
      const k = "__bv_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  const STORAGE_AVAILABLE = hasStorage();

  // Fallback: храним в памяти, если localStorage недоступен
  let memoryStore = {};

  function readAll() {
    if (!STORAGE_AVAILABLE) return { ...memoryStore };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch (e) {
      // Поврежденные данные — сбрасываем
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      return {};
    }
  }

  function writeAll(data) {
    if (!STORAGE_AVAILABLE) {
      memoryStore = { ...data };
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Если квота исчерпана — переходим на in-memory
      memoryStore = { ...data };
    }
  }

  /* ------- Helpers ------- */
  function resolveId(input) {
    if (input == null) return "";
    if (typeof input === "string" || typeof input === "number") {
      return String(input).trim();
    }
    if (typeof input === "object") {
      return String(input.id || input.slug || "").trim();
    }
    return "";
  }

  /* ------- Public API ------- */
  function getViews(postIdOrArticle) {
    const id = resolveId(postIdOrArticle);
    if (!id) return 0;
    const all = readAll();
    const value = Number(all[id]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function getAllViews() {
    return readAll();
  }

  // Защита от двойного инкремента в рамках одной загрузки страницы
  const incrementedThisLoad = new Set();

  function incrementViews(postIdOrArticle, options) {
    const id = resolveId(postIdOrArticle);
    if (!id) return 0;

    const opts = options || {};
    const force = opts.force === true;

    if (!force && incrementedThisLoad.has(id)) {
      return getViews(id);
    }

    const all = readAll();
    const current = Number(all[id]);
    const next = (Number.isFinite(current) && current > 0 ? current : 0) + 1;
    all[id] = next;
    writeAll(all);

    incrementedThisLoad.add(id);
    return next;
  }

  /* ------- Formatting ------- */
  function pluralizeViews(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "просмотр";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "просмотра";
    return "просмотров";
  }

  function formatViewsLabel(count) {
    return count + " " + pluralizeViews(count);
  }

  /* ------- HTML helpers (для удобной интеграции) ------- */
  const EYE_ICON_SVG =
    '<svg class="post-views-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 5C6.5 5 2.2 8.6 1 12c1.2 3.4 5.5 7 11 7s9.8-3.6 11-7c-1.2-3.4-5.5-7-11-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>' +
    "</svg>";

  function renderCardBadge(postIdOrArticle) {
    const count = getViews(postIdOrArticle);
    return (
      '<li class="post-views" aria-label="' + formatViewsLabel(count) + '">' +
      EYE_ICON_SVG +
      '<span class="post-views-count">' + count + "</span>" +
      "</li>"
    );
  }

  function renderDetailBadge(postIdOrArticle) {
    const count = getViews(postIdOrArticle);
    return (
      '<div class="post-views post-views--detail" aria-label="' + formatViewsLabel(count) + '">' +
      EYE_ICON_SVG +
      '<span class="post-views-count">' + count + "</span>" +
      '<span class="post-views-label">' + pluralizeViews(count) + "</span>" +
      "</div>"
    );
  }

  global.BlogViews = {
    getViews: getViews,
    incrementViews: incrementViews,
    getAllViews: getAllViews,
    formatViewsLabel: formatViewsLabel,
    pluralizeViews: pluralizeViews,
    renderCardBadge: renderCardBadge,
    renderDetailBadge: renderDetailBadge,
    EYE_ICON_SVG: EYE_ICON_SVG,
    STORAGE_KEY: STORAGE_KEY,
  };
})(window);
