document.addEventListener("DOMContentLoaded", () => {
  fetch("data/blog-articles.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка загрузки JSON");
      }
      return response.json();
    })
    .then((article) => {
      renderArticle(article);
    })
    .catch((error) => {
      console.error("Ошибка:", error);
    });
});

function renderArticle(article) {
  /* ===============================
     META / HEADER DATA
     =============================== */

  const dateEl = document.getElementById("post-date");
  if (dateEl && article.date) {
    dateEl.innerHTML = `<strong>${formatDay(
      article.date
    )}</strong> <span>${formatMonth(article.date)}</span>`;
  }

  const authorEl = document.getElementById("post-author");
  if (authorEl) authorEl.textContent = article.author || "";

  const categoryEl = document.getElementById("post-category");
  if (categoryEl) categoryEl.textContent = article.category || "";

  /* ===============================
     TITLES
     =============================== */

  const titleEl = document.getElementById("post-title");
  if (titleEl) titleEl.textContent = article.title || "";

  const pageTitle = document.querySelector("h2.m-tb0");
  if (pageTitle && article.title) {
    pageTitle.textContent = article.title;
  }

  /* ===============================
     SEO
     =============================== */

  if (article.title) {
    document.title = article.title;
  }

  let metaDescription = document.querySelector(
    'meta[name="description"]'
  );

  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    document.head.appendChild(metaDescription);
  }

  const descriptionText =
    article.metaDescription ||
    article.conclusion ||
    "";

  metaDescription.setAttribute(
    "content",
    descriptionText.substring(0, 160)
  );

  /* ===============================
     IMAGE
     =============================== */

  const imageEl = document.getElementById("post-image");

  if (imageEl && article.image) {
    imageEl.src = article.image;
    imageEl.alt =
      article.imageAlt ||
      article.title ||
      "Изображение статьи";

    imageEl.onerror = () => {
      imageEl.src = "/images/blog/default.jpg";
    };
  }

  /* ===============================
     BREADCRUMB
     =============================== */

  const breadcrumb = document.getElementById("breadcrumb");

  if (breadcrumb && article.title) {
    breadcrumb.innerHTML = "";

    const home = document.createElement("li");
    home.innerHTML = '<a href="/">Главная</a>';

    const blog = document.createElement("li");
    blog.innerHTML = '<a href="/blog.html">Блог</a>';

    const current = document.createElement("li");
    current.textContent = article.title;

    breadcrumb.appendChild(home);
    breadcrumb.appendChild(blog);
    breadcrumb.appendChild(current);
  }

  /* ===============================
     INSTAGRAM (REUSABLE, FULL CLICK)
     =============================== */

  if (article.instagram) {
    const instagramBlocks =
      document.querySelectorAll("[data-instagram]");

    instagramBlocks.forEach((block) => {
      renderInstagramCard(
        block,
        article.instagram,
        article.title
      );
    });
  }

  /* ===============================
     CONTENT
     =============================== */

  if (Array.isArray(article.content)) {
    renderPostContent("post-content", article.content);
  }

  /* ===============================
     CONCLUSION / QUOTE
     =============================== */

  if (article.conclusion) {
    renderConclusionQuote(
      "post-content",
      article.conclusion,
      article.quoteAuthor,
      article.quoteRole
    );
  }

  /* ===============================
     TITLE ANIMATION
     =============================== */

  requestAnimationFrame(() => {
    const titles = document.querySelectorAll(
      ".post-title, h2.m-tb0"
    );
    titles.forEach((el) => el.classList.add("is-visible"));
  });
}

/* ===============================
   INSTAGRAM CARD (FULL CLICK)
   =============================== */

function renderInstagramCard(container, instagram, articleTitle) {
  if (!container || !instagram || !instagram.url) return;

  const image = container.querySelector("[data-instagram-image]");
  const text = container.querySelector("[data-instagram-text]");
  const date = container.querySelector("[data-instagram-date]");

  if (!image || !text || !date) return;

  /* ===============================
     CONTENT
     =============================== */

  image.src = instagram.image;
  image.alt =
    instagram.alt ||
    "Instagram пост — " + (articleTitle || "");

  text.textContent = instagram.text || "";
  date.textContent = instagram.date || "";

  /* ===============================
     ACCESSIBILITY
     =============================== */

  container.setAttribute("role", "link");
  container.setAttribute("tabindex", "0");
  container.setAttribute(
    "aria-label",
    "Открыть связанный Instagram пост"
  );

  /* ===============================
     CLICK + RIPPLE
     =============================== */

  const openInstagram = (event) => {
    // RIPPLE
    const ripple = document.createElement("span");
    ripple.className = "instagram-ripple";

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    container.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);

    // OPEN LINK
    window.open(
      instagram.url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  container.addEventListener("click", openInstagram);

  /* ===============================
     KEYBOARD SUPPORT
     =============================== */

  container.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();

      // имитируем клик по центру для ripple
      const rect = container.getBoundingClientRect();
      openInstagram({
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
    }
  });

  /* ===============================
     SHOW BLOCK
     =============================== */

  container.style.display = "flex";
}


/* ===============================
   CONTENT RENDER
   =============================== */

function renderPostContent(containerId, content) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  content.forEach((block) => {
    if (block.type === "paragraph") {
      const p = document.createElement("p");
      p.textContent = block.text || "";
      container.appendChild(p);
    }

    if (block.type === "list") {
      if (block.title) {
        const h4 = document.createElement("h4");
        h4.textContent = block.title;
        container.appendChild(h4);
      }

      const ul = document.createElement("ul");

      (block.items || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });

      container.appendChild(ul);
    }
  });
}

/* ===============================
   CONCLUSION QUOTE
   =============================== */

function renderConclusionQuote(containerId, text, author, role) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const blockquote = document.createElement("blockquote");
  blockquote.className =
    "bdr-1 bdr-solid bdr-gray author-quote";

  const p = document.createElement("p");
  p.textContent = text;

  const info = document.createElement("div");
  info.className = "p-t15";

  if (author) {
    const strong = document.createElement("strong");
    strong.textContent = author;
    info.appendChild(strong);
  }

  if (role) {
    const span = document.createElement("span");
    span.textContent = role;
    info.appendChild(span);
  }

  const icon = document.createElement("i");
  icon.className = "fa fa-quote-left";

  blockquote.appendChild(p);
  blockquote.appendChild(info);
  blockquote.appendChild(icon);

  container.appendChild(blockquote);
}

/* ===============================
   HELPERS
   =============================== */

function formatDay(dateString) {
  const date = new Date(dateString);
  return isNaN(date) ? "" : date.getDate();
}

function formatMonth(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  return date.toLocaleString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}
