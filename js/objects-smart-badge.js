"use strict";

document.addEventListener("DOMContentLoaded", initObjectsBadge);

async function initObjectsBadge(){

const badge=document.getElementById("objectsBadge");

if(!badge) return;

try{

const res=await fetch("/data/objects.json");

if(!res.ok) return;

const objects=await res.json();

if(!Array.isArray(objects)) return;


/* -----------------------------
получаем просмотренные объекты
----------------------------- */

let viewed=JSON.parse(localStorage.getItem("objects_viewed")||"[]");


/* -----------------------------
ограничение 7 дней
----------------------------- */

const now=Date.now();

const sevenDays=7*24*60*60*1000;


/* -----------------------------
подсчёт новых объектов
----------------------------- */

let newCount=0;

objects.forEach(object=>{

const date=parseDate(object.date);

if(!date) return;

const age=now-date;

if(age<sevenDays && !viewed.includes(object.slug)){

newCount++;

}

});


/* -----------------------------
показываем badge
----------------------------- */

if(newCount>0){

badge.textContent="+"+newCount;

badge.classList.add("active");

}


/* -----------------------------
если пользователь открыл объект
----------------------------- */

markObjectViewed(viewed);

}

catch(e){

console.error("Objects badge error:",e);

}

}



/* --------------------------------
запоминаем просмотр объекта
-------------------------------- */

function markObjectViewed(viewed){

const path=window.location.pathname;

if(!path.startsWith("/object/")) return;

const slug=path.split("/object/")[1];

if(!slug) return;

if(!viewed.includes(slug)){

viewed.push(slug);

localStorage.setItem("objects_viewed",JSON.stringify(viewed));

}

}



/* --------------------------------
парсер даты
-------------------------------- */

function parseDate(str){

if(!str) return null;

if(str.includes(".")){

const [d,m,y]=str.split(".");

return new Date(y,m-1,d).getTime();

}

const date=new Date(str);

if(isNaN(date)) return null;

return date.getTime();

}