"use strict";

(function SmartSliderFilter() {
  /* ── State ──────────────────────────────────────────── */
  let sfMinUsd  = 0;
  let sfMaxUsd  = 130000;
  let sfMinArea = 30;
  let sfMaxArea = 340;

  const isActive = { budget: false, area: false, location: false };

  /* ── DOM refs (populated in init) ───────────────────── */
  let priceToUsdEl, areaFromEl, locationEl;
  let sfBudgetEl, sfAreaEl;
  let sfBudgetValueEl, sfAreaValueEl;
  let sfCountEl, sfResetEl;

  /* ── Helpers ────────────────────────────────────────── */
  function fmtUsd(v) {
    return Number(v).toLocaleString("ru-RU") + "\u00a0USD";
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
    updateResetBtn();
  }

  function updateResetBtn() {
    const anyActive = isActive.budget || isActive.area || isActive.location;
    sfResetEl?.classList.toggle("is-hidden", !anyActive);
  }

  /* ── Handlers ───────────────────────────────────────── */
  function onBudgetInput() {
    const val   = +sfBudgetEl.value;
    const isMax = val >= sfMaxUsd;
    isActive.budget = !isMax;

    sfBudgetValueEl.textContent = isMax ? "Любой бюджет" : "до " + fmtUsd(val);
    setValueState(sfBudgetValueEl, isMax);

    priceToUsdEl.value = isMax ? "" : val;
    priceToUsdEl.dispatchEvent(new Event("change", { bubbles: true }));

    updateRangeFill(sfBudgetEl);
    triggerFilters();
  }

  function onAreaInput() {
    const val   = +sfAreaEl.value;
    const isMin = val <= sfMinArea;
    isActive.area = !isMin;

    sfAreaValueEl.textContent = isMin ? "Любая площадь" : "от " + fmtArea(val);
    setValueState(sfAreaValueEl, isMin);

    areaFromEl.value = isMin ? "" : val;
    areaFromEl.dispatchEvent(new Event("change", { bubbles: true }));

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

  function resetSmartFilter() {
    /* Budget */
    sfBudgetEl.value        = sfMaxUsd;
    isActive.budget         = false;
    sfBudgetValueEl.textContent = "Любой бюджет";
    setValueState(sfBudgetValueEl, true);
    updateRangeFill(sfBudgetEl);
    priceToUsdEl.value      = "";

    /* Area */
    sfAreaEl.value         = sfMinArea;
    isActive.area          = false;
    sfAreaValueEl.textContent = "Любая площадь";
    setValueState(sfAreaValueEl, true);
    updateRangeFill(sfAreaEl);
    areaFromEl.value       = "";

    /* Location */
    document.querySelectorAll(".sf-pill").forEach((p) => {
      p.classList.toggle("is-active", p.dataset.location === "all");
    });
    isActive.location = false;
    locationEl.value  = "all";
    locationEl.dispatchEvent(new Event("change", { bubbles: true }));

    triggerFilters();
  }

  /* ── Init sliders with real data bounds ─────────────── */
  function initSliders(objects) {
    const usdPrices = objects
      .map((o) => Number(o.priceUSD))
      .filter((v) => v > 0);

    const areas = objects
      .map((o) => o.area ?? o.areaTotal ?? o.totalArea ?? o.square)
      .filter(Boolean)
      .map((a) => parseFloat(String(a).replace(",", ".")))
      .filter((a) => a > 0);

    if (usdPrices.length) {
      sfMinUsd = 0;
      sfMaxUsd = Math.ceil(Math.max(...usdPrices) / 5000) * 5000;
    }

    if (areas.length) {
      sfMinArea = Math.floor(Math.min(...areas));
      sfMaxArea = Math.ceil(Math.max(...areas) / 10) * 10;
    }

    /* Budget slider */
    sfBudgetEl.min   = sfMinUsd;
    sfBudgetEl.max   = sfMaxUsd;
    sfBudgetEl.step  = 5000;
    sfBudgetEl.value = sfMaxUsd;
    updateRangeFill(sfBudgetEl);
    setValueState(sfBudgetValueEl, true);

    const budgetMinEl = document.getElementById("sfBudgetMin");
    const budgetMaxEl = document.getElementById("sfBudgetMax");
    if (budgetMinEl) budgetMinEl.textContent = "0 USD";
    if (budgetMaxEl) budgetMaxEl.textContent = fmtUsd(sfMaxUsd);

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

    /* Read initial count from objectsCounter */
    const counterEl = document.getElementById("objectsCounter");
    if (counterEl && sfCountEl) {
      const m = (counterEl.textContent || "").match(/\d+/);
      updateCountDisplay(m ? +m[0] : objects.length);
    }
  }

  /* ── Observe objectsCounter for live count ──────────── */
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
    priceToUsdEl    = document.getElementById("priceToUsd");
    areaFromEl      = document.getElementById("areaFrom");
    locationEl      = document.getElementById("locationSelect");
    sfBudgetEl      = document.getElementById("sfBudget");
    sfAreaEl        = document.getElementById("sfArea");
    sfBudgetValueEl = document.getElementById("sfBudgetValue");
    sfAreaValueEl   = document.getElementById("sfAreaValue");
    sfCountEl       = document.getElementById("sfCount");
    sfResetEl       = document.getElementById("sfReset");

    if (!sfBudgetEl || !sfAreaEl || !priceToUsdEl || !areaFromEl) return;

    sfBudgetEl.addEventListener("input", onBudgetInput);
    sfAreaEl.addEventListener("input", onAreaInput);

    document.querySelectorAll(".sf-pill").forEach((pill) => {
      pill.addEventListener("click", () => onLocationPill(pill));
    });

    sfResetEl?.addEventListener("click", resetSmartFilter);

    observeCounter();
    updateResetBtn();
  }

  document.addEventListener("DOMContentLoaded", init);

  /* Wait for filters.js to finish loading objects */
  document.addEventListener("realterObjectsReady", (e) => {
    initSliders(e.detail.objects);
  });
})();
