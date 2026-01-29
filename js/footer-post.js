/* =========================================================
   FOOTER RANDOM BLOG POSTS
   Независимый скрипт для футера
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadFooterPosts();
});

/* =========================================================
   LOAD ARTICLES JSON
   ========================================================= */
function loadFooterPosts() {
  fetch("/data/blog-articles.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не удалось загрузить blog-articles.json");
      }
      return response.json();
    })
    .then((articles) => {
      if (!Array.isArray(articles) || articles.length === 0) return;

      renderFooterRandomPosts(articles);
    })
    .catch((error) => {
      console.error("Footer posts error:", error);
    });
}

/* =========================================================
   RENDER RANDOM POSTS IN FOOTER
   ========================================================= */
function renderFooterRandomPosts(articles) {
  const container = document.getElementById("footer-recent-posts");
  if (!container) return;

  // Перемешиваем массив (Fisher–Yates)
  const shuffled = [...articles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Берем первые 3 статьи
  const selected = shuffled.slice(0, 3);

  container.innerHTML = selected
    .map((article) => {
      const date = new Date(article.date);

      return `
        <div class="widget-post clearfix">
          <div class="sx-post-date text-center text-uppercase text-white">
            <strong class="p-date">${date.getDate()}</strong>
            <span class="p-month">${date.toLocaleString("ru-RU", {
              month: "short",
            })}</span>
            <span class="p-year">${date.getFullYear()}</span>
          </div>

          <div class="sx-post-info">
            <div class="sx-post-header">
              <h6 class="post-title">
                <a href="/blog-detail.html?slug=${article.slug}">
                  ${article.title}
                </a>
              </h6>
            </div>

            <div class="sx-post-meta">
              <ul>
                <li class="post-author">
                  <i class="fa fa-user"></i>
                  ${article.author || "Ольга Турко"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}
