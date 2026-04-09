/*
  Contact widget behavior (vanilla JS)
  Реализовано:
  - Delayed init через 3 секунды после window.load
  - requestIdleCallback + fallback setTimeout
  - Открытие/закрытие модалки
  - Закрытие по overlay, Escape, кнопке закрытия
  - Scroll lock body через CSS-класс
  - localStorage TTL 24 часа после ручного закрытия
*/

(function contactWidget() {
  'use strict';

  const STORAGE_KEY_LAST_MANUAL_CLOSE = 'cw:lastManualCloseAt';
  const MANUAL_CLOSE_TTL_MS = 24 * 60 * 60 * 1000;
  const DELAY_AFTER_LOAD_MS = 3000;
  const AUTO_OPEN_DELAY_MS = 800;

  let domReady = false;
  let pageLoaded = false;
  let widgetInitialized = false;

  let root;
  let fab;
  let overlay;
  let modal;
  let closeBtn;

  function getNow() {
    return Date.now();
  }

  function hasRecentManualClose() {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_MANUAL_CLOSE);
    if (!raw) return false;

    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return false;

    return getNow() - timestamp < MANUAL_CLOSE_TTL_MS;
  }

  function setManualCloseTimestamp() {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_MANUAL_CLOSE, String(getNow()));
    } catch (error) {
      // localStorage может быть недоступен (private mode / policy)
      // Ошибку осознанно игнорируем, чтобы не ломать UX.
    }
  }

  function isOpen() {
    return overlay && overlay.classList.contains('cw__overlay--open');
  }

  function openModal() {
    if (!overlay || !modal || !fab || isOpen()) return;

    overlay.hidden = false;

    // Следующий кадр нужен для корректного старта CSS transition
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
    if (manual) setManualCloseTimestamp();

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
    // Закрываем только при клике по затемнению, но не по контенту модалки.
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

  function maybeAutoOpenOnce() {
    // Улучшение UX: мягко авто-открываем один раз,
    // но только если пользователь недавно не закрывал окно вручную.
    if (hasRecentManualClose()) return;

    window.setTimeout(() => {
      if (!isOpen()) openModal();
    }, AUTO_OPEN_DELAY_MS);
  }

  function showFab() {
    if (!fab) return;
    fab.classList.add('cw__fab--visible');
  }

  function initWidget() {
    if (widgetInitialized) return;

    root = document.querySelector('[data-cw-root]');
    fab = document.querySelector('[data-cw-open]');
    overlay = document.querySelector('[data-cw-overlay]');
    closeBtn = document.querySelector('[data-cw-close]');
    modal = document.getElementById('cw-modal');

    if (!root || !fab || !overlay || !closeBtn || !modal) {
      return;
    }

    bindEvents();
    showFab();
    maybeAutoOpenOnce();

    widgetInitialized = true;
  }

  function scheduleInitialization() {
    const start = () => {
      window.setTimeout(initWidget, DELAY_AFTER_LOAD_MS);
    };

    // Отдаём приоритет idle-периоду, чтобы не мешать критическому рендерингу.
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: DELAY_AFTER_LOAD_MS + 1200 });
    } else {
      // Fallback для браузеров без requestIdleCallback.
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
