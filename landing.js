(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const heroTitle = document.getElementById('heroTitle');
  const style = params.get('style');
  const dynamicTerm = params.get('keyword') || params.get('utm_term');

  const defaultTitle = 'Продажа и покупка недвижимости в Лиде и районе — быстро, безопасно и по реальной цене';
  const termTitle = dynamicTerm
    ? `${decodeURIComponent(dynamicTerm).replace(/\+/g, ' ')} — подбор и сопровождение сделки`
    : defaultTitle;

  if (heroTitle) {
    heroTitle.textContent = termTitle.charAt(0).toUpperCase() + termTitle.slice(1);
  }

  if (style === 'premium') {
    document.body.classList.remove('variant-performance');
    document.body.classList.add('variant-premium');
  }

  buildFaqSchema();
  bindForms();
  bindAnalyticsEvents();
  trackScrollDepth();

  function bindForms() {
    const forms = [document.getElementById('leadForm'), document.getElementById('quickForm')].filter(Boolean);

    forms.forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        const fd = new FormData(form);
        const phone = String(fd.get('phone') || '').trim();
        const name = String(fd.get('name') || '').trim();

        if (!name || phone.length < 7) {
          const status = form.querySelector('.form-status');
          if (status) status.textContent = 'Пожалуйста, заполните имя и корректный телефон.';
          return;
        }

        const payload = {
          name,
          phone,
          requestType: fd.get('requestType') || 'quick',
          comment: fd.get('comment') || '',
          source: 'landing_subdomain',
          utm_source: params.get('utm_source') || '',
          utm_medium: params.get('utm_medium') || '',
          utm_campaign: params.get('utm_campaign') || '',
          utm_term: params.get('utm_term') || params.get('keyword') || ''
        };

        // продовая интеграция: заменить endpoint на ваш CRM/API
        fetch('/api/client-quiz.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(() => {
            const status = form.querySelector('.form-status');
            if (status) status.textContent = 'Спасибо! Заявка отправлена, мы скоро свяжемся.';
            form.reset();
            emitTrackingEvent('form_submit', payload.requestType);
          })
          .catch(() => {
            const status = form.querySelector('.form-status');
            if (status) status.textContent = 'Ошибка отправки. Позвоните нам: +375 29 180 95 16.';
          });
      });
    });
  }

  function buildFaqSchema() {
    const script = document.getElementById('faqSchema');
    const faqBlocks = Array.from(document.querySelectorAll('#faqAccordion details')).map((item) => {
      const question = item.querySelector('summary')?.textContent?.trim();
      const answer = item.querySelector('p')?.textContent?.trim();
      return {
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      };
    });

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqBlocks
    });
  }

  function bindAnalyticsEvents() {
    document.querySelectorAll('[data-track]').forEach((node) => {
      node.addEventListener('click', () => {
        const type = node.dataset.track;
        const label = node.dataset.cta || node.textContent.trim();
        emitTrackingEvent(type, label);
      });
    });
  }

  function trackScrollDepth() {
    let fired50 = false;
    let fired90 = false;
    document.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (!fired50 && percent >= 50) {
        fired50 = true;
        emitTrackingEvent('scroll_depth', '50%');
      }

      if (!fired90 && percent >= 90) {
        fired90 = true;
        emitTrackingEvent('scroll_depth', '90%');
      }
    }, { passive: true });
  }

  function emitTrackingEvent(eventName, label) {
    if (typeof window.ym === 'function') {
      window.ym(window.YM_COUNTER_ID || 0, 'reachGoal', eventName, { label });
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        event_category: 'landing',
        event_label: label
      });
    }
  }
})();
