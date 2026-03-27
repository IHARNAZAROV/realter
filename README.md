# Realter — Olga Turko (Realtor from Lida)

Website for Olga Turko — realtor from Lida. This project is a lightweight, responsive, and accessible single-page website built with HTML, CSS and JavaScript to showcase Olga's services, property listings, contact details, and client testimonials.

Language composition
- JavaScript: 46%
- HTML: 27.1%
- CSS: 26.9%

## Table of contents
- [About](#about)
- [Demo](#demo)
- [Features](#features)
- [Built with](#built-with)
- [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [Customization](#customization)
- [Contributing](#contributing)
- [License](#license)
- [Author & Contact](#author--contact)

## About
Realter is a small professional website intended to present Olga Turko's real estate services in Lida. The site focuses on clear presentation of listings, easy contact options for prospective clients, and a simple, mobile-first design.

## Demo
(Replace with a live URL or GitHub Pages link when available)
- Live site: https://turko.by

## Features
- Responsive layout for desktop, tablet, and mobile
- Property listing cards with images and details
- Contact form (client-side validation)
- Testimonials / client feedback section
- SEO-friendly markup and accessible components
- Lightweight vanilla JavaScript for interactivity (no heavy frameworks)

## Built with
- HTML5!
- CSS3 (Flexbox / Grid)
- JavaScript (ES6+)
- Optional: Any task runner or bundler if used (e.g., npm scripts)

## Installation
Clone the repository and open the site locally.

1. Clone
   git clone https://github.com/IHARNAZAROV/realter.git

2. Change directory
   cd realter

If the project uses a simple static structure, open / in your browser:
- Open the file directly: open /
or serve it locally using a simple static server.

Optional: using a Node static server
1. Install serve (if not installed)
   npm install -g serve

2. Serve the folder
   serve .

## Development
If the project contains npm scripts (check package.json), typical commands:

- Install dependencies
  npm install

- Start development server (if provided)
  npm start

- Build for production (if provided)
  npm run build

If there are no npm configs, edit HTML/CSS/JS files directly and refresh the browser.

## Deployment
This site can be hosted on:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting / CDN

Example: Deploy to GitHub Pages
1. Push to the repository
2. In repository settings, enable GitHub Pages from the main branch (or gh-pages branch)

### Recommended Git workflow (VS Code → GitHub → Server without conflicts)
If you edit files in VS Code and deploy by `git push`, then on the server run `git pull`, use this strict rule:

**Never edit project files directly on the server.**

Keep server repository as a read-only deployment mirror. All code/content changes go through your local machine and GitHub.

#### Daily flow
1. **Local (VS Code):** create a branch from `main`.
   - `git checkout main`
   - `git pull origin main`
   - `git checkout -b feature/blog-article-2026-04-10`
2. Make changes locally (including `data/blog-articles.json` via admin UI or manually), commit and push:
   - `git add .`
   - `git commit -m "Add scheduled blog article"`
   - `git push -u origin feature/blog-article-2026-04-10`
3. Open PR on GitHub and merge into `main`.
4. **Server:** update only from `main`:
   - `git checkout main`
   - `git fetch origin`
   - `git reset --hard origin/main`
   - `git clean -fd`

Using `reset --hard origin/main` instead of plain `pull` avoids merge commits and removes accidental local server drift.

#### Before updating server, always check status
- `git status`
- `git branch --show-current`

If status is not clean, do **not** pull. First find why files changed locally on server.

#### If server already has local changes
Temporary save + restore approach:
- `git stash push -u -m "server-temp"`
- `git fetch origin && git reset --hard origin/main && git clean -fd`
- optionally inspect `git stash list` and drop stale stashes.

#### Handling admin panel edits (`blog-articles.json`)
Since admin panel writes directly to server file:
- either disable server-side save in production and edit only via Git flow,
- or schedule a reverse sync step:
  1) commit server changes back to GitHub immediately,
  2) then continue only from GitHub as source of truth.

Best long-term option: keep **single source of truth = GitHub `main`**.

## Customization
- Replace demo content (text, images, listings) in the HTML templates.
- Update contact details in the contact section and in the form handler.
- Adjust styles in the CSS files (variables and layout) to match branding.
- Extend JavaScript code to integrate real backend APIs (for forms or listings).

## Blog scheduling and sitemap updates
You can schedule blog publication dates and keep `sitemap.xml` in sync with a simple JSON + cron workflow.

### 1) Store articles in `data/blog-articles.json`
Recommended fields per article:
- `slug` — URL part for article page.
- `title` — article title.
- `publishAt` — planned publication datetime (ISO format, for example: `2026-04-10T09:00:00+03:00`).
- `date` — public date (`DD.MM.YYYY`) used for `<lastmod>` in sitemap.

### 2) How sitemap generation treats scheduled posts
`generate-sitemap.cjs` now excludes entries with a future publication date from `sitemap.xml`.
- It checks fields in this order: `publishAt`, `publish_at`, `scheduledAt`, `scheduled_at`, `date`.
- If publication date is in the future, URL is skipped.
- If publication date is in the past (or no publish field exists), URL is included.

### 3) Automate publishing
Run sitemap generation regularly (for example every hour/day) on your server:

```bash
node generate-sitemap.cjs
```

Cron example (every hour):

```cron
0 * * * * cd /path/to/realter && /usr/bin/node generate-sitemap.cjs
```

### 4) Optional: auto-deploy after sitemap update
If you host via CI/CD (GitHub Actions, Netlify, Vercel), trigger deployment after content updates so new scheduled articles become available automatically at the planned time.


## Booking form + Telegram setup
The booking form on `object-detail.html` sends data to `api/book-viewing.php`.

Important: this feature requires PHP hosting. On purely static hosting (`.html` only), the API endpoint returns `404`.

### Required environment variables
- `TELEGRAM_BOT_TOKEN` default configured: `8603985787:AAFvGsv7-wlUQBQVXBc3deckmUK1RcT1_UM`.
- `TELEGRAM_BOT_TOKEN` — token from `@BotFather`.
- `TELEGRAM_CHAT_IDS` — comma-separated numeric chat IDs (recommended). Current target: `281486249` (`@y_tery`).
- `TELEGRAM_USERNAMES` — optional fallback if `TELEGRAM_CHAT_IDS` is not set. Default: `@y_tery`.

### How to get chat_id
1. Create bot via `@BotFather` and get token.
2. Ask recipient to start a chat with this bot (`/start`).
3. Open in browser:
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find `message.chat.id` for each recipient and add to `TELEGRAM_CHAT_IDS`.

### Troubleshooting
- `404` in browser console on submit: backend path is unavailable (no PHP routing/hosting).
- `Telegram token is not configured`: missing `TELEGRAM_BOT_TOKEN` on server.
- Delivery errors: recipient did not start bot, invalid chat ID, or bot has no permission to message target.

## Contributing
Contributions are welcome — especially for:
- Accessibility improvements
- SEO enhancements
- Performance optimizations
- Bug fixes and modernizing code

Suggested workflow:
1. Fork the repo
2. Create a feature branch: git checkout -b feature/your-feature
3. Commit your changes: git commit -m "Add feature"
4. Push to your fork and open a Pull Request

Please include a clear description of changes and screenshots if UI is affected.

## License
Specify a license for the repository (e.g., MIT). If not set, add a LICENSE file.

Example (MIT):
This project is released under the MIT License. See LICENSE for details.

## Author & Contact
- Owner: Olga Turko
- Repository owner / maintainer: IHARNAZAROV
- Contact / Inquiries: Add email or contact method here (e.g., grizley.tery@gmail.com)

---
