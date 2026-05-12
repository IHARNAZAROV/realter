!function () {
  'use strict';

  const TEAM_DATA_URL = '/data/team.json';

  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key) || '';
  }

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function buildSocialBtn(key, href) {
    const map = {
      instagram: { icon: 'fa-brands fa-instagram', label: 'Instagram' },
      telegram:  { icon: 'fa-brands fa-telegram',  label: 'Telegram'  },
      viber:     { icon: 'fa-brands fa-viber',      label: 'Viber'     },
      vk:        { icon: 'fa-brands fa-vk',         label: 'ВКонтакте' },
      whatsapp:  { icon: 'fa-brands fa-whatsapp',   label: 'WhatsApp'  },
    };
    const meta = map[key] || { icon: 'fa-solid fa-link', label: key };
    return `<a href="${href}" class="team-detail-social-btn" target="_blank" rel="noopener noreferrer" aria-label="${meta.label}"><i class="${meta.icon}" aria-hidden="true"></i>${meta.label}</a>`;
  }

  function render(member) {
    document.title = `${member.name} — ${member.position} | turko.by`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', member.shortDescription || '');

    const bc = document.querySelector('.team-detail-breadcrumb ol');
    if (bc) {
      bc.innerHTML = `
        <li><a href="/">Главная</a><span class="sep" aria-hidden="true">›</span></li>
        <li class="current" aria-current="page">${member.name}</li>
      `;
    }

    const nameEl = document.getElementById('team-detail-name');
    if (nameEl) { nameEl.textContent = member.name; nameEl.setAttribute('itemprop', 'name'); }

    const posEl = document.getElementById('team-detail-position');
    if (posEl) { posEl.textContent = member.position; }

    const expEl = document.getElementById('team-detail-experience');
    if (expEl) expEl.textContent = member.experience || '';

    const descEl = document.getElementById('team-detail-description');
    if (descEl) descEl.textContent = member.shortDescription || '';

    const phoneEl = document.getElementById('team-detail-phone');
    if (phoneEl) {
      phoneEl.href = 'tel:' + member.phone.replace(/\s/g, '');
      phoneEl.querySelector('span')?.remove();
      phoneEl.insertAdjacentHTML('beforeend', `<span>${member.phone}</span>`);
    }

    const emailEl = document.getElementById('team-detail-email');
    if (emailEl) {
      emailEl.href = 'mailto:' + member.email;
      emailEl.querySelector('span')?.remove();
      emailEl.insertAdjacentHTML('beforeend', `<span>${member.email}</span>`);
    }

    const photoEl = document.getElementById('team-detail-photo');
    if (photoEl) {
      const img = photoEl.querySelector('img');
      const placeholder = photoEl.querySelector('.team-card__avatar-placeholder');
      if (img) {
        img.src = member.photo || '';
        img.alt = `Фото ${member.name}`;
        img.onerror = function() {
          this.style.display = 'none';
          if (placeholder) {
            placeholder.textContent = getInitials(member.name);
            placeholder.style.display = 'flex';
          }
        };
      }
    }

    const socialsEl = document.getElementById('team-detail-socials');
    if (socialsEl && member.socials) {
      socialsEl.innerHTML = Object.entries(member.socials)
        .filter(([, href]) => href && href !== '#')
        .map(([key, href]) => buildSocialBtn(key, href))
        .join('');
    }

    const ctaEl = document.getElementById('team-detail-cta');
    if (ctaEl && member.phone) {
      ctaEl.href = 'tel:' + member.phone.replace(/\s/g, '');
    }

    const schemaEl = document.getElementById('team-detail-schema');
    if (schemaEl) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": member.name,
        "jobTitle": member.position,
        "telephone": member.phone,
        "email": member.email,
        "image": member.photo,
        "description": member.shortDescription,
        "worksFor": {
          "@type": "Organization",
          "name": "Гермесгрупп",
          "url": "https://turko.by/"
        }
      };
      schemaEl.textContent = JSON.stringify(schema, null, 2);
    }
  }

  function showError(msg) {
    const wrap = document.getElementById('team-detail-wrap');
    if (wrap) wrap.innerHTML = `<div class="container"><p style="padding:48px;text-align:center;color:var(--color-text-light)">${msg}</p></div>`;
  }

  async function init() {
    const id = getParam('id');
    if (!id) { showError('Риэлтер не найден.'); return; }

    try {
      const res = await fetch(TEAM_DATA_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const members = await res.json();
      const member = members.find(m => m.id === id);
      if (!member) throw new Error('not found');
      render(member);
    } catch {
      showError('Не удалось загрузить информацию о специалисте.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}();
