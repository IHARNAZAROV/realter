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
  const TEAM_JSON_CANDIDATES = ['/team.json', './team.json', '/data/team.json'];
  const FALLBACK_TEAM_DATA = [
    { id: 1, name: 'Ольга Турко', position: 'Руководитель филиала', specialization: 'Эксперт по недвижимости Лиды', experience: 12, deals: 340, city: 'Лида', photo: '/images/team/olga-turko.webp', isManager: true, description: 'Эксперт по недвижимости Лиды с 12-летним опытом. Провела более 340 успешных сделок.' },
    { id: 2, name: 'Артём Лисовский', position: 'Риэлтер', specialization: 'Новостройки и инвестиции', experience: 8, deals: 188, city: 'Гродно', photo: '/images/team/artem-lisovskiy.webp', isManager: false },
    { id: 3, name: 'Марина Кравчук', position: 'Риэлтер', specialization: 'Семейные квартиры', experience: 6, deals: 145, city: 'Лида', photo: '/images/team/marina-kravchuk.webp', isManager: false },
    { id: 4, name: 'Дмитрий Ярош', position: 'Риэлтер', specialization: 'Загородные дома', experience: 10, deals: 231, city: 'Щучин', photo: '/images/team/dmitriy-yarosh.webp', isManager: false },
    { id: 5, name: 'Екатерина Полещук', position: 'Риэлтер', specialization: 'Коммерческая недвижимость', experience: 9, deals: 164, city: 'Волковыск', photo: '/images/team/ekaterina-poleschuk.webp', isManager: false }
  ];

  const loadTeamData = async () => {
    let lastError = null;
    for (const url of TEAM_JSON_CANDIDATES) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload) || payload.length === 0) {
          throw new Error(`${url} -> invalid payload`);
        }
        return payload;
      } catch (error) {
        lastError = error;
      }
    }
    console.error('[team-section] all team.json sources failed, fallback to embedded data', lastError);
    return FALLBACK_TEAM_DATA;
  };

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
    sliderRegion.classList.toggle('is-empty', slides.length === 0);
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

  loadTeamData()
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
    loadTeamData().then(data => {
      slides = buildSlides(data.filter(p => !p.isManager));
      current = 0;
      render();
      startAutoplay();
    }).catch((error) => {
      console.error('[team-section] failed to reload team data on resize', error);
    });
  });

  track.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    image.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420'%3E%3Crect width='100%25' height='100%25' fill='%23e8ecea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23687a75' font-family='Arial' font-size='24'%3EФото недоступно%3C/text%3E%3C/svg%3E";
    image.alt = `${image.alt}. Фото временно недоступно`;
  }, true);
})();
