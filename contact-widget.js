/*
  Contact widget behavior (vanilla JS)
  - Появление FAB через 3 секунды после window.load
  - requestIdleCallback + fallback setTimeout
  - Модальное окно открывается только по клику на FAB
  - Закрытие: кнопка, клик по подложке, Escape
  - Scroll lock через CSS-класс
  - localStorage: время ручного закрытия (TTL 24ч)
  - FAB меняет иконку и градиент каждые 10 секунд (WA -> TG -> Viber)
*/

(function contactWidget() {
  'use strict';

  const STORAGE_KEY_LAST_MANUAL_CLOSE = 'cw:lastManualCloseAt';
  const MANUAL_CLOSE_TTL_MS = 24 * 60 * 60 * 1000;
  const DELAY_AFTER_LOAD_MS = 3000;
  const FAB_ROTATE_MS = 10000;

  const FAB_THEMES = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      modifier: 'cw__fab--whatsapp',
      svgPath: 'M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.42 0 .01 5.4 0 12.05c0 2.12.56 4.2 1.63 6.04L0 24l6.08-1.58a11.95 11.95 0 0 0 5.98 1.53h.01c6.64 0 12.05-5.4 12.05-12.05a11.96 11.96 0 0 0-3.6-8.42ZM12.07 21.9h-.01a9.91 9.91 0 0 1-5.05-1.39l-.36-.22-3.61.94.96-3.52-.23-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.43 4.4-9.84 9.83-9.84 2.62 0 5.08 1.02 6.93 2.88a9.78 9.78 0 0 1 2.88 6.96c0 5.42-4.42 9.83-9.82 9.83Zm5.39-7.37c-.29-.14-1.72-.85-1.99-.95-.26-.1-.45-.14-.64.15-.19.29-.74.94-.91 1.13-.17.19-.34.21-.63.07-.29-.14-1.24-.45-2.35-1.44-.87-.78-1.45-1.74-1.62-2.03-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.46-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36s-.99.97-.99 2.37 1.02 2.75 1.17 2.94c.14.19 2.01 3.07 4.86 4.3.68.29 1.21.46 1.63.59.68.22 1.29.19 1.78.11.54-.08 1.72-.7 1.96-1.38.24-.67.24-1.25.17-1.38-.07-.12-.26-.19-.55-.33Z'
    },
    {
      key: 'telegram',
      label: 'Telegram',
      modifier: 'cw__fab--telegram',
      svgPath: 'M23.98 2.65c-.24 1.7-2.53 14.84-3.7 18.58-.5 1.58-1.5 2.11-2.47 2.16-2.11.2-3.7-1.39-5.74-2.73-3.2-2.1-5-3.4-8.1-5.45-3.59-2.35-1.26-3.65.78-5.78.53-.55 9.7-8.89 9.88-9.65.02-.1.04-.47-.18-.66-.22-.2-.55-.13-.79-.08-.34.08-5.78 3.68-16.33 10.8-1.55 1.07-2.95 1.58-4.18 1.55-1.36-.03-3.98-.77-5.92-1.4-2.38-.78-4.27-1.19-4.1-2.5.09-.68 1.03-1.38 2.82-2.09C-2.43 3.64 5.53.34 8.05-.7c7.2-2.99 8.7-3.5 9.68-3.52.22 0 .72.05 1.04.31.27.21.35.49.39.68.03.2.08.64.04.98Z'
    },
    {
      key: 'viber',
      label: 'Viber',
      modifier: 'cw__fab--viber',
      svgPath: 'M11.96 0C6.35 0 1.8 4.42 1.8 9.87c0 3.35 1.75 6.31 4.45 8.1V24l3.95-2.18c.57.08 1.16.13 1.76.13 5.62 0 10.16-4.42 10.16-9.87C22.12 4.42 17.58 0 11.96 0Zm5.69 14.33c-.24.69-1.42 1.29-1.99 1.37-.51.07-1.16.1-1.88-.14-.44-.14-.99-.31-1.71-.62-3-1.31-4.95-4.4-5.1-4.61-.14-.2-1.22-1.63-1.22-3.11 0-1.48.77-2.2 1.05-2.5.28-.3.61-.37.81-.37h.59c.19 0 .44-.07.68.5.26.62.89 2.16.97 2.31.08.15.13.33.02.53-.1.2-.15.33-.31.5-.16.18-.33.4-.47.54-.16.17-.32.35-.14.68.18.33.79 1.3 1.69 2.1 1.17 1.03 2.15 1.35 2.47 1.5.32.16.5.14.68-.08.18-.22.77-.9.98-1.21.2-.3.41-.25.69-.15.29.1 1.84.87 2.15 1.03.3.16.5.24.57.37.08.13.08.77-.16 1.45Z'
    }
  ];

  let domReady = false;
  let pageLoaded = false;
  let widgetInitialized = false;

  let fab;
  let overlay;
  let modal;
  let closeBtn;
  let fabIcon;
  let fabThemeIndex = 0;

  function getNow() {
    return Date.now();
  }

  function setManualCloseTimestamp() {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_MANUAL_CLOSE, String(getNow()));
    } catch (_) {
      // localStorage может быть недоступен; безопасно игнорируем.
    }
  }

  function isManualCloseStillActive() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAST_MANUAL_CLOSE);
      if (!raw) return false;
      const timestamp = Number(raw);
      if (!Number.isFinite(timestamp) || timestamp <= 0) return false;
      return getNow() - timestamp < MANUAL_CLOSE_TTL_MS;
    } catch (_) {
      return false;
    }
  }

  function isOpen() {
    return overlay && overlay.classList.contains('cw__overlay--open');
  }

  function renderFabTheme(theme) {
    if (!fab || !fabIcon || !theme) return;

    fab.classList.remove('cw__fab--whatsapp', 'cw__fab--telegram', 'cw__fab--viber');
    fab.classList.add(theme.modifier);
    fab.setAttribute('aria-label', `Открыть способы связи (${theme.label})`);

    fabIcon.innerHTML = `
      <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
        <path d="${theme.svgPath}" />
      </svg>
    `;
  }

  function rotateFabTheme() {
    fabThemeIndex = (fabThemeIndex + 1) % FAB_THEMES.length;
    renderFabTheme(FAB_THEMES[fabThemeIndex]);
  }

  function startFabThemeRotation() {
    renderFabTheme(FAB_THEMES[fabThemeIndex]);
    window.setInterval(rotateFabTheme, FAB_ROTATE_MS);
  }

  function openModal() {
    if (!overlay || !modal || !fab || isOpen()) return;

    isManualCloseStillActive();

    overlay.hidden = false;

    requestAnimationFrame(() => {
      overlay.classList.add('cw__overlay--open');
      document.body.classList.add('cw-scroll-lock');
      fab.setAttribute('aria-expanded', 'true');
      modal.focus({ preventScroll: true });
    });
  }

  function closeModal(options) {
    if (!overlay || !fab || !isOpen()) return;

    const { manual = false } = options || {};
    if (manual) {
      setManualCloseTimestamp();
    }

    overlay.classList.remove('cw__overlay--open');
    document.body.classList.remove('cw-scroll-lock');
    fab.setAttribute('aria-expanded', 'false');

    const onTransitionEnd = () => {
      if (!isOpen()) {
        overlay.hidden = true;
      }
      overlay.removeEventListener('transitionend', onTransitionEnd);
    };

    overlay.addEventListener('transitionend', onTransitionEnd);
    fab.focus({ preventScroll: true });
  }

  function handleOverlayClick(event) {
    if (event.target === overlay) {
      closeModal({ manual: true });
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      closeModal({ manual: true });
    }
  }

  function bindEvents() {
    if (!fab || !overlay || !modal || !closeBtn) return;

    fab.addEventListener('click', openModal);
    closeBtn.addEventListener('click', () => closeModal({ manual: true }));
    overlay.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', handleKeydown);
  }

  function showFab() {
    if (!fab) return;
    fab.classList.add('cw__fab--visible');
  }

  function initWidget() {
    if (widgetInitialized) return;

    fab = document.querySelector('[data-cw-open]');
    overlay = document.querySelector('[data-cw-overlay]');
    closeBtn = document.querySelector('[data-cw-close]');
    modal = document.getElementById('cw-modal');
    fabIcon = document.querySelector('.cw__fab-icon');

    if (!fab || !overlay || !closeBtn || !modal || !fabIcon) return;

    bindEvents();
    startFabThemeRotation();
    showFab();
    widgetInitialized = true;
  }

  function scheduleInitialization() {
    const start = () => {
      window.setTimeout(initWidget, DELAY_AFTER_LOAD_MS);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: DELAY_AFTER_LOAD_MS + 1000 });
    } else {
      window.setTimeout(start, 0);
    }
  }

  function trySchedule() {
    if (domReady && pageLoaded) {
      scheduleInitialization();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    domReady = true;
    trySchedule();
  });

  window.addEventListener('load', () => {
    pageLoaded = true;
    trySchedule();
  });
})();
