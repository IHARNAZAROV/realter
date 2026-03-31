(function () {
  const DATA_PATH = {
    districts: 'data/lida/districts.geojson',
    infrastructure: 'data/lida/infrastructure.json',
    prices: 'data/lida/prices.json',
    meta: 'data/lida/meta.json'
  };

  const colorStops = [
    [850, '#d9f0ff'],
    [900, '#a6d4fa'],
    [950, '#72b6f4'],
    [1000, '#3f96eb'],
    [1100, '#156fd3']
  ];

  const friendlyTypes = {
    school: 'Школы',
    kindergarten: 'Детсады',
    clinic: 'Поликлиники',
    pharmacy: 'Аптеки',
    transport: 'Остановки'
  };

  function createSparkline(trend) {
    if (!Array.isArray(trend) || trend.length < 2) return '—';
    const chars = '▁▂▃▄▅▆▇█';
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    return trend
      .map((v) => {
        if (max === min) return chars[0];
        const i = Math.round(((v - min) / (max - min)) * (chars.length - 1));
        return chars[i];
      })
      .join('');
  }

  function changeClass(value) {
    return Number(value) >= 0 ? 'trend-positive' : 'trend-negative';
  }

  function formatChange(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return 'н/д';
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  }

  function formatRent(value) {
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) return 'н/д';
    return num.toFixed(1);
  }

  function bySlug(list) {
    return list.reduce((acc, row) => {
      acc[row.slug] = row;
      return acc;
    }, {});
  }

  async function getJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }
    return response.json();
  }

  function injectLegend() {
    const legend = document.getElementById('priceLegend');
    colorStops.forEach(([limit, color]) => {
      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `<span class="legend-color" style="background:${color}"></span><span>до ${limit} $/м²</span>`;
      legend.appendChild(row);
    });
  }

  function renderPriceTable(prices) {
    const tbody = document.getElementById('priceTableBody');
    tbody.innerHTML = '';
    prices.districts
      .slice()
      .sort((a, b) => b.sale_price_m2 - a.sale_price_m2)
      .forEach((district) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${district.name}</td>
          <td>${district.sale_price_m2}</td>
          <td>${formatRent(district.rent_price_m2)}</td>
          <td class="${changeClass(district.change_1m)}">${formatChange(district.change_1m)}</td>
          <td class="${changeClass(district.change_12m)}">${formatChange(district.change_12m)}</td>
          <td class="sparkline">${createSparkline(district.trend)}</td>
        `;
        tbody.appendChild(tr);
      });
  }

  function renderInsights(prices, infrastructure) {
    const insights = document.getElementById('insights');
    const byPrice = prices.districts.slice().sort((a, b) => a.sale_price_m2 - b.sale_price_m2);
    const topGrowth = prices.districts.slice().sort((a, b) => b.change_12m - a.change_12m)[0];

    const infraCountByDistrict = infrastructure.features.reduce((acc, item) => {
      acc[item.district_slug] = (acc[item.district_slug] || 0) + 1;
      return acc;
    }, {});

    const bestInfra = Object.entries(infraCountByDistrict).sort((a, b) => b[1] - a[1])[0];
    const bestInfraDistrict = prices.districts.find((d) => d.slug === bestInfra?.[0]);

    insights.innerHTML = `
      <div>Самый доступный район: <strong>${byPrice[0].name}</strong> (${byPrice[0].sale_price_m2} $/м²)</div>
      <div>Лидер роста за 12 мес: <strong>${topGrowth.name}</strong> (${formatChange(topGrowth.change_12m)})</div>
      <div>Лучшая инфраструктура: <strong>${bestInfraDistrict?.name || 'н/д'}</strong> (${bestInfra?.[1] || 0} объектов)</div>
    `;
  }

  function renderInfraCounters(infrastructure) {
    const counters = document.getElementById('infraCounters');
    const activeTypes = new Set(
      Array.from(document.querySelectorAll('.infra-filter:checked')).map((el) => el.value)
    );

    const grouped = infrastructure.features
      .filter((item) => activeTypes.has(item.type))
      .reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});

    counters.innerHTML = Object.entries(friendlyTypes)
      .map(([type, label]) => `<div class="kpi-item">${label}<strong>${grouped[type] || 0}</strong></div>`)
      .join('');
  }

  function buildMap(districtsGeoJson, infrastructure, pricesBySlug) {
    const map = new maplibregl.Map({
      container: 'lidaMap',
      style: 'https://demotiles.maplibre.org/style.json',
      center: [25.309, 53.894],
      zoom: 12
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      const districts = JSON.parse(JSON.stringify(districtsGeoJson));
      districts.features.forEach((feature) => {
        feature.properties.sale_price_m2 = pricesBySlug[feature.properties.slug]?.sale_price_m2 || 0;
      });

      map.addSource('districts', { type: 'geojson', data: districts });
      map.addSource('infrastructure', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: infrastructure.features.map((item) => ({
            type: 'Feature',
            properties: { ...item },
            geometry: { type: 'Point', coordinates: item.coordinates }
          }))
        }
      });

      map.addLayer({
        id: 'district-fill',
        type: 'fill',
        source: 'districts',
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'sale_price_m2'], ...colorStops.flat()],
          'fill-opacity': 0.45
        }
      });

      map.addLayer({
        id: 'district-outline',
        type: 'line',
        source: 'districts',
        paint: { 'line-color': '#1f2a37', 'line-width': 1.5 }
      });

      map.addLayer({
        id: 'infra-points',
        type: 'circle',
        source: 'infrastructure',
        paint: {
          'circle-color': '#f97316',
          'circle-radius': 4,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1
        }
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mousemove', 'district-fill', (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const p = pricesBySlug[feature.properties.slug];
        map.getCanvas().style.cursor = 'pointer';
        popup
          .setLngLat(event.lngLat)
          .setHTML(`<strong>${feature.properties.name}</strong><br>Продажа: ${p?.sale_price_m2 || 'н/д'} $/м²<br>12 мес: ${formatChange(p?.change_12m)}`)
          .addTo(map);
      });

      map.on('mouseleave', 'district-fill', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    return map;
  }

  function applyInfraMapFilter(map) {
    const activeTypes = Array.from(document.querySelectorAll('.infra-filter:checked')).map((el) => el.value);
    if (!map.getLayer('infra-points')) return;
    if (!activeTypes.length) {
      map.setFilter('infra-points', ['==', ['get', 'type'], '__none__']);
      return;
    }
    map.setFilter('infra-points', ['match', ['get', 'type'], activeTypes, true, false]);
  }

  async function init() {
    try {
      injectLegend();
      const [districts, infrastructure, prices, meta] = await Promise.all([
        getJSON(DATA_PATH.districts),
        getJSON(DATA_PATH.infrastructure),
        getJSON(DATA_PATH.prices),
        getJSON(DATA_PATH.meta)
      ]);

      const pricesBySlug = bySlug(prices.districts);
      document.getElementById('updatedAt').textContent = meta.updated_at;

      const map = buildMap(districts, infrastructure, pricesBySlug);
      map.once('load', () => applyInfraMapFilter(map));
      renderPriceTable(prices);
      renderInsights(prices, infrastructure);
      renderInfraCounters(infrastructure);

      document.querySelectorAll('.infra-filter').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          renderInfraCounters(infrastructure);
          if (map.loaded()) {
            applyInfraMapFilter(map);
          } else {
            map.once('load', () => applyInfraMapFilter(map));
          }
        });
      });
    } catch (error) {
      const root = document.getElementById('lidaDistrictsRoot');
      root.innerHTML = `<div class="card-surface" style="padding:16px">Не удалось загрузить блок «Районы Лиды». ${error.message}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
