# Realter — Olga Turko (Realtor from Lida)

## Project Overview
A professional real estate website for Olga Turko, a realtor from Lida, Belarus. Built with static HTML, CSS, and JavaScript with a PHP backend for the booking form API and admin panel.

## Architecture
- **Frontend**: Static HTML/CSS/JS (no build step required)
- **Backend**: PHP 8.2 — serves API endpoints and admin panel
- **Server**: PHP built-in server (`php -S 0.0.0.0:5000 -t .`) handles both static files and PHP
- **Data**: Property listings stored as flat JSON files in `/data/` and `/data/objects/`

## Key Files
- `index.html` — Homepage
- `nedvizhimost-lida.html` — Property listing catalog
- `object-detail.html` — Property listing detail page with booking form
- `api/book-viewing.php` — PHP API endpoint that sends booking notifications via Telegram
- `adminka_objects/` — Admin panel for managing property listings (Basic Auth protected)
- `data/objects.json` — Central database for all property listings
- `data/objects-list.json` — Summary list of all objects for catalog/homepage
- `data/blog-articles.json` — Blog articles data
- `env.php` — PHP environment configuration
- `site-version.php` — Returns cache-busting version string
- `css/` — Stylesheets (Bootstrap, Swiper, FontAwesome, custom)
- `js/` — JavaScript files
- `images/`, `media/` — Assets (WebP images, SVGs, fonts)

## Running the App
The PHP built-in server serves everything on port 5000:
```
php -S 0.0.0.0:5000 -t .
```

## Telegram Integration (Booking Form)
The booking form on `object-detail.html` posts to `api/book-viewing.php`, which sends Telegram messages.

Environment variables:
- `TELEGRAM_BOT_TOKEN` — Bot token from @BotFather (default hardcoded in PHP)
- `TELEGRAM_CHAT_IDS` — Comma-separated numeric chat IDs (default: `281486249,920099484`)
- `TELEGRAM_USERNAMES` — Optional fallback usernames (default: `@y_tery,@TurkoOlga`)

## Third-Party Integrations
- **Telegram Bot API**: Sends booking form notifications to the realtor
- **Yandex Direct API**: Used in the admin panel for marketing analytics
- **NBRB API**: Fetches live USD→BYN currency exchange rates for property price display
- **MapLibre GL**: Interactive maps for property locations

## Deployment
- Target: autoscale
- Run: `php -S 0.0.0.0:5000 -t .`

## Blog Contextual Internal Links
Blog articles automatically render two internal-link blocks for SEO:
- **Mid-article CTA** — server passes JSON via `data-mid-cta` on `#post-content`; `js/blog-detail.js` (`insertMidCta`) inserts a styled aside after the 3rd paragraph. CTA chosen by article `category` from `data/blog-cta-map.json` (with `default` fallback). Skipped if article has fewer than 4 paragraphs.
- **«По теме» card** — server-rendered `<aside class="related-links-card">` after `#post-content`. Up to 3 deduped links chosen by article `tags` from `data/blog-related-map.json` (`fallback` array used when fewer than 2 matches). Manual override: set `relatedLinks: [{title,url},...]` in the article's JSON entry to bypass auto-mapping.
- Styles: `css/blog-related.css`.

## Admin Panel Protection (`/adminka_objects/`)
The admin panel includes Basic Auth protection and token-based validation for save operations.

Setup steps:
1. Create a password file outside the public web root (example):
   `htpasswd -c /absolute/path/outside/public_html/.htpasswd-adminka admin`
2. Edit `adminka_objects/.htaccess` and set `AuthUserFile` to that absolute path.
3. Keep bearer token checks in app code enabled as the first/second factor (defense in depth).

`adminka_objects/.htpasswd.example` is only a template and must not be used in production.
