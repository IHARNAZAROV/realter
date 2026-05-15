(() => {
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const slugFromPath = location.pathname.split('/').filter(Boolean).pop()?.replace('.html','');
  const slug = params.get('slug') || slugFromPath;
  const safe = (v='') => String(v).replace(/[<>&"']/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[m]));

  async function loadTeam(){
    for (const u of ['/data/team.json']) {
      try { const r = await fetch(u,{cache:'no-store'}); if(!r.ok) continue; const d=await r.json(); if(Array.isArray(d)) return d; } catch {}
    }
    return [];
  }
  function render404(){
    $('#tdHero').classList.add('loaded');
    $('#tdHero').innerHTML = '<div class="td-card"><h1>Риэлтер не найден</h1><p>Проверьте ссылку или вернитесь на главную.</p><a class="td-btn" href="/">На главную</a></div>';
  }
  function breadcrumbs(name){
    $('.td-breadcrumbs').innerHTML = `<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="/"><span itemprop="name">Главная</span></a><meta itemprop="position" content="1"></span><span class="sep">›</span><span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><span itemprop="name">${safe(name)}</span><meta itemprop="position" content="2"></span>`;
  }
  function counter(el, to){ let n=0; const step=Math.max(1,Math.round(to/40)); const i=setInterval(()=>{n+=step; if(n>=to){n=to;clearInterval(i);} el.textContent=n;},20); }

  loadTeam().then((team)=>{
    const p = team.find(x=>x.slug===slug) || team.find(x=>x.isManager);
    if(!p){ render404(); return; }
    document.title = `${p.name} — риэлтер агентства`;
    breadcrumbs(p.name);
    $('#tdHero').classList.add('loaded');
    $('#tdHero').innerHTML = `<img class="td-hero__img" src="${safe(p.photo)}" alt="${safe(p.name)}" loading="lazy"><div><h1>${safe(p.name)}</h1><p>${safe(p.position)} · ${safe(p.city)}</p><p>${safe(p.description||'')}</p><div class="td-buttons"><a class="td-btn" href="tel:${safe(p.phone||'')}" aria-label="Позвонить">Позвонить</a><a class="td-btn" href="${safe(p.telegram||'#')}" target="_blank" rel="noopener">Telegram</a><a class="td-btn" href="${safe(p.whatsapp||'#')}" target="_blank" rel="noopener">WhatsApp</a><a class="td-btn" href="#tdCta">Оставить заявку</a></div></div>`;
    $('#tdAbout').innerHTML = `<div class="td-grid"><article class="td-card"><h2>О риэлтере</h2><p><strong>Опыт:</strong> ${p.experience} лет</p><p><strong>Специализация:</strong> ${safe(p.specialization||'')}</p><p><strong>Подход:</strong> ${safe(p.approach||'')}</p></article><article class="td-card"><h2>Достижения</h2><ul>${(p.achievements||[]).map(a=>`<li>${safe(a)}</li>`).join('')}</ul><h3>Сертификаты</h3><ul>${(p.certificates||[]).map(c=>`<li>${safe(c)}</li>`).join('')}</ul></article></div>`;
    const s=p.stats||{};
    $('#tdStats').innerHTML = `<div class="td-stats-wrap"><div class="td-card td-stat"><strong data-n="${s.deals||0}">0</strong>Сделок</div><div class="td-card td-stat"><strong data-n="${s.experience||p.experience||0}">0</strong>Лет опыта</div><div class="td-card td-stat"><strong data-n="${s.activeListings||0}">0</strong>Объектов</div><div class="td-card td-stat"><strong data-n="${s.happyClients||0}">0</strong>Клиентов</div></div>`;
    $('#tdObjects').innerHTML = `<h2>Объекты риэлтера</h2><div class="td-objects-grid">${(p.objects||[]).map(o=>`<article class="td-card td-obj"><img src="${safe(o.image)}" alt="${safe(o.title)}" loading="lazy"><h3>${safe(o.title)}</h3><p>${safe(o.location)} · ${safe(o.area)}</p><p><strong>${safe(o.price)}</strong></p><a class="td-btn" href="${safe(o.url||'#')}">Смотреть</a></article>`).join('')}</div>`;
    $('#tdCta').innerHTML = `<div class="td-card"><h2>Свяжитесь с риэлтером</h2><form><input aria-label="Ваше имя" placeholder="Ваше имя" required><input aria-label="Телефон" placeholder="Телефон" required><button class="td-btn" type="submit">Отправить заявку</button></form><p><a href="tel:${safe(p.phone||'')}">Или позвонить: ${safe(p.phone||'')}</a></p></div>`;
    document.querySelector('#person-schema').textContent = JSON.stringify({"@context":"https://schema.org","@type":["Person","RealEstateAgent"],name:p.name,jobTitle:p.position,telephone:p.phone,email:p.email,address:{"@type":"PostalAddress",addressLocality:p.city},url:location.href,image:p.photo});

    const io = new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');if(e.target.id==='tdStats') e.target.querySelectorAll('[data-n]').forEach(el=>counter(el,Number(el.dataset.n)||0));}}),{threshold:.25});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  });
})();
