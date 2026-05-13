!function () {
  'use strict';

  const TEAM_DATA_URL = '/data/team.json';

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function buildSocialLinks(socials) {
    if (!socials || typeof socials !== 'object') return '';
    const map = {
      instagram: { icon: 'fa-brands fa-instagram', label: 'Instagram' },
      telegram:  { icon: 'fa-brands fa-telegram',  label: 'Telegram'  },
      viber:     { icon: 'fa-brands fa-viber',      label: 'Viber'     },
      vk:        { icon: 'fa-brands fa-vk',         label: 'ВКонтакте' },
      whatsapp:  { icon: 'fa-brands fa-whatsapp',   label: 'WhatsApp'  },
    };

    return Object.entries(socials)
      .filter(([, href]) => href && href !== '#')
      .map(([key, href]) => {
        const meta = map[key] || { icon: 'fa-solid fa-link', label: key };
        return `<a href="${href}" class="team-card__social-link" target="_blank" rel="noopener noreferrer" aria-label="${meta.label}"><i class="${meta.icon}" aria-hidden="true"></i></a>`;
      })
      .join('');
  }

  function buildPhotoContent(member) {
    const photoSrc = member.photo || '';
    const initials  = getInitials(member.name);
    return `
      <img
        src="${photoSrc}"
        alt="Фото ${member.name}"
        loading="lazy"
        decoding="async"
        onerror="this.parentElement.classList.add('team-card__photo--no-image'); this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div class="team-card__avatar-placeholder" style="display:none;" aria-hidden="true">${initials}</div>
    `;
  }

  function buildSlide(member) {
    const socials   = buildSocialLinks(member.socials);
    const photo     = buildPhotoContent(member);
    const detailUrl = `/team-detail.html?id=${encodeURIComponent(member.id)}`;

    return `
      <div class="swiper-slide" role="group" aria-label="${member.name}">
        <article class="team-card" itemscope itemtype="https://schema.org/Person">
          <div class="team-card__photo">${photo}</div>
          <div class="team-card__info">
            ${socials ? `<div class="team-card__socials">${socials}</div>` : ''}
            <p class="team-card__name" itemprop="name">${member.name}</p>
            <p class="team-card__position" itemprop="jobTitle">${member.position}</p>
            <a href="${detailUrl}" class="team-card__detail-link" aria-label="Подробнее о ${member.name}">Подробнее →</a>
          </div>
        </article>
      </div>
    `;
  }

  function initSwiper() {
    if (typeof Swiper === 'undefined') return;

    const el = document.querySelector('.team-swiper');
    if (!el) return;

    new Swiper('.team-swiper', {
      slidesPerView:  'auto',
      centeredSlides: true,
      spaceBetween:   24,
      loop:           true,
      grabCursor:     true,
      speed:          500,
      keyboard:       { enabled: true },
      a11y:           { enabled: true },
      autoplay: {
        delay:              4000,
        disableOnInteraction: false,
        pauseOnMouseEnter:  true,
      },
      pagination: {
        el:        '.team-swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl:        '.team-swiper-next',
        prevEl:        '.team-swiper-prev',
        disabledClass: 'swiper-button-disabled',
      },
      breakpoints: {
        0:   { spaceBetween: 16 },
        768: { spaceBetween: 24 },
      },
    });
  }

  async function loadAndRender() {
    const wrap = document.querySelector('.team-swiper');
    if (!wrap) return;

    const swWrap = wrap.querySelector('.swiper-wrapper');
    if (!swWrap) return;

    try {
      const res = await fetch(TEAM_DATA_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const members = await res.json();

      if (!Array.isArray(members) || members.length === 0) throw new Error('empty');

      swWrap.innerHTML = members.map(buildSlide).join('');

      initSwiper();

      // Event delegation on the fixed container — works with Swiper loop clones.
      // mouseover/mouseout bubble unlike mouseenter/mouseleave.
      wrap.addEventListener('mouseover', function (e) {
        var card = e.target.closest && e.target.closest('.team-card');
        if (card) card.classList.add('is-hovered');
      });
      wrap.addEventListener('mouseout', function (e) {
        var card = e.target.closest && e.target.closest('.team-card');
        if (!card) return;
        // Only clear when the cursor truly leaves the card (not moving between children)
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('is-hovered');
        }
      });
    } catch (err) {
      const section = wrap.closest('.team-swiper-wrap') || wrap.parentElement;
      section.innerHTML = `<p class="team-swiper-error">Не удалось загрузить данные команды.</p>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndRender);
  } else {
    loadAndRender();
  }
}();
