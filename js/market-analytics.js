(function () {
  const objectsPath = '/data/objects.json';
  const cityName = 'Лида';
  const roomTypes = [1, 2, 3, 4];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'BYN',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatNumber = (value, digits = 0) =>
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value || 0);

  const parseDate = (input) => {
    if (!input) return null;
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const calcAverage = (items, valueExtractor) => {
    const values = items
      .map(valueExtractor)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const calcAveragePerSqm = (items) => {
    const values = items
      .map((item) => {
        const price = Number(item.priceBYN);
        const area = Number(item.areaTotal);
        if (!Number.isFinite(price) || !Number.isFinite(area) || area <= 0) {
          return null;
        }
        return price / area;
      })
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const setText = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  };

  const groupByMonth = (items) => {
    const buckets = new Map();

    items.forEach((item) => {
      const date = parseDate(item.publishedAt);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    });

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        key,
        label: new Date(`${key}-01`).toLocaleDateString('ru-RU', {
          month: 'short',
          year: 'numeric',
        }),
        value,
      }));
  };

  const buildTrend = (series) => {
    if (series.length < 2) {
      return { text: 'Недостаточно данных', details: 'Добавьте больше объектов для сравнения динамики.' };
    }

    const prev = series[series.length - 2];
    const last = series[series.length - 1];
    const delta = last - prev;
    const percent = prev > 0 ? (delta / prev) * 100 : 0;

    if (Math.abs(percent) < 0.5) {
      return { text: '→ Стабильно', details: 'Изменения менее 0.5% к прошлому периоду.' };
    }

    if (percent > 0) {
      return { text: `↗ Рост ${formatNumber(percent, 1)}%`, details: 'Средняя стоимость квартир растёт.' };
    }

    return { text: `↘ Снижение ${formatNumber(Math.abs(percent), 1)}%`, details: 'Средняя стоимость квартир снижается.' };
  };

  const buildChart = (labels, datasets) => {
    const canvas = document.getElementById('market-price-chart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: {
          duration: 1400,
          easing: 'easeOutQuart',
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
            },
          },
          legend: {
            position: 'bottom',
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => formatCurrency(value),
            },
          },
        },
      },
    });
  };

  const initMarketAnalytics = async () => {
    try {
      const response = await fetch(objectsPath, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load objects');

      const allObjects = await response.json();
      const apartments = allObjects.filter(
        (item) =>
          item &&
          item.dealType === 'Продажа' &&
          item.type === 'Квартира' &&
          item.city &&
          item.city.includes(cityName)
      );

      setText('#avg-apartment-price', formatCurrency(calcAverage(apartments, (item) => item.priceBYN)));
      setText(
        '#avg-apartment-sqm',
        `Средняя цена за м² (${cityName}): ${formatCurrency(calcAveragePerSqm(apartments))}`
      );

      roomTypes.forEach((rooms) => {
        const roomApartments = apartments.filter((item) => Number(item.rooms) === rooms);
        setText(`#avg-room-${rooms}-price`, formatCurrency(calcAverage(roomApartments, (item) => item.priceBYN)));
        setText(`#avg-room-${rooms}-count`, `Объектов: ${roomApartments.length}`);
      });

      const monthlyBuckets = groupByMonth(apartments);
      const labels = monthlyBuckets.map((bucket) => bucket.label);

      const palette = {
        1: { border: '#0059ff', bg: 'rgba(0, 89, 255, 0.15)' },
        2: { border: '#00a779', bg: 'rgba(0, 167, 121, 0.15)' },
        3: { border: '#ff7a00', bg: 'rgba(255, 122, 0, 0.15)' },
        4: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
      };

      const datasets = roomTypes.map((rooms) => {
        const color = palette[rooms];
        return {
          label: `${rooms}-комнатные`,
          data: monthlyBuckets.map((bucket) => {
            const roomItems = bucket.value.filter((item) => Number(item.rooms) === rooms);
            return roomItems.length ? calcAverage(roomItems, (item) => item.priceBYN) : null;
          }),
          borderColor: color.border,
          backgroundColor: color.bg,
          fill: false,
          spanGaps: true,
          tension: 0.35,
        };
      });

      const overallSeries = monthlyBuckets.map((bucket) => calcAverage(bucket.value, (item) => item.priceBYN));
      const trend = buildTrend(overallSeries);
      setText('#market-trend', trend.text);
      setText('#market-trend-details', trend.details);

      buildChart(labels, datasets);
    } catch (error) {
      setText('#market-trend', 'Данные временно недоступны');
      setText('#market-trend-details', 'Не удалось загрузить статистику квартир.');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketAnalytics);
  } else {
    initMarketAnalytics();
  }
})();
