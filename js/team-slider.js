(function () {
  'use strict';

  var WRAPPER_ID = 'team-swiper-wrapper';
  var swiperInstance = null;

  function getInitials(name) {
    return (name || '').split(' ').slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase();
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var SOCIAL_META = {
    instagram: { icon: 'fa-brands fa-square-instagram', label: 'Instagram' },
    telegram:  { icon: 'fa-brands fa-telegram',         label: 'Telegram'  },
    viber:     { icon: 'fa-brands fa-viber',             label: 'Viber'     },
    vk:        { icon: 'fa-brands fa-vk',                label: 'ВКонтакте' },
    tiktok:    { icon: 'fa-brands fa-tiktok',            label: 'TikTok'    }
  };

  function buildSocials(socials) {
    if (!socials) return '';
    return Object.keys(SOCIAL_META).reduce(function (acc, key) {
      var url = socials[key];
      if (!url || url === '#') return acc;
      var m = SOCIAL_META[key];
      return acc +
        '<a href="' + esc(url) + '" class="team-card__social-link"' +
        ' target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + esc(m.label) + '">' +
        '<i class="' + m.icon + '" aria-hidden="true"></i>' +
        '</a>';
    }, '');
  }

  function buildCard(member) {
    var initials = getInitials(member.name);

    var photoInner = member.photo
      ? '<img loading="lazy" src="' + esc(member.photo) + '"' +
        ' alt="' + esc(member.name) + ', ' + esc(member.position) + '"' +
        ' width="300" height="400"' +
        ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
        '<div class="team-card__photo-placeholder" style="display:none" aria-hidden="true">' + esc(initials) + '</div>'
      : '<div class="team-card__photo-placeholder" aria-hidden="true">' + esc(initials) + '</div>';

    var socialLinks = buildSocials(member.socials);
    var overlay = socialLinks
      ? '<div class="team-card__overlay"><div class="team-card__socials">' + socialLinks + '</div></div>'
      : '';

    var badge = member.experience
      ? '<span class="team-card__experience">' + esc(member.experience) + '</span>'
      : '';

    var telHref = member.phone
      ? 'tel:' + member.phone.replace(/[^+\d]/g, '')
      : '';

    var phoneHtml = member.phone
      ? '<a href="' + esc(telHref) + '" class="team-card__phone"' +
        ' aria-label="Позвонить ' + esc(member.name) + '">' +
        esc(member.phone) + '</a>'
      : '';

    var detailUrl = '/team-detail.html?id=' + esc(member.id);

    return '<div class="swiper-slide">' +
      '<article class="team-card"' +
      ' itemscope itemtype="https://schema.org/Person">' +
        '<div class="team-card__photo">' +
          badge +
          photoInner +
          overlay +
        '</div>' +
        '<div class="team-card__body">' +
          '<h3 class="team-card__name" itemprop="name">' + esc(member.name) + '</h3>' +
          '<p class="team-card__position" itemprop="jobTitle">' + esc(member.position) + '</p>' +
          '<p class="team-card__desc" itemprop="description">' + esc(member.shortDescription) + '</p>' +
          '<div class="team-card__footer">' +
            phoneHtml +
            '<a href="' + detailUrl + '" class="site-button-link"' +
            ' aria-label="Подробнее о ' + esc(member.name) + '">Подробнее</a>' +
          '</div>' +
        '</div>' +
      '</article>' +
    '</div>';
  }

  function destroySwiper() {
    if (swiperInstance) {
      swiperInstance.destroy(true, true);
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
      spaceBetween: 24,
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
        576: { slidesPerView: 2, spaceBetween: 20 },
        992: { slidesPerView: 3, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 24 }
      }
    });
  }

  function showError(wrap) {
    if (wrap) {
      wrap.innerHTML =
        '<div class="team-swiper-error">' +
        '<p>Не удалось загрузить данные команды. Попробуйте обновить страницу.</p>' +
        '</div>';
    }
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
