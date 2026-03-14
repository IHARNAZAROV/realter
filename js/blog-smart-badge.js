"use strict";

/*
========================================
BLOG BADGE SYSTEM
• считает новые статьи
• запоминает просмотренные
• работает на всех страницах
• не ломается если badge нет
========================================
*/

(function initBlogBadge() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

async function run() {
  try {
    /* ======================================
   1. получаем просмотренные статьи
====================================== */

    let viewed;

    try {
      viewed = JSON.parse(localStorage.getItem("blog_viewed") || "[]");

      if (!Array.isArray(viewed)) viewed = [];
    } catch (e) {
      viewed = [];
    }

    /* ======================================
   2. фиксируем просмотр статьи
====================================== */

    viewed = markArticleViewed(viewed);

    /* ======================================
   3. загружаем JSON
====================================== */

    const res = await fetch("/data/blog-articles.json", { cache: "no-store" });

    if (!res.ok) {
      console.error("blog json load error");

      return;
    }

    const articles = await res.json();

    if (!Array.isArray(articles)) return;

    /* ======================================
   4. считаем новые статьи
====================================== */

    const now = Date.now();

    const week = 7 * 24 * 60 * 60 * 1000;

    let newCount = 0;
    let todayCount = 0;

    articles.forEach((article) => {
      if (!article.slug) return;

     if (viewed.includes(article.slug)) return

      const date = parseDate(article.date);

      if (!date) return;

      const age = now - date;

      if (age < week) {
        newCount++;
      }

      if (isToday(date)) {
        todayCount++;
      }
    });

    /* ======================================
   5. показываем badge
====================================== */

    const badge = document.getElementById("blogBadge");

    if (!badge) return;

    if (newCount === 0) {
      badge.classList.remove("active", "new");

      badge.textContent = "";

      return;
    }

    /* если сегодня вышла статья */

    if (todayCount > 0) {
      badge.textContent = "NEW";

      badge.classList.add("active", "new");

      setTimeout(() => {
        badge.textContent = "+" + newCount;

        badge.classList.remove("new");
      }, 3000);

      return;
    }

    /* обычный badge */

    badge.textContent = "+" + newCount;

    badge.classList.add("active");
  } catch (e) {
    console.error("blog badge error", e);
  }
}

/*
========================================
запоминаем просмотр статьи
========================================
*/

function markArticleViewed(viewed) {
  try {
    const path = window.location.pathname;

    if (!path.startsWith("/blog/")) return viewed;

    let slug = path.replace("/blog/", "");

    slug = slug.split("?")[0];
    slug = slug.split("#")[0];
    slug = slug.replace(/\/$/, "");

    if (!slug) return viewed;

    if (!viewed.includes(slug)) {
      viewed.push(slug);

      localStorage.setItem("blog_viewed", JSON.stringify(viewed));
    }
  } catch (e) {
    console.error("view mark error", e);
  }

  return viewed;
}

/*
========================================
проверяем сегодня ли статья
========================================
*/

function isToday(time) {
  const d = new Date(time);
  const now = new Date();

  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/*
========================================
парсер даты
========================================
*/

function parseDate(str) {
  if (!str) return null;

  if (str.includes(".")) {
    const parts = str.split(".");

    if (parts.length !== 3) return null;

    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);

    return new Date(y, m - 1, d).getTime();
  }

  const date = new Date(str);

  if (isNaN(date)) return null;

  return date.getTime();
}
