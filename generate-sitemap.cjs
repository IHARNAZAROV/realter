// generate-sitemap.js
// Генерация sitemap.xml из objects.json
// Запуск: node generate-sitemap.cjs

const fs = require('fs')
const path = require('path')

const SITE_URL = 'https://turko.by'

const OBJECTS_JSON_PATH = path.join(__dirname, 'data', 'objects.json')

// куда сохранить sitemap
const OUTPUT_SITEMAP_PATH = path.join(__dirname, 'sitemap.xml')

// какой URL у страницы объекта (канонический)
function buildObjectUrl (slug) {
  return `${SITE_URL}/object-detail?slug=${encodeURIComponent(slug)}`
}

function escapeXml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toIsoLastmod (date = new Date()) {
  // формат: 2025-12-10T09:05:15+00:00
  const pad = (n) => String(n).padStart(2, '0')

  const yyyy = date.getUTCFullYear()
  const mm = pad(date.getUTCMonth() + 1)
  const dd = pad(date.getUTCDate())
  const hh = pad(date.getUTCHours())
  const mi = pad(date.getUTCMinutes())
  const ss = pad(date.getUTCSeconds())

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+00:00`
}

function uniq (arr) {
  return [...new Set(arr)]
}

function readObjectsJson () {
  if (!fs.existsSync(OBJECTS_JSON_PATH)) {
    throw new Error(`Не найден файл objects.json: ${OBJECTS_JSON_PATH}`)
  }

  const raw = fs.readFileSync(OBJECTS_JSON_PATH, 'utf-8')
  const data = JSON.parse(raw)

  if (!Array.isArray(data)) {
    throw new Error('objects.json должен быть массивом объектов')
  }

  return data
}

function validateSlugs (objects) {
  const slugs = objects.map((o) => (o && o.slug ? String(o.slug).trim() : '')).filter(Boolean)

  const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i)
  if (duplicates.length) {
    console.warn('⚠️ Найдены дубли slug в objects.json:')
    console.warn(uniq(duplicates))
    console.warn('Лучше исправить, чтобы не было дублей страниц в sitemap.')
  }

  return uniq(slugs)
}

function buildUrlTag (loc, lastmod, priority) {
  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <priority>${escapeXml(priority)}</priority>
  </url>`
}

function generateSitemapXml (slugs) {
  const lastmod = toIsoLastmod(new Date())

  const staticPages = [
    { loc: `${SITE_URL}/`, priority: '1.00' },
    { loc: `${SITE_URL}/about`, priority: '0.80' },
    { loc: `${SITE_URL}/objects`, priority: '0.80' },
    { loc: `${SITE_URL}/blog`, priority: '0.80' },
    { loc: `${SITE_URL}/faq`, priority: '0.80' },
    { loc: `${SITE_URL}/contact`, priority: '0.80' },
    { loc: `${SITE_URL}/Privacy`, priority: '0.80' }
  ]

  const objectPages = slugs.map((slug) => ({
    loc: buildObjectUrl(slug),
    priority: '0.70'
  }))

  const allPages = [...staticPages, ...objectPages]

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset\n' +
    '      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    '      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n' +
    '            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n' +
    '\n' +
    '  <!-- generated автоматически из objects.json -->\n' +
    allPages.map((p) => buildUrlTag(p.loc, lastmod, p.priority)).join('\n') +
    '\n\n</urlset>\n'

  return xml
}

function main () {
  try {
    const objects = readObjectsJson()
    const slugs = validateSlugs(objects)

    if (!slugs.length) {
      throw new Error('В objects.json не найдено ни одного slug')
    }

    const sitemapXml = generateSitemapXml(slugs)
    fs.writeFileSync(OUTPUT_SITEMAP_PATH, sitemapXml, 'utf-8')

    console.log('✅ sitemap.xml успешно создан!')
    console.log(`Файл: ${OUTPUT_SITEMAP_PATH}`)
    console.log(`Всего объектов: ${slugs.length}`)
  } catch (err) {
    console.error('❌ Ошибка генерации sitemap:')
    console.error(err.message)
    process.exit(1)
  }
}

main()
