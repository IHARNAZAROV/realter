"use strict";

/* =========================================================
   BLOG LIST + SKELETON
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderSkeletons(8);
  loadBlogArticles();
});

/* =========================================================
   SKELETON
   ========================================================= */
function renderSkeletons(count) {
  const container = document.querySelector(".news-masonry");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const item = document.createElement("div");
    item.className = "masonry-item";

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
      articles.sort((a, b) => parseDate(b.date) - parseDate(a.date));

      fadeOutSkeletons(() => {
        renderBlogCards(articles);
        reinitMasonry();
      });
    })
    .catch(console.error);
}

/* =========================================================
   FADE OUT SKELETON
   ========================================================= */
function fadeOutSkeletons(callback) {
  const container = document.querySelector(".news-masonry");
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
  const container = document.querySelector(".news-masonry");

  articles.forEach((article) => {
    const item = document.createElement("div");
    item.className = "masonry-item";

    item.innerHTML = `
      <div class="blog-post blog-grid date-style-2 blog-card">
        <div class="sx-post-media sx-img-effect img-reflection">
          <a href="/blog-detail?slug=${article.slug}">
            <img src="${article.image}" alt="${article.imageAlt || article.title}" loading="lazy">
          </a>
        </div>

        <div class="sx-post-info p-t30">
          <div class="sx-post-meta">
            <ul>
              <li class="post-date">${renderDate(article.date)}</li>
              <li class="post-author"><span>${article.author}</span></li>
            </ul>
          </div>

          <div class="sx-post-title">
            <h4 class="post-title">
              <a href="/blog-detail?slug=${article.slug}">${article.title}</a>
            </h4>
          </div>

          <a href="/blog-detail?slug=${article.slug}" class="blog-read-more">
            Узнать подробнее <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;

    container.appendChild(item);
  });
}

/* =========================================================
   HELPERS
   ========================================================= */
function parseDate(str) {
  if (str.includes(".")) {
    const [d, m, y] = str.split(".");
    return new Date(y, m - 1, d);
  }
  return new Date(str);
}

function renderDate(dateString) {
  const d = parseDate(dateString);
  return `<strong>${d.getDate().toString().padStart(2, "0")}</strong>
          <span>${d.toLocaleDateString("ru-RU", { month: "short" })}</span>`;
}

function reinitMasonry() {
  if (window.jQuery && jQuery.fn.masonry) {
    jQuery(".news-masonry").masonry("reloadItems").masonry();
  }
}
