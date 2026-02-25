export async function handler() {
  try {
    const url =
      "https://news.google.com/rss/search" +
      "?q=недвижимость+квартира+дом" +
      "&hl=ru&gl=BY&ceid=BY:ru";

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!r.ok) {
      throw new Error("News RSS fetch failed");
    }

    const text = await r.text();

    const titles = [...text.matchAll(/<title>(.*?)<\/title>/g)]
      .map(m => m[1])
      .slice(1); // первый — служебный

    const demandIndex = Math.min(100, titles.length * 5);

    return {
      statusCode: 200,
      body: JSON.stringify({
        demandIndex,
        articles: titles.length,
        source: "Google News"
      })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "News RSS failed",
        details: e.message
      })
    };
  }
}