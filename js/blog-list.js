"use strict";

/* =========================================================
   BLOG LIST + SKELETON
   ========================================================= */

const BLOG_FILTERS = {
  all: {
    key: "all",
    predicate: () => true,
  },
  latest: {
    key: "latest",
    predicate: () => true,
    limit: 6,
  },
  legal: {
    key: "legal",
    predicate: (article) =>
      includesText(article.category, "юрид") ||
      hasTag(article.tags, "юридические риски"),
  },
  sale: {
    key: "sale",
    predicate: (article) =>
      hasTag(article.tags, "покупка квартиры") ||
      hasTag(article.tags, "продажа квартиры"),
  },
  psychology: {
    key: "psychology",
    predicate: (article) => includesText(article.category, "псих"),
  },
};

const FILTER_ANIMATION_DURATION = 260;

let allArticles = [];
let activeFilterKey = "latest";
let activeTagSlug = getTagFromQuery();

document.addEventListener("DOMContentLoaded", () => {
  if (activeTagSlug) {
    activeFilterKey = null;
  }

  renderSkeletons(8);
  loadBlogArticles();
  initBlogFilters();
  initTagResultsReset();
  updateActiveFilterButton();
  updateTagResultsState();
});

/* =========================================================
   SKELETON
   ========================================================= */
function renderSkeletons(count) {
  const container = document.querySelector(".blog-grid-list");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const item = document.createElement("div");
    item.className = "blog-grid-item";

    item.innerHTML = `
      <div class="blog-post blog-card">
        <div class="skeleton skeleton-img"></div>
        <div class="sx-post-info p-t30">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line"></div>
        </div>
      </div>
    `;

    container.appendChild(item);
  }
}

/* =========================================================
   LOAD JSON
   ========================================================= */
function loadBlogArticles() {
  fetch("/data/blog-articles.json")
    .then((res) => {
      if (!res.ok) throw new Error("JSON load error");
      return res.json();
    })
    .then((articles) => {
      allArticles = [...articles].sort((a, b) => blogParseDate(b.date) - blogParseDate(a.date));

      fadeOutSkeletons(() => {
        renderActiveArticles({ skipAnimation: true });
      });
    })
    .catch(console.error);
}

/* =========================================================
   FADE OUT SKELETON
   ========================================================= */
function fadeOutSkeletons(callback) {
  const container = document.querySelector(".blog-grid-list");
  container.classList.add("skeleton-fade-out");

  setTimeout(() => {
    container.classList.remove("skeleton-fade-out");
    container.innerHTML = "";
    callback();
  }, 400);
}

/* =========================================================
   RENDER REAL CARDS
   ========================================================= */
function renderBlogCards(articles) {
  const container = document.querySelector(".blog-grid-list");
  if (!container) return;

  container.innerHTML = "";

  if (!articles.length) {
    renderEmptyState(container);
    return;
  }

  articles.forEach((article) => {
    const item = document.createElement("div");
    item.className = "blog-grid-item";

    item.innerHTML = `
      <div class="blog-post blog-grid date-style-2 blog-card">
        <div class="sx-post-media sx-img-effect img-reflection">
          <a href="/blog/${article.slug}">
            <img src="${article.image}" alt="${article.imageAlt || article.title}" loading="lazy">
          </a>
        </div>

        <div class="sx-post-info p-t30">
          <div class="sx-post-meta">
            <ul>
              <li class="post-date">${renderDate(article.date)}</li>
              <li class="post-author"><span>${article.author}</span></li>
                                    <li class="post-reading">
                         <i class="fa-solid fa-clock"></i>
   ${calculateReadingTime(article)} мин
</li>
            </ul>
          </div>

          <div class="sx-post-title">
            <h4 class="post-title">
              <a href="/blog/${article.slug}">${article.title}</a>
            </h4>
          </div>

          <a href="/blog/${article.slug}" class="blog-read-more">
            Узнать подробнее <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;

    container.appendChild(item);
  });
}

function initBlogFilters() {
  const buttonsContainer = document.getElementById("blog-filter-buttons");
  if (!buttonsContainer) return;

  buttonsContainer.addEventListener("click", (event) => {
    const button = event.target.closest(".blog-filter-button");
    if (!button) return;

    const nextFilterKey = button.dataset.filter;
    if (!BLOG_FILTERS[nextFilterKey] || (nextFilterKey === activeFilterKey && !activeTagSlug)) return;

    activeTagSlug = null;
    activeFilterKey = nextFilterKey;
    syncTagQueryParam();
    updateTagResultsState();
    updateActiveFilterButton();
    renderActiveArticles();
  });
}

function initTagResultsReset() {
  document.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-clear-tag-filter]");
    if (!resetButton) return;

    activeTagSlug = null;
    activeFilterKey = "all";
    syncTagQueryParam();
    updateTagResultsState();
    updateActiveFilterButton();
    renderActiveArticles();
  });
}

function updateActiveFilterButton() {
  document.querySelectorAll(".blog-filter-button").forEach((button) => {
    button.classList.toggle(
      "is-active",
      !activeTagSlug && button.dataset.filter === activeFilterKey
    );
  });
}

function renderActiveArticles({ skipAnimation = false } = {}) {
  const container = document.querySelector(".blog-grid-list");
  if (!container || !allArticles.length) return;

  const articles = getVisibleArticles();
  updateTagResultsState(articles.length);

  if (skipAnimation) {
    container.classList.remove("blog-list-fade-out");
    container.classList.add("blog-list-fade-in");
    renderBlogCards(articles);
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        container.classList.remove("blog-list-fade-in");
      }, FILTER_ANIMATION_DURATION);
    });
    return;
  }

  container.classList.remove("blog-list-fade-in");
  container.classList.add("blog-list-fade-out");

  window.setTimeout(() => {
    renderBlogCards(articles);
    container.classList.remove("blog-list-fade-out");
    container.classList.add("blog-list-fade-in");

    window.setTimeout(() => {
      container.classList.remove("blog-list-fade-in");
    }, FILTER_ANIMATION_DURATION);
  }, FILTER_ANIMATION_DURATION);
}

function getVisibleArticles() {
  if (activeTagSlug) {
    return allArticles.filter((article) =>
      article.tags?.some((tag) => slugify(tag) === activeTagSlug)
    );
  }

  const definition = BLOG_FILTERS[activeFilterKey] || BLOG_FILTERS.latest;
  const filtered = allArticles.filter(definition.predicate);

  return typeof definition.limit === "number"
    ? filtered.slice(0, definition.limit)
    : filtered;
}

function updateTagResultsState(resultCount = 0) {
  const container = document.getElementById("blog-tag-results");
  if (!container) return;

  if (!activeTagSlug) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  const tagLabel = getTagLabel(activeTagSlug);
  const articleLabel = pluralizeArticles(resultCount);

  container.hidden = false;
  container.innerHTML = `
    <div class="blog-tag-results-text">
      <span>Показаны материалы по тегу</span>
      <strong>#${tagLabel}</strong>
      <span>— найдено ${resultCount} ${articleLabel}</span>
    </div>
    <button type="button" class="blog-tag-reset" data-clear-tag-filter>
      Сбросить фильтр
    </button>
  `;
}

function renderEmptyState(container) {
  const title = activeTagSlug
    ? "По этому тегу пока нет статей"
    : "По выбранному фильтру пока нет статей";
  const description = activeTagSlug
    ? "Попробуйте сбросить фильтр или выбрать другую тему."
    : "Попробуйте выбрать другую категорию.";

  container.innerHTML = `
    <div class="blog-empty-state">
      <h3>${title}</h3>
      <p>${description}</p>
    </div>
  `;
}

/* =========================================================
   HELPERS
   ========================================================= */
function blogParseDate(str) {
  if (!str || typeof str !== "string") return new Date(0);
  if (str.includes(".")) {
    const [day, month, year] = str.split(".");
    return new Date(+year, +month - 1, +day);
  }
  return new Date(str);
}

function includesText(value, needle) {
  return String(value || "").toLowerCase().includes(String(needle).toLowerCase());
}

function hasTag(tags, expectedTag) {
  return Array.isArray(tags)
    ? tags.some((tag) => String(tag).toLowerCase() === expectedTag.toLowerCase())
    : false;
}

function getTagFromQuery() {
  return new URLSearchParams(window.location.search).get("tag");
}

function syncTagQueryParam() {
  const url = new URL(window.location.href);

  if (activeTagSlug) {
    url.searchParams.set("tag", activeTagSlug);
  } else {
    url.searchParams.delete("tag");
  }

  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-а-яё]/gi, "");
}

function getTagLabel(tagSlug) {
  for (const article of allArticles) {
    const matchedTag = article.tags?.find((tag) => slugify(tag) === tagSlug);
    if (matchedTag) return matchedTag;
  }

  return tagSlug.replace(/-/g, " ");
}

function pluralizeArticles(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "статья";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "статьи";
  return "статей";
}

function renderDate(dateString) {
  try {
    const d = blogParseDate(dateString);
    return `<strong>${d.getDate().toString().padStart(2, "0")}</strong>
            <span>${d.toLocaleDateString("ru-RU", { month: "short" })}</span>`;
  } catch (e) {
    return "";
  }
}

/* =========================================================
   READING TIME
   ========================================================= */

function calculateReadingTime(article) {

  const wordsPerMinute = 200;

  if (!article.content) return 1;

  let text = "";

  article.content.forEach(block => {

    if (block.type === "paragraph") {
      text += " " + block.text;
    }

    if (block.type === "list" && block.items) {
      text += " " + block.items.join(" ");
    }

  });

  const words = text.trim().split(/\s+/).length;

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
