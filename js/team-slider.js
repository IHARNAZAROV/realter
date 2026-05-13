(function () {
  'use strict';

  /* ——— helpers ——— */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getInitials(name) {
    return (name || '').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0] ? w[0].toUpperCase() : ''; }).join('');
  }

  var SOCIALS = {
    instagram: { icon: 'fa-brands fa-square-instagram', label: 'Instagram'  },
    telegram:  { icon: 'fa-brands fa-telegram',         label: 'Telegram'   },
    viber:     { icon: 'fa-brands fa-viber',             label: 'Viber'      },
    vk:        { icon: 'fa-brands fa-vk',                label: 'ВКонтакте'  },
    tiktok:    { icon: 'fa-brands fa-tiktok',            label: 'TikTok'     }
  };

  /* onerror: скрыть сломанное фото, показать инициалы */
  function onErrAttr(initials) {
    return 'onerror="' +
      'this.style.display=\'none\';' +
      'var p=this.parentNode;' +
      'var el=p&&p.querySelector(\'.team-featured-card__initials,.team-mini-card__initials\');' +
      'if(el)el.style.display=\'flex\';"';
  }

  /* ——— БОЛЬШАЯ КАРТОЧКА (featured) ——— */
  function buildFeatured(member) {
    var initials = getInitials(member.name);
    var detailUrl = '/team-detail.html?id=' + esc(member.id);

    /* Фото */
    var photoHtml = member.photo
      ? '<img loading="eager" src="' + esc(member.photo) + '"' +
        ' alt="' + esc(member.name) + '" width="540" height="720"' +
        ' onerror="this.style.display=\'none\';' +
        'var fb=this.parentNode.querySelector(\'.team-featured-card__initials\');' +
        'if(fb){fb.style.display=\'flex\'}">' +
        '<div class="team-featured-card__initials" style="display:none" aria-hidden="true">' + esc(initials) + '</div>'
      : '<div class="team-featured-card__initials" aria-hidden="true">' + esc(initials) + '</div>';

    /* Соцсети */
    var socialsHtml = '';
    if (member.socials) {
      Object.keys(SOCIALS).forEach(function (key) {
        var url = member.socials[key];
        if (!url || url === '#') return;
        var m = SOCIALS[key];
        socialsHtml +=
          '<a href="' + esc(url) + '" class="team-featured-card__social"' +
          ' target="_blank" rel="noopener noreferrer" aria-label="' + esc(m.label) + '">' +
          '<i class="' + m.icon + '" aria-hidden="true"></i></a>';
      });
    }

    return (
      '<a href="' + detailUrl + '" class="team-featured-card"' +
      ' style="text-decoration:none;display:flex;flex-direction:column;height:100%">' +
        '<div class="team-featured-card__img">' + photoHtml + '</div>' +
        '<div class="team-featured-card__body">' +
          '<div class="team-featured-card__info">' +
            '<p class="team-featured-card__name" itemprop="name">' + esc(member.name) + '</p>' +
            '<p class="team-featured-card__position" itemprop="jobTitle">' + esc(member.position) + '</p>' +
          '</div>' +
          (socialsHtml
            ? '<div class="team-featured-card__socials" onclick="event.preventDefault()">' + socialsHtml + '</div>'
            : '') +
        '</div>' +
      '</a>'
    );
  }

  /* ——— МИНИ-КАРТОЧКА ——— */
  function buildMiniCard(member) {
    var initials = getInitials(member.name);
    var detailUrl = '/team-detail.html?id=' + esc(member.id);

    var photoHtml = member.photo
      ? '<img loading="lazy" src="' + esc(member.photo) + '"' +
        ' alt="' + esc(member.name) + '" width="280" height="280"' +
        ' onerror="this.style.display=\'none\';' +
        'var fb=this.parentNode.querySelector(\'.team-mini-card__initials\');' +
        'if(fb){fb.style.display=\'flex\'}">' +
        '<div class="team-mini-card__initials" style="display:none" aria-hidden="true">' + esc(initials) + '</div>'
      : '<div class="team-mini-card__initials" aria-hidden="true">' + esc(initials) + '</div>';

    return (
      '<a href="' + detailUrl + '" class="team-mini-card"' +
      ' aria-label="' + esc(member.name) + ', ' + esc(member.position) + '">' +
        '<div class="team-mini-card__img">' + photoHtml + '</div>' +
        '<div class="team-mini-card__overlay">' +
          '<p class="team-mini-card__name">' + esc(member.name) + '</p>' +
          '<p class="team-mini-card__position">' + esc(member.position) + '</p>' +
        '</div>' +
      '</a>'
    );
  }

  /* ——— СЛАЙД-ПАРА (2 мини-карточки в строку) ——— */
  function buildPairSlide(pair) {
    return (
      '<div class="swiper-slide">' +
        '<div class="team-mini-row">' +
          pair.map(buildMiniCard).join('') +
        '</div>' +
      '</div>'
    );
  }

  var vSwiperInstance = null;

  function destroySwiper() {
    if (vSwiperInstance) {
      try { vSwiperInstance.destroy(true, true); } catch (e) {}
      vSwiperInstance = null;
    }
  }

  function initVerticalSwiper(pairsCount) {
    if (typeof Swiper === 'undefined' || pairsCount < 1) return;
    var el = document.querySelector('.team-v-swiper');
    if (!el) return;
    destroySwiper();

    var shouldLoop = pairsCount > 2;

    vSwiperInstance = new Swiper('.team-v-swiper', {
      direction: 'vertical',
      slidesPerView: 2,
      spaceBetween: 20,
      loop: shouldLoop,
      speed: 700,
      autoplay: {
        delay: 3200,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Предыдущая строка',
        nextSlideMessage: 'Следующая строка'
      }
    });
  }

  function showError(container, msg) {
    if (container) {
      container.innerHTML =
        '<div style="color:#787878;font-size:.9rem;padding:20px 0">' +
        (msg || 'Не удалось загрузить данные команды.') + '</div>';
    }
  }

  function init() {
    var featuredEl = document.getElementById('team-featured');
    var vWrapper   = document.getElementById('team-v-wrapper');
    if (!featuredEl && !vWrapper) return;

    fetch('/data/team.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (team) {
        if (!Array.isArray(team) || !team.length) throw new Error('empty');

        /* Первый участник — большая карточка */
        if (featuredEl) {
          featuredEl.innerHTML = buildFeatured(team[0]);
        }

        /* Остальные — вертикальный слайдер парами */
        if (vWrapper) {
          var rest = team.slice(1);
          if (rest.length === 0) {
            /* Если только один участник — дублируем для заполнения */
            rest = [team[0]];
          }

          /* Разбиваем на пары */
          var pairs = [];
          for (var i = 0; i < rest.length; i += 2) {
            var pair = rest.slice(i, i + 2);
            /* Если последняя пара нечётная — дублируем первый элемент */
            if (pair.length === 1) pair.push(pair[0]);
            pairs.push(pair);
          }

          vWrapper.innerHTML = pairs.map(buildPairSlide).join('');
          initVerticalSwiper(pairs.length);
        }
      })
      .catch(function (err) {
        showError(featuredEl, 'Не удалось загрузить данные команды.');
        console.error('[team-slider]', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pagehide', destroySwiper);
}());
