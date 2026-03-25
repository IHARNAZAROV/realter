/**
 * split-objects.cjs
 * Читает data/objects.json и генерирует:
 *   - data/objects-list.json  (лёгкий список для главной, виджетов)
 *   - data/objects/{slug}.json (полный файл каждого объекта)
 *
 * Запуск: node split-objects.cjs
 */

"use strict";

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "data", "objects.json");
const LIST_OUT = path.join(__dirname, "data", "objects-list.json");
const OBJECTS_DIR = path.join(__dirname, "data", "objects");

// Таблица превью-изображений из js/filters.js (previewImages)
const PREVIEW_IMAGES = {
  "dom-lidskiy-rayon-krupovo": "images/objects/pic1.webp",
  "dom-lida-severnyy-gorodok-ul-govorova": "images/objects/pic2.webp",
  "kvartira-lida-ul-zarechnaya-39": "images/objects/pic3.webp",
  "dom-lidskiy-rayon-sheybaki": "images/objects/pic4.webp",
  "kvartira-lida-yuzhnyy-gorodok": "images/objects/pic5.webp",
  "dom-shchuchinskiy-rayon-rozhanka": "images/objects/pic6.webp",
  "kvartira-lida-yuzhnyy-gorodok-d-19": "images/objects/pic7.webp",
  "dom-dokudovo-2": "images/objects/pic8.webp",
  "kvartira-lida-ul-varshavskaya-44": "images/objects/pic9.webp",
  "kvartira-lida-ul-letnaya-8": "images/objects/pic10.webp",
  "dom-lidskiy-rayon-melyashi": "images/objects/pic11.webp",
  "kvartira-lida-ul-tuhachevskogo-65-k1": "images/objects/pic12.webp",
  "kvartira-lida-ul-masherova-7-k2": "images/objects/pic13.webp",
  "kvartira-lida-ul-masherova": "images/objects/pic14.webp",
  "kvartira-lida-ul-tuhachevskogo": "images/objects/pic15.webp",
  "dom-lidskiy-rayon-minoyty": "images/objects/pic16.webp",
  "kvartira-lida-ul-kosmonavtov": "images/objects/pic17.webp",
  "kvartira-lida-ul-zarechnaya-7": "images/objects/pic18.webp",
  "dom-lidskiy-rayon-ostrovlya-novoselov": "images/objects/pic19.webp",
  "kvartira-laykovshchina-lidskiy-rayon": "images/objects/pic20.webp",
  "kvartira-lida-ul-prolygina-4": "images/objects/pic21.webp",
  "dom-shchuchinskiy-rayon-skribovtsy": "images/objects/pic22.webp",
  "dom-shchuchinskiy-rayon-boyary-zheludokskie": "images/objects/pic23.webp",
  "kvartira-volkovysk-centr": "images/objects/pic24.webp",
  "kvartira-lida-knyazya-gedimina-7": "images/objects/pic25.webp",
  "sto-lida-ignatova-42-veras-avto": "images/objects/pic26.webp",
  "kvartira-volkovysk-socialisticheskaya": "images/objects/pic27.webp",
  "dom-lida-ul-shchedrina": "images/objects/pic28.webp",
  "kvartira-lida-ul-tavlaya-25a": "images/objects/pic29.webp",
  "kvartira-shchuchin-ul-ostrovskogo-5": "images/objects/pic30.webp",
  "kvartira-lida-ul-nevskogo-20a": "images/objects/pic31.webp",
  "kvartira-lida-ul-sovetskaya-36": "images/objects/pic32.webp",
  "kvartira-lida-ul-respublikanskaya-7": "images/objects/pic33.webp",
  "kvartira-lida-ul-kosmonavtov-12-k1": "images/objects/pic34.webp",
  "dom-yodki-ul-sadovaya": "images/objects/pic35.webp",
  "kvartira-lida-ul-urickogo-60": "images/objects/pic36.webp",
  "kvartira-lida-ul-yuzhnyy-gorodok-24": "images/objects/pic37.webp",
  "kvartira-lida-ul-tukhachevskogo-65": "images/objects/pic38.webp",
  "kvartira-lida-ul-sovetskaya-36-stalinka": "images/objects/pic39.webp",
  "kvartira-lida-ul-nevskogo-20-cheshka": "images/objects/pic40.webp",
  "kvartira-lida-ul-naberezhnaya-1-vid-na-ozero": "images/objects/pic41.webp",
  "kvartira-lida-ul-hasanovskaya-1-64": "images/objects/pic42.webp",
  "kvartira-lida-ul-sovetskaya-5-center": "images/objects/pic43.webp",
  "kvartira-volkovysk-ul-novye-borki-23": "images/objects/pic44.webp",
  "dom-lida-ul-novoprudskaya-2": "images/objects/pic45.webp",
  "kvartira-lida-ul-nevskogo-44-severny": "images/objects/pic46.webp",
  "kvartira-lida-ul-rybinovskogo-22": "images/objects/pic47.webp",
  "kvartira-lida-ul-masherova-15-2": "images/objects/pic48.webp",
  "dom-lida-ul-poselkovaya-industrialny": "images/objects/pic49.webp",
};

const LIST_FIELDS = [
  "slug",
  "title",
  "type",
  "dealType",
  "city",
  "address",
  "priceBYN",
  "priceUSD",
  "status",
  "recommended",
  "publishedAt",
  "rooms",
  "areaTotal",
  "cardDescription",
  "description",
];

function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Файл не найден:", SRC);
    process.exit(1);
  }

  const raw = fs.readFileSync(SRC, "utf8");
  const objects = JSON.parse(raw);

  if (!Array.isArray(objects)) {
    console.error("objects.json должен быть массивом");
    process.exit(1);
  }

  if (!fs.existsSync(OBJECTS_DIR)) {
    fs.mkdirSync(OBJECTS_DIR, { recursive: true });
  }

  const list = objects.map((obj) => {
    const item = {};
    LIST_FIELDS.forEach((field) => {
      if (obj[field] !== undefined) {
        item[field] = obj[field];
      }
    });

    const previewImg = PREVIEW_IMAGES[obj.slug];
    if (previewImg) {
      item.images = [previewImg];
    } else if (Array.isArray(obj.images) && obj.images.length) {
      item.images = [obj.images[0]];
      console.warn(`  [warn] slug "${obj.slug}" не найден в PREVIEW_IMAGES, используем images[0]`);
    } else {
      item.images = [];
      console.warn(`  [warn] slug "${obj.slug}" — нет ни prevew, ни images`);
    }

    return item;
  });

  fs.writeFileSync(LIST_OUT, JSON.stringify(list, null, 2), "utf8");
  console.log(`objects-list.json: ${list.length} объектов`);

  let written = 0;
  let skipped = 0;

  objects.forEach((obj) => {
    if (!obj.slug) {
      console.warn("Пропускаем объект без slug:", obj.id || obj.title || "?");
      skipped++;
      return;
    }

    const outPath = path.join(OBJECTS_DIR, `${obj.slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(obj, null, 2), "utf8");
    written++;
  });

  console.log(`objects/{slug}.json: записано ${written}, пропущено ${skipped}`);
}

main();
