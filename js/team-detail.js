(function () {
  'use strict';

  var SOCIAL_META = {
    instagram: { icon: 'fa-brands fa-square-instagram', label: 'Instagram', cls: 'td-social--instagram' },
    telegram:  { icon: 'fa-brands fa-telegram',         label: 'Telegram',  cls: 'td-social--telegram'  },
    viber:     { icon: 'fa-brands fa-viber',             label: 'Viber',     cls: 'td-social--viber'     },
    vk:        { icon: 'fa-brands fa-vk',                label: 'ВКонтакте', cls: 'td-social--vk'        },
    tiktok:    { icon: 'fa-brands fa-tiktok',            label: 'TikTok',    cls: 'td-social--tiktok'    }
  };

  function getParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function getInitials(name) {
    return (name || '').split(' ').slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase();
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || '';
  }

  function setMeta(name, value) {
    var el = document.querySelector('meta[name="' + name + '"]') ||
             document.querySelector('meta[property="' + name + '"]');
    if (el) el.setAttribute('content', value || '');
  }

  function renderMember(member) {
    var fullTitle = member.name + ' — ' + member.position + ' | ГермесГрупп, Лида';
    var metaDesc = member.name + ': ' + (member.shortDescription || '') +
      (member.experience ? ' ' + member.experience + '.' : '') +
      ' Агентство недвижимости ГермесГрупп, г. Лида.';

    document.title = fullTitle;
    setMeta('description', metaDesc);
    setMeta('og:title', fullTitle);
    setMeta('og:description', metaDesc);
    if (member.photo) {
      setMeta('og:image', 'https://turko.by/' + member.photo);
    }

    /* Breadcrumb */
    setText('td-breadcrumb-name', member.name);

    /* Фото */
    var photoEl = document.getElementById('td-photo');
    if (photoEl) {
      var initials = getInitials(member.name);
      if (member.photo) {
        photoEl.innerHTML =
          '<img src="' + member.photo + '"' +
          ' alt="' + member.name + ', ' + member.position + '"' +
          ' width="480" height="640"' +
          ' onerror="this.style.display=\'none\';' +
          'var fb=document.getElementById(\'td-photo-fallback\');if(fb)fb.style.display=\'flex\'">' +
          '<div id="td-photo-fallback" class="td-photo-placeholder"' +
          ' style="display:none" aria-hidden="true">' + initials + '</div>';
      } else {
        photoEl.innerHTML =
          '<div class="td-photo-placeholder" aria-hidden="true">' + initials + '</div>';
      }
    }

    /* Имя, должность — banner (h1) и content section (h2) */
    setText('td-name', member.name);
    setText('td-position', member.position);
    setText('td-name-h2', member.name);
    setText('td-position-p', member.position);

    /* Опыт */
    var expEl = document.getElementById('td-experience');
    var expWrap = document.getElementById('td-experience-wrap');
    if (member.experience) {
      if (expEl) expEl.textContent = member.experience;
      if (expWrap) expWrap.style.display = '';
    } else {
      if (expWrap) expWrap.style.display = 'none';
    }

    /* Описание */
    setText('td-desc', member.shortDescription);

    /* Телефон */
    var phoneEl = document.getElementById('td-phone');
    var phoneItem = document.getElementById('td-phone-item');
    if (member.phone) {
      if (phoneEl) {
        phoneEl.href = 'tel:' + member.phone.replace(/[^+\d]/g, '');
        phoneEl.textContent = member.phone;
      }
      if (phoneItem) phoneItem.style.display = '';
    } else {
      if (phoneItem) phoneItem.style.display = 'none';
    }

    /* Email */
    var emailEl = document.getElementById('td-email');
    var emailItem = document.getElementById('td-email-item');
    if (member.email) {
      if (emailEl) {
        emailEl.href = 'mailto:' + member.email;
        emailEl.textContent = member.email;
      }
      if (emailItem) emailItem.style.display = '';
    } else {
      if (emailItem) emailItem.style.display = 'none';
    }

    /* Кнопка CTA: ссылка на звонок */
    var ctaBtn = document.getElementById('td-cta-btn');
    if (ctaBtn && member.phone) {
      ctaBtn.href = 'tel:' + member.phone.replace(/[^+\d]/g, '');
    }

    /* Соцсети */
    var socialsEl = document.getElementById('td-socials');
    if (socialsEl && member.socials) {
      var html = Object.keys(SOCIAL_META).reduce(function (acc, key) {
        var url = member.socials[key];
        if (!url || url === '#') return acc;
        var m = SOCIAL_META[key];
        return acc +
          '<a href="' + url + '" class="td-social-btn ' + m.cls + '"' +
          ' target="_blank" rel="noopener noreferrer"' +
          ' aria-label="' + m.label + '">' +
          '<i class="' + m.icon + '" aria-hidden="true"></i> ' + m.label +
          '</a>';
      }, '');
      socialsEl.innerHTML = html || '<span style="color:var(--color-text-light);font-size:.85rem">Соцсети не указаны</span>';
    }

    /* JSON-LD Person schema */
    var ldScript = document.getElementById('td-json-ld');
    if (ldScript) {
      var sameAs = member.socials
        ? Object.values(member.socials).filter(function (v) { return v && v !== '#' && /^https?:/.test(v); })
        : [];
      var ld = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': member.name,
        'jobTitle': member.position,
        'telephone': member.phone || '',
        'email': member.email || '',
        'description': member.shortDescription || '',
        'image': member.photo ? 'https://turko.by/' + member.photo : '',
        'worksFor': {
          '@type': 'Organization',
          'name': 'ГермесГрупп',
          'url': 'https://germesgroup.by'
        }
      };
      if (sameAs.length) ld.sameAs = sameAs;
      ldScript.textContent = JSON.stringify(ld, null, 2);
    }

    /* Показываем контент, скрываем лоадер */
    var loader  = document.getElementById('td-loading');
    var content = document.getElementById('td-content');
    if (loader)  loader.style.display  = 'none';
    if (content) content.style.display = '';
  }

  function showError(msg) {
    var loader  = document.getElementById('td-loading');
    var errorEl = document.getElementById('td-error');
    if (loader)  loader.style.display  = 'none';
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = '';
    }
  }

  function init() {
    var id = getParam('id');
    if (!id) {
      showError('Сотрудник не найден. Проверьте ссылку.');
      return;
    }

    fetch('/data/team.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (team) {
        var member = team.find(function (m) { return m.id === id; });
        if (!member) throw new Error('not_found');
        renderMember(member);
      })
      .catch(function (err) {
        showError(
          err.message === 'not_found'
            ? 'Сотрудник с данным ID не найден. Возможно, ссылка устарела.'
            : 'Не удалось загрузить данные. Попробуйте позже.'
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
