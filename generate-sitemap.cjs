const fs = require("fs");
const path = require("path");

const SITE_URL = "https://turko.by";
const OUTPUT_SITEMAP = path.join(__dirname, "sitemap.xml");

const SOURCES = [
  {
    file: path.join(__dirname, "data", "objects.json"),
    buildUrl: (slug) =>
      `${SITE_URL}/object-detail?slug=${encodeURIComponent(slug)}`,
  },
  {
    file: path.join(__dirname, "data", "services.json"),
    buildUrl: (slug) =>
      `${SITE_URL}/services-detail?slug=${encodeURIComponent(slug)}`,
  },
  {
    file: path.join(__dirname, "data", "blog-articles.json"),
    buildUrl: (slug) =>
      `${SITE_URL}/blog-detail?slug=${encodeURIComponent(slug)}`,
  },
];

/* ===================== helpers ===================== */

// рекурсивно собирает все slug из любого JSON
function collectSlugsDeep(data, acc = []) {
  if (Array.isArray(data)) {
    data.forEach((item) => collectSlugsDeep(item, acc));
  } else if (data && typeof data === "object") {
    if (typeof data.slug === "string" && data.slug.trim()) {
      acc.push(data.slug.trim());
    }
    Object.values(data).forEach((v) => collectSlugsDeep(v, acc));
  }
  return acc;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function isoDate() {
  return new Date().toISOString().replace(/\.\d+Z$/, "+00:00");
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* ===================== main ===================== */

function generateSitemap() {
  const urls = new Set();
  const lastmod = isoDate();

  // JSON → slug → URL
  SOURCES.forEach(({ file, buildUrl }) => {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️ Файл не найден: ${file}`);
      return;
    }

    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    const slugs = uniq(collectSlugsDeep(json));

    slugs.forEach((slug) => {
      urls.add(buildUrl(slug));
    });
  });

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n` +
    [...urls]
      .map(
        (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
      )
      .join("\n\n") +
    `\n\n</urlset>\n`;

  fs.writeFileSync(OUTPUT_SITEMAP, xml, "utf8");

  console.log("✅ sitemap.xml создан");
  console.log(`🔗 Всего URL: ${urls.size}`);
}

generateSitemap();
