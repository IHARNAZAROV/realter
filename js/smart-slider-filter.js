"use strict";

(function SmartSliderFilter() {
  /* ── State ──────────────────────────────────────────── */
  let sfMinByn  = 0;
  let sfMaxByn  = 360000;
  let sfMinArea = 30;
  let sfMaxArea = 340;

  const isActive = { budget: false, area: false, location: false };

  /* ── DOM refs (populated in init) ───────────────────── */
  let priceToEl, areaFromEl, locationEl;
  let sfBudgetEl, sfAreaEl;
  let sfBudgetValueEl, sfAreaValueEl;
  let sfCountEl;

  /* ── Helpers ────────────────────────────────────────── */
  function fmtByn(v) {
    return Number(v).toLocaleString("ru-RU") + "\u00a0BYN";
  }

  function fmtArea(v) {
    return v + "\u00a0м²";
  }

  function updateRangeFill(input) {
    const min = +input.min;
    const max = +input.max;
    const val = +input.value;
    const pct =
      max > min
        ? (((val - min) / (max - min)) * 100).toFixed(1) + "%"
        : "100%";
    input.style.setProperty("--fill", pct);
  }

  function setValueState(el, isDefault) {
    el.classList.toggle("is-default", isDefault);
  }

  function updateCountDisplay(n) {
    if (!sfCountEl) return;
    sfCountEl.textContent = n;
    sfCountEl.classList.toggle("is-zero", n === 0);
  }

  function triggerFilters() {
    if (typeof window.realterApplyFilters === "function") {
      window.realterApplyFilters();
    }
  }

  /* ── Handlers ───────────────────────────────────────── */
  function onBudgetInput() {
    const val   = +sfBudgetEl.value;
    const isMax = val >= sfMaxByn;
    isActive.budget = !isMax;

    sfBudgetValueEl.textContent = isMax ? "Любой бюджет" : "до\u00a0" + fmtByn(val);
    setValueState(sfBudgetValueEl, isMax);

    /* Пишем BYN напрямую в #priceTo — filters.js читает его */
    priceToEl.value = isMax ? "" : String(val);

    updateRangeFill(sfBudgetEl);
    triggerFilters();
  }

  function onAreaInput() {
    const val   = +sfAreaEl.value;
    const isMin = val <= sfMinArea;
    isActive.area = !isMin;

    sfAreaValueEl.textContent = isMin ? "Любая площадь" : "от\u00a0" + fmtArea(val);
    setValueState(sfAreaValueEl, isMin);

    areaFromEl.value = isMin ? "" : String(val);

    updateRangeFill(sfAreaEl);
    triggerFilters();
  }

  function onLocationPill(pillEl) {
    const loc = pillEl.dataset.location;

    document
      .querySelectorAll(".sf-pill")
      .forEach((p) => p.classList.remove("is-active"));
    pillEl.classList.add("is-active");

    isActive.location = loc !== "all";

    locationEl.value = loc;
    locationEl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* ── Сброс ползунков (вызывается из filters.js тоже) ── */
  function resetSmartFilter() {
    /* Budget */
    sfBudgetEl.value            = sfMaxByn;
    isActive.budget             = false;
    sfBudgetValueEl.textContent = "Любой бюджет";
    setValueState(sfBudgetValueEl, true);
    updateRangeFill(sfBudgetEl);
    priceToEl.value             = "";

    /* Area */
    sfAreaEl.value             = sfMinArea;
    isActive.area              = false;
    sfAreaValueEl.textContent  = "Любая площадь";
    setValueState(sfAreaValueEl, true);
    updateRangeFill(sfAreaEl);
    areaFromEl.value           = "";

    /* Location */
    document.querySelectorAll(".sf-pill").forEach((p) => {
      p.classList.toggle("is-active", p.dataset.location === "all");
    });
    isActive.location = false;
    locationEl.value  = "all";
    locationEl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* Глобальный хук — filters.js вызывает его при "Сбросить фильтры" */
  window.sfResetSliders = resetSmartFilter;

  /* ── Инициализация слайдеров по реальным данным ─────── */
  function initSliders(objects) {
    /* BYN prices */
    const bynPrices = objects
      .map((o) => {
        const raw = Number(o.priceBYN);
        if (raw > 0) return raw;
        /* fallback: если есть live-price в window.RealterPrice */
        if (typeof window.RealterPrice?.getLiveBynPriceSync === "function") {
          const live = window.RealterPrice.getLiveBynPriceSync(o);
          if (live > 0) return live;
        }
        return 0;
      })
      .filter((v) => v > 0);

    const areas = objects
      .map((o) => o.area ?? o.areaTotal ?? o.totalArea ?? o.square)
      .filter(Boolean)
      .map((a) => parseFloat(String(a).replace(",", ".")))
      .filter((a) => a > 0);

    if (bynPrices.length) {
      sfMinByn = 0;
      sfMaxByn = Math.ceil(Math.max(...bynPrices) / 10000) * 10000;
    }

    if (areas.length) {
      sfMinArea = Math.floor(Math.min(...areas));
      sfMaxArea = Math.ceil(Math.max(...areas) / 10) * 10;
    }

    /* Budget slider */
    sfBudgetEl.min   = sfMinByn;
    sfBudgetEl.max   = sfMaxByn;
    sfBudgetEl.step  = 10000;
    sfBudgetEl.value = sfMaxByn;
    updateRangeFill(sfBudgetEl);
    setValueState(sfBudgetValueEl, true);

    const budgetMinEl = document.getElementById("sfBudgetMin");
    const budgetMaxEl = document.getElementById("sfBudgetMax");
    if (budgetMinEl) budgetMinEl.textContent = "0 BYN";
    if (budgetMaxEl) budgetMaxEl.textContent = fmtByn(sfMaxByn);

    /* Area slider */
    sfAreaEl.min   = sfMinArea;
    sfAreaEl.max   = sfMaxArea;
    sfAreaEl.step  = 5;
    sfAreaEl.value = sfMinArea;
    updateRangeFill(sfAreaEl);
    setValueState(sfAreaValueEl, true);

    const areaMinEl = document.getElementById("sfAreaMin");
    const areaMaxEl = document.getElementById("sfAreaMax");
    if (areaMinEl) areaMinEl.textContent = fmtArea(sfMinArea);
    if (areaMaxEl) areaMaxEl.textContent = fmtArea(sfMaxArea);

    /* Начальный счётчик */
    const counterEl = document.getElementById("objectsCounter");
    if (counterEl && sfCountEl) {
      const m = (counterEl.textContent || "").match(/\d+/);
      updateCountDisplay(m ? +m[0] : objects.length);
    }
  }

  /* ── Следим за счётчиком objectsCounter ─────────────── */
  function observeCounter() {
    const counterEl = document.getElementById("objectsCounter");
    if (!counterEl || !sfCountEl) return;

    const observer = new MutationObserver(() => {
      const m = (counterEl.textContent || "").match(/\d+/);
      updateCountDisplay(m ? +m[0] : 0);
    });

    observer.observe(counterEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    priceToEl       = document.getElementById("priceTo");
    areaFromEl      = document.getElementById("areaFrom");
    locationEl      = document.getElementById("locationSelect");
    sfBudgetEl      = document.getElementById("sfBudget");
    sfAreaEl        = document.getElementById("sfArea");
    sfBudgetValueEl = document.getElementById("sfBudgetValue");
    sfAreaValueEl   = document.getElementById("sfAreaValue");
    sfCountEl       = document.getElementById("sfCount");

    if (!sfBudgetEl || !sfAreaEl || !priceToEl || !areaFromEl) return;

    sfBudgetEl.addEventListener("input", onBudgetInput);
    sfAreaEl.addEventListener("input", onAreaInput);

    document.querySelectorAll(".sf-pill").forEach((pill) => {
      pill.addEventListener("click", () => onLocationPill(pill));
    });

    observeCounter();
    updateRangeFill(sfBudgetEl);
    updateRangeFill(sfAreaEl);
  }

  document.addEventListener("DOMContentLoaded", init);

  /* Данные объектов готовы — инициализируем диапазоны */
  document.addEventListener("realterObjectsReady", (e) => {
    initSliders(e.detail.objects);
  });
})();
