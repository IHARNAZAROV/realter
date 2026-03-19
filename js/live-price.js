(function () {
  "use strict";

  const NBRB_USD_RATE_URL = "https://api.nbrb.by/exrates/rates/431";
  let cachedUsdRatePromise = null;

  async function fetchUsdRate() {
    if (!cachedUsdRatePromise) {
      cachedUsdRatePromise = fetch(NBRB_USD_RATE_URL, { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Не удалось получить курс USD из API НБРБ");
          }

          return res.json();
        })
        .then((data) => {
          const rate = Number(data?.Cur_OfficialRate);
          const scale = Number(data?.Cur_Scale) || 1;
          const actualDate = data?.Date ? new Date(data.Date) : null;

          if (!Number.isFinite(rate) || rate <= 0) {
            throw new Error("API НБРБ вернул некорректный курс USD");
          }

          return {
            ratePerUnit: rate / scale,
            dateLabel:
              actualDate && !Number.isNaN(actualDate.getTime())
                ? actualDate.toLocaleDateString("ru-RU")
                : "",
          };
        })
        .catch((error) => {
          cachedUsdRatePromise = null;
          throw error;
        });
    }

    return cachedUsdRatePromise;
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
    if (!obj || typeof obj !== "object") return obj;

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
    if (!Array.isArray(objects) || !objects.length) return objects;

    const needRate = objects.some(
      (obj) => typeof obj?.priceUSD === "number" && obj.priceUSD > 0,
    );

    let rateData = null;

    if (needRate) {
      try {
        rateData = await fetchUsdRate();
      } catch (error) {
        console.error(error);
      }
    }

    return objects.map((obj) => {
      if (!obj || typeof obj !== "object") return obj;

      if (rateData && typeof obj.priceUSD === "number" && obj.priceUSD > 0) {
        return {
          ...obj,
          livePriceBYN: Math.round(obj.priceUSD * rateData.ratePerUnit),
        };
      }

      return {
        ...obj,
        livePriceBYN: getLiveBynPriceSync(obj),
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
