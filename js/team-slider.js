(function () {
  'use strict';

  /* ── helpers ──────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0] ? w[0].toUpperCase() : ''; }).join('');
  }

  var SOCIALS = {
    instagram: { cls: 'fa-brands fa-instagram', label: 'Instagram' },
    telegram:  { cls: 'fa-brands fa-telegram',  label: 'Telegram'  },
    viber:     { cls: 'fa-brands fa-viber',      label: 'Viber'     },
    vk:        { cls: 'fa-brands fa-vk',         label: 'ВКонтакте' },
    tiktok:    { cls: 'fa-brands fa-tiktok',     label: 'TikTok'    }
  };

  /* Initials span (position:absolute inside the img wrapper) */
  function mkInitials(name) {
    return '<span class="ts-initials" aria-hidden="true">' + esc(initials(name)) + '</span>';
  }

  /* Photo + fallback initials */
  function mkPhoto(member) {
    if (!member.photo) return mkInitials(member.name);
    return (
      '<img loading="lazy" src="' + esc(member.photo) + '"' +
      ' alt="' + esc(member.name) + '"' +
      ' onerror="this.style.display=\'none\';' +
      'var s=this.parentNode&&this.parentNode.querySelector(\'.ts-initials\');' +
      'if(s){s.style.display=\'flex\'}">' +
      '<span class="ts-initials" style="display:none" aria-hidden="true">' +
        esc(initials(member.name)) +
      '</span>'
    );
  }

  /* ── Featured (left) card ──────────────────────────────── */
  function buildFeatured(member) {
    var href = '/team-detail.html?id=' + esc(member.id);

    var socHtml = '';
    if (member.socials) {
      Object.keys(SOCIALS).forEach(function (k) {
        var url = member.socials[k];
        if (!url || url === '#') return;
        var s = SOCIALS[k];
        socHtml +=
          '<a href="' + esc(url) + '" class="ts-featured__social"' +
          ' target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label) + '"' +
          ' onclick="event.stopPropagation()">' +
          '<i class="' + s.cls + '" aria-hidden="true"></i></a>';
      });
    }

    return (
      '<a href="' + href + '" class="ts-featured" aria-label="' + esc(member.name) + '">' +
        '<div class="ts-featured__img">' + mkPhoto(member) + '</div>' +
        '<div class="ts-featured__body">' +
          '<div class="ts-featured__info">' +
            '<strong class="ts-featured__name">' + esc(member.name) + '</strong>' +
            '<span class="ts-featured__pos">' + esc(member.position) + '</span>' +
          '</div>' +
          (socHtml ? '<div class="ts-featured__socials">' + socHtml + '</div>' : '') +
        '</div>' +
      '</a>'
    );
  }

  /* ── Mini card (right grid) ────────────────────────────── */
  function buildMini(member) {
    var href = '/team-detail.html?id=' + esc(member.id);
    return (
      '<a href="' + href + '" class="ts-mini"' +
      ' aria-label="' + esc(member.name) + ', ' + esc(member.position) + '">' +
        '<div class="ts-mini__img">' + mkPhoto(member) + '</div>' +
        '<div class="ts-mini__overlay">' +
          '<span class="ts-mini__name">' + esc(member.name) + '</span>' +
          '<span class="ts-mini__pos">' + esc(member.position) + '</span>' +
        '</div>' +
      '</a>'
    );
  }

  /* ── Row of 2 mini cards ────────────────────────────────── */
  function buildPair(pair) {
    return (
      '<div class="ts-pair">' +
        pair.map(buildMini).join('') +
      '</div>'
    );
  }

  /* ── Main ───────────────────────────────────────────────── */
  function show(el)  { if (el) el.style.display = ''; }
  function hide(el)  { if (el) el.style.display = 'none'; }

  function init() {
    var skelLeft   = document.getElementById('ts-skel-left');
    var skelRight  = document.getElementById('ts-skel-right');
    var featuredEl = document.getElementById('team-featured');
    var trackEl    = document.getElementById('team-track');

    if (!featuredEl && !trackEl) return;

    fetch('/data/team.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (team) {
        if (!Array.isArray(team) || !team.length) throw new Error('empty');

        /* Featured member: isManager:true or first */
        var manager = null;
        for (var i = 0; i < team.length; i++) {
          if (team[i].isManager) { manager = team[i]; break; }
        }
        if (!manager) manager = team[0];

        /* ─ Left: featured card ─ */
        if (featuredEl) {
          featuredEl.innerHTML = buildFeatured(manager);
          hide(skelLeft);
          show(featuredEl);
        }

        /* ─ Right: infinite vertical scroll ─ */
        if (trackEl) {
          var rest = team.filter(function (m) { return m !== manager; });
          if (!rest.length) rest = [manager]; /* Only 1 person edge case */

          /* Make pairs */
          var pairs = [];
          for (var j = 0; j < rest.length; j += 2) {
            var pair = rest.slice(j, j + 2);
            if (pair.length === 1) pair.push(rest[0]); /* pad odd */
            pairs.push(pair);
          }

          /* Need ≥ 2 pairs for seamless loop animation (-50%).
             If only 1 pair, duplicate it. */
          if (pairs.length < 2) pairs = pairs.concat(pairs);

          /* Duplicate the full list for seamless loop */
          var html = pairs.map(buildPair).join('') +
                     pairs.map(buildPair).join('');

          trackEl.innerHTML = html;
          hide(skelRight);
          show(trackEl);
        }
      })
      .catch(function (err) {
        console.error('[team-slider]', err);
        hide(skelLeft);
        hide(skelRight);
        if (featuredEl) {
          show(featuredEl);
          featuredEl.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;' +
            'height:300px;border-radius:18px;background:#f5f5f5;color:#999">' +
            'Нет данных о команде</div>';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
