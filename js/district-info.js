(function () {
  'use strict';

  function getSlug() {
    var m = location.search.match(/[?&]slug=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
    m = location.pathname.match(/\/objects?\/([^/?#]+)/);
    if (m) return decodeURIComponent(m[1]);
    return null;
  }

  function normalizeStreet(str) {
    return str
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^а-яa-z0-9]/g, ' ')
      .trim();
  }

  function addressMatchesDistrict(address, streets) {
    var norm = normalizeStreet(address);
    for (var i = 0; i < streets.length; i++) {
      var s = normalizeStreet(streets[i]);
      if (norm.indexOf(s) !== -1) return true;
    }
    return false;
  }

  function formatStat(key, stats) {
    switch (key) {
      case 'toCenter': return { value: stats.toCenter, label: 'До центра' };
      case 'schools':  return { value: stats.schools,  label: 'Школ' };
      case 'clinics':  return { value: stats.clinics,  label: 'Поликлиник' };
      case 'shops':    return { value: stats.shops,    label: 'Магазинов' };
      default: return null;
    }
  }

  function renderDistrictBlock(container, district) {
    var stats = district.stats;
    var statKeys = ['toCenter', 'schools', 'clinics', 'shops'];

    var statsHtml = statKeys.map(function (k) {
      var s = formatStat(k, stats);
      if (!s) return '';
      return '<div class="district-stat">' +
        '<span class="district-stat__value">' + s.value + '</span>' +
        '<span class="district-stat__label">' + s.label + '</span>' +
        '</div>';
    }).join('');

    var paragraphs = (district.seoText || []).slice(0, 2).map(function (p) {
      return '<p>' + p + '</p>';
    }).join('');

    container.innerHTML =
      '<section class="district-info" aria-label="Информация о районе">' +
        '<div class="district-info__header">' +
          '<span class="district-info__label">Район</span>' +
          '<h2 class="district-info__title">' + district.nameFull + ', ' + district.city + '</h2>' +
        '</div>' +
        '<div class="district-info__stats">' + statsHtml + '</div>' +
        '<div class="district-info__text">' + paragraphs + '</div>' +
        '<a class="district-info__link" href="/raion/' + district.slug + '">' +
          'Все объекты в этом районе <i class="fa fa-arrow-right"></i>' +
        '</a>' +
      '</section>';
  }

  function init() {
    var slug = getSlug();
    if (!slug) return;

    var container = document.querySelector('[data-district-info]');
    if (!container) return;

    Promise.all([
      fetch('/data/objects/' + encodeURIComponent(slug) + '.json').then(function (r) { return r.ok ? r.json() : null; }),
      fetch('/data/districts.json').then(function (r) { return r.ok ? r.json() : []; })
    ]).then(function (results) {
      var obj = results[0];
      var districts = results[1];
      if (!obj || !obj.address || !Array.isArray(districts)) return;

      for (var i = 0; i < districts.length; i++) {
        var d = districts[i];
        if (addressMatchesDistrict(obj.address, d.streets || [])) {
          renderDistrictBlock(container, d);
          container.removeAttribute('hidden');
          return;
        }
      }
    }).catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
