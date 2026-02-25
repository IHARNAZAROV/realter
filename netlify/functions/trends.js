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
      comparisonItem: keywords.map(k => ({
        keyword: k,
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

    const r = await fetch(exploreUrl);
    const text = await r.text();
    const json = JSON.parse(text.replace(/^\)\]\}',?/, ""));

    const widget = json.widgets.find(w => w.id === "TIMESERIES");
    const widgetReq = widget.request;
    const token = widget.token;

    const dataUrl =
      "https://trends.google.com/trends/api/widgetdata/multiline" +
      "?hl=" + hl +
      "&tz=-180" +
      "&req=" + encodeURIComponent(JSON.stringify(widgetReq)) +
      "&token=" + token;

    const r2 = await fetch(dataUrl);
    const text2 = await r2.text();
    const json2 = JSON.parse(text2.replace(/^\)\]\}',?/, ""));

    const timeline = json2.default.timelineData;

    const avg =
      timeline.reduce((s, p) => s + p.value[0], 0) / timeline.length;

    return {
      statusCode: 200,
      body: JSON.stringify({
        demandIndex: Math.round(avg),
        keywords,
        period: "30 days"
      })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Trends fetch failed" })
    };
  }
}