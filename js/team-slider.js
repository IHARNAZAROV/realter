(function () {
  'use strict';

  var WRAPPER_ID = 'team-swiper-wrapper';
  var swiperInstance = null;

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getInitials(name) {
    return (name || '').trim().split(/\s+/).slice(0, 2).map(function (w) {
      return w[0] ? w[0].toUpperCase() : '';
    }).join('');
  }

  var SOCIAL_META = {
    instagram: { icon: 'fa-brands fa-square-instagram', label: 'Instagram'  },
    telegram:  { icon: 'fa-brands fa-telegram',         label: 'Telegram'   },
    viber:     { icon: 'fa-brands fa-viber',             label: 'Viber'      },
    vk:        { icon: 'fa-brands fa-vk',                label: 'ВКонтакте'  },
    tiktok:    { icon: 'fa-brands fa-tiktok',            label: 'TikTok'     }
  };

  /* Строит ряд иконок соцсетей для тела карточки */
  function buildSocials(socials) {
    if (!socials) return '';
    var links = Object.keys(SOCIAL_META).reduce(function (acc, key) {
      var url = socials[key];
      if (!url || url === '#') return acc;
      var m = SOCIAL_META[key];
      return acc +
        '<a href="' + esc(url) + '"' +
        ' class="team-card__social-link"' +
        ' target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + esc(m.label) + '">' +
        '<i class="' + m.icon + '" aria-hidden="true"></i>' +
        '</a>';
    }, '');
    return links ? '<div class="team-card__socials">' + links + '</div>' : '';
  }

  /* Строит одну карточку */
  function buildCard(member) {
    var initials = getInitials(member.name);
    var telHref  = member.phone ? 'tel:' + member.phone.replace(/[^+\d]/g, '') : '';

    /* Фото: img с fallback на инициалы */
    var photoHtml;
    if (member.photo) {
      photoHtml =
        '<img loading="lazy"' +
        ' src="' + esc(member.photo) + '"' +
        ' alt="' + esc(member.name) + ', ' + esc(member.position) + '"' +
        ' width="300" height="300"' +
        ' onerror="this.style.display=\'none\'">' +
        '<div class="team-card__initials" aria-hidden="true">' + esc(initials) + '</div>';
    } else {
      photoHtml = '<div class="team-card__initials" aria-hidden="true">' + esc(initials) + '</div>';
    }

    var badge = member.experience
      ? '<span class="team-card__badge">' + esc(member.experience) + '</span>'
      : '';

    var phoneLine = member.phone
      ? '<a href="' + esc(telHref) + '" class="team-card__phone"' +
        ' aria-label="Позвонить ' + esc(member.name) + '">' + esc(member.phone) + '</a>'
      : '<span></span>';

    var detailUrl = '/team-detail.html?id=' + esc(member.id);

    return (
      '<div class="swiper-slide">' +
      '<article class="team-card" itemscope itemtype="https://schema.org/Person">' +

        /* Фото */
        '<div class="team-card__photo">' +
          photoHtml + badge +
        '</div>' +

        /* Тело */
        '<div class="team-card__body">' +
          '<h3 class="team-card__name" itemprop="name">' + esc(member.name) + '</h3>' +
          '<p class="team-card__position" itemprop="jobTitle">' + esc(member.position) + '</p>' +
          '<p class="team-card__desc" itemprop="description">' + esc(member.shortDescription) + '</p>' +

          buildSocials(member.socials) +

          '<div class="team-card__footer">' +
            phoneLine +
            '<a href="' + detailUrl + '" class="site-button-link"' +
            ' aria-label="Подробнее о ' + esc(member.name) + '">Подробнее</a>' +
          '</div>' +
        '</div>' +

      '</article>' +
      '</div>'
    );
  }

  function destroySwiper() {
    if (swiperInstance) {
      try { swiperInstance.destroy(true, true); } catch (e) {}
      swiperInstance = null;
    }
  }

  function initSwiper() {
    if (typeof Swiper === 'undefined') return;
    var el = document.querySelector('.team-swiper');
    if (!el) return;
    destroySwiper();
    swiperInstance = new Swiper('.team-swiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      grabCursor: true,
      keyboard: { enabled: true, onlyInViewport: true },
      autoplay: {
        delay: 4500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.team-swiper-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.team-swiper-next',
        prevEl: '.team-swiper-prev',
        disabledClass: 'swiper-button-disabled'
      },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Предыдущий слайд',
        nextSlideMessage: 'Следующий слайд'
      },
      breakpoints: {
        576:  { slidesPerView: 2, spaceBetween: 16 },
        992:  { slidesPerView: 3, spaceBetween: 20 },
        1200: { slidesPerView: 4, spaceBetween: 22 }
      }
    });
  }

  function showError(wrap) {
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="team-swiper-error">' +
      '<p>Не удалось загрузить данные команды. Попробуйте обновить страницу.</p>' +
      '</div>';
  }

  function init() {
    var wrapper = document.getElementById(WRAPPER_ID);
    if (!wrapper) return;
    var wrap = wrapper.closest('.team-swiper-wrap');

    fetch('/data/team.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (team) {
        if (!Array.isArray(team) || !team.length) throw new Error('empty');
        wrapper.innerHTML = team.map(buildCard).join('');
        initSwiper();
      })
      .catch(function () {
        showError(wrap);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pagehide', destroySwiper);
}());
