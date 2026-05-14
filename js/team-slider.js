"use strict";

/* =========================================================
   TEAM SLIDER — turko.by
   Fetches /data/team.json, renders leader card + grid slider.
   Uses translateX on the track (standard carousel approach).
========================================================= */

(function () {
  const AUTOPLAY_DELAY  = 4500;
  const TRANSITION_MS   = 420;
  const CARDS_PER_SLIDE = 4; // 2×2 grid

  /* ---- State ---- */
  let members      = [];
  let slides       = [];
  let currentSlide = 0;
  let isAnimating  = false;
  let autoplayTimer = null;

  /* ---- Touch / drag ---- */
  let dragStartX = 0;
  let isDragging = false;

  /* ---- DOM refs ---- */
  let track, dotsWrap, prevBtn, nextBtn;

  /* =========================================================
     INIT
  ========================================================= */
  function init() {
    if (!document.getElementById('teamSection')) return;

    fetch('/data/team.json')
      .then(r => r.json())
      .then(data => {
        members = data;
        renderLeader(members.find(m => m.isLeader));
        renderSlider(members.filter(m => !m.isLeader));
        observeEntrance();
        startAutoplay();
      })
      .catch(err => console.warn('[team-slider] fetch error', err));
  }

  /* =========================================================
     LEADER CARD
  ========================================================= */
  function renderLeader(leader) {
    const wrap = document.getElementById('teamLeaderCard');
    if (!wrap || !leader) return;

    wrap.innerHTML = `
      <div class="team-leader-img-wrap">
        <img
          src="${leader.image}"
          alt="${esc(leader.name)}"
          loading="lazy"
          decoding="async"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="team-avatar-fallback" style="display:none">${initials(leader.name)}</div>
        <span class="team-leader-badge">Руководитель</span>
      </div>
      <div class="team-leader-body">
        <p class="team-leader-position">${esc(leader.position)}</p>
        <h3>${esc(leader.name)}</h3>
        <p class="team-leader-desc">${esc(leader.shortDescription)}</p>
        <div class="team-leader-stats">
          <div class="team-leader-stat">
            <strong>${leader.experience}</strong>
            <span>лет опыта</span>
          </div>
          <div class="team-leader-stat">
            <strong>${leader.deals}</strong>
            <span>сделок</span>
          </div>
          <div class="team-leader-stat">
            <strong>Лида</strong>
            <span>город</span>
          </div>
        </div>
        <a href="/team-detail.html?slug=${leader.slug}" class="site-button text-uppercase">Подробнее</a>
      </div>
    `;
  }

  /* =========================================================
     SLIDER
  ========================================================= */
  function renderSlider(realtors) {
    track    = document.getElementById('teamTrack');
    dotsWrap = document.getElementById('teamDots');
    prevBtn  = document.getElementById('teamPrev');
    nextBtn  = document.getElementById('teamNext');
    if (!track) return;

    /* Build slide groups */
    slides = [];
    for (let i = 0; i < realtors.length; i += CARDS_PER_SLIDE) {
      slides.push(realtors.slice(i, i + CARDS_PER_SLIDE));
    }

    /* Render HTML */
    track.innerHTML = slides
      .map((group, si) => `
        <div class="team-slide" role="group" aria-label="Слайд ${si + 1} из ${slides.length}">
          ${group.map(cardHTML).join('')}
        </div>
      `)
      .join('');

    /* Dots */
    if (dotsWrap) {
      dotsWrap.innerHTML = slides
        .map((_, i) => `<button class="team-dot${i === 0 ? ' is-active' : ''}" data-slide="${i}" aria-label="Перейти к слайду ${i + 1}"></button>`)
        .join('');
      dotsWrap.addEventListener('click', e => {
        const btn = e.target.closest('.team-dot');
        if (btn) goTo(+btn.dataset.slide);
      });
    }

    /* Arrow buttons */
    if (prevBtn) prevBtn.addEventListener('click', () => { goTo(currentSlide - 1); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo(currentSlide + 1); resetAutoplay(); });

    /* Pause autoplay on hover */
    const vp = document.getElementById('teamViewport');
    if (vp) {
      vp.addEventListener('mouseenter', stopAutoplay,  { passive: true });
      vp.addEventListener('mouseleave', startAutoplay, { passive: true });
    }

    /* Touch / mouse drag */
    setupDrag();

    /* Set initial position without animation */
    track.style.transition = 'none';
    track.style.transform  = 'translateX(0)';
    updateDots();
  }

  /* ---- Card HTML ---- */
  function cardHTML(m) {
    return `
      <article class="team-card" tabindex="0"
        aria-label="${esc(m.name)}"
        onclick="location.href='/team-detail.html?slug=${m.slug}'"
        onkeydown="if(event.key==='Enter')location.href='/team-detail.html?slug=${m.slug}'">
        <div class="team-card-img-wrap">
          <img
            src="${m.image}"
            alt="${esc(m.name)}"
            loading="lazy"
            decoding="async"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          />
          <div class="team-avatar-fallback" style="display:none">${initials(m.name)}</div>
        </div>
        <div class="team-card-body">
          <h4 class="team-card-name">${esc(m.name)}</h4>
          <p class="team-card-spec">${esc(m.specialization)}</p>
          <div class="team-card-meta">
            <span>${m.experience} лет</span>
            <span>${m.deals} сделок</span>
            <span>${esc(m.city)}</span>
          </div>
          <a href="/team-detail.html?slug=${m.slug}" class="team-card-btn" onclick="event.stopPropagation()">
            Подробнее <span aria-hidden="true">→</span>
          </a>
        </div>
      </article>
    `;
  }

  /* =========================================================
     NAVIGATION — translateX on track
  ========================================================= */
  function goTo(index) {
    if (isAnimating || slides.length <= 1) return;
    const next = ((index % slides.length) + slides.length) % slides.length;
    if (next === currentSlide) return;

    isAnimating = true;
    currentSlide = next;

    track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)`;
    track.style.transform  = `translateX(-${currentSlide * 100}%)`;

    updateDots();

    setTimeout(() => { isAnimating = false; }, TRANSITION_MS);
  }

  function updateDots() {
    if (!dotsWrap) return;
    Array.from(dotsWrap.children).forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentSlide);
    });
  }

  /* =========================================================
     AUTOPLAY
  ========================================================= */
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setTimeout(() => {
      goTo(currentSlide + 1);
      startAutoplay();
    }, AUTOPLAY_DELAY);
  }

  function stopAutoplay()  { clearTimeout(autoplayTimer); }
  function resetAutoplay() { stopAutoplay(); startAutoplay(); }

  /* =========================================================
     DRAG / TOUCH
  ========================================================= */
  function setupDrag() {
    const vp = document.getElementById('teamViewport');
    if (!vp) return;

    vp.addEventListener('touchstart', e => { dragStartX = e.touches[0].clientX; isDragging = true; }, { passive: true });
    vp.addEventListener('touchend',   e => { endDrag(e.changedTouches[0].clientX); }, { passive: true });

    vp.addEventListener('mousedown',  e => { dragStartX = e.clientX; isDragging = true; });
    vp.addEventListener('mouseup',    e => { if (isDragging) endDrag(e.clientX); });
    vp.addEventListener('mouseleave', e => { if (isDragging) endDrag(e.clientX); });
  }

  function endDrag(endX) {
    if (!isDragging) return;
    isDragging = false;
    const delta = endX - dragStartX;
    if (Math.abs(delta) < 50) return;
    goTo(delta < 0 ? currentSlide + 1 : currentSlide - 1);
    resetAutoplay();
  }

  /* =========================================================
     ENTRANCE ANIMATION
  ========================================================= */
  function observeEntrance() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = +(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('is-visible'), delay);
        io.unobserve(el);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    const leader = document.querySelector('.team-leader-card');
    if (leader) {
      leader.classList.add('will-animate');
      io.observe(leader);
    }

    setTimeout(() => {
      document.querySelectorAll('.team-card').forEach((el, i) => {
        el.classList.add('will-animate');
        el.dataset.delay = i * 60;
        io.observe(el);
      });
    }, 50);
  }

  /* =========================================================
     HELPERS
  ========================================================= */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  /* ---- Boot ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
