"use strict";

document.addEventListener("DOMContentLoaded", initBlogBadge);

function initBlogBadge(){

fetch("/data/blog-articles.json")

.then(res=>{

if(!res.ok) throw new Error("blog json error");

return res.json();

})

.then(articles=>{

if(!Array.isArray(articles)) return;

const badge=document.getElementById("blogBadge");

if(!badge) return;

const now=Date.now();

const oneDay=24*60*60*1000;

let newCount=0;

articles.forEach(article=>{

const date=parseArticleDate(article.date);

if(!date) return;

if((now-date)<oneDay){

newCount++;

}

});

if(newCount>0){

badge.textContent=newCount;

badge.classList.add("active");

}

})

.catch(err=>console.error("Blog badge error:",err));

}



function parseArticleDate(str){

if(!str) return null;

if(str.includes(".")){

const [d,m,y]=str.split(".");

return new Date(y,m-1,d).getTime();

}

const date=new Date(str);

if(isNaN(date)) return null;

return date.getTime();

}