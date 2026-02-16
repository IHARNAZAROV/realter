(function () {
  "use strict";

  const COOKIE_NAME = "cookieConsent";
  const COOKIE_DAYS = 180;
  const COUNTER_ID = 105770392; // ← ID Яндекс.Метрики

  // =========================
  // METRIKA
  // =========================
  function reachGoal(goal, params) {
    if (typeof ym === "function") {
      ym(COUNTER_ID, "reachGoal", goal, params || {});
    }
  }

  // =========================
  // HTML INJECT
  // =========================
  function injectHTML() {
    if (document.getElementById("cookieModal")) return;

    const modal = document.createElement("div");
    modal.id = "cookieModal";
    modal.className = "cookie-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Настройки cookies");

    modal.innerHTML = `
      <div class="cookie-top">
        <div class="cookie-title">
          <div class="cookie-icon" aria-hidden="true">🍪</div>
          <div class="cookie-title-text">
            <h2>Cookies</h2>
            <p>Вы управляете своими настройками.</p>
          </div>
        </div>
        <button class="cookie-close" id="cookieCloseBtn" type="button" aria-label="Закрыть">✕</button>
      </div>

      <div class="cookie-body">
        <p class="cookie-desc">
          Мы используем cookies для корректной работы сайта и аналитики.
          <a href="/cookies-policy" target="_blank" rel="noopener noreferrer">Подробнее</a>
        </p>

        <div class="cookie-actions">
          <button class="cookie-btn primary" id="cookieAcceptAll">Принять всё</button>
          <button class="cookie-btn ghost" id="cookieDeclineAll">Отклонить</button>
          <button class="cookie-btn outline" id="cookieSettingsBtn">Настроить</button>
        </div>

        <div class="cookie-settings" id="cookieSettings">
          <div class="cookie-settings-head">
            <h3>Настройки cookies</h3>
            <p>Можно включить только необходимые или добавить аналитику.</p>
          </div>

          <div class="cookie-setting-row">
            <div class="cookie-setting-text">
              <strong>Necessary</strong>
              <span>Нужны для работы сайта (всегда включены)</span>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" checked disabled />
              <span class="cookie-slider"></span>
            </label>
          </div>

          <div class="cookie-setting-row">
            <div class="cookie-setting-text">
              <strong>Analytics</strong>
              <span>GA4 / Яндекс.Метрика</span>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="cookieAnalytics" />
              <span class="cookie-slider"></span>
            </label>
          </div>

          <div class="cookie-setting-row">
            <div class="cookie-setting-text">
              <strong>Marketing</strong>
              <span>Реклама и ретаргетинг</span>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="cookieMarketing" />
              <span class="cookie-slider"></span>
            </label>
          </div>

          <div class="cookie-settings-actions">
            <button class="cookie-btn primary" id="cookieSaveSettings">Сохранить</button>
            <button class="cookie-btn ghost" id="cookieBackBtn">Назад</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // =========================
  // COOKIE HELPERS
  // =========================
  function setCookie(name, value, days) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; max-age=" +
      maxAge +
      "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1];
  }

  function getConsent() {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }

  function saveConsent(consent) {
    setCookie(
      COOKIE_NAME,
      JSON.stringify({
        necessary: true,
        analytics: !!consent.analytics,
        marketing: !!consent.marketing,
        updatedAt: new Date().toISOString(),
      }),
      COOKIE_DAYS
    );
  }

  function applyConsent() {
    if (typeof window.__applyCookieConsent === "function") {
      window.__applyCookieConsent();
    }
  }

  // =========================
  // UI
  // =========================
  function showModal() {
    document.getElementById("cookieModal")?.classList.add("show");
  }

  function hideModal() {
    document.getElementById("cookieModal")?.classList.remove("show");
    document.getElementById("cookieSettings")?.classList.remove("open");
  }

  // =========================
  // INIT
  // =========================
  function init() {
    injectHTML();

    const modal = document.getElementById("cookieModal");
    if (!modal) return;

    const btnAccept = document.getElementById("cookieAcceptAll");
    const btnDecline = document.getElementById("cookieDeclineAll");
    const btnSettings = document.getElementById("cookieSettingsBtn");
    const btnSave = document.getElementById("cookieSaveSettings");
    const btnBack = document.getElementById("cookieBackBtn");
    const btnClose = document.getElementById("cookieCloseBtn");

    const checkboxAnalytics = document.getElementById("cookieAnalytics");
    const checkboxMarketing = document.getElementById("cookieMarketing");
    const settingsPanel = document.getElementById("cookieSettings");

    const saved = getConsent();
    if (saved) {
      if (saved.analytics) applyConsent();
      return;
    }

    // 🔥 Показ модалки
    showModal();
    reachGoal("cookie_modal_shown");

    btnAccept.addEventListener("click", () => {
      reachGoal("cookie_accept_all");
      saveConsent({ analytics: true, marketing: true });
      applyConsent();
      hideModal();
    });

    btnDecline.addEventListener("click", () => {
      reachGoal("cookie_decline_all");
      saveConsent({ analytics: false, marketing: false });
      hideModal();
    });

    btnSettings.addEventListener("click", () => {
      settingsPanel.classList.add("open");
    });

    btnBack.addEventListener("click", () => {
      settingsPanel.classList.remove("open");
    });

    btnSave.addEventListener("click", () => {
      const consent = {
        analytics: checkboxAnalytics.checked,
        marketing: checkboxMarketing.checked,
      };

      reachGoal("cookie_save_settings", {
        analytics: consent.analytics ? 1 : 0,
        marketing: consent.marketing ? 1 : 0,
      });

      saveConsent(consent);
      if (consent.analytics) applyConsent();
      hideModal();
    });

    btnClose.addEventListener("click", () => {
      reachGoal("cookie_decline_all");
      saveConsent({ analytics: false, marketing: false });
      hideModal();
    });

    window.openCookieSettings = function () {
      showModal();
      settingsPanel.classList.add("open");
    };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
