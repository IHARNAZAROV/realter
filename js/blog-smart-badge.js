"use strict";

document.addEventListener("DOMContentLoaded", initBlogBadge);

async function initBlogBadge() {

const badge = document.getElementById("blogBadge");

if (!badge) return;

/* -------------------------
получаем просмотренные статьи
------------------------- */

let viewed = JSON.parse(localStorage.getItem("blog_viewed") || "[]");

/* -------------------------
сначала отмечаем просмотр статьи
------------------------- */

viewed = markArticleViewed(viewed);

/* -------------------------
загружаем статьи
------------------------- */

try {

const res = await fetch("/data/blog-articles.json");

if (!res.ok) return;

const articles = await res.json();

if (!Array.isArray(articles)) return;

/* -------------------------
считаем новые статьи
------------------------- */

let newCount = 0;

articles.forEach(article => {

if (!viewed.includes(article.slug)) {

newCount++;

}

});

/* -------------------------
показываем badge
------------------------- */

if (newCount > 0) {

badge.textContent = "+" + newCount;

badge.classList.add("active");

}

} catch (e) {

console.error("Blog badge error:", e);

}

}


/* -------------------------
записываем просмотр статьи
------------------------- */

function markArticleViewed(viewed) {

const url = new URL(window.location.href);

let slug = "";

/* вариант ?slug= */

const qsSlug = url.searchParams.get("slug");

if (qsSlug) {

slug = qsSlug;

}

/* вариант /blog/slug */

if (!slug) {

const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");

if (parts.length === 2 && parts[0] === "blog") {

slug = decodeURIComponent(parts[1]);

}

}

if (!slug) return viewed;

/* записываем просмотр */

if (!viewed.includes(slug)) {

viewed.push(slug);

localStorage.setItem("blog_viewed", JSON.stringify(viewed));

}

return viewed;

}