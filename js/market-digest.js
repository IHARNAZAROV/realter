(function () {
  const DIGEST_SELECTOR = '[data-market-digest]';
  const RU_LOCALE = 'ru-RU';
  const BYN_FORMATTER = new Intl.NumberFormat(RU_LOCALE, {
    style: 'currency',
    currency: 'BYN',
    maximumFractionDigits: 0
  });

  function normalizeObjects(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.objects)) return payload.objects;
    if (Array.isArray(payload?.items)) return payload.items;

    for (const value of Object.values(payload || {})) {
      if (Array.isArray(value) && value.some((item) => item && typeof item === 'object')) {
        return value;
      }
    }

    return [];
  }

  function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    if (typeof value === 'number') {
      const dateFromNumber = new Date(value);
      return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
    }

    if (typeof value !== 'string') return null;

    const normalized = value.trim().replace(/\./g, '-').replace(/\//g, '-');
    const directDate = new Date(normalized);
    if (!Number.isNaN(directDate.getTime())) return directDate;

    const dayMonthYear = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dayMonthYear) {
      const [, day, month, year] = dayMonthYear;
      const fromDMY = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(fromDMY.getTime()) ? null : fromDMY;
    }

    return null;
  }

  function getPluralDays(value) {
    const n = Math.abs(Number(value)) || 0;
    const lastTwo = n % 100;
    const last = n % 10;

    if (lastTwo >= 11 && lastTwo <= 14) return `${n} дней`;
    if (last === 1) return `${n} день`;
    if (last >= 2 && last <= 4) return `${n} дня`;
    return `${n} дней`;
  }

  function getLatestDate(objectItem) {
    return (
      parseDate(objectItem?.publishedAt) ||
      parseDate(objectItem?.createdAt) ||
      parseDate(objectItem?.dateAdded) ||
      parseDate(objectItem?.updatedAt) ||
      parseDate(objectItem?.date) ||
      null
    );
  }

  function toNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function normalizeStatus(item) {
    const rawStatus = item?.status ?? item?.state ?? item?.availability ?? item?.dealStatus;
    if (rawStatus && typeof rawStatus === 'object') {
      return String(rawStatus.type || rawStatus.status || '').toLowerCase();
    }
    return String(rawStatus || '').toLowerCase();
  }

  function isActiveObject(item) {
    const status = normalizeStatus(item);
    const soldWords = ['sold', 'продан', 'продано', 'снят', 'закрыт', 'архив'];
    const activeWords = ['актив', 'в продаже', 'доступ', 'available'];

    if (status && soldWords.some((word) => status.includes(word))) return false;
    if (status && activeWords.some((word) => status.includes(word))) return true;
    return true;
  }

  function getLocationBucket(item) {
    const district = item?.district || item?.districtName || item?.microdistrict;
    if (district) return String(district);

    const city = String(item?.city || '').trim();
    if (city) return city;

    const address = String(item?.address || '').trim();
    if (!address) return null;

    const chunk = address.split(',')[0]?.trim();
    return chunk || null;
  }

  function hoursAgoText(hours) {
    if (!Number.isFinite(hours) || hours < 0) return 'Нет данных';
    if (hours < 1) return 'Обновлено сегодня';

    const rounded = Math.floor(hours);
    const lastTwo = rounded % 100;
    const last = rounded % 10;
    let word = 'часов';
    if (lastTwo < 11 || lastTwo > 14) {
      if (last === 1) word = 'час';
      else if (last >= 2 && last <= 4) word = 'часа';
    }

    return `Последний объект добавлен ${rounded} ${word} назад`;
  }

  function createMarketDigest(data) {
    const objects = normalizeObjects(data).filter((item) => item && typeof item === 'object');
    const now = new Date();

    const activeCount = objects.filter(isActiveObject).length;

    const withDates = objects
      .map((item) => ({ item, date: getLatestDate(item) }))
      .filter((entry) => entry.date instanceof Date);

    const latestObject = withDates.reduce((acc, current) => {
      if (!acc) return current;
      return current.date > acc.date ? current : acc;
    }, null);

    const daysSinceLatest = latestObject
      ? Math.max(0, Math.floor((now.getTime() - latestObject.date.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const hoursSinceLatest = latestObject
      ? Math.max(0, (now.getTime() - latestObject.date.getTime()) / (1000 * 60 * 60))
      : null;

    const apartments = objects.filter((item) => String(item?.type || '').toLowerCase().includes('кварт'));
    const houses = objects.filter((item) => String(item?.type || '').toLowerCase().includes('дом'));

    const apartmentPrices = apartments
      .map((item) => toNumber(item?.livePriceBYN ?? item?.priceBYN))
      .filter((price) => Number.isFinite(price) && price > 0);

    const housePrices = houses
      .map((item) => toNumber(item?.livePriceBYN ?? item?.priceBYN))
      .filter((price) => Number.isFinite(price) && price > 0);

    const avgApartmentPrice = apartmentPrices.length
      ? apartmentPrices.reduce((sum, price) => sum + price, 0) / apartmentPrices.length
      : null;

    const avgHousePrice = housePrices.length
      ? housePrices.reduce((sum, price) => sum + price, 0) / housePrices.length
      : null;

    const newIn30Days = withDates.filter((entry) => {
      const diffDays = (now.getTime() - entry.date.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    const mostExpensive = objects
      .map((item) => ({
        title: item?.title || item?.type || null,
        price: toNumber(item?.livePriceBYN ?? item?.priceBYN)
      }))
      .filter((item) => Number.isFinite(item.price) && item.price > 0)
      .sort((a, b) => b.price - a.price)[0] || null;

    const roomCounts = {
      1: apartments.filter((item) => Number(item?.rooms) === 1).length,
      2: apartments.filter((item) => Number(item?.rooms) === 2).length,
      3: apartments.filter((item) => Number(item?.rooms) === 3).length
    };

    const inLidaCount = objects.filter((item) => {
      const city = String(item?.city || '');
      const address = String(item?.address || '');
      return city.toLowerCase().includes('лида') || address.toLowerCase().includes('лида');
    }).length;

    const suburbCount = objects.length ? Math.max(0, objects.length - inLidaCount) : null;

    return [
      {
        key: 'active-now',
        icon: 'fa-solid fa-house',
        value: activeCount,
        numericValue: activeCount,
        label: 'Сейчас в продаже',
        hint: 'Актуальные объекты в листинге.'
      },
      {
        key: 'last-addition',
        icon: 'fa-regular fa-clock',
        value: daysSinceLatest === null ? 'Нет данных' : getPluralDays(daysSinceLatest),
        numericValue: daysSinceLatest,
        label: 'Последнее добавление',
        hint: latestObject ? hoursAgoText(hoursSinceLatest) : 'Нет данных о дате публикации.'
      },
      {
        key: 'new-objects',
        icon: 'fa-solid fa-calendar-plus',
        value: Number.isFinite(newIn30Days) ? newIn30Days : 'Нет данных',
        numericValue: Number.isFinite(newIn30Days) ? newIn30Days : null,
        label: 'Новых объектов за 30 дней'
      },
      {
        key: 'lida-vs-suburb',
        icon: 'fa-solid fa-location-dot',
        value: inLidaCount || suburbCount !== null
          ? `Лида: ${inLidaCount} • Пригород: ${suburbCount}`
          : 'Нет данных',
        label: 'Лида и пригород'
      },
      {
        key: 'average-price-apartment',
        icon: 'fa-solid fa-building',
        value: avgApartmentPrice === null ? 'Нет данных' : BYN_FORMATTER.format(avgApartmentPrice),
        numericValue: avgApartmentPrice,
        label: 'Средняя цена квартиры'
      },
      {
        key: 'average-price-house',
        icon: 'fa-solid fa-house-chimney',
        value: avgHousePrice === null ? 'Нет данных' : BYN_FORMATTER.format(avgHousePrice),
        numericValue: avgHousePrice,
        label: 'Средняя цена дома'
      },
      {
        key: 'max-price',
        icon: 'fa-solid fa-gem',
        value: mostExpensive ? BYN_FORMATTER.format(mostExpensive.price) : 'Нет данных',
        numericValue: mostExpensive?.price ?? null,
        label: 'Самая дорогая недвижимость',
        hint: mostExpensive?.title || 'Нет данных'
      },
      {
        key: 'rooms-distribution',
        icon: 'fa-solid fa-layer-group',
        value: apartments.length
          ? `${roomCounts[1]} / ${roomCounts[2]} / ${roomCounts[3]}`
          : 'Нет данных',
        label: 'Распределение по комнатам',
        hint: apartments.length ? '1к / 2к / 3к квартиры' : 'Нет квартир в выборке.'
      }
    ];
  }

  function renderMarketDigest(metrics) {
    const root = document.querySelector(DIGEST_SELECTOR);
    if (!root) return;

    const grid = root.querySelector('[data-market-digest-grid]');
    if (!grid) return;

    const cardsMarkup = metrics
      .map((metric, index) => {
        const hint = metric?.hint ? `<p class="market-digest__hint">${metric.hint}</p>` : '';
        const isPulseCard = metric.key === 'last-addition';
        const pulse = isPulseCard
          ? '<span class="market-digest__pulse" aria-hidden="true"></span>'
          : '';

        const isNumeric = Number.isFinite(metric?.numericValue);
        const counterAttrs = isNumeric
          ? `data-counter data-counter-target="${metric.numericValue}" data-counter-type="${metric.key.includes('price') || metric.key === 'max-price' ? 'currency' : 'number'}"`
          : '';

        return `
          <article class="market-digest__card" data-metric="${metric.key}" data-digest-index="${index}">
            <div class="market-digest__icon" aria-hidden="true"><i class="${metric.icon || 'fa-solid fa-chart-line'}"></i></div>
            <div class="market-digest__value" ${counterAttrs}>${metric?.value ?? 'Нет данных'}</div>
            <h3 class="market-digest__label">${metric?.label || 'Метрика'}</h3>
            <div class="market-digest__meta">${pulse}${hint}</div>
          </article>
        `;
      })
      .join('');

    grid.innerHTML = cardsMarkup;
  }

  function animateCounters() {
    const root = document.querySelector(DIGEST_SELECTOR);
    if (!root) return;

    const counters = root.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const numberFormatter = new Intl.NumberFormat(RU_LOCALE, { maximumFractionDigits: 0 });

    const startAnimation = () => {
      counters.forEach((counter) => {
        const target = Number(counter.getAttribute('data-counter-target'));
        if (!Number.isFinite(target) || target < 0) return;

        const type = counter.getAttribute('data-counter-type') || 'number';
        const duration = 1200;
        const startTime = performance.now();

        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);

          counter.textContent =
            type === 'currency' ? BYN_FORMATTER.format(current) : numberFormatter.format(current);

          if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
      });
    };

    if (!('IntersectionObserver' in window)) {
      startAnimation();
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          startAnimation();
          obs.disconnect();
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(root);
  }

  async function initMarketDigest() {
    try {
      const response = await fetch('/data/objects.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load objects.json');

      const data = await response.json();
      const metrics = createMarketDigest(data);
      renderMarketDigest(metrics);
      animateCounters();
    } catch (error) {
      const fallbackMetrics = createMarketDigest([]);
      renderMarketDigest(fallbackMetrics);
    }
  }

  window.createMarketDigest = createMarketDigest;
  window.renderMarketDigest = renderMarketDigest;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketDigest);
  } else {
    initMarketDigest();
  }
})();
