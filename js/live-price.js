(function () {
  "use strict";

  const API_URL = "https://api.nbrb.by/exrates/rates/431";
  const STORAGE_KEY = "realter_usd_byn_rate";

  let ratePromise = null;

  function formatApiDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("ru-RU");
  }

  function getTodayIsoDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function getApiDateForQuery() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  function normalizeRatePayload(payload) {
    const officialRate = Number(payload?.Cur_OfficialRate);
    const scale = Number(payload?.Cur_Scale) || 1;
    const apiDate = payload?.Date ? new Date(payload.Date) : null;

    if (!Number.isFinite(officialRate) || officialRate <= 0) {
      throw new Error("API НБРБ вернул некорректный курс USD");
    }

    return {
      ratePerUnit: officialRate / scale,
      dateLabel: formatApiDate(apiDate),
      fetchedOn: getTodayIsoDate(),
    };
  }

  function readRateCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;

      const ratePerUnit = Number(parsed.ratePerUnit);
      const dateLabel = typeof parsed.dateLabel === "string" ? parsed.dateLabel : "";
      const fetchedOn = typeof parsed.fetchedOn === "string" ? parsed.fetchedOn : "";

      if (!Number.isFinite(ratePerUnit) || ratePerUnit <= 0) {
        return null;
      }

      return {
        ratePerUnit,
        dateLabel,
        fetchedOn,
      };
    } catch (_) {
      return null;
    }
  }

  function writeRateCache(rateData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rateData));
    } catch (_) {
      // ignore storage errors
    }
  }

  async function fetchUsdRate() {
    if (ratePromise) {
      return ratePromise;
    }

    const cached = readRateCache();
    if (cached && cached.fetchedOn === getTodayIsoDate()) {
      return cached;
    }

    const requestUrl = `${API_URL}?ondate=${encodeURIComponent(getApiDateForQuery())}&parammode=2`;

    ratePromise = fetch(requestUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Не удалось получить курс USD из API НБРБ");
        }

        return res.json();
      })
      .then((payload) => {
        const normalized = normalizeRatePayload(payload);
        writeRateCache(normalized);
        return normalized;
      })
      .catch((error) => {
        ratePromise = null;

        if (cached) {
          return cached;
        }

        throw error;
      });

    return ratePromise;
  }

  function getLiveBynPriceSync(obj) {
    if (typeof obj?.livePriceBYN === "number" && obj.livePriceBYN > 0) {
      return obj.livePriceBYN;
    }

    if (typeof obj?.priceBYN === "number" && obj.priceBYN > 0) {
      return obj.priceBYN;
    }

    return null;
  }

  async function enrichObjectWithLivePrice(obj) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    if (typeof obj.priceUSD === "number" && obj.priceUSD > 0) {
      try {
        const rateData = await fetchUsdRate();
        return {
          ...obj,
          livePriceBYN: Math.round(obj.priceUSD * rateData.ratePerUnit),
        };
      } catch (error) {
        console.error(error);
      }
    }

    return {
      ...obj,
      livePriceBYN: getLiveBynPriceSync(obj),
    };
  }

  async function enrichObjectsWithLivePrices(objects) {
    if (!Array.isArray(objects) || objects.length === 0) {
      return objects;
    }

    const hasUsdObjects = objects.some(
      (item) => typeof item?.priceUSD === "number" && item.priceUSD > 0,
    );

    let rateData = null;

    if (hasUsdObjects) {
      try {
        rateData = await fetchUsdRate();
      } catch (error) {
        console.error(error);
      }
    }

    return objects.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      if (rateData && typeof item.priceUSD === "number" && item.priceUSD > 0) {
        return {
          ...item,
          livePriceBYN: Math.round(item.priceUSD * rateData.ratePerUnit),
        };
      }

      return {
        ...item,
        livePriceBYN: getLiveBynPriceSync(item),
      };
    });
  }

  window.RealterPrice = {
    fetchUsdRate,
    getLiveBynPriceSync,
    enrichObjectWithLivePrice,
    enrichObjectsWithLivePrices,
  };
})();
