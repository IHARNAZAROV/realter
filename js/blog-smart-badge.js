"use strict";

document.addEventListener("DOMContentLoaded", initBlogBadge);

async function initBlogBadge(){

const badge=document.getElementById("blogBadge");

if(!badge) return;

try{

const res=await fetch("/data/blog-articles.json");

if(!res.ok) return;

const articles=await res.json();

if(!Array.isArray(articles)) return;


/* -------------------------
получаем просмотренные статьи
------------------------- */

let viewed=JSON.parse(localStorage.getItem("blog_viewed")||"[]");


/* -------------------------
подсчитываем новые статьи
------------------------- */

let newCount=0;

articles.forEach(article=>{

if(!viewed.includes(article.slug)){

newCount++;

}

});


/* -------------------------
показываем badge
------------------------- */

if(newCount>0){

badge.textContent="+"+newCount;

badge.classList.add("active");

}


/* -------------------------
если пользователь открыл статью
------------------------- */

markArticleViewed(viewed);

}

catch(e){

console.error("Blog badge error:",e);

}

}



function markArticleViewed(viewed){

const path=window.location.pathname;

if(!path.startsWith("/blog/")) return;

const slug=path.split("/blog/")[1];

if(!slug) return;

if(!viewed.includes(slug)){

viewed.push(slug);

localStorage.setItem("blog_viewed",JSON.stringify(viewed));

}

}