export async function handler() {
  try {
    const geo = "BY";
    const url = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!r.ok) {
      throw new Error("RSS fetch failed");
    }

    const text = await r.text();

    const titles = [...text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
      .map(m => m[1])
      .slice(1); // первый title — служебный

    const realEstateKeywords = [
      "квартира",
      "дом",
      "недвиж",
      "ипотек",
      "жиль"
    ];

    const estateHits = titles.filter(title =>
      realEstateKeywords.some(k =>
        title.toLowerCase().includes(k)
      )
    ).length;

    const demandIndex = Math.round(
      (estateHits / titles.length) * 100
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        demandIndex,
        totalTrends: titles.length,
        estateTrends: estateHits,
        source: "Google Trending Searches"
      })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Trending RSS failed",
        details: e.message
      })
    };
  }
}