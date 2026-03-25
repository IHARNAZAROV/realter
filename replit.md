# Realter — Olga Turko (Realtor from Lida)

## Project Overview
A professional real estate website for Olga Turko, a realtor from Lida. Built with static HTML, CSS, and JavaScript with a PHP backend for the booking form API.

## Architecture
- **Frontend**: Static HTML/CSS/JS (no build step required)
- **Backend**: PHP 8.2 — serves the API endpoint at `api/book-viewing.php`
- **Server**: PHP built-in server (`php -S 0.0.0.0:5000 -t .`) handles both static files and PHP

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

## Admin Panel Protection (`/adminka_objects/`)
To add a second protection layer, this repo now includes `adminka_objects/.htaccess` with HTTP Basic Auth.

Setup steps:
1. Create a password file outside the public web root (example):
   `htpasswd -c /absolute/path/outside/public_html/.htpasswd-adminka admin`
2. Edit `adminka_objects/.htaccess` and set `AuthUserFile` to that absolute path.
3. Keep bearer token checks in app code enabled as the first/second factor (defense in depth).

`adminka_objects/.htpasswd.example` is only a template and must not be used in production.
