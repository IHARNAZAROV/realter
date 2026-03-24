# Realter — Olga Turko (Realtor from Lida)

## Project Overview
A professional real estate website for Olga Turko, a realtor from Lida. Built with static HTML, CSS, and JavaScript with a PHP backend for the booking form API.

## Architecture
- **Frontend**: Static HTML/CSS/JS (no build step required)
- **Backend**: PHP 8.2 — serves the API endpoint at `api/book-viewing.php`
- **Server**: PHP built-in server (`php -S 0.0.0.0:5000 -t .`) handles both static files and PHP

## Slider / Carousel
- **Swiper.js** (v9+) is used for all carousels — fully migrated from Owl Carousel + jQuery
  - About-home slider: `.swiper-about-home` — with animated progress line via CSS `--progress-width` var
  - Testimonials: `.swiper-testimonial-home` — with `.testimonial-home-pagination` dots
  - Service / recommended objects: `.swiper-service-slider` — loaded dynamically by `home-recommended-slider.js`, initialized in `customgpt.js`
- **jQuery has been completely removed** from all HTML pages and JavaScript files
- **Masonry** (v4, vanilla, no jQuery): `js/masonry.pkgd.min.js` loaded on `blog.html`

## Key Files
- `index.html` — Homepage
- `object-detail.html` — Property listing detail page with booking form
- `api/book-viewing.php` — PHP API endpoint that sends booking notifications via Telegram
- `env.php` — PHP environment configuration
- `css/` — Stylesheets
- `js/` — JavaScript files
- `images/`, `media/` — Assets

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

## Deployment
- Target: autoscale
- Run: `php -S 0.0.0.0:5000 -t .`
