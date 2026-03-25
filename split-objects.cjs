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

    item.images =
      Array.isArray(obj.images) && obj.images.length
        ? [obj.images[0]]
        : [];

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
