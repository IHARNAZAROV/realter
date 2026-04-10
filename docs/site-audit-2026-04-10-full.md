# Аудит проекта turko.by (Лида) — 2026-04-10

> Формат: deep static audit по исходникам (HTML/CSS/JS/JSON/robots/sitemap).
> Ограничение: в среде не запускался Lighthouse/Chrome trace, поэтому CWV оценены по коду и архитектуре, а не по live-полевым метрикам.

## Проверенный охват

### Полностью проверено
- Все HTML в корне: `index.html`, `nedvizhimost-lida.html`, `object-detail.html`, `blog.html`, `blog-detail.html`, `faq.html`, `contact.html`, `rieltor-lida.html`, `services-detail.html`, `Privacy.html`, `cookies-policy.html`, `404.html`.
- Ключевые JS-модули: `js/filters.js`, `js/object-detail.js`, `js/blog-list.js`, `js/blog-detail.js`, `js/service-detail.js`, `js/optimize.js`, `contact-widget.js`, и прочие утилитарные.
- SEO-файлы: `robots.txt`, `sitemap.xml`, `rss.xml`.
- Данные: `data/objects.json`, `data/objects-list.json`, `data/blog-articles.json`, `data/services.json`.

### Не проверялось вручную построчно
- Вендорные/минифицированные библиотеки: `js/swiper-bundle.min.js`, `libs/maplibre/maplibre-gl.js`, `js/swiper.js`.
- Бинарные ассеты (картинки/woff) проверялись только по весу/формату, без визуальной инспекции каждого файла.

---

## 1) Общая оценка проекта

- **Итоговая оценка:** 7.4/10.
- **Сильные стороны:**
  - Есть canonical/robots/description/h1 на всех основных HTML.
  - Динамическая генерация schema.org для карточек объектов реализована (не заглушка).
  - Используются lazy-паттерны, часть preconnect/preload, есть mobile UX-модули.
- **Сдерживающие факторы:**
  - Дубли meta/title между блог-страницами.
  - Ошибки индексации 404 и неконсистентность canonical.
  - Критичные performance-антипаттерны (versioning через `time()`, синхронный `site-version.php`, heavy CSS в head).
  - Есть зоны риска memory leaks/дублирующихся listeners в модалках и длительно живущих сценариях.

---

## 2) Критические ошибки

### C1. 404 индексируется как обычная страница
- **Файл:** `404.html:8`
- **Проблема:** `meta robots="index, follow"` на странице ошибки.
- **Критичность:** critical
- **Влияние:** риск soft 404 в индексе, каннибализация crawl budget.
- **Замена:**
```html
<!-- было -->
<meta name="robots" content="index, follow" />

<!-- стало -->
<meta name="robots" content="noindex, follow" />
```

### C2. Canonical в services-detail указывает на чужую страницу
- **Файл:** `services-detail.html:19`
- **Проблема:** `href="https://turko.by/rieltor-lida.html"` вместо URL услуги.
- **Критичность:** critical
- **Влияние:** потеря релевантности, дубли и неверная каноникализация.
- **Замена:**
```html
<!-- было -->
<link rel="canonical" href="https://turko.by/rieltor-lida.html" />

<!-- стало (шаблон до динамики) -->
<link rel="canonical" href="https://turko.by/services" />
```
+ в `js/service-detail.js` уже корректно подставляется slug-каноникал — это оставить.

### C3. Версионирование ассетов ломает HTTP-cache
- **Файл:** `site-version.php:2-3`
- **Проблема:** `window.SITE_VERSION = time()` меняется на каждый запрос.
- **Критичность:** critical
- **Влияние:** почти полная инвалидизация кэша CSS/JS, ухудшение FCP/LCP/TBT.
- **Замена (без изменения логики UI):**
```php
<?php
header('Content-Type: application/javascript; charset=UTF-8');
$versionFile = __DIR__ . '/version.php';
$version = file_exists($versionFile) ? trim((string) include $versionFile) : '1';
echo 'window.SITE_VERSION = "' . addslashes($version) . '";';
```

---

## 3) SEO

### 3.1 Найденные проблемы и точечные исправления

#### S1. Дубли title у `blog.html` и `blog-detail.html`
- **Файлы:** `blog.html:10`, `blog-detail.html:11`
- **Критичность:** high
- **Влияние:** конкуренция URL в выдаче, слабый CTR.
- **До / после:**
```html
<!-- blog-detail.html было -->
<title>Полезные статьи о рынке жилья в Лиде — Ольга Турко</title>

<!-- стало -->
<title>Статья о недвижимости в Лиде — Ольга Турко</title>
```
(после загрузки slug дополнительно переопределять JS-ом по заголовку статьи).

#### S2. Дубли description на 6 страницах
- **Файлы:** `index.html`, `404.html`, `faq.html`, `blog.html`, `blog-detail.html`, `rieltor-lida.html`
- **Критичность:** high
- **Влияние:** ухудшение релевантности сниппетов.
- **Исправление:** уникализировать description под intent страницы.

#### S3. Title > 60 символов на главной
- **Файл:** `index.html:17`
- **Критичность:** medium
- **Влияние:** обрезка сниппета в SERP.
- **До / после:**
```html
<!-- было 61+ -->
<title>Риэлтер в Лиде — Ольга Турко | Покупка и продажа недвижимости</title>

<!-- стало -->
<title>Риэлтер в Лиде — Ольга Турко | Недвижимость</title>
```

#### S4. Нет OG/Twitter на части страниц
- **Файлы:** `blog.html`, `blog-detail.html`, `faq.html`, `contact.html`, `nedvizhimost-lida.html`, `rieltor-lida.html`, `services-detail.html`, `404.html`
- **Критичность:** medium
- **Влияние:** слабые social-snippets.
- **Шаблон исправления:**
```html
<meta property="og:type" content="website">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="...">
<meta property="og:image" content="https://turko.by/images/main-slider/2.webp">
<meta name="twitter:card" content="summary_large_image">
```

#### S5. Отсутствует hreflang (если планируется мультиязычность)
- **Файлы:** все HTML
- **Критичность:** low (сейчас один язык)
- **Влияние:** ограничено, но пригодится при RU/BY/EN версиях.

#### S6. Отсутствует rel prev/next для листинга/пагинации
- **Файлы:** `blog.html`, `nedvizhimost-lida.html`
- **Критичность:** medium
- **Влияние:** поисковику сложнее понять цепочки списков.

#### S7. Canonical/robots для фильтров и поиска не зафиксированы
- **Файл:** `nedvizhimost-lida.html` + логика `js/filters.js`
- **Критичность:** high
- **Влияние:** риск indexation мусорных query-URL при внешних ссылках.
- **Решение:** при наличии query-параметров фильтра выставлять self-canonical на базовый листинг + `noindex,follow`.

### 3.2 Structured Data (schema.org)

#### Что уже хорошо
- `index.html` содержит `RealEstateAgent`.
- `faq.html` содержит `FAQPage`.
- `object-detail.js` динамически генерирует JSON-LD из `objects.json`, включая `Offer`, `Product`, типы недвижимости и `BreadcrumbList`.

#### Проблемы schema

1) **Несовместимый тип `RealEstateListing`** (не в базовом schema.org ядре для всех валидаторов).
- **Файл:** `js/object-detail.js:453`
- **Критичность:** medium
- **Решение:** использовать `OfferCatalog`/`Product`/`Residence` + `Offer`, либо оставить `RealEstateListing` как дополнительный, но иметь fallback graph.

2) **Тип `SingleFamilyResidence` + `House` + `Product` в одном массиве type** может быть валидно, но для части валидаторов noisy.
- **Файл:** `js/object-detail.js:389`
- **Критичность:** low
- **Решение:** оставить 1 primary тип + `additionalType`.

3) **`priceValidUntil` статичен до 2030-12-31**.
- **Файл:** `js/object-detail.js:363`
- **Критичность:** medium
- **Решение:** генерировать динамически `today + 30/90 days`.

4) **Отсутствуют отдельные `WebSite` + `SearchAction`** на главной.
- **Файл:** `index.html`
- **Критичность:** medium
- **Решение (готовый блок):**
```html
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"WebSite",
  "url":"https://turko.by/",
  "name":"turko.by",
  "potentialAction":{
    "@type":"SearchAction",
    "target":"https://turko.by/nedvizhimost-lida?search={search_term_string}",
    "query-input":"required name=search_term_string"
  }
}
</script>
```

---

## 4) Производительность и Core Web Vitals

## 4.1 Ожидаемые узкие места

### P1. Render-blocking `site-version.php` почти на всех страницах
- **Файлы:** почти все HTML, напр. `index.html:63`, `blog.html:44`.
- **Критичность:** high
- **Почему влияет:** блокирует парсер до получения JS-ответа.
- **До / после:**
```html
<!-- было -->
<script src="/site-version.php"></script>

<!-- стало -->
<script src="/site-version.php" defer></script>
```
(инициализацию versioned-ассетов запускать после DOMContentLoaded).

### P2. Много CSS в `<head>` без критического инлайна
- **Файлы:** `blog.html`, `blog-detail.html`, `contact.html`, ...
- **Критичность:** high
- **Почему:** удлиняет critical path, особенно на мобильном.
- **Рекомендация:** унифицировать подход как на главной (preload+onload) для вторичных CSS.

### P3. maplibre грузится без lazy gating
- **Файл:** `object-detail.html:853`
- **Критичность:** medium
- **Почему:** тяжёлый JS загружается, даже если пользователь не дошёл до карты.
- **После:** динамический import/ленивая вставка скрипта при intersect блока карты.

### P4. Отсутствие `fetchpriority`/`decoding`/`width/height` на части изображений
- **Файлы:** выборочно в HTML-шаблонах карточек и блога.
- **Критичность:** medium
- **Почему:** CLS + медленный LCP.
- **Шаблон:**
```html
<img src="..." width="640" height="420" loading="lazy" decoding="async" alt="...">
```

### P5. LCP-кандидат на главной: hero слайдер
- **Файл:** `index.html` (hero images)
- **Критичность:** medium
- **Почему:** слайдер/анимации до стабилизации layout могут отложить LCP.

---

## 5) JS и memory leaks

### J1. Возможная утечка/дублирование listeners в share block
- **Файл:** `js/object-detail.js:1540-1594`
- **Критичность:** high
- **Почему:** `initShareBlock` вешает listeners при каждом вызове; при повторной инициализации (soft navigation) накопление.
- **Безопасная замена:** использовать флаг `data-initialized` + `AbortController`:
```js
if (block.dataset.bound === "1") return;
block.dataset.bound = "1";
const ac = new AbortController();
copyBtn?.addEventListener("click", onCopy, { signal: ac.signal });
// ...
window._shareAbortController = ac;
```
и в `cleanupResources()` вызывать `window._shareAbortController?.abort()`.

### J2. `setInterval` без очистки в widget
- **Файл:** `contact-widget.js:139`
- **Критичность:** medium
- **Почему:** если виджет переинициализируется, интервалы могут умножаться.
- **Фикс:** хранить id и очищать при destroy/reinit.

### J3. `MutationObserver` без disconnect
- **Файл:** `js/filters-custom-select.js:1`
- **Критичность:** medium
- **Почему:** observer живёт до unload, при динамических перерендерах может накапливаться.
- **Фикс:** держать ссылку на observer и `disconnect()` при удалении select.

### J4. Глобальные singleton-переменные в `window` без централизованного lifecycle
- **Файл:** `js/object-detail.js:1471, 1510`
- **Критичность:** low/medium
- **Почему:** повышает риск конфликтов при SPA-подобной навигации.

### J5. Частые операции в scroll listener без passive
- **Файл:** `js/filters.js:1358`
- **Критичность:** medium
- **Исправление:**
```js
window.addEventListener("scroll", onScrollHandler, { passive: true });
```

---

## 6) HTML / Accessibility / Semantics

### A1. Нет skip-link
- **Файлы:** все ключевые шаблоны
- **Критичность:** medium
- **Влияние:** хуже keyboard UX.
- **Готовая вставка:**
```html
<a class="skip-link" href="#main-content">Перейти к содержимому</a>
<main id="main-content">...</main>
```

### A2. `img` без alt в динамическом Instagram-блоке
- **Файл:** `blog-detail.html:258`
- **Критичность:** medium
- **Исправление:**
```html
<img loading="lazy" data-instagram-image alt="Instagram превью статьи" />
```

### A3. Недостаток семантических landmark (`main`) на части страниц
- **Файлы:** напр. `index.html`, `blog.html`, `contact.html`
- **Критичность:** medium
- **Влияние:** screen-reader навигация хуже.

### A4. Модальные окна: не везде явный focus trap/restore
- **Файлы:** `object-detail.html`, `js/viewing-booking.js`, `contact-widget.js`
- **Критичность:** medium
- **Решение:** единый helper focus-trap + возврат фокуса на opener.

---

## 7) Что уже реализовано хорошо

- **Фильтры объектов (`js/filters.js`)**: есть debounce, сохранение состояния, сравнение, избранное.
- **Избранное/сравнение**: localStorage интегрирован с UI, есть counters и compare modal.
- **Динамическая карточка объекта (`js/object-detail.js`)**: генерирует meta, schema, похожие объекты, карту, share-блок.
- **FAQ**: есть JSON-LD и структурная секция.
- **Cookie consent**: отдельный модуль + состояние.
- **Контактный widget**: аккуратные fallback-и, passive scroll.

Оценка качества реализации (по 10-балльной):
- Фильтры: 8/10
- Избранное: 7/10
- Сравнение: 7/10
- Блог: 6.5/10 (SEO дубли)
- Schema: 7.5/10
- Мобильное меню: 7/10

---

## 8) Что нужно срочно исправить

1. `404 noindex`.
2. Canonical в `services-detail`.
3. Версионирование `site-version.php` (убрать `time()`).
4. Уникализировать `title/description` для blog/blog-detail/faq/home/rieltor.
5. Добавить OG/Twitter минимум на все коммерческие страницы.
6. Зафиксировать policy для query-страниц фильтров (canonical+robots).

---

## 9) Что можно улучшить позже

- Унификация preload/defer-стратегии по всем шаблонам.
- Переход на модульную архитектуру JS (core/ui/seo/data layers).
- Вынести повторяющуюся mobile-nav логику в один модуль.
- Свести inline HTML-строки к шаблонам (`<template>` + DocumentFragment).

---

## 10) Оптимизация JS/HTML без изменения функционала

### O1. `innerHTML +=` в цикле (service-detail)
- **Файл:** `js/service-detail.js`.
- **Почему плохо:** повторный parse/reflow.
- **До:**
```js
m.innerHTML = "";
r.services.forEach((e)=>{ m.innerHTML += `<li>...</li>`; });
```
- **После:**
```js
const html = r.services.map((e)=>`<li class="${e.slug===a?"active":""}"><a href="/services/${e.slug}">${e.title}</a></li>`).join("");
m.innerHTML = html;
```

### O2. Повторные `querySelector` в горячих местах
- **Файл:** `js/object-detail.js`, `js/filters.js`.
- **Улучшение:** кэш узлов при init, переиспользование ссылок.

### O3. Сложные HTML-строки карточек
- **Файлы:** `js/home-recommended-slider.js`, `js/object-detail.js`.
- **Улучшение:** template + `DocumentFragment` (меньше GC pressure).

---

## 11) Нестандартные UI/UX идеи (20)

1. **Карта времени до жизни** — время пешком/на авто до школ/поликлиник/работы; в карточке объекта; сложность M; эффект: рост доверия.
2. **Режим “С моим стилем жизни”** — фильтр сценариями (с ребёнком/инвестор/пенсия); в листинге; M; выше конверсия.
3. **Калькулятор “Потяну ли”** — ежемесячная нагрузка + резерв; на карточке; M; меньше «холодных» лидов.
4. **Индекс “Спокойствие сделки”** — риск-скоринг документов; карточка+форма; H; рост доверия.
5. **Таймлайн района** — как менялась инфраструктура; на страницах районов; H; глубина просмотра.
6. **Сравнение “по-человечески”** — не таблица, а “лучше для семьи/аренды/тишины”; compare modal; M.
7. **Карта шума/трафика по времени** — утро/вечер heatmap; карточка; H.
8. **“Если отложить на 6 месяцев”** — сценарный блок с диапазонами цен; карточка; M.
9. **Персональный shortlist с заметками** — приватный лист + комментарии; кабинет-lite; M.
10. **Режим “Покажи родителям”** — упрощённый экран, крупный текст, печать PDF; карточка; L.
11. **Видео-маршрут до объекта** — короткая поездка от центра Лиды; карточка; M.
12. **Эмоциональный селектор интерьера** — предпочтения -> подбор похожих объектов; листинг; M.
13. **“Похожие на вашу текущую квартиру”** — ввод текущих параметров -> релевантные альтернативы; листинг; M.
14. **Сигнал “Редкий объект”** — rarity badge на основе статистики; карточки; M.
15. **Live-лента изменений** — что поменялось по цене/статусу за неделю; главная/объекты; M.
16. **Checklist готовности к сделке** — интерактивный прогресс по документам; CTA-блок; L/M.
17. **“Соседский профиль”** — спокойствие, семейность, транспортный ритм; карточка; M.
18. **Сценарий “Переезд за 30 дней”** — пошаговый план с дедлайнами; блог+карточка; L.
19. **Анти-стресс микроанимации доверия** — подтверждение действий, прозрачные статусы; глобально; L.
20. **Умный re-engagement** — персональные пуш-баннеры по просмотренным районам; листинг; M.

---

## 12) Пошаговый план внедрения

### Фаза 1 (1–2 дня, критично)
- Исправить robots/canonical/duplicates meta.
- Починить `site-version.php`.
- Добавить OG/Twitter минимум на top pages.

### Фаза 2 (3–5 дней)
- Укрепить schema graph (WebSite/SearchAction, refine object schema).
- Ввести policy для filters/search/pagination indexation.
- Убрать риски reinit/listener leaks.

### Фаза 3 (1–2 недели)
- Рефактор рендера карточек на template/fragment.
- Lazy map/script gating.
- Интеграция UX-фич 3–5 самых эффективных.

---

## 13) Таблица приоритетов

| ID | Задача | Критичность | Effort | Impact |
|---|---|---|---|---|
| C1 | 404 noindex | Critical | XS | High |
| C2 | Canonical services-detail | Critical | XS | High |
| C3 | Stable asset versioning | Critical | S | High |
| S1 | Уникальные title/blog detail | High | XS | High |
| S2 | Уникальные description | High | S | High |
| S7 | Canonical+robots для фильтров | High | M | High |
| P1 | defer для site-version + init strategy | High | S | High |
| J1 | AbortController для share listeners | High | S | Medium |
| P3 | Lazy maplibre | Medium | M | Medium |
| A1 | skip-link/main landmarks | Medium | S | Medium |

---

## 14) Доказательство сохранения функционала при предложенных изменениях

Все предложенные правки относятся к:
- мета/SEO-тегам;
- стратегии загрузки (defer/lazy/versioning), не меняющей бизнес-логику;
- lifecycle-очистке listeners/observers;
- семантике и доступности.

Ни один предложенный change-set не меняет:
- фильтрацию объектов,
- логику избранного/сравнения,
- бизнес-правила карточек,
- процесс отправки заявок.

