"use strict";

document.addEventListener("DOMContentLoaded", initBlogBadge);

async function initBlogBadge() {
  const badge = document.getElementById("blogBadge");

  let viewed = JSON.parse(localStorage.getItem("blog_viewed") || "[]");

  /* фиксируем просмотр статьи */

  viewed = markArticleViewed(viewed);

  if (!badge) return;

  try {
    const res = await fetch("/data/blog-articles.json");

    if (!res.ok) return;

    const articles = await res.json();

    if (!Array.isArray(articles)) return;

    const now = Date.now();

    const oneDay = 24 * 60 * 60 * 1000;

    const week = 7 * oneDay;

    let todayCount = 0;
    let dayCount = 0;
    let weekCount = 0;

    articles.forEach((article) => {
      if (viewed.includes(article.slug)) return;

      const date = parseDate(article.date);

      if (!date) return;

      const age = now - date;

      if (age < oneDay) {
        dayCount++;
      }

      if (age < week) {
        weekCount++;
      }

      if (isToday(date)) {
        todayCount++;
      }
    });

    /* логика badge */

if (todayCount > 0) {

  badge.textContent = "NEW";
  badge.classList.add("active", "new");

  setTimeout(() => {

    badge.textContent = "+1";
    badge.classList.remove("new");

  }, 3000);

} else if (dayCount > 0) {

  badge.textContent = "+1";
  badge.classList.add("active");

} else if (weekCount > 0) {

  badge.textContent = "+" + weekCount;
  badge.classList.add("active");

}
  } catch (e) {
    console.error("badge error", e);
  }
}

/* определяем сегодня ли статья */

function isToday(time) {
  const d = new Date(time);

  const now = new Date();

  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/* парсер даты */

function parseDate(str) {
  if (!str) return null;

  if (str.includes(".")) {
    const [d, m, y] = str.split(".");

    return new Date(y, m - 1, d).getTime();
  }

  return new Date(str).getTime();
}

/* запоминаем просмотр */

function markArticleViewed(viewed){

const path=window.location.pathname;

if(!path.startsWith("/blog/")) return viewed;

let slug=path.replace("/blog/","");

/* убираем хвосты */

slug=slug.split("#")[0];
slug=slug.split("?")[0];
slug=slug.replace(/\/$/,"");

if(!slug) return viewed;

if(!viewed.includes(slug)){

viewed.push(slug);

localStorage.setItem("blog_viewed",JSON.stringify(viewed));

}

return viewed;

}