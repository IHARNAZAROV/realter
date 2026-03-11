(function () {
  const objectsPath = '/data/objects.json';
  const cityName = 'Лида';

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
      return { text: `↗ Рост ${formatNumber(percent, 1)}%`, details: 'Средняя цена увеличивается.' };
    }

    return { text: `↘ Снижение ${formatNumber(Math.abs(percent), 1)}%`, details: 'Средняя цена снижается.' };
  };

  const buildChart = (labels, apartments, houses) => {
    const canvas = document.getElementById('market-price-chart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Квартиры (средняя цена)',
            data: apartments,
            borderColor: '#0059ff',
            backgroundColor: 'rgba(0, 89, 255, 0.15)',
            fill: true,
            tension: 0.35,
          },
          {
            label: 'Дома (средняя цена)',
            data: houses,
            borderColor: '#00a779',
            backgroundColor: 'rgba(0, 167, 121, 0.15)',
            fill: true,
            tension: 0.35,
          },
        ],
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
      const objects = allObjects.filter(
        (item) => item && item.dealType === 'Продажа' && item.city && item.city.includes(cityName)
      );

      const apartments = objects.filter((item) => item.type === 'Квартира');
      const houses = objects.filter((item) => item.type === 'Дом');

      setText('#avg-apartment-price', formatCurrency(calcAverage(apartments, (item) => item.priceBYN)));
      setText('#avg-house-price', formatCurrency(calcAverage(houses, (item) => item.priceBYN)));
      setText(
        '#avg-apartment-sqm',
        `Средняя цена за м² (${cityName}): ${formatCurrency(calcAveragePerSqm(apartments))}`
      );
      setText(
        '#avg-house-sqm',
        `Средняя цена за м² (${cityName}): ${formatCurrency(calcAveragePerSqm(houses))}`
      );

      const apartmentSeries = groupByMonth(apartments).map((bucket) => ({
        label: bucket.label,
        value: calcAverage(bucket.value, (item) => item.priceBYN),
      }));

      const houseSeries = groupByMonth(houses).map((bucket) => ({
        label: bucket.label,
        value: calcAverage(bucket.value, (item) => item.priceBYN),
      }));

      const allLabels = [...new Set([...apartmentSeries.map((item) => item.label), ...houseSeries.map((item) => item.label)])];

      const apartmentMap = new Map(apartmentSeries.map((item) => [item.label, item.value]));
      const houseMap = new Map(houseSeries.map((item) => [item.label, item.value]));

      const apartmentValues = allLabels.map((label) => apartmentMap.get(label) || null);
      const houseValues = allLabels.map((label) => houseMap.get(label) || null);

      const mergedForTrend = allLabels
        .map((_, idx) => {
          const values = [apartmentValues[idx], houseValues[idx]].filter((v) => Number.isFinite(v));
          if (!values.length) return null;
          return values.reduce((a, b) => a + b, 0) / values.length;
        })
        .filter((value) => Number.isFinite(value));

      const trend = buildTrend(mergedForTrend);
      setText('#market-trend', trend.text);
      setText('#market-trend-details', trend.details);

      buildChart(allLabels, apartmentValues, houseValues);
    } catch (error) {
      setText('#market-trend', 'Данные временно недоступны');
      setText('#market-trend-details', 'Не удалось загрузить статистику объектов.');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketAnalytics);
  } else {
    initMarketAnalytics();
  }
})();
