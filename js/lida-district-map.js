(function () {
  "use strict";

  const MAP_CONTAINER_ID = "lidaDistrictMap";
  const LIDA_CENTER = [53.8872, 25.3028];

  const state = {
    map: null,
    districtCollection: null,
    objectMarksAll: [],
    objectMarksDimmed: [],
    activeClusterer: null,
    activeDistrictSlug: null,
    districtsBySlug: new Map(),
    districtToObjects: new Map(),
    allObjects: []
  };

  function formatPrice(value) {
    if (!value) return "Цена уточняется";
    return `${Number(value).toLocaleString("ru-RU")} $`;
  }

  function normalizeDistrictSlug(text) {
    return (text || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/ё/g, "e")
      .replace(/[^a-zа-я0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function pointInPolygon(point, polygonCoords) {
    const x = point[1];
    const y = point[0];
    let inside = false;

    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
      const xi = polygonCoords[i][0];
      const yi = polygonCoords[i][1];
      const xj = polygonCoords[j][0];
      const yj = polygonCoords[j][1];

      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  // Перевод координат GeoJSON [lon, lat] -> Yandex [lat, lon]
  function geoJsonToYandexCoords(coordinates) {
    if (!Array.isArray(coordinates)) return coordinates;
    if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
      return [coordinates[1], coordinates[0]];
    }
    return coordinates.map(geoJsonToYandexCoords);
  }

  function getDistrictByPoint(lat, lng) {
    for (const district of state.districtsBySlug.values()) {
      const ring = district.geometry.coordinates[0];
      if (pointInPolygon([lat, lng], ring)) {
        return district.properties.slug;
      }
    }
    return null;
  }

  async function fetchObjects() {
    const primary = await fetch("/objects.json");
    if (primary.ok) return primary.json();

    const fallback = await fetch("/data/objects.json");
    if (!fallback.ok) throw new Error("Не удалось загрузить objects.json");
    return fallback.json();
  }

  function createPlacemark(objectItem, isDimmed) {
    const coords = [objectItem.location.lat, objectItem.location.lng];
    const price = formatPrice(objectItem.priceUSD);

    const mark = new ymaps.Placemark(
      coords,
      {
        hintContent: objectItem.title,
        balloonContent: `
          <div style="min-width:220px;font-family:Inter,sans-serif;">
            <h4 style="margin:0 0 6px;font-size:16px;">${objectItem.title}</h4>
            <p style="margin:0 0 4px;"><strong>Цена:</strong> ${price}</p>
            <p style="margin:0 0 8px;"><strong>Район:</strong> ${objectItem.resolvedDistrictName || "Не указан"}</p>
            <a href="/objects/${objectItem.slug}" style="color:#155945;font-weight:600;">Открыть объект</a>
          </div>
        `
      },
      {
        preset: isDimmed ? "islands#grayCircleDotIcon" : "islands#darkGreenCircleDotIcon"
      }
    );

    mark.properties.set("districtSlug", objectItem.resolvedDistrictSlug || "");
    return mark;
  }

  function renderDistrictObjectsPanel(districtSlug) {
    const title = document.getElementById("lidaDistrictTitle");
    const stats = document.getElementById("lidaDistrictStats");
    const list = document.getElementById("lidaDistrictObjects");

    if (!districtSlug) {
      title.textContent = "Выберите район";
      stats.textContent = "Выберите район на карте, чтобы увидеть список объектов";
      list.innerHTML = "";
      return;
    }

    const district = state.districtsBySlug.get(districtSlug);
    const items = state.districtToObjects.get(districtSlug) || [];

    title.textContent = district.properties.name;
    stats.textContent = `Найдено объектов: ${items.length}`;

    if (!items.length) {
      list.innerHTML = '<li class="lida-objects-empty">В этом районе пока нет объектов</li>';
      return;
    }

    list.innerHTML = items
      .map((item) => {
        return `
          <li class="lida-objects-list__item">
            <p class="lida-objects-list__title">${item.title}</p>
            <p class="lida-objects-list__meta">${formatPrice(item.priceUSD)} · ${item.address || "Адрес уточняется"}</p>
            <a class="lida-objects-list__link" href="/objects/${item.slug}">Подробнее</a>
          </li>
        `;
      })
      .join("");
  }

  function buildClusterer(placemarks) {
    const clusterer = new ymaps.Clusterer({
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterOpenBalloonOnClick: false,
      clusterBalloonContentLayout: "cluster#balloonCarousel",
      clusterBalloonPanelMaxMapArea: 0,
      clusterIcons: [
        {
          href:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='54' viewBox='0 0 54 54'%3E%3Cdefs%3E%3Cfilter id='s' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeDropShadow dx='0' dy='4' stdDeviation='4' flood-color='%23155945' flood-opacity='.35'/%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='27' cy='27' r='22' fill='%23155945' fill-opacity='.93' filter='url(%23s)'/%3E%3Ccircle cx='27' cy='27' r='16' fill='%23d7b39a'/%3E%3C/svg%3E",
          size: [54, 54],
          offset: [-27, -27]
        }
      ],
      clusterIconContentLayout: ymaps.templateLayoutFactory.createClass(
        '<div style="color:#1f2a25;font-weight:700;font-size:15px;line-height:54px;text-align:center;">{{ properties.geoObjects.length }}</div>'
      )
    });

    clusterer.add(placemarks);
    clusterer.events.add("click", function (event) {
      const target = event.get("target");
      const bounds = typeof target.getBounds === "function" ? target.getBounds() : null;
      if (bounds) {
        state.map.setBounds(bounds, { checkZoomRange: true, duration: 300 });
      }
    });

    return clusterer;
  }

  function redrawMapObjects() {
    if (state.activeClusterer) {
      state.map.geoObjects.remove(state.activeClusterer);
    }

    state.objectMarksDimmed.forEach((mark) => state.map.geoObjects.remove(mark));

    const activeSlug = state.activeDistrictSlug;
    const activePlacemarks = activeSlug
      ? state.objectMarksAll.filter((m) => m.properties.get("districtSlug") === activeSlug)
      : state.objectMarksAll;

    state.activeClusterer = buildClusterer(activePlacemarks);
    state.map.geoObjects.add(state.activeClusterer);

    if (activeSlug) {
      state.objectMarksDimmed
        .filter((m) => m.properties.get("districtSlug") !== activeSlug)
        .forEach((mark) => state.map.geoObjects.add(mark));
    }
  }

  function activateDistrict(districtSlug, moveMap) {
    state.activeDistrictSlug = districtSlug;

    state.districtCollection.each((polygon) => {
      const isActive = polygon.properties.get("slug") === districtSlug;
      polygon.options.set("fillColor", isActive ? "rgba(21, 89, 69, 0.28)" : "rgba(215, 179, 154, 0.18)");
      polygon.options.set("strokeColor", isActive ? "#155945" : "#c99578");
      polygon.options.set("strokeWidth", isActive ? 3 : 2);
    });

    redrawMapObjects();
    renderDistrictObjectsPanel(districtSlug);

    if (districtSlug) {
      if (moveMap) {
        let districtPolygon = null;
        state.districtCollection.each((polygon) => {
          if (polygon.properties.get("slug") === districtSlug) {
            districtPolygon = polygon;
          }
        });
        const bounds = districtPolygon ? districtPolygon.geometry.getBounds() : null;
        if (bounds) {
          state.map.setBounds(bounds, { checkZoomRange: true, duration: 350 });
        }
      }
      history.replaceState(null, "", `?district=${districtSlug}`);
    } else {
      history.replaceState(null, "", window.location.pathname);
    }
  }

  function initDistricts(features) {
    const collection = new ymaps.GeoObjectCollection();

    features.forEach((feature) => {
      state.districtsBySlug.set(feature.properties.slug, feature);
      state.districtToObjects.set(feature.properties.slug, []);

      const polygonCoordinates = geoJsonToYandexCoords(feature.geometry.coordinates);
      const polygon = new ymaps.Polygon(polygonCoordinates, {
        hintContent: feature.properties.name,
        districtName: feature.properties.name,
        slug: feature.properties.slug
      }, {
        fillColor: "rgba(215, 179, 154, 0.18)",
        strokeColor: "#c99578",
        strokeOpacity: 0.95,
        strokeWidth: 2,
        zIndex: 200,
        cursor: "pointer"
      });

      polygon.events.add("mouseenter", function () {
        if (state.activeDistrictSlug !== feature.properties.slug) {
          polygon.options.set("fillColor", "rgba(56, 116, 94, 0.25)");
        }
      });

      polygon.events.add("mouseleave", function () {
        if (state.activeDistrictSlug !== feature.properties.slug) {
          polygon.options.set("fillColor", "rgba(215, 179, 154, 0.18)");
        }
      });

      polygon.events.add("click", function () {
        activateDistrict(feature.properties.slug, true);
      });

      collection.add(polygon);
    });

    state.districtCollection = collection;
    state.map.geoObjects.add(collection);
  }

  function prepareObjects(objects) {
    state.allObjects = objects.filter((item) => item.location && item.location.lat && item.location.lng);

    state.allObjects.forEach((item) => {
      const rawSlug = normalizeDistrictSlug(item.district);
      const byPoint = getDistrictByPoint(item.location.lat, item.location.lng);
      const districtSlug = state.districtsBySlug.has(rawSlug) ? rawSlug : byPoint;

      item.resolvedDistrictSlug = districtSlug;
      item.resolvedDistrictName = districtSlug
        ? state.districtsBySlug.get(districtSlug).properties.name
        : item.district || "Не указан";

      if (districtSlug && state.districtToObjects.has(districtSlug)) {
        state.districtToObjects.get(districtSlug).push(item);
      }
    });

    state.objectMarksAll = state.allObjects.map((item) => createPlacemark(item, false));
    state.objectMarksDimmed = state.allObjects.map((item) => createPlacemark(item, true));
  }

  async function initMap() {
    const mapRoot = document.getElementById(MAP_CONTAINER_ID);
    if (!mapRoot || !window.ymaps) return;

    try {
      const [districtsResponse, objects] = await Promise.all([
        fetch("/data/lida-districts.geojson").then((response) => response.json()),
        fetchObjects()
      ]);

      state.map = new ymaps.Map(MAP_CONTAINER_ID, {
        center: LIDA_CENTER,
        zoom: 12,
        controls: ["zoomControl", "fullscreenControl"]
      }, {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true
      });

      initDistricts(districtsResponse.features || []);
      prepareObjects(objects || []);
      redrawMapObjects();

      const queryDistrict = new URLSearchParams(window.location.search).get("district");
      if (queryDistrict && state.districtsBySlug.has(queryDistrict)) {
        activateDistrict(queryDistrict, true);
      } else {
        renderDistrictObjectsPanel(null);
      }
    } catch (error) {
      console.error("Ошибка загрузки карты районов:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      ymaps.ready(initMap);
    });
  } else {
    ymaps.ready(initMap);
  }
})();
