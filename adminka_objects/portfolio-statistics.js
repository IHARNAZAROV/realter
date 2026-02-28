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
    const now = new Date();

    const stats = {
      rooms: {},
      types: {},
      cities: {},
      districts: {},
      priceRanges: {},
      avgPricePerM2: {},
      soldDays: [],
      agingDistribution: {
        "0-30": 0,
        "31-60": 0,
        "61-90": 0,
        "90+": 0
      }
    };

    const sellThrough = calculateSellThroughRate(objects, 30, now);
    const overpricingShare = calculateOverpricingShare(objects);

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

      /* ---------- MEDIAN TIME TO SALE ---------- */
      if (obj.status?.type === "sold") {
        const publishedAt = toDate(obj.publishedAt);
        const soldAt = toDate(obj.status?.date);

        if (publishedAt && soldAt) {
          const days = dayDiff(publishedAt, soldAt);
          if (days >= 0) {
            stats.soldDays.push(days);
          }
        }
      }

      /* ---------- AGING DISTRIBUTION ---------- */
      const isActive = obj.status?.type !== "sold";
      if (isActive) {
        const publishedAt = toDate(obj.publishedAt);
        if (!publishedAt) return;

        const ageDays = dayDiff(publishedAt, now);

        if (ageDays <= 30) {
          stats.agingDistribution["0-30"]++;
        } else if (ageDays <= 60) {
          stats.agingDistribution["31-60"]++;
        } else if (ageDays <= 90) {
          stats.agingDistribution["61-90"]++;
        } else {
          stats.agingDistribution["90+"]++;
        }
      }
    });

    return normalizeStatistics(stats, {
      sellThrough,
      overpricingShare
    });
  }

  /* ------------------------------------------------------
     NORMALIZATION
  ------------------------------------------------------ */
  function normalizeStatistics(stats, extra = {}) {
    const soldDays = [...stats.soldDays].sort((a, b) => a - b);
    const medianTimeToSaleDays = getMedian(soldDays);
    const totalActive = Object.values(stats.agingDistribution).reduce(
      (sum, value) => sum + value,
      0
    );

    const agingDistribution = Object.fromEntries(
      Object.entries(stats.agingDistribution).map(([bucket, count]) => {
        const sharePct = totalActive
          ? round2((count / totalActive) * 100)
          : 0;
        return [bucket, { count, sharePct }];
      })
    );

    const normalized = {
      rooms: stats.rooms,
      types: stats.types,
      cities: stats.cities,
      districts: stats.districts,
      priceRanges: stats.priceRanges,
      avgPricePerM2: {},
      medianTimeToSaleDays,
      agingDistribution: {
        totalActive,
        buckets: agingDistribution
      },
      sellThroughRate30d: extra.sellThrough || null,
      overpricingShare: extra.overpricingShare || null
    };

    Object.entries(stats.avgPricePerM2).forEach(([key, data]) => {
      normalized.avgPricePerM2[key] = Math.round(
        data.sum / data.count
      );
    });

    return normalized;
  }

  function calculateSellThroughRate(objects, periodDays, now) {
    const MS_IN_DAY = 1000 * 60 * 60 * 24;
    const periodStart = new Date(now.getTime() - periodDays * MS_IN_DAY);

    let soldInPeriod = 0;
    let activeAtPeriodStart = 0;

    objects.forEach(obj => {
      const publishedAt = toDate(obj.publishedAt);
      if (!publishedAt || publishedAt > periodStart) return;

      const soldAt =
        obj.status?.type === "sold" ? toDate(obj.status?.date) : null;

      if (soldAt && soldAt >= periodStart && soldAt <= now) {
        soldInPeriod++;
      }

      if (!soldAt || soldAt > periodStart) {
        activeAtPeriodStart++;
      }
    });

    return {
      periodDays,
      soldInPeriod,
      activeAtPeriodStart,
      ratePct: activeAtPeriodStart
        ? round2((soldInPeriod / activeAtPeriodStart) * 100)
        : 0
    };
  }

  function calculateOverpricingShare(objects, thresholdPct = 7) {
    const segmentStats = {};

    objects.forEach(obj => {
      const isActive = obj.status?.type !== "sold";
      if (!isActive) return;

      const priceUSD = Number(obj.priceUSD);
      const areaTotal = Number(obj.areaTotal);
      if (!Number.isFinite(priceUSD) || !Number.isFinite(areaTotal) || areaTotal <= 0) {
        return;
      }

      const key = buildMarketSegmentKey(obj);
      if (!segmentStats[key]) {
        segmentStats[key] = { sum: 0, count: 0 };
      }

      segmentStats[key].sum += priceUSD / areaTotal;
      segmentStats[key].count += 1;
    });

    let totalAnalyzed = 0;
    let overpricedCount = 0;

    objects.forEach(obj => {
      const isActive = obj.status?.type !== "sold";
      if (!isActive) return;

      const priceUSD = Number(obj.priceUSD);
      const areaTotal = Number(obj.areaTotal);
      if (!Number.isFinite(priceUSD) || !Number.isFinite(areaTotal) || areaTotal <= 0) {
        return;
      }

      const key = buildMarketSegmentKey(obj);
      const segment = segmentStats[key];
      if (!segment || segment.count < 2) return;

      const marketPricePerM2 = segment.sum / segment.count;
      const currentPricePerM2 = priceUSD / areaTotal;
      const gapPct = ((currentPricePerM2 - marketPricePerM2) / marketPricePerM2) * 100;

      totalAnalyzed++;
      if (gapPct > thresholdPct) {
        overpricedCount++;
      }
    });

    return {
      thresholdPct,
      totalAnalyzed,
      overpricedCount,
      sharePct: totalAnalyzed
        ? round2((overpricedCount / totalAnalyzed) * 100)
        : 0
    };
  }

  function buildMarketSegmentKey(obj) {
    const type = obj.type || "unknown";
    const city = obj.city || "unknown";
    const roomKey = Number.isFinite(obj.rooms)
      ? (obj.rooms >= 4 ? "4+" : String(obj.rooms))
      : "all";

    return `${type}|${city}|${roomKey}`;
  }

  function toDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  function dayDiff(fromDate, toDateValue) {
    const MS_IN_DAY = 1000 * 60 * 60 * 24;
    return Math.floor((toDateValue - fromDate) / MS_IN_DAY);
  }

  function getMedian(sortedNumbers) {
    if (!sortedNumbers.length) return null;
    const middle = Math.floor(sortedNumbers.length / 2);

    if (sortedNumbers.length % 2 === 0) {
      return round2((sortedNumbers[middle - 1] + sortedNumbers[middle]) / 2);
    }

    return sortedNumbers[middle];
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
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
