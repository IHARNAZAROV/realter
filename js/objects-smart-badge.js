"use strict";

document.addEventListener("DOMContentLoaded", initObjectsBadge);

async function initObjectsBadge() {

const badge = document.getElementById("objectsBadge");

if (!badge) return;

try {

const res = await fetch("/data/objects.json",{cache:"no-store"});

if (!res.ok) return;

const objects = await res.json();

if (!Array.isArray(objects)) return;


/* --------------------------------
получаем просмотренные объекты
-------------------------------- */

let viewed = JSON.parse(localStorage.getItem("objects_viewed") || "[]");


/* --------------------------------
фиксируем просмотр текущего объекта
-------------------------------- */

viewed = markObjectViewed(viewed);


/* --------------------------------
ограничение 7 дней
-------------------------------- */

const now = Date.now();
const sevenDays = 7 * 24 * 60 * 60 * 1000;


/* --------------------------------
подсчёт новых объектов
-------------------------------- */

let newCount = 0;

objects.forEach(obj => {

const date = parseDate(obj.publishedAt);

if (!date) return;

const age = now - date;

if (age < sevenDays && !viewed.includes(obj.slug)) {

newCount++;

}

});


/* --------------------------------
показываем badge
-------------------------------- */

if (newCount > 0) {

badge.textContent = "+" + newCount;
badge.classList.add("active");

}

}

catch (e) {

console.error("Objects badge error:", e);

}

}



/* --------------------------------
запоминаем просмотр объекта
-------------------------------- */

function markObjectViewed(viewed) {

const path = window.location.pathname;


/* проверяем что это страница объекта */

if (!path.startsWith("/object/") && !path.startsWith("/objects/")) {

return viewed;

}


/* извлекаем slug */

let slug = path
.replace("/object/","")
.replace("/objects/","");


slug = slug.split("?")[0];
slug = slug.split("#")[0];
slug = slug.replace(/\/$/,"");

if (!slug) return viewed;


/* записываем просмотр */

if (!viewed.includes(slug)) {

viewed.push(slug);

localStorage.setItem("objects_viewed", JSON.stringify(viewed));

}

return viewed;

}



/* --------------------------------
парсер даты
-------------------------------- */

function parseDate(str) {

if (!str) return null;


/* формат YYYY-MM-DD */

const date = new Date(str);

if (!isNaN(date)) {

return date.getTime();

}


/* формат DD.MM.YYYY */

if (str.includes(".")) {

const [d,m,y] = str.split(".");

return new Date(y,m-1,d).getTime();

}

return null;

}