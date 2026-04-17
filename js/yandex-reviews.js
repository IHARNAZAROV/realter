(function () {
  const root = document.querySelector('[data-yandex-reviews]');
  if (!root) return;

  const list = root.querySelector('[data-reviews-list]');
  const ratingNode = root.querySelector('[data-reviews-rating]');
  const countNode = root.querySelector('[data-reviews-count]');
  const viewport = root.querySelector('[data-reviews-viewport]');

  const sourceUrl = root.dataset.reviewsSource || '/data/reviews.json';
  const yandexPlaceUrl = root.dataset.yandexPlaceUrl || 'https://yandex.ru/maps/';

  const state = {
    autoScrollTimer: null,
    pauseAutoScroll: false
  };

  init();

  async function init() {
    renderSkeleton();

    try {
      const payload = await loadReviews();
      const reviews = Array.isArray(payload?.reviews) ? payload.reviews : payload;

      if (!Array.isArray(reviews) || !reviews.length) {
        throw new Error('Отзывы не найдены.');
      }

      const rating = payload?.summary?.rating ?? calculateRating(reviews);
      const count = payload?.summary?.count ?? reviews.length;

      ratingNode.textContent = Number(rating).toFixed(1);
      countNode.textContent = String(count);

      renderReviews(reviews);
      setupRevealObserver();
      setupMobileAutoScroll();
    } catch (error) {
      console.warn('[reviews] Не удалось загрузить отзывы:', error);
      renderFallback();
    }
  }

  async function loadReviews() {
    // Точка подключения реального API Яндекса:
    // 1) Можно проксировать запрос на ваш backend и там дергать Yandex Business API.
    // 2) Для прямого браузерного запроса задайте window.YANDEX_REVIEWS_API_URL.
    const apiUrl = window.YANDEX_REVIEWS_API_URL;

    if (apiUrl) {
      const realResponse = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (realResponse.ok) return realResponse.json();
    }

    const localResponse = await fetch(sourceUrl, { headers: { Accept: 'application/json' } });
    if (!localResponse.ok) {
      throw new Error(`Ошибка загрузки JSON: ${localResponse.status}`);
    }

    return localResponse.json();
  }

  function renderReviews(reviews) {
    list.innerHTML = reviews
      .map((review, index) => {
        const hasLongText = review.text && review.text.length > 250;
        const initials = getInitials(review.author);

        return `
          <article class="reviews__card" role="listitem" style="transition-delay:${Math.min(index * 70, 500)}ms">
            <header class="reviews__author">
              <div class="reviews__avatar">
                ${review.avatar
            ? `<img loading="lazy" src="${escapeHtml(review.avatar)}" alt="${escapeHtml(review.author)}" width="46" height="46">`
            : `<div class="reviews__avatar-fallback">${escapeHtml(initials)}</div>`}
              </div>
              <div>
                <p class="reviews__author-name">${escapeHtml(review.author || 'Клиент')}</p>
                <p class="reviews__date">${formatDate(review.date)}</p>
              </div>
            </header>

            <div class="reviews__stars-line" aria-label="${Number(review.rating) || 5} из 5">${renderStars(review.rating)}</div>

            <div class="reviews__text-wrap">
              <p class="reviews__text ${hasLongText ? 'reviews__text--clamped' : ''}" data-review-text>${escapeHtml(review.text || '')}</p>
              ${hasLongText ? '<button class="reviews__more" type="button" data-review-more>Показать полностью</button>' : ''}
            </div>

            <a class="reviews__source" href="${escapeHtml(review.link || yandexPlaceUrl)}" target="_blank" rel="noopener noreferrer">Читать на Яндексе</a>
          </article>
        `;
      })
      .join('');

    bindExpandHandlers();
  }

  function renderSkeleton() {
    list.innerHTML = Array.from({ length: 3 }, () => `
      <article class="reviews__card reviews__card--skeleton" aria-hidden="true">
        <div class="reviews__author">
          <div class="reviews__skeleton-avatar"></div>
          <div style="flex:1;display:grid;gap:8px;">
            <div class="reviews__skeleton-line reviews__skeleton-line--md"></div>
            <div class="reviews__skeleton-line reviews__skeleton-line--sm"></div>
          </div>
        </div>
        <div class="reviews__skeleton-line reviews__skeleton-line--xs"></div>
        <div style="display:grid;gap:8px;">
          <div class="reviews__skeleton-line reviews__skeleton-line--lg"></div>
          <div class="reviews__skeleton-line reviews__skeleton-line--lg"></div>
          <div class="reviews__skeleton-line reviews__skeleton-line--lg"></div>
          <div class="reviews__skeleton-line reviews__skeleton-line--md"></div>
        </div>
      </article>
    `).join('');
  }

  function renderFallback() {
    list.innerHTML = `
      <div class="reviews__fallback">
        <p>Сейчас не удалось загрузить актуальные отзывы. Вы можете посмотреть их напрямую в Яндекс Картах.</p>
        <a class="reviews__fallback-link" href="${escapeHtml(yandexPlaceUrl)}" target="_blank" rel="noopener noreferrer">Открыть отзывы на Яндекс Картах</a>
      </div>
    `;
  }

  function bindExpandHandlers() {
    list.querySelectorAll('[data-review-more]').forEach((button) => {
      button.addEventListener('click', () => {
        const textNode = button.closest('.reviews__text-wrap')?.querySelector('[data-review-text]');
        if (!textNode) return;

        const expanded = !textNode.classList.contains('reviews__text--clamped');
        textNode.classList.toggle('reviews__text--clamped', expanded);
        button.textContent = expanded ? 'Показать полностью' : 'Свернуть';
      });
    });
  }

  function setupRevealObserver() {
    const cards = list.querySelectorAll('.reviews__card');
    if (!cards.length || !('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    cards.forEach((card) => observer.observe(card));
  }

  function setupMobileAutoScroll() {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    if (!mobileQuery.matches || !viewport) return;

    const stop = () => {
      state.pauseAutoScroll = true;
    };

    const resume = () => {
      state.pauseAutoScroll = false;
    };

    viewport.addEventListener('mouseenter', stop);
    viewport.addEventListener('mouseleave', resume);
    viewport.addEventListener('touchstart', stop, { passive: true });
    viewport.addEventListener('touchend', resume, { passive: true });

    state.autoScrollTimer = window.setInterval(() => {
      if (state.pauseAutoScroll) return;
      const maxScrollLeft = list.scrollWidth - list.clientWidth;
      if (maxScrollLeft <= 0) return;

      const nextLeft = list.scrollLeft + list.clientWidth;
      list.scrollTo({
        left: nextLeft >= maxScrollLeft ? 0 : nextLeft,
        behavior: 'smooth'
      });
    }, 4500);
  }

  function renderStars(value) {
    const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 5)));
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  function calculateRating(reviews) {
    const total = reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0);
    return reviews.length ? total / reviews.length : 5;
  }

  function formatDate(dateString) {
    if (!dateString) return 'Дата не указана';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function getInitials(name) {
    return String(name || 'Клиент')
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
