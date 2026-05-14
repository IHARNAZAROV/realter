"use strict";

/* =========================================================
   TEAM DETAIL PAGE — turko.by
   Reads ?slug= from URL, loads team.json, renders page.
========================================================= */

(function () {

  /* =========================================================
     INIT
  ========================================================= */
  function init() {
    const params = new URLSearchParams(window.location.search);
    const slug   = params.get('slug') || '';

    if (!slug) {
      renderNotFound();
      return;
    }

    fetch('/data/team.json')
      .then(r => r.json())
      .then(data => {
        const member = data.find(m => m.slug === slug);
        if (!member) {
          renderNotFound();
        } else {
          renderMember(member);
        }
      })
      .catch(() => renderNotFound());
  }

  /* =========================================================
     RENDER MEMBER
  ========================================================= */
  function renderMember(m) {
    const root = document.getElementById('teamDetailRoot');
    if (!root) return;

    /* SEO */
    document.title = `${m.name} — ${m.position} | turko.by`;
    setMeta('description', `${m.name}: ${m.shortDescription}. Опыт: ${m.experience} лет, сделок: ${m.deals}. Г. ${m.city}.`);
    setMeta('og:title',       `${m.name} — ${m.position}`);
    setMeta('og:description', m.shortDescription);
    setMeta('og:image',       m.image);
    setCanonical(`/team-detail.html?slug=${m.slug}`);

    /* Schema.org Person */
    const schema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": m.name,
      "jobTitle": m.position,
      "description": m.description,
      "telephone": m.phone,
      "email": m.email,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": m.city,
        "addressCountry": "BY"
      },
      "image": `https://turko.by${m.image}`,
      "url": `https://turko.by/team-detail.html?slug=${m.slug}`,
      "worksFor": {
        "@type": "RealEstateAgent",
        "name": "Ольга Турко, риэлтер",
        "url": "https://turko.by"
      }
    };
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(schema);
    document.head.appendChild(schemaScript);

    /* Breadcrumbs */
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Главная",  "item": "https://turko.by" },
        { "@type": "ListItem", "position": 2, "name": "Команда", "item": "https://turko.by/#teamSection" },
        { "@type": "ListItem", "position": 3, "name": m.name }
      ]
    };
    const bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(bcScript);

    /* Social links */
    const socialsHTML = buildSocials(m.socials);

    /* Skills */
    const skillsHTML = (m.skills || [])
      .map(s => `<span class="team-skill-tag">${escHtml(s)}</span>`)
      .join('');

    root.innerHTML = `
      <!-- Breadcrumbs -->
      <div class="container">
        <nav class="team-breadcrumbs" aria-label="Навигация по сайту">
          <a href="/">Главная</a>
          <i class="fa fa-chevron-right" aria-hidden="true"></i>
          <a href="/#teamSection">Команда</a>
          <i class="fa fa-chevron-right" aria-hidden="true"></i>
          <span>${escHtml(m.name)}</span>
        </nav>
      </div>

      <!-- HERO -->
      <section class="team-detail-hero">
        <div class="container">
          <div class="team-detail-hero__inner">

            <div class="team-detail-hero__photo">
              <img
                src="${m.image}"
                alt="${escHtml(m.name)}"
                loading="eager"
                decoding="async"
                onerror="this.style.display='none';document.getElementById('tdFallback').style.display='flex'"
              />
              <div id="tdFallback" class="team-avatar-fallback" style="display:none;height:100%">${initials(m.name)}</div>
            </div>

            <div class="team-detail-hero__content">
              <span class="team-detail-hero__eyebrow">${escHtml(m.position)}</span>
              <h1 class="team-detail-hero__name">${escHtml(m.name)}</h1>
              <p class="team-detail-hero__position">${escHtml(m.specialization)}</p>

              <div class="team-detail-kpi">
                <div class="team-detail-kpi__item">
                  <span class="team-detail-kpi__value">${m.experience}</span>
                  <span class="team-detail-kpi__label">Лет опыта</span>
                </div>
                <div class="team-detail-kpi__item">
                  <span class="team-detail-kpi__value">${m.deals}</span>
                  <span class="team-detail-kpi__label">Сделок</span>
                </div>
                <div class="team-detail-kpi__item">
                  <span class="team-detail-kpi__value"><i class="fa fa-map-marker-alt" aria-hidden="true"></i></span>
                  <span class="team-detail-kpi__label">${escHtml(m.city)}</span>
                </div>
              </div>

              <div class="team-detail-cta">
                <a href="tel:${m.phone}" class="site-button text-uppercase">
                  <i class="fa fa-phone" aria-hidden="true"></i>&nbsp; Позвонить
                </a>
                ${m.socials.telegram
                  ? `<a href="${escHtml(m.socials.telegram)}" target="_blank" rel="noopener" class="site-button site-button-secondry text-uppercase">
                      <i class="fab fa-telegram" aria-hidden="true"></i>&nbsp; Telegram
                    </a>`
                  : ''}
              </div>

              <div class="team-detail-contacts">
                <a href="tel:${m.phone}">
                  <i class="fa fa-phone" aria-hidden="true"></i>
                  ${escHtml(m.phone)}
                </a>
                <a href="mailto:${m.email}">
                  <i class="fa fa-envelope" aria-hidden="true"></i>
                  ${escHtml(m.email)}
                </a>
              </div>

              ${socialsHTML ? `<div class="team-socials">${socialsHTML}</div>` : ''}
            </div>
          </div>
        </div>
      </section>

      <!-- ABOUT -->
      <section class="team-detail-about">
        <div class="container">
          <header class="section-head section-head--bracket m-b30">
            <h2 class="section-title">О специалисте</h2>
          </header>
          <p class="team-detail-about__text">${escHtml(m.description)}</p>

          ${skillsHTML ? `
            <h3 style="font-size:1.125rem;font-weight:700;margin:36px 0 16px;color:var(--color-secondary)">Специализации</h3>
            <div class="team-skills">${skillsHTML}</div>
          ` : ''}
        </div>
      </section>

      <!-- CONTACTS SECTION -->
      <section class="section-full mobile-page-padding p-t60 p-b60 bg-white">
        <div class="container">
          <header class="section-head section-head--bracket m-b30">
            <h2 class="section-title">Связаться</h2>
          </header>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <a href="tel:${m.phone}" class="site-button text-uppercase">
              Позвонить
            </a>
            <a href="/" class="site-button-link">
              На главную <i class="fa fa-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </section>
    `;

    /* Entrance animations */
    animateEntrance(root);
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */
  function renderNotFound() {
    const root = document.getElementById('teamDetailRoot');
    if (!root) return;

    document.title = 'Специалист не найден | turko.by';

    root.innerHTML = `
      <div class="container">
        <div class="team-not-found">
          <div style="font-size:4rem;margin-bottom:16px">🔍</div>
          <h2>Специалист не найден</h2>
          <p>Запрошенная страница не существует или была удалена.</p>
          <a href="/" class="site-button text-uppercase">На главную</a>
        </div>
      </div>
    `;
  }

  /* =========================================================
     HELPERS
  ========================================================= */
  function buildSocials(socials) {
    if (!socials) return '';
    const links = [];
    if (socials.telegram)  links.push(`<a href="${escHtml(socials.telegram)}" target="_blank" rel="noopener" class="team-social-link" aria-label="Telegram"><i class="fab fa-telegram" aria-hidden="true"></i></a>`);
    if (socials.instagram) links.push(`<a href="${escHtml(socials.instagram)}" target="_blank" rel="noopener" class="team-social-link" aria-label="Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a>`);
    if (socials.linkedin)  links.push(`<a href="${escHtml(socials.linkedin)}" target="_blank" rel="noopener" class="team-social-link" aria-label="LinkedIn"><i class="fab fa-linkedin-in" aria-hidden="true"></i></a>`);
    return links.join('');
  }

  function animateEntrance(root) {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    root.querySelectorAll('.team-detail-kpi__item, .team-skill-tag').forEach((el, i) => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(16px)';
      el.style.transition = `opacity 0.4s ease ${i * 60}ms, transform 0.4s ease ${i * 60}ms`;
      io.observe(el);
    });
  }

  function setMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"],meta[property="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      const prop = name.startsWith('og:') ? 'property' : 'name';
      el.setAttribute(prop, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setCanonical(path) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `https://turko.by${path}`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  /* =========================================================
     BOOT
  ========================================================= */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
