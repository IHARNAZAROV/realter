(function () {
  "use strict";

  const slider = document.querySelector(".service-slider");
  if (!slider) return;

  const ROOM_LABELS = {
    "1": "Однокомнатная квартира",
    "2": "Двухкомнатная квартира",
    "3": "Трехкомнатная квартира",
    "4": "Четырехкомнатная квартира",
    "5": "Пятикомнатная квартира",
  };

  function toAbsoluteImagePath(path) {
    if (!path || typeof path !== "string") {
      return "images/objects/placeholder.webp";
    }
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return path.startsWith("/") ? path : `/${path}`;
  }

  function getLocationLabel(objectItem) {
    const city = objectItem?.city ? `город ${objectItem.city}` : "";
    const address = objectItem?.address || "";

    if (city && address) return `${city}, ${address}`;
    return city || address || "Объект недвижимости";
  }

  function getShortTitle(objectItem) {
    const type = (objectItem?.type || "").toLowerCase();
    if (type.includes("дом")) {
      return "Дом с участком";
    }

    const sourceText = `${objectItem?.description || ""} ${objectItem?.title || ""}`;
    const roomsMatch = sourceText.match(/(\d+)\s*[- ]?комнатн/i);

    if (roomsMatch && ROOM_LABELS[roomsMatch[1]]) {
      return ROOM_LABELS[roomsMatch[1]];
    }

    if (type.includes("квартира")) {
      return "Квартира";
    }

    return objectItem?.type || "Объект недвижимости";
  }

  function buildSlideMarkup(objectItem) {
    const link = `/objects/${encodeURIComponent(objectItem.slug)}`;
    const image = toAbsoluteImagePath(objectItem?.images?.[0]);
    const locationLabel = getLocationLabel(objectItem);
    const shortTitle = getShortTitle(objectItem);

    return `
      <div class="item">
        <a href="${link}" class="service-card-link" target="_blank" rel="nofollow noopener noreferrer">
          <div class="bgcall-block d-flex flex-wrap justify-content-center align-content-end bg-cover overlay-wraper" style="background-image: url('${image}');">
            <div class="overlay-main bg-black opacity-07"></div>
            <div class="bg-content-mid-outer">
              <div class="bg-content-mid">
                <div class="sx-icon-box-wraper center text-white">
                  <div class="icon-lg m-b15">
                    <span class="icon-cell"><i class="flaticon-home-1"></i></span>
                  </div>
                  <div class="icon-content">
                    <h4 class="sx-tilte">
                      <span class="sx-text-white">${locationLabel}</span>
                    </h4>
                  </div>
                </div>
                <span class="bgcall-block-number">${shortTitle}</span>
                <div class="bg-overlay"></div>
              </div>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  async function initRecommendedObjectsSlider() {
    try {
      const response = await fetch("/data/objects.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch objects.json");

      const objects = await response.json();
      const recommended = Array.isArray(objects)
        ? objects.filter((item) => item && item.recommended === true && item.slug)
        : [];

      slider.innerHTML = recommended.map(buildSlideMarkup).join("");
      window.dispatchEvent(new Event("recommended-slider-ready"));
    } catch (error) {
      slider.innerHTML = "";
      console.error("Не удалось загрузить рекомендуемые объекты для слайдера:", error);
    }
  }

  initRecommendedObjectsSlider();
})();
