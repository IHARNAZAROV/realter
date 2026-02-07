/* =========================================================
   BLOG DETAIL PAGE SCRIPT
   Работает с массивом статей и slug
   ========================================================= */

/* =========================================================
   1. DOM READY
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  loadArticleData();
});

/* =========================================================
   2. LOAD JSON
   ========================================================= */
function loadArticleData() {
  fetch("/data/blog-articles.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не удалось загрузить JSON");
      }
      return response.json();
    })
    .then((articles) => {
      if (!Array.isArray(articles) || articles.length === 0) {
        console.error("JSON пуст или имеет неверный формат");
        return;
      }

      const article = getArticleBySlug(articles);

      if (!article) {
        console.error("Статья не найдена");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const currentSlug = params.get("slug") || article.slug;

      renderArticle(article);
      renderRandomPosts(articles, currentSlug);
    })
    .catch((error) => {
      console.error("Ошибка загрузки статьи:", error);
    });
}

/* =========================================================
   3. GET ARTICLE BY SLUG
   ========================================================= */
function getArticleBySlug(articles) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    return articles[0]; // fallback — первая статья
  }

  return articles.find((article) => article.slug === slug);
}

/* =========================================================
   4. RENDER FULL ARTICLE
   ========================================================= */
function renderArticle(article) {
  renderMeta(article);
  renderHeader(article);
  renderBreadcrumb(article);
  renderImage(article);
  renderContent(article);
  renderConclusion(article);
  renderInstagram(article);
  renderSchema(article);
}

/* =========================================================
   5. META & SEO
   ========================================================= */
function renderMeta(article) {
  document.title = article.title || document.title;

  const description = document.querySelector('meta[name="description"]');
  if (description && article.metaDescription) {
    description.setAttribute("content", article.metaDescription);
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && article.slug) {
    canonical.href = `https://turko.by/blog/${article.slug}`;
  }
}

/* =========================================================
   6. HEADER / TITLE / BREADCRUMB
   ========================================================= */
function renderHeader(article) {
  // PAGE INTRO TITLE
  const pageTitle = document.getElementById("page-title");
  if (pageTitle) {
    pageTitle.textContent = article.title || "";
  }

  // PAGE INTRO LEAD (опционально)
  const pageLead = document.getElementById("page-lead");
  if (pageLead && article.lead) {
    pageLead.textContent = article.lead;
  }

  // EYEBROW (если захочешь из JSON)
  const eyebrow = document.getElementById("page-eyebrow");
  if (eyebrow && article.category) {
    eyebrow.textContent = article.category;
  }

  // ↓ ОСТАЛЬНОЕ ОСТАВЛЯЕМ КАК ЕСТЬ ↓

  const dateEl = document.getElementById("post-date");
  if (dateEl && article.date) {
    dateEl.textContent = article.date;
  }

  const authorEl = document.getElementById("post-author");
  if (authorEl && article.author) {
    authorEl.textContent = article.author;
  }

  const categoryEl = document.getElementById("post-category");
  if (categoryEl && article.category) {
    categoryEl.textContent = article.category;
  }
}


/* =========================================================
   BREADCRUMB
   ========================================================= */
function renderBreadcrumb(article) {
  const breadcrumb = document.getElementById("breadcrumb");
  if (!breadcrumb || !article) return;

  breadcrumb.innerHTML = "";

  const home = document.createElement("li");
  home.innerHTML = `<a href="/">Главная</a>`;

  const blog = document.createElement("li");
  blog.innerHTML = `<a href="/blog">Блог</a>`;

  const current = document.createElement("li");
  current.textContent = article.title || "";

  breadcrumb.appendChild(home);
  breadcrumb.appendChild(blog);
  breadcrumb.appendChild(current);
}

/* =========================================================
   SCHEMA.ORG (JSON-LD)
   ========================================================= */

function renderSchema(article) {
  if (!article) return;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription || article.conclusion || "",
    author: {
      "@type": "Person",
      name: article.author || "Ольга Турко",
      sameAs: [
        "https://www.instagram.com/rielter_olga_lida/",
        "https://t.me/TurkoOlga",
      ],
    },
    datePublished: article.date,
    dateModified: article.date,
    image: article.image ? `https://turko.by${article.image}` : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://turko.by/blog/${article.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Ольга Турко — недвижимость в Лиде",
      logo: {
        "@type": "ImageObject",
        url: "https://turko.by/images/logo-light.webp",
      },
    },
  };

  // Удаляем undefined поля (чистота schema)
  Object.keys(schema).forEach(
    (key) => schema[key] === undefined && delete schema[key],
  );

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);

  document.head.appendChild(script);
}

/* =========================================================
   RANDOM RECENT POSTS (3 articles, exclude current)
   ========================================================= */

function renderRandomPosts(articles, currentSlug) {
  const container = document.getElementById("recent-posts");
  if (!container || !Array.isArray(articles)) return;

  // 1. Убираем текущую статью
  const filtered = articles.filter((article) => article.slug !== currentSlug);

  // 2. Перемешиваем массив (Fisher–Yates)
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  // 3. Берём первые 3
  const selected = filtered.slice(0, 3);

  // 4. Генерируем HTML
  container.innerHTML = selected
    .map((article) => {
      return `
        <div class="widget-post clearfix">
          <div class="sx-post-media">
            <a href="/blog-detail?slug=${article.slug}">
              <img
                src="${article.image}"
                alt="${article.imageAlt || article.title}"
                loading="lazy"
              />
            </a>
          </div>
          <div class="sx-post-info">
            <div class="sx-post-header">
              <h6 class="post-title">
                <a href="/blog-detail?slug=${article.slug}">
                  ${article.title}
                </a>
              </h6>
            </div>
            <div class="sx-post-meta">
              <ul>
                <li class="post-author">
                  ${formatDate(article.date)}
                </li>
              </ul>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =========================================================
   DATE FORMATTER (2026-01-29 → 29 Янв 2026)
   ========================================================= */

function formatDate(dateString) {
  if (!dateString) return "";

  // DD.MM.YYYY
  if (dateString.includes(".")) {
    const [day, month, year] = dateString.split(".");
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ISO fallback
  const date = new Date(dateString);
  if (isNaN(date)) return "";

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   7. IMAGE
   ========================================================= */
function renderImage(article) {
  const imageEl = document.getElementById("post-image");

  if (!imageEl || !article.image) return;

  imageEl.src = article.image;
  imageEl.alt = article.imageAlt || article.title || "";
}

/* =========================================================
   8. MAIN CONTENT
   ========================================================= */
function renderContent(article) {
  const container = document.getElementById("post-content");
  if (!container || !Array.isArray(article.content)) return;

  container.innerHTML = "";

  article.content.forEach((block) => {
    renderContentBlock(container, block);
  });
}

/* =========================================================
   9. CONTENT BLOCK TYPES
   ========================================================= */
function renderContentBlock(container, block) {
  if (!block || !block.type) return;

  /* ---------- Paragraph ---------- */
  if (block.type === "paragraph") {
    const p = document.createElement("p");
    p.textContent = block.text || "";
    container.appendChild(p);
  }

  /* ---------- List / Checklist ---------- */
  if (block.type === "list") {
    if (block.title) {
      const h4 = document.createElement("h4");
      h4.textContent = block.title;
      container.appendChild(h4);
    }

    let list;

    if (block.style === "check") {
      list = document.createElement("ul");
      list.className = "sx-checklist";
    } else if (block.style === "numbered") {
      list = document.createElement("ol");
      list.className = "sx-numbered-list";
    } else {
      list = document.createElement("ul");
    }

    (block.items || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });

    container.appendChild(list);
  }

  /* ---------- Disclaimer ---------- */
  if (block.type === "disclaimer") {
    const div = document.createElement("div");
    div.className = "sx-legal-disclaimer";
    div.textContent = block.text || "";
    container.appendChild(div);
  }
}

/* =========================================================
   10. CONCLUSION / QUOTE
   ========================================================= */
function renderConclusion(article) {
  if (!article.conclusion) return;

  const container = document.getElementById("post-content");
  if (!container) return;

  const blockquote = document.createElement("blockquote");
  blockquote.className = "author-quote bdr-1 bdr-solid bdr-gray";

  const h4 = document.createElement("h4");
  h4.textContent = article.conclusion;

  const iconLeft = document.createElement("i");
  iconLeft.className = "fa fa-quote-left";

  h4.appendChild(iconLeft);
  blockquote.appendChild(h4);

  if (article.quoteAuthor || article.quoteRole) {
    const authorWrap = document.createElement("div");
    authorWrap.className = "p-t15";

    if (article.quoteAuthor) {
      const strong = document.createElement("strong");
      strong.textContent = article.quoteAuthor;
      authorWrap.appendChild(strong);
    }

    if (article.quoteRole) {
      const span = document.createElement("span");
      span.textContent = article.quoteRole;
      authorWrap.appendChild(span);
    }

    blockquote.appendChild(authorWrap);
  }

  container.appendChild(blockquote);
}

/* =========================================================
   11. INSTAGRAM CARD
   ========================================================= */
function renderInstagram(article) {
  const container = document.querySelector("[data-instagram]");
  if (!container || !article.instagram) return;

  const image = container.querySelector("[data-instagram-image]");
  const text = container.querySelector("[data-instagram-text]");
  const date = container.querySelector("[data-instagram-date]");

  if (image && article.instagram.image) {
    image.src = article.instagram.image;
    image.alt =
      article.instagram.alt || "Instagram пост — " + (article.title || "");
  }

  if (text) text.textContent = article.instagram.text || "";
  if (date) date.textContent = article.instagram.date || "";

  container.onclick = () => {
    window.open(article.instagram.url, "_blank", "noopener");
  };

  container.style.display = "flex";
}
