"use strict";

document.addEventListener("DOMContentLoaded", initBlogBadge);

async function initBlogBadge(){

const badge = document.getElementById("blogBadge");

/* получаем просмотренные статьи */

let viewed = JSON.parse(localStorage.getItem("blog_viewed") || "[]");

/* отмечаем просмотр статьи */

viewed = markArticleViewed(viewed);

/* если на странице нет badge — дальше не продолжаем */

if(!badge) return;

try{

const res = await fetch("/data/blog-articles.json");

if(!res.ok) return;

const articles = await res.json();

if(!Array.isArray(articles)) return;


/* считаем новые статьи */

let newCount = 0;

articles.forEach(article => {

if(!viewed.includes(article.slug)){

newCount++;

}

});


/* показываем badge */

if(newCount > 0){

badge.textContent = "+" + newCount;

badge.classList.add("active");

}

}
catch(e){

console.error("Blog badge error:", e);

}

}



/* -----------------------
запоминаем просмотр статьи
----------------------- */

function markArticleViewed(viewed){

const path = window.location.pathname;

/* проверяем что это страница статьи */

if(!path.startsWith("/blog/")) return viewed;

/* получаем slug */

let slug = path.replace("/blog/","");

slug = slug.replace("/","");

if(!slug) return viewed;

/* записываем */

if(!viewed.includes(slug)){

viewed.push(slug);

localStorage.setItem("blog_viewed", JSON.stringify(viewed));

}

return viewed;

}