// import-objects-to-firestore.cjs
// Умный импорт objects.json в Firestore коллекцию "objects"
// Документ ID = slug
// Запуск: node import-objects-to-firestore.cjs

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// === НАСТРОЙКИ ===
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "secrets", "firebase-admin.json");

// !!! Поменяй путь если у тебя objects.json лежит не в /data/
const OBJECTS_JSON_PATH = path.join(__dirname, "data", "objects.json");

// Название коллекции
const COLLECTION_NAME = "objects";

// true = перезаписывать документы при повторном импорте
const OVERWRITE = true;

// дефолтный статус, если нет в JSON
const DEFAULT_STATUS = "active";

// дефолтный город, если пустой
const DEFAULT_CITY = "Лидский район";

// ==================

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Файл не найден: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error("JSON должен быть массивом объектов");
  }

  return data;
}

function isFilled(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

function isValidSlug(slug) {
  return typeof slug === "string" && slug.trim().length > 0;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function toNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (!isFilled(v)) return null;

  // "175 000" -> "175000", "175000,50" -> "175000.50"
  const s = String(v).replace(/\s+/g, "").replace(",", ".");
  const n = Number(s);

  return Number.isFinite(n) ? n : null;
}

function normalizeImages(images) {
  // если уже массив
  if (Array.isArray(images)) {
    return images.map((x) => String(x).trim()).filter(Boolean);
  }

  // если вдруг строка "/a.webp, /b.webp"
  if (isFilled(images)) {
    return String(images)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeDateYYYYMMDD(v) {
  // ожидаем "2026-01-21"
  if (!isFilled(v)) return null;

  const s = String(v).trim();

  // если уже YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // если ISO "2026-01-21T..." -> берём дату
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);

  return null;
}

function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeCity(city) {
  if (!isFilled(city)) return DEFAULT_CITY;

  let c = String(city).trim();

  // лёгкая нормализация частых вариантов
  // (можешь расширять под себя)
  const map = {
    "г. лида": "Лида",
    "лида": "Лида",
    "г. минск": "Минск",
    "минск": "Минск",
    "лидский р-н": "Лидский район",
    "лидский район": "Лидский район",
  };

  const key = c.toLowerCase();
  if (map[key]) c = map[key];

  return c;
}

function normalizeStatus(status) {
  if (!isFilled(status)) return DEFAULT_STATUS;

  const s = String(status).trim().toLowerCase();

  // нормализуем разные варианты в единый формат
  if (["active", "активно", "в продаже", "продается", "продаётся"].includes(s)) return "active";
  if (["sold", "продано"].includes(s)) return "sold";
  if (["reserved", "бронь", "забронировано"].includes(s)) return "reserved";
  if (["hidden", "скрыто"].includes(s)) return "hidden";

  // если прилетело что-то своё — оставим как есть
  return String(status).trim();
}

function normalizeObject(rawObj) {
  const slug = String(rawObj.slug || "").trim();

  const priceBYN = toNumber(rawObj.priceBYN);
  const priceUSD = toNumber(rawObj.priceUSD);

  // updatedAt: если нет — берём publishedAt, если и его нет — today
  const publishedAt = normalizeDateYYYYMMDD(rawObj.publishedAt);
  const updatedAt =
    normalizeDateYYYYMMDD(rawObj.updatedAt) ||
    publishedAt ||
    todayYYYYMMDD();

  const normalized = {
    ...rawObj,

    // гарантируем ключевые поля
    slug,
    status: normalizeStatus(rawObj.status),
    city: normalizeCity(rawObj.city),

    // числа
    priceBYN,
    priceUSD,

    // массив картинок
    images: normalizeImages(rawObj.images),

    // даты
    publishedAt: publishedAt || rawObj.publishedAt || null,
    updatedAt,

    // тех поля
    _source: "import-from-json",
  };

  return normalized;
}

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(
      `Не найден ключ Service Account:\n${SERVICE_ACCOUNT_PATH}\n\n` +
      `Скачай его в Firebase Console → Project settings → Service accounts → Generate new private key`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  });

  const db = admin.firestore();

  const objects = readJsonArray(OBJECTS_JSON_PATH);

  // проверка slug на дубли
  const slugs = objects
    .map((o) => (o && o.slug ? String(o.slug).trim() : ""))
    .filter(Boolean);

  const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (duplicates.length) {
    console.warn("⚠️ Найдены дубли slug. Это плохо для ссылок и sitemap:");
    console.warn(uniq(duplicates));
    console.warn("Импорт продолжится, но документы будут перезаписываться.");
  }

  let imported = 0;
  let skipped = 0;

  for (const rawObj of objects) {
    if (!rawObj || !isValidSlug(rawObj.slug)) {
      console.warn("⏭️ Пропуск объекта без slug:", rawObj);
      skipped++;
      continue;
    }

    const obj = normalizeObject(rawObj);

    const docRef = db.collection(COLLECTION_NAME).doc(obj.slug);

    if (!OVERWRITE) {
      const snap = await docRef.get();
      if (snap.exists) {
        console.log(`⏭️ Уже есть в базе, пропуск: ${obj.slug}`);
        skipped++;
        continue;
      }
    }

    const payload = {
      ...obj,
      _importedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(payload, { merge: true });

    console.log(
      `✅ Импортировано: ${obj.slug} | ${obj.city} | ${obj.type || "тип?"} | ${obj.priceBYN || "цена?"} BYN`
    );

    imported++;
  }

  console.log("\n=== ГОТОВО ===");
  console.log(`Импортировано: ${imported}`);
  console.log(`Пропущено: ${skipped}`);
  console.log(`Коллекция: ${COLLECTION_NAME}`);
}

main().catch((e) => {
  console.error("\n❌ Ошибка импорта:");
  console.error(e);
  process.exit(1);
});
