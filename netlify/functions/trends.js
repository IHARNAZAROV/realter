export async function handler() {
  try {
    const keywords = [
      "купить квартиру Лида",
      "продажа дома Лидский район"
    ];

    const hl = "ru";
    const geo = "BY";
    const time = "today 1-m";

    const exploreReq = {
      comparisonItem: keywords.map(keyword => ({
        keyword,
        geo,
        time
      })),
      category: 0,
      property: ""
    };

    const exploreUrl =
      "https://trends.google.com/trends/api/explore" +
      "?hl=" + hl +
      "&tz=-180" +
      "&req=" + encodeURIComponent(JSON.stringify(exploreReq));

    const exploreRes = await fetch(exploreUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!exploreRes.ok) {
      throw new Error("Explore request failed");
    }

    const exploreText = await exploreRes.text();
    const exploreJson = JSON.parse(
      exploreText.replace(/^\)\]\}',?/, "")
    );

    const widget = exploreJson.widgets?.find(
      w => w.id === "TIMESERIES"
    );

    if (!widget) {
      throw new Error("TIMESERIES widget not found");
    }

    const dataUrl =
      "https://trends.google.com/trends/api/widgetdata/multiline" +
      "?hl=" + hl +
      "&tz=-180" +
      "&req=" + encodeURIComponent(JSON.stringify(widget.request)) +
      "&token=" + widget.token;

    const dataRes = await fetch(dataUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!dataRes.ok) {
      throw new Error("Timeline request failed");
    }

    const dataText = await dataRes.text();
    const dataJson = JSON.parse(
      dataText.replace(/^\)\]\}',?/, "")
    );

    const timeline = dataJson.default?.timelineData;

    if (!timeline || !timeline.length) {
      throw new Error("No timeline data");
    }

    const avg =
      timeline.reduce((sum, p) => sum + (p.value?.[0] || 0), 0) /
      timeline.length;

    return {
      statusCode: 200,
      body: JSON.stringify({
        demandIndex: Math.round(avg),
        keywords,
        period: "30 days"
      })
    };

  } catch (err) {
    console.error("Trends error:", err.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Trends fetch failed",
        details: err.message
      })
    };
  }
}