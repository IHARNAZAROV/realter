/* =========================================================
   BLOG TAGS SYSTEM (Vanilla JS)
   Автор: production-ready версия под твой сайт
========================================================= */

(function () {
  'use strict';

  /* ===============================
     1. УТИЛИТЫ
  =============================== */

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-а-яё]/gi, '');
  }

  function getActiveTag() {
    const params = new URLSearchParams(window.location.search);
    return params.get('tag');
  }

  function isBlogPage() {
    return document.getElementById('tags-filter');
  }

  function isBlogDetailPage() {
    return document.getElementById('post-tags');
  }

  /* ===============================
     2. РЕНДЕР ТЕГОВ В СТАТЬЕ
  =============================== */

function renderPostTags(tags) {
  const container = document.getElementById('post-tags');
  if (!container || !tags) return;

  const activeTag = getActiveTag();

  container.innerHTML = tags.map(tag => {
    const slug = slugify(tag);

    return `
      <a href="/blog?tag=${slug}" 
         class="tag ${activeTag === slug ? 'active' : ''}">
        #${tag}
      </a>
    `;
  }).join('');
}

  /* ===============================
     3. ТЕГИ В КАРТОЧКАХ
  =============================== */

  function renderTagsInCard(tags) {
    if (!tags || !tags.length) return '';

    return `
      <div class="blog-tags">
        ${tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
      </div>
    `;
  }

  /* ===============================
     4. ФИЛЬТРАЦИЯ
  =============================== */

  function filterByTag(articles, tag) {
    if (!tag) return articles;

    return articles.filter(article =>
      article.tags?.some(t => slugify(t) === tag)
    );
  }

  /* ===============================
     5. ФИЛЬТР ТЕГОВ (UI)
  =============================== */

function renderTagsFilter(articles) {
  const container = document.getElementById('tags-filter');
  const countEl = document.getElementById('tags-count');
  const showMoreBtn = document.getElementById('tags-show-more');

  if (!container) return;

  const activeTag = getActiveTag();
  const tagsSet = new Set();

  articles.forEach(article => {
    article.tags?.forEach(tag => tagsSet.add(tag));
  });

  const tags = Array.from(tagsSet);

  // count
  if (countEl) {
    countEl.textContent = `${tags.length} тем`;
  }

  // render tags
  container.innerHTML = tags.map(tag => {
    const slug = slugify(tag);

    return `
      <a href="/blog?tag=${slug}" 
         class="tag-filter ${activeTag === slug ? 'active' : ''}">
        ${tag}
      </a>
    `;
  }).join('');

  // show more logic
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      container.classList.toggle('expanded');

      showMoreBtn.textContent = container.classList.contains('expanded')
        ? 'Скрыть'
        : 'Показать все';
    });
  }
}

  /* ===============================
     6. РЕНДЕР КАРТОЧЕК (ОБНОВЛЁННЫЙ)
     ⚠️ ВАЖНО: если у тебя уже есть renderArticles —
     замени только часть с тегами
  =============================== */

  function renderArticlesWithTags(articles) {
    const container = document.querySelector('.news-masonry');
    if (!container) return;

    container.innerHTML = articles.map(article => {

      const tagsHtml = renderTagsInCard(article.tags);

      return `
        <div class="news-masonry-item">
          <div class="sx-news-box">

            <div class="sx-post-media">
              <a href="/blog/${article.slug}">
                <img src="${article.image}" alt="${article.imageAlt}">
              </a>
            </div>

            <div class="sx-post-info">

              <div class="sx-post-meta">
                <ul>
                  <li class="post-date">${article.date}</li>
                  <li class="post-category">${article.category}</li>
                </ul>
              </div>

              <div class="sx-post-title">
                <h3>
                  <a href="/blog/${article.slug}">
                    ${article.title}
                  </a>
                </h3>
              </div>

              ${tagsHtml}

            </div>

          </div>
        </div>
      `;
    }).join('');
  }

  /* ===============================
     7. ОСНОВНАЯ ЛОГИКА BLOG PAGE
  =============================== */



  /* ===============================
     8. ПЕРЕХВАТ ДАННЫХ СТАТЬИ (detail)
     ⚠️ Автоматически подцепляет article.tags
  =============================== */



  /* ===============================
     9. INIT
  =============================== */

  document.addEventListener('DOMContentLoaded', () => {



 

  });


  window.blogTags = {
  getActiveTag,
  filterByTag,
  renderTagsFilter,
  renderPostTags,
  slugify
};
})();