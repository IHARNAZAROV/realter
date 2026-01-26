(function () {
  "use strict";

  const CONSENT_COOKIE_NAME = "cookieConsent";
  const CONSENT_MAX_AGE_DAYS = 180;

  // -----------------------------
  // Helpers
  // -----------------------------
  function setCookie(name, value, maxAgeDays) {
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; max-age=" +
      maxAge +
      "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (let i = 0; i < cookies.length; i++) {
      const parts = cookies[i].split("=");
      const key = parts.shift();
      const val = parts.join("=");
      if (key === name) return decodeURIComponent(val);
    }
    return null;
  }

  function safeJSONParse(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  function getConsent() {
    const raw = getCookie(CONSENT_COOKIE_NAME);
    if (!raw) return null;

    const parsed = safeJSONParse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    // normalize
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  }

  function saveConsent(consent) {
    const payload = JSON.stringify({
      necessary: true,
      analytics: !!consent.analytics,
      marketing: !!consent.marketing,
      updatedAt: new Date().toISOString(),
    });

    setCookie(CONSENT_COOKIE_NAME, payload, CONSENT_MAX_AGE_DAYS);
  }

  function lockBodyScroll(lock) {
    document.documentElement.style.overflow = lock ? "hidden" : "";
    document.body.style.overflow = lock ? "hidden" : "";
  }

  // -----------------------------
  // Inject HTML + CSS
  // -----------------------------
  function injectStyles() {
    if (document.getElementById("cookieConsentStyles")) return;

    const style = document.createElement("style");
    style.id = "cookieConsentStyles";
    style.textContent = `
      :root{
        --cc-bg: #ffffff;
        --cc-text: #1e2430;
        --cc-muted: #5c677d;
        --cc-link: #155945;
        --cc-border: rgba(0,0,0,.10);
        --cc-shadow: 0 18px 40px rgba(0,0,0,.18);
        --cc-overlay: rgba(0,0,0,.55);
        --cc-radius: 18px;
      }

      .cookie-overlay{
        position: fixed;
        inset: 0;
        background: var(--cc-overlay);
        opacity: 0;
        visibility: hidden;
        transition: opacity .25s ease, visibility .25s ease;
        z-index: 9998;
      }
      .cookie-overlay.show{
        opacity: 1;
        visibility: visible;
      }

      .cookie-modal{
        position: fixed;
        left: 20px;
        bottom: 20px;
        width: min(420px, calc(100% - 40px));
        background: var(--cc-bg);
        border: 1px solid var(--cc-border);
        border-radius: var(--cc-radius);
        box-shadow: var(--cc-shadow);
        transform: translateY(12px);
        opacity: 0;
        visibility: hidden;
        transition: transform .25s ease, opacity .25s ease, visibility .25s ease;
        z-index: 9999;
        overflow: hidden;
      }

      .cookie-modal.show{
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .cookie-top{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap: 12px;
        padding: 16px 16px 10px;
      }

      .cookie-title{
        display:flex;
        align-items:flex-start;
        gap: 10px;
      }

      .cookie-icon{
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display:flex;
        align-items:center;
        justify-content:center;
        background: rgba(47,111,237,.10);
        font-size: 18px;
        flex: 0 0 auto;
      }

      .cookie-title-text h2{
        margin:0;
        font-size: 18px;
        line-height: 1.1;
        color: var(--cc-text);
      }

      .cookie-title-text p{
        margin:6px 0 0;
        font-size: 13px;
        color: var(--cc-muted);
      }

      .cookie-close{
        border: 1px solid var(--cc-border);
        background: #fff;
        color: var(--cc-text);
        border-radius: 12px;
        width: 38px;
        height: 38px;
        cursor: pointer;
        display:flex;
        align-items:center;
        justify-content:center;
        transition: transform .15s ease, border-color .15s ease;
      }
      .cookie-close:hover{
        transform: scale(1.03);
        border-color: rgba(47,111,237,.35);
      }

      .cookie-body{
        padding: 0 16px 16px;
      }

      .cookie-desc{
        margin: 0;
        color: var(--cc-text);
        font-size: 14px;
        line-height: 1.45;
      }

      .cookie-desc a{
        color: var(--cc-link);
        text-decoration: none;
        font-weight: 600;
      }
      .cookie-desc a:hover{
        text-decoration: underline;
      }

      .cookie-actions{
        display:flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 14px;
      }

      .cookie-btn{
        border-radius: 14px;
        border: 1px solid var(--cc-border);
        background: #fff;
        color: var(--cc-text);
        padding: 10px 14px;
        cursor: pointer;
        font-size: 14px;
        transition: transform .15s ease, filter .15s ease, border-color .15s ease;
        user-select: none;
      }

      .cookie-btn:hover{
        transform: translateY(-1px);
        border-color: rgba(47,111,237,.35);
      }

      .cookie-btn.primary{
        background: var(--cc-link);
        border-color: var(--cc-link);
        color: #fff;
      }

      .cookie-btn.primary:hover{
        filter: brightness(.95);
      }

      .cookie-btn.ghost{
        background: rgba(0,0,0,.04);
      }

      .cookie-btn.outline{
        background: transparent;
      }

      .cookie-settings{
        margin-top: 14px;
        border-top: 1px solid var(--cc-border);
        padding-top: 14px;
        display: none;
      }

      .cookie-settings.open{
        display: block;
      }

      .cookie-settings-head h3{
        margin: 0;
        font-size: 15px;
        color: var(--cc-text);
      }
      .cookie-settings-head p{
        margin: 6px 0 0;
        font-size: 13px;
        color: var(--cc-muted);
      }

      .cookie-setting-row{
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid var(--cc-border);
        border-radius: 14px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap: 12px;
      }

      .cookie-setting-text strong{
        display:block;
        font-size: 14px;
        color: var(--cc-text);
      }
      .cookie-setting-text span{
        display:block;
        margin-top: 2px;
        font-size: 12px;
        color: var(--cc-muted);
      }

      .cookie-switch{
        position: relative;
        display:inline-block;
        width: 44px;
        height: 26px;
        flex: 0 0 auto;
      }

      .cookie-switch input{
        opacity:0;
        width:0;
        height:0;
      }

      .cookie-slider{
        position:absolute;
        cursor:pointer;
        top:0; left:0; right:0; bottom:0;
        background: rgba(0,0,0,.12);
        border-radius: 999px;
        transition: .2s ease;
      }

      .cookie-slider:before{
        content:"";
        position:absolute;
        height: 20px;
        width: 20px;
        left: 3px;
        top: 3px;
        background: #fff;
        border-radius: 999px;
        transition: .2s ease;
        box-shadow: 0 3px 8px rgba(0,0,0,.18);
      }

      .cookie-switch input:checked + .cookie-slider{
        background: rgba(47,111,237,.85);
      }

      .cookie-switch input:checked + .cookie-slider:before{
        transform: translateX(18px);
      }

      .cookie-settings-actions{
        margin-top: 12px;
        display:flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      /* Mobile: center bottom */
      @media (max-width: 600px){
        .cookie-modal{
          left: 50%;
          bottom: 16px;
          transform: translate(-50%, 12px);
          width: min(420px, calc(100% - 24px));
        }
        .cookie-modal.show{
          transform: translate(-50%, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function injectHTML() {
    if (document.getElementById("cookieModal")) return;

    const overlay = document.createElement("div");
    overlay.className = "cookie-overlay";
    overlay.id = "cookieOverlay";
    overlay.setAttribute("aria-hidden", "true");

    const modal = document.createElement("div");
    modal.className = "cookie-modal";
    modal.id = "cookieModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
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
          Мы используем cookies для корректной работы сайта и аналитики. Вы можете принять все cookies или настроить категории.
          <a href="/cookies-policy" target="_blank" rel="noopener noreferrer">Подробнее</a>
        </p>

        <div class="cookie-actions">
          <button class="cookie-btn primary" id="cookieAcceptAll" type="button">Принять всё</button>
          <button class="cookie-btn ghost" id="cookieDeclineAll" type="button">Отклонить</button>
          <button class="cookie-btn outline" id="cookieSettingsBtn" type="button">Настроить</button>
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
              <span>GA4 / GTM / Яндекс.Метрика</span>
            </div>

            <label class="cookie-switch">
              <input type="checkbox" id="cookieAnalytics" />
              <span class="cookie-slider"></span>
            </label>
          </div>

          <div class="cookie-setting-row">
            <div class="cookie-setting-text">
              <strong>Marketing</strong>
              <span>Рекламные пиксели и ретаргетинг</span>
            </div>

            <label class="cookie-switch">
              <input type="checkbox" id="cookieMarketing" />
              <span class="cookie-slider"></span>
            </label>
          </div>

          <div class="cookie-settings-actions">
            <button class="cookie-btn primary" id="cookieSaveSettings" type="button">Сохранить</button>
            <button class="cookie-btn ghost" id="cookieBackBtn" type="button">Назад</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }

  // -----------------------------
  // UI control
  // -----------------------------
  function getEls() {
    return {
      overlay: document.getElementById("cookieOverlay"),
      modal: document.getElementById("cookieModal"),
      closeBtn: document.getElementById("cookieCloseBtn"),
      acceptAll: document.getElementById("cookieAcceptAll"),
      declineAll: document.getElementById("cookieDeclineAll"),
      settingsBtn: document.getElementById("cookieSettingsBtn"),
      settingsPanel: document.getElementById("cookieSettings"),
      saveBtn: document.getElementById("cookieSaveSettings"),
      backBtn: document.getElementById("cookieBackBtn"),
      analytics: document.getElementById("cookieAnalytics"),
      marketing: document.getElementById("cookieMarketing"),
    };
  }

  function showConsent() {
    const { overlay, modal } = getEls();
    if (!overlay || !modal) return;

    overlay.classList.add("show");
    modal.classList.add("show");
    lockBodyScroll(true);
  }

  function hideConsent() {
    const { overlay, modal, settingsPanel } = getEls();
    if (!overlay || !modal) return;

    overlay.classList.remove("show");
    modal.classList.remove("show");
    if (settingsPanel) settingsPanel.classList.remove("open");
    lockBodyScroll(false);
  }

  function openSettings() {
    const { settingsPanel } = getEls();
    if (!settingsPanel) return;
    settingsPanel.classList.add("open");
  }

  function closeSettings() {
    const { settingsPanel } = getEls();
    if (!settingsPanel) return;
    settingsPanel.classList.remove("open");
  }

  // -----------------------------
  // Apply consent immediately
  // -----------------------------
  function applyConsentNow() {
    if (typeof window.__applyCookieConsent === "function") {
      window.__applyCookieConsent();
    }
  }

  // -----------------------------
  // Init
  // -----------------------------
  function init() {
    injectStyles();
    injectHTML();

    const els = getEls();
    if (!els.overlay || !els.modal) return;

    // restore state
    const saved = getConsent();
    if (saved) {
      if (els.analytics) els.analytics.checked = !!saved.analytics;
      if (els.marketing) els.marketing.checked = !!saved.marketing;
      return; // already chosen ранее — баннер не показываем
    }

    // show first time
    showConsent();

    // events
    els.settingsBtn.addEventListener("click", () => openSettings());

    els.backBtn.addEventListener("click", () => closeSettings());

    els.acceptAll.addEventListener("click", () => {
      const consent = { necessary: true, analytics: true, marketing: true };
      if (els.analytics) els.analytics.checked = true;
      if (els.marketing) els.marketing.checked = true;

      saveConsent(consent);
      applyConsentNow();
      hideConsent();
    });

    els.declineAll.addEventListener("click", () => {
      const consent = { necessary: true, analytics: false, marketing: false };
      if (els.analytics) els.analytics.checked = false;
      if (els.marketing) els.marketing.checked = false;

      saveConsent(consent);
      hideConsent();
    });

    els.saveBtn.addEventListener("click", () => {
      const consent = {
        necessary: true,
        analytics: !!(els.analytics && els.analytics.checked),
        marketing: !!(els.marketing && els.marketing.checked),
      };

      saveConsent(consent);

      // если включили аналитику — грузим сразу
      if (consent.analytics) applyConsentNow();

      hideConsent();
    });

    els.closeBtn.addEventListener("click", () => {
      const consent = { necessary: true, analytics: false, marketing: false };
      saveConsent(consent);
      hideConsent();
    });

    els.overlay.addEventListener("click", () => {
      const consent = { necessary: true, analytics: false, marketing: false };
      saveConsent(consent);
      hideConsent();
    });

    // global open settings
    window.openCookieSettings = function () {
      showConsent();
      openSettings();
    };
  }

  window.addEventListener("DOMContentLoaded", init);
})();
