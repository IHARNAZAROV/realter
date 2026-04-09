/*
  Contact widget behavior (vanilla JS)
  - Появление FAB через 3 секунды после window.load
  - requestIdleCallback + fallback setTimeout
  - Модальное окно открывается только по клику на FAB
  - Закрытие: кнопка, клик по подложке, Escape
  - Scroll lock через CSS-класс
  - localStorage: время ручного закрытия (TTL 24ч)
*/

(function contactWidget() {
  'use strict';

  const STORAGE_KEY_LAST_MANUAL_CLOSE = 'cw:lastManualCloseAt';
  const MANUAL_CLOSE_TTL_MS = 24 * 60 * 60 * 1000;
  const DELAY_AFTER_LOAD_MS = 3000;

  let domReady = false;
  let pageLoaded = false;
  let widgetInitialized = false;

  let fab;
  let overlay;
  let modal;
  let closeBtn;

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

  function openModal() {
    if (!overlay || !modal || !fab || isOpen()) return;

    // Для будущих сценариев автопоказа можно использовать TTL.
    // Сейчас модалка открывается ТОЛЬКО по клику, поэтому TTL не блокирует ручное открытие.
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

    if (!fab || !overlay || !closeBtn || !modal) return;

    bindEvents();
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
