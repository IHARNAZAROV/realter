/* ======================================================
   PORTFOLIO STATISTICS MODULE
   Работает с массивом objects
====================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------
     PRICE RANGES CONFIG
  ------------------------------------------------------ */
  const PRICE_RANGES = [
    { key: "<30000", min: 0, max: 29999 },
    { key: "30000-50000", min: 30000, max: 49999 },
    { key: "50000-80000", min: 50000, max: 79999 },
    { key: "80000+", min: 80000, max: Infinity }
  ];

  /* ------------------------------------------------------
     MAIN CALCULATION
  ------------------------------------------------------ */
  function calculatePortfolioStatistics(objects) {
    const stats = {
      rooms: {},
      types: {},
      cities: {},
      districts: {},
      priceRanges: {},
      avgPricePerM2: {}
    };

    // init price ranges
    PRICE_RANGES.forEach(r => {
      stats.priceRanges[r.key] = 0;
    });

    objects.forEach(obj => {
      /* ---------- ROOMS ---------- */
      if (Number.isFinite(obj.rooms)) {
        const roomKey = obj.rooms >= 4 ? "4+" : String(obj.rooms);
        stats.rooms[roomKey] = (stats.rooms[roomKey] || 0) + 1;
      }

      /* ---------- TYPE ---------- */
      if (obj.type) {
        stats.types[obj.type] = (stats.types[obj.type] || 0) + 1;
      }

      /* ---------- CITY ---------- */
      if (obj.city) {
        stats.cities[obj.city] = (stats.cities[obj.city] || 0) + 1;
      }

      /* ---------- DISTRICT ---------- */
      if (obj.district) {
        stats.districts[obj.district] =
          (stats.districts[obj.district] || 0) + 1;
      }

      /* ---------- PRICE RANGES ---------- */
      if (Number.isFinite(obj.priceUSD)) {
        const price = obj.priceUSD;

        PRICE_RANGES.forEach(range => {
          if (price >= range.min && price <= range.max) {
            stats.priceRanges[range.key]++;
          }
        });
      }

      /* ---------- AVG PRICE PER M² ---------- */
      if (
        Number.isFinite(obj.priceUSD) &&
        Number.isFinite(obj.areaTotal) &&
        Number.isFinite(obj.rooms) &&
        obj.areaTotal > 0
      ) {
        const roomKey = obj.rooms >= 4 ? "4+" : String(obj.rooms);
        const pricePerM2 = obj.priceUSD / obj.areaTotal;

        if (!stats.avgPricePerM2[roomKey]) {
          stats.avgPricePerM2[roomKey] = {
            sum: 0,
            count: 0
          };
        }

        stats.avgPricePerM2[roomKey].sum += pricePerM2;
        stats.avgPricePerM2[roomKey].count++;
      }
    });

    return normalizeStatistics(stats);
  }

  /* ------------------------------------------------------
     NORMALIZATION
  ------------------------------------------------------ */
  function normalizeStatistics(stats) {
    const normalized = {
      rooms: stats.rooms,
      types: stats.types,
      cities: stats.cities,
      districts: stats.districts,
      priceRanges: stats.priceRanges,
      avgPricePerM2: {}
    };

    Object.entries(stats.avgPricePerM2).forEach(([key, data]) => {
      normalized.avgPricePerM2[key] = Math.round(
        data.sum / data.count
      );
    });

    return normalized;
  }

  /* ------------------------------------------------------
     PUBLIC API
  ------------------------------------------------------ */
  window.PortfolioStatistics = {
    calculate(objects) {
      if (!Array.isArray(objects)) {
        console.warn("PortfolioStatistics: objects is not an array");
        return null;
      }
      return calculatePortfolioStatistics(objects);
    }
  };





})();