"use strict";
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initObjectsBadge);
} else {
  initObjectsBadge();
}


async function initObjectsBadge() {

const badge = document.getElementById("objectsBadge");
if (!badge) return;

try {

const res = await fetch("/data/objects-list.json", { cache: "no-store" });
if (!res.ok) return;

const objects = await res.json();
if (!Array.isArray(objects)) return;


/* просмотренные объекты */

let viewed = JSON.parse(localStorage.getItem("objects_viewed") || "[]");


/* фиксируем просмотр */

viewed = detectViewedObject(viewed);


/* период новых объектов */

const now = Date.now();
const week = 7 * 24 * 60 * 60 * 1000;

let newCount = 0;

objects.forEach(obj => {

const date = parseDate(obj.publishedAt);
if (!date) return;

const age = now - date;

if (age < week && !viewed.includes(obj.slug)) {
newCount++;
}

});


/* badge */

if (newCount > 0) {
badge.textContent = "+" + newCount;
badge.classList.add("active");
}

}

catch (e) {
console.error("Objects badge error:", e);
}

}



/* ===============================
определяем просмотр объекта
=============================== */

function detectViewedObject(viewed) {

const parts = window.location.pathname
.replace(/^\/+|\/+$/g, "")
.split("/");

/*
URL твоего сайта:

/objects/slug
*/

if (parts.length === 2 && (parts[0] === "objects" || parts[0] === "object")) {

const slug = decodeURIComponent(parts[1]);

if (!viewed.includes(slug)) {

viewed.push(slug);
localStorage.setItem("objects_viewed", JSON.stringify(viewed));

}

}

return viewed;

}



/* ===============================
парсер даты
=============================== */

function parseDate(str) {

if (!str) return null;

const date = new Date(str);

if (!isNaN(date)) return date.getTime();

if (str.includes(".")) {

const [d, m, y] = str.split(".");
return new Date(y, m - 1, d).getTime();

}

return null;

}