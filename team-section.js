(() => {
  const section = document.querySelector('.team-section');
  if (!section) return;

  const managerRoot = section.querySelector('.manager-card');
  const track = section.querySelector('.agents-slider__track');
  const pagination = section.querySelector('.agents-slider__pagination');
  const prevBtn = section.querySelector('.team-nav--prev');
  const nextBtn = section.querySelector('.team-nav--next');
  const sliderRegion = section.querySelector('.agents-slider');

  const chunkSize = () => (window.innerWidth <= 700 ? 1 : 4);
  let slides = [];
  let current = 0;
  let autoplayId = null;
  const AUTOPLAY_MS = 4500;

  const safe = (v) => String(v ?? '').replace(/[<>&"']/g, (m) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[m]));

  const cardTemplate = (agent, manager = false) => `
    <div class="card-media">
      <img src="${safe(agent.photo)}" alt="${safe(agent.name)} — ${safe(agent.position || agent.specialization)}" loading="lazy" decoding="async">
    </div>
    <div class="card-body">
      ${manager ? '<span class="card-label">РУКОВОДИТЕЛЬ</span>' : ''}
      <h3 class="card-name">${safe(agent.name)}</h3>
      <p class="card-role">${safe(agent.specialization || agent.position)}</p>
      ${manager ? `<p class="card-description">${safe(agent.description || '')}</p>` : ''}
      <div class="card-stats">
        <div><span class="stat-label">Опыт</span><span class="stat-value">${safe(agent.experience)} лет</span></div>
        <div><span class="stat-label">Сделки</span><span class="stat-value">${safe(agent.deals)}</span></div>
        <div><span class="stat-label">Город</span><span class="stat-value">${safe(agent.city)}</span></div>
      </div>
      <a href="#" class="card-link" aria-label="Подробнее о ${safe(agent.name)}">Подробнее <span aria-hidden="true">→</span></a>
    </div>`;

  const buildSlides = (agents) => {
    const size = chunkSize();
    const grouped = [];
    for (let i = 0; i < agents.length; i += size) grouped.push(agents.slice(i, i + size));
    return grouped;
  };

  const render = () => {
    track.innerHTML = slides.map(group => `
      <article class="team-slide">${group.map(agent => `<article class="agent-card">${cardTemplate(agent)}</article>`).join('')}</article>
    `).join('');
    pagination.innerHTML = slides.map((_, i) => `<button class="team-dot ${i===current?'is-active':''}" aria-label="Перейти к слайду ${i+1}" data-index="${i}"></button>`).join('');
    update();
  };

  const update = () => {
    if (!slides.length) return;
    current = (current + slides.length) % slides.length;
    track.style.transform = `translate3d(-${current * 100}%,0,0)`;
    pagination.querySelectorAll('.team-dot').forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  };

  const next = () => { current += 1; update(); };
  const prev = () => { current -= 1; update(); };
  const startAutoplay = () => {
    clearInterval(autoplayId);
    autoplayId = setInterval(next, AUTOPLAY_MS);
  };

  fetch('/team.json')
    .then(r => r.json())
    .then(data => {
      const manager = data.find(p => p.isManager) || data[0];
      const agents = data.filter(p => !p.isManager);
      managerRoot.innerHTML = cardTemplate(manager, true);
      slides = buildSlides(agents);
      render();
      startAutoplay();
    })
    .catch((error) => {
      console.error('[team-section] failed to load team.json', error);
      managerRoot.innerHTML = '<div class="card-body"><p>Не удалось загрузить данные команды.</p></div>';
    });

  nextBtn.addEventListener('click', () => { next(); startAutoplay(); });
  prevBtn.addEventListener('click', () => { prev(); startAutoplay(); });

  pagination.addEventListener('click', (e) => {
    const btn = e.target.closest('.team-dot');
    if (!btn) return;
    current = Number(btn.dataset.index);
    update();
    startAutoplay();
  });

  sliderRegion.addEventListener('mouseenter', () => clearInterval(autoplayId));
  sliderRegion.addEventListener('mouseleave', startAutoplay);

  sliderRegion.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); startAutoplay(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); startAutoplay(); }
  });

  let x0 = null;
  sliderRegion.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
  sliderRegion.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const delta = e.changedTouches[0].clientX - x0;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    x0 = null;
  }, { passive: true });

  window.addEventListener('resize', () => {
    const cards = Array.from(track.querySelectorAll('.agent-card')).map((_, i) => i);
    if (!cards.length) return;
    fetch('/team.json').then(r => r.json()).then(data => {
      slides = buildSlides(data.filter(p => !p.isManager));
      current = 0;
      render();
      startAutoplay();
    });
  });
})();
