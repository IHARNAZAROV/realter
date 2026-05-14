"use strict";

/* =========================================================
   TEAM SLIDER — turko.by
   Fetches /data/team.json, renders leader card + grid
   slider that swaps all 4 cards simultaneously.
========================================================= */

(function () {
  const AUTOPLAY_DELAY = 4500;
  const TRANSITION_MS  = 420;
  const CARDS_PER_SLIDE = 4; // 2×2 grid

  /* ---- State ---- */
  let members       = [];
  let slides        = [];
  let currentSlide  = 0;
  let autoplayTimer = null;
  let isAnimating   = false;

  /* ---- Touch / drag ---- */
  let dragStartX = 0;
  let isDragging = false;

  /* ---- DOM refs ---- */
  let track, dotsWrap, prevBtn, nextBtn, sliderSection;

  /* =========================================================
     INIT
  ========================================================= */
  function init() {
    sliderSection = document.getElementById('teamSection');
    if (!sliderSection) return;

    fetch('/data/team.json')
      .then(r => r.json())
      .then(data => {
        members = data;
        render();
        observeEntrance();
        startAutoplay();
      })
      .catch(err => console.warn('team.json load error', err));
  }

  /* =========================================================
     RENDER
  ========================================================= */
  function render() {
    const leader   = members.find(m => m.isLeader);
    const realtors = members.filter(m => !m.isLeader);

    renderLeader(leader);
    renderSlider(realtors);
  }

  /* ---- Leader card ---- */
  function renderLeader(leader) {
    const wrap = document.getElementById('teamLeaderCard');
    if (!wrap || !leader) return;

    wrap.innerHTML = `
      <div class="team-leader-img-wrap">
        <img
          src="${leader.image}"
          alt="${leader.name}"
          loading="lazy"
          decoding="async"
          onerror="this.style.display='none';this.parentElement.querySelector('.team-avatar-fallback').style.display='flex'"
        />
        <div class="team-avatar-fallback" style="display:none">${initials(leader.name)}</div>
        <span class="team-leader-badge">Руководитель</span>
      </div>
      <div class="team-leader-body">
        <p class="team-leader-position">${escHtml(leader.position)}</p>
        <h3>${escHtml(leader.name)}</h3>
        <p class="team-leader-desc">${escHtml(leader.shortDescription)}</p>
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
            <strong><i class="fa fa-map-marker-alt" aria-hidden="true"></i></strong>
            <span>${escHtml(leader.city)}</span>
          </div>
        </div>
        <a href="/team-detail.html?slug=${leader.slug}" class="site-button text-uppercase">
          Подробнее
        </a>
      </div>
    `;
  }

  /* ---- Slider ---- */
  function renderSlider(realtors) {
    track    = document.getElementById('teamTrack');
    dotsWrap = document.getElementById('teamDots');
    prevBtn  = document.getElementById('teamPrev');
    nextBtn  = document.getElementById('teamNext');

    if (!track) return;

    /* Build slides (groups of CARDS_PER_SLIDE) */
    slides = [];
    for (let i = 0; i < realtors.length; i += CARDS_PER_SLIDE) {
      slides.push(realtors.slice(i, i + CARDS_PER_SLIDE));
    }

    /* Render slide HTML */
    track.innerHTML = slides
      .map((group, si) => `
        <div class="team-slide" role="group" aria-label="Слайд ${si + 1} из ${slides.length}">
          ${group.map(m => cardHTML(m)).join('')}
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

    /* Buttons */
    if (prevBtn) prevBtn.addEventListener('click', () => { goTo(currentSlide - 1); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo(currentSlide + 1); resetAutoplay(); });

    /* Touch / drag */
    setupDrag();

    /* Pause on hover */
    const viewport = document.getElementById('teamViewport');
    if (viewport) {
      viewport.addEventListener('mouseenter', stopAutoplay,  { passive: true });
      viewport.addEventListener('mouseleave', startAutoplay, { passive: true });
    }

    updateUI();
  }

  /* ---- Card HTML ---- */
  function cardHTML(m) {
    return `
      <article class="team-card" tabindex="0" role="button" aria-label="Подробнее о ${escHtml(m.name)}"
               onclick="location.href='/team-detail.html?slug=${m.slug}'"
               onkeydown="if(event.key==='Enter')location.href='/team-detail.html?slug=${m.slug}'">
        <div class="team-card-img-wrap">
          <img
            src="${m.image}"
            alt="${escHtml(m.name)}"
            loading="lazy"
            decoding="async"
            onerror="this.style.display='none';this.parentElement.querySelector('.team-avatar-fallback').style.display='flex'"
          />
          <div class="team-avatar-fallback" style="display:none">${initials(m.name)}</div>
        </div>
        <div class="team-card-body">
          <h4 class="team-card-name">${escHtml(m.name)}</h4>
          <p class="team-card-spec">${escHtml(m.specialization)}</p>
          <div class="team-card-meta">
            <span><i class="fa fa-briefcase" aria-hidden="true"></i>${m.experience} лет</span>
            <span><i class="fa fa-handshake" aria-hidden="true"></i>${m.deals} сделок</span>
            <span><i class="fa fa-map-marker-alt" aria-hidden="true"></i>${escHtml(m.city)}</span>
          </div>
          <a href="/team-detail.html?slug=${m.slug}" class="team-card-btn" onclick="event.stopPropagation()">
            Подробнее <i class="fa fa-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
      </article>
    `;
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */
  function goTo(index, wrap) {
    if (isAnimating || slides.length === 0) return;
    const next = (index + slides.length) % slides.length;
    if (next === currentSlide && !wrap) return;

    isAnimating = true;
    const direction = next > currentSlide ? -1 : 1;

    /* Slide out current */
    const currentEl = track.children[currentSlide];
    const nextEl    = track.children[next];

    currentEl.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${TRANSITION_MS}ms`;
    currentEl.style.transform  = `translateX(${direction * -60}px)`;
    currentEl.style.opacity    = '0';
    currentEl.style.position   = 'absolute';
    currentEl.style.width      = '100%';

    nextEl.style.transition = 'none';
    nextEl.style.transform  = `translateX(${direction * 60}px)`;
    nextEl.style.opacity    = '0';
    nextEl.style.position   = 'relative';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextEl.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${TRANSITION_MS}ms`;
        nextEl.style.transform  = 'translateX(0)';
        nextEl.style.opacity    = '1';
      });
    });

    setTimeout(() => {
      currentEl.style.position   = 'absolute';
      currentEl.style.visibility = 'hidden';
      currentSlide = next;
      updateUI();
      isAnimating = false;
    }, TRANSITION_MS);

    currentSlide = next; // update early for dots
    updateUI();
  }

  function updateUI() {
    /* Dots */
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((dot, i) => {
        dot.classList.toggle('is-active', i === currentSlide);
      });
    }

    /* Slides visibility */
    Array.from(track.children).forEach((slide, i) => {
      const active = i === currentSlide;
      if (!active) {
        slide.style.position   = 'absolute';
        slide.style.visibility = 'hidden';
        slide.style.opacity    = '0';
      } else {
        slide.style.position   = 'relative';
        slide.style.visibility = 'visible';
        slide.style.opacity    = '1';
        slide.style.transform  = 'translateX(0)';
      }
    });

    /* Aria */
    if (prevBtn) prevBtn.setAttribute('aria-label', 'Предыдущий слайд');
    if (nextBtn) nextBtn.setAttribute('aria-label', 'Следующий слайд');
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

  function stopAutoplay() {
    clearTimeout(autoplayTimer);
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  /* =========================================================
     DRAG / TOUCH
  ========================================================= */
  function setupDrag() {
    const viewport = document.getElementById('teamViewport');
    if (!viewport) return;

    viewport.addEventListener('touchstart', onDragStart, { passive: true });
    viewport.addEventListener('touchmove',  onDragMove,  { passive: true });
    viewport.addEventListener('touchend',   onDragEnd,   { passive: true });

    viewport.addEventListener('mousedown', onDragStart);
    viewport.addEventListener('mousemove', onDragMove);
    viewport.addEventListener('mouseup',   onDragEnd);
    viewport.addEventListener('mouseleave',onDragEnd);
  }

  function getX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    dragStartX = getX(e);
    isDragging = true;
  }

  function onDragMove(e) {
    if (!isDragging) return;
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const delta = getX(e) - dragStartX;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) {
      goTo(currentSlide + 1);
    } else {
      goTo(currentSlide - 1);
    }
    resetAutoplay();
  }

  /* =========================================================
     ENTRANCE ANIMATION (IntersectionObserver)
  ========================================================= */
  function observeEntrance() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.team-card, .team-leader-card').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || 0;
          setTimeout(() => el.classList.add('is-visible'), +delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });

    const leaderCard = document.querySelector('.team-leader-card');
    if (leaderCard) io.observe(leaderCard);

    /* Observe cards after a short delay to let render finish */
    setTimeout(() => {
      document.querySelectorAll('.team-card').forEach((el, i) => {
        el.dataset.delay = i * 80;
        io.observe(el);
      });
    }, 100);
  }

  /* =========================================================
     HELPERS
  ========================================================= */
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
