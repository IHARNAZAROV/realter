(function () {
  "use strict";

  const OBJECTS_DATA_URL = "/data/objects.json";
  const MAPTILER_KEY = "ZSZnUbPl4oOTpdLavjmE";
  const BRAND_COLOR = "#155945";
  const BRAND_NAME = "Ольга Турко";

  const PDFMAKE_SOURCES = [
    {
      lib: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/pdfmake.min.js",
      vfs: [
        "https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/vfs_fonts.js",
        "https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/vfs_fonts.min.js",
      ],
    },
    {
      lib: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js",
      vfs: [
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js",
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js",
      ],
    },
    {
      lib: "https://unpkg.com/pdfmake@0.2.7/build/pdfmake.min.js",
      vfs: [
        "https://unpkg.com/pdfmake@0.2.7/build/vfs_fonts.js",
        "https://unpkg.com/pdfmake@0.2.7/build/vfs_fonts.min.js",
      ],
    },
  ];

  const previewImages = {
    "dom-lidskiy-rayon-krupovo": "images/objects/pic1.webp",
    "dom-lida-severnyy-gorodok-ul-govorova": "images/objects/pic2.webp",
    "kvartira-lida-ul-zarechnaya-39": "images/objects/pic3.webp",
    "dom-lidskiy-rayon-sheybaki": "images/objects/pic4.webp",
    "kvartira-lida-yuzhnyy-gorodok": "images/objects/pic5.webp",
    "dom-shchuchinskiy-rayon-rozhanka": "images/objects/pic6.webp",
    "kvartira-lida-yuzhnyy-gorodok-d-19": "images/objects/pic7.webp",
    "dom-dokudovo-2": "images/objects/pic8.webp",
    "kvartira-lida-ul-varshavskaya-44": "images/objects/pic9.webp",
    "kvartira-lida-ul-letnaya-8": "images/objects/pic10.webp",
    "dom-lidskiy-rayon-melyashi": "images/objects/pic11.webp",
    "kvartira-lida-ul-tuhachevskogo-65-k1": "images/objects/pic12.webp",
    "kvartira-lida-ul-masherova-7-k2": "images/objects/pic13.webp",
    "kvartira-lida-ul-masherova": "images/objects/pic14.webp",
    "kvartira-lida-ul-tuhachevskogo": "images/objects/pic15.webp",
    "dom-lidskiy-rayon-minoyty": "images/objects/pic16.webp",
    "kvartira-lida-ul-kosmonavtov": "images/objects/pic17.webp",
    "kvartira-lida-ul-zarechnaya-7": "images/objects/pic18.webp",
    "dom-lidskiy-rayon-ostrovlya-novoselov": "images/objects/pic19.webp",
    "kvartira-laykovshchina-lidskiy-rayon": "images/objects/pic20.webp",
    "kvartira-lida-ul-prolygina-4": "images/objects/pic21.webp",
    "dom-shchuchinskiy-rayon-skribovtsy": "images/objects/pic22.webp",
    "dom-shchuchinskiy-rayon-boyary-zheludokskie": "images/objects/pic23.webp",
    "kvartira-volkovysk-centr": "images/objects/pic24.webp",
    "kvartira-lida-knyazya-gedimina-7": "images/objects/pic25.webp",
    "sto-lida-ignatova-42-veras-avto": "images/objects/pic26.webp",
    "kvartira-volkovysk-socialisticheskaya": "images/objects/pic27.webp",
    "dom-lida-ul-shchedrina": "images/objects/pic28.webp",
    "kvartira-lida-ul-tavlaya-25a": "images/objects/pic29.webp",
    "kvartira-shchuchin-ul-ostrovskogo-5": "images/objects/pic30.webp",
    "kvartira-lida-ul-nevskogo-20a": "images/objects/pic31.webp",
    "kvartira-lida-ul-sovetskaya-36": "images/objects/pic32.webp",
    "kvartira-lida-ul-respublikanskaya-7": "images/objects/pic33.webp",
    "kvartira-lida-ul-kosmonavtov-12-k1": "images/objects/pic34.webp",
    "dom-yodki-ul-sadovaya": "images/objects/pic35.webp",
    "kvartira-lida-ul-urickogo-60": "images/objects/pic36.webp",
    "kvartira-lida-ul-yuzhnyy-gorodok-24": "images/objects/pic37.webp",
    "kvartira-lida-ul-tukhachevskogo-65": "images/objects/pic38.webp",
    "kvartira-lida-ul-sovetskaya-36-stalinka": "images/objects/pic39.webp",
    "kvartira-lida-ul-nevskogo-20-cheshka": "images/objects/pic40.webp",
    "kvartira-lida-ul-naberezhnaya-1-vid-na-ozero": "/images/objects/pic41.webp",
    "kvartira-lida-ul-hasanovskaya-1-64": "/images/objects/pic42.webp",
  };

  const state = { activeObject: null };

  const qs = (selector, root = document) => root.querySelector(selector);

  function getSlugFromUrl() {
    const url = new URL(window.location.href);
    const querySlug = url.searchParams.get("slug");
    if (querySlug) return querySlug;

    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length === 2 && (parts[0] === "objects" || parts[0] === "object")) {
      return decodeURIComponent(parts[1]);
    }

    return "";
  }

  async function fetchObjects() {
    const response = await fetch(OBJECTS_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Не удалось загрузить объекты");
    return response.json();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-runtime-src="${src}"]`);
      if (existing && existing.dataset.loaded === "1") return resolve();
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.runtimeSrc = src;
      script.onload = () => {
        script.dataset.loaded = "1";
        resolve();
      };
      script.onerror = () => {
        script.remove();
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  async function ensurePdfMake() {
    if (window.pdfMake && typeof window.pdfMake.createPdf === "function" && window.pdfMake.vfs) return true;

    let lastError = null;
    for (const source of PDFMAKE_SOURCES) {
      try {
        await loadScript(source.lib);

        let vfsLoaded = false;
        for (const vfsSrc of source.vfs) {
          try {
            await loadScript(vfsSrc);
            vfsLoaded = true;
            break;
          } catch (vfsError) {
            lastError = vfsError;
          }
        }

        if (!vfsLoaded) continue;
        if (window.pdfMake && typeof window.pdfMake.createPdf === "function" && window.pdfMake.vfs) return true;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw new Error(`Не удалось загрузить pdfmake: ${lastError.message}`);
    return false;
  }

  async function imagePathToDataUrl(path, outputMime = "image/jpeg", quality = 0.9) {
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = new URL(path, window.location.origin).toString();
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 800;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL(outputMime, quality);
  }

  async function fetchMapDataUrl(obj) {
    const lat = obj.location && Number(obj.location.lat);
    const lng = obj.location && Number(obj.location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const mapUrl = `https://api.maptiler.com/maps/streets-v2/static/${lng},${lat},14/1200x700.png?markers=${lng},${lat},lightred&key=${MAPTILER_KEY}`;

    try {
      const response = await fetch(mapUrl);
      if (!response.ok) throw new Error(`Map request failed: ${response.status}`);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Не удалось загрузить карту для PDF", error);
      return null;
    }
  }

  function formatPrice(value) {
    if (typeof value !== "number") return "Цена по запросу";
    return `${value.toLocaleString("ru-RU")} BYN`;
  }

  function getCoverImagePath(obj) {
    return previewImages[obj.slug] || (Array.isArray(obj.images) && obj.images[0]) || "/images/objects/pic1.webp";
  }

  function getFilenameForObject(obj) {
    if (obj.slug) return `${obj.slug}.pdf`;
    return "object-presentation.pdf";
  }

  function buildSpecRows(obj) {
    return [
      ["Общая площадь", obj.areaTotal ? `${obj.areaTotal} м²` : "—"],
      ["Жилая площадь", obj.areaLiving ? `${obj.areaLiving} м²` : "—"],
      ["Площадь кухни", obj.areaKitchen ? `${obj.areaKitchen} м²` : "—"],
      ["Этаж", obj.floor || "—"],
      ["Этажей в доме", obj.floorsTotal || "—"],
      ["Тип недвижимости", obj.type || "—"],
    ];
  }

  async function buildDocumentDefinition(obj) {
    const coverDataUrl = await imagePathToDataUrl(getCoverImagePath(obj), "image/jpeg", 0.9);
    const mapDataUrl = await fetchMapDataUrl(obj);

    const locationLine = [obj.city, obj.address].filter(Boolean).join(", ");
    const dealLine = [obj.dealType || "Продажа", obj.type].filter(Boolean).join(" · ");

    const mainFacts = [
      `Комнат: ${obj.rooms || "—"}`,
      `Этаж: ${obj.floor || "—"}/${obj.floorsTotal || "—"}`,
      `Год постройки: ${obj.yearBuilt || "—"}`,
    ].join("    ");

    const detailRows = [
      ["Балкон", obj.balcony || "—"],
      ["Ремонт", obj.renovation || obj.finishing || "—"],
      ["Высота потолков", obj.ceilingHeight || "—"],
      ["Полы", obj.flooring || "—"],
      ["Санузел", obj.bathroom || "—"],
    ];

    return {
      pageSize: "A4",
      pageMargins: [24, 24, 24, 24],
      background: (currentPage, pageSize) => {
        if (currentPage === 1) return null;
        return {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: pageSize.width,
              h: pageSize.height,
              color: "#0A3B31",
            },
          ],
        };
      },
      info: {
        title: obj.title || "Презентация объекта",
        author: BRAND_NAME,
        subject: "Презентация объекта недвижимости",
      },
      styles: {
        sectionTitle: { fontSize: 24, bold: true, color: "#FFFFFF", margin: [0, 0, 0, 14] },
        body: { fontSize: 11, lineHeight: 1.35, color: "#1D2523" },
        lightBody: { fontSize: 11, lineHeight: 1.35, color: "#DDE7E3" },
      },
      content: [
        {
          stack: [
            { image: coverDataUrl, fit: [547, 794], absolutePosition: { x: 24, y: 24 } },
            {
              canvas: [{ type: "rect", x: 0, y: 0, w: 547, h: 794, color: "#000000", opacity: 0.32 }],
              absolutePosition: { x: 24, y: 24 },
            },
            { text: BRAND_NAME, absolutePosition: { x: 44, y: 48 }, color: "#FFFFFF", fontSize: 16, bold: true },
            {
              text: obj.title || "Объект недвижимости",
              absolutePosition: { x: 44, y: 225 },
              color: "#FFFFFF",
              fontSize: 34,
              bold: true,
              width: 500,
            },
            { text: formatPrice(obj.priceBYN), absolutePosition: { x: 44, y: 702 }, color: BRAND_COLOR, fontSize: 28, bold: true },
            { text: locationLine, absolutePosition: { x: 44, y: 742 }, color: "#FFFFFF", fontSize: 13, width: 500 },
          ],
          pageBreak: "after",
        },

        {
          columns: [
            {
              stack: [
                { text: "OLGA TURKO", color: "#FFFFFF", bold: true, fontSize: 20 },
                { text: "REAL ESTATE", color: "#BFD3CC", fontSize: 10, margin: [0, 2, 0, 0] },
              ],
            },
            {
              width: 230,
              stack: [
                { text: "Агент по недвижимости", color: "#BFD3CC", alignment: "right", fontSize: 10 },
                { text: "Ольга Турко", color: "#FFFFFF", alignment: "right", bold: true, fontSize: 16, margin: [0, 2, 0, 0] },
                { text: "+375 (29) 180-95-16", color: "#E2F2EC", alignment: "right", margin: [0, 2, 0, 0] },
              ],
            },
          ],
          margin: [0, 0, 0, 16],
        },

        {
          table: {
            widths: ["*", 110, 165],
            body: [[
              {
                stack: [
                  { text: obj.title || "Объект недвижимости", bold: true, fontSize: 15, color: "#122321", margin: [0, 0, 0, 8] },
                  { text: locationLine || "—", color: "#2F3B38", margin: [0, 0, 0, 8] },
                  { text: dealLine || "—", color: "#6A7572", fontSize: 10, margin: [0, 0, 0, 8] },
                  { text: mainFacts, color: "#2F3B38", fontSize: 11 },
                ],
                fillColor: "#FFFFFF",
                margin: [12, 12, 12, 12],
              },
              {
                stack: [
                  { text: "Площадь", bold: true, color: "#2A3533", margin: [0, 0, 0, 16] },
                  { text: `${obj.areaTotal || "—"} м²`, bold: true, color: "#122321", fontSize: 16 },
                  { text: "общая", color: "#6B7572", fontSize: 10, margin: [0, 2, 0, 10] },
                  { text: `${obj.areaLiving || "—"} м²`, bold: true, color: "#122321", fontSize: 14 },
                  { text: "жилая", color: "#6B7572", fontSize: 10 },
                ],
                fillColor: "#FFFFFF",
                margin: [12, 12, 12, 12],
              },
              {
                stack: [
                  { text: "Стоимость", bold: true, color: "#2A3533", margin: [0, 0, 0, 16] },
                  {
                    text: formatPrice(obj.priceBYN),
                    color: "#FFFFFF",
                    bold: true,
                    fontSize: 15,
                    background: BRAND_COLOR,
                    margin: [8, 6, 8, 6],
                  },
                  { text: "Цена объекта", color: "#6B7572", fontSize: 10, margin: [0, 10, 0, 0] },
                ],
                fillColor: "#FFFFFF",
                margin: [12, 12, 12, 12],
              },
            ]],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: (i) => (i === 0 || i === 3 ? 0 : 1),
            vLineColor: () => "#D6E2DD",
          },
          margin: [0, 0, 0, 14],
        },

        {
          table: {
            widths: ["*", 180],
            body: detailRows.map((row, idx) => [
              { text: row[0], fillColor: idx % 2 ? "#F6F8F7" : "#FFFFFF", margin: [12, 8, 12, 8] },
              { text: row[1], bold: true, alignment: "right", fillColor: idx % 2 ? "#F6F8F7" : "#FFFFFF", margin: [12, 8, 12, 8] },
            ]),
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
          margin: [0, 0, 0, 14],
        },

        {
          stack: [
            { text: "Описание объекта", color: "#FFFFFF", bold: true, fontSize: 18, margin: [0, 0, 0, 8] },
            {
              text: obj.description || "Описание отсутствует.",
              style: "lightBody",
            },
          ],
          pageBreak: "after",
        },

        { text: "Расположение и контакты", style: "sectionTitle" },
        mapDataUrl
          ? { image: mapDataUrl, fit: [547, 300], margin: [0, 0, 0, 16] }
          : {
              stack: [
                { canvas: [{ type: "rect", x: 0, y: 0, w: 547, h: 300, color: "#EDF2EF", lineColor: "#CED9D3" }] },
                { text: "Карта недоступна", margin: [16, -170, 0, 0], color: "#5E6966", bold: true, fontSize: 16 },
              ],
              margin: [0, 0, 0, 16],
            },
        {
          table: {
            widths: [140, "*"],
            body: [[
              {
                qr: `https://turko.by/objects/${encodeURIComponent(obj.slug || "")}`,
                fit: 120,
                foreground: BRAND_COLOR,
                alignment: "center",
                margin: [0, 6, 0, 6],
                fillColor: "#FFFFFF",
              },
              {
                stack: [
                  { text: 'Агентство недвижимости «ГермесГрупп»', bold: true, color: BRAND_COLOR, fontSize: 14 },
                  { text: 'г. Лида, бульвар Князя Гедимина, 12', margin: [0, 8, 0, 0], color: "#26312E" },
                  { text: 'Телефоны: (+375) 29 180 95 16, (+375) 44 501 90 90', margin: [0, 8, 0, 0], color: "#26312E" },
                  { text: 'Instagram: @rielter_olga_lida', margin: [0, 8, 0, 0], color: "#26312E" },
                  { text: `Ссылка на объект: turko.by/objects/${obj.slug || ""}`, margin: [0, 8, 0, 0], color: "#26312E" },
                ],
                fillColor: "#FFFFFF",
                margin: [12, 10, 12, 10],
              },
            ]],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
        },
      ],
    };
  }

  async function loadActiveObject() {
    const slug = getSlugFromUrl();
    if (!slug) return null;

    const objects = await fetchObjects();
    if (!Array.isArray(objects)) return null;

    return objects.find((item) => item && item.slug === slug) || null;
  }

  function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.textContent = isLoading ? "Формируем PDF..." : "Скачать презентацию объекта";
  }

  async function handleDownloadClick(button) {
    try {
      setButtonLoading(button, true);

      const ready = await ensurePdfMake();
      if (!ready || !window.pdfMake) throw new Error("pdfmake not available");

      if (!state.activeObject) {
        state.activeObject = await loadActiveObject();
      }
      if (!state.activeObject) {
        alert("Объект не найден.");
        return;
      }

      const dd = await buildDocumentDefinition(state.activeObject);
      window.pdfMake.createPdf(dd).download(getFilenameForObject(state.activeObject));
    } catch (error) {
      console.error("Ошибка генерации PDF презентации:", error);
      alert("Не удалось сформировать PDF. Попробуйте ещё раз.");
    } finally {
      setButtonLoading(button, false);
    }
  }

  async function initObjectPdfPresentation() {
    const button = qs("[data-download-pdf-presentation]");
    if (!button) return;

    try {
      state.activeObject = await loadActiveObject();
      ensurePdfMake().catch((error) => console.warn("Предзагрузка pdfmake не удалась", error));
    } catch (error) {
      console.warn("Не удалось предварительно загрузить объект", error);
    }

    button.addEventListener("click", () => handleDownloadClick(button));
  }

  document.addEventListener("DOMContentLoaded", initObjectPdfPresentation);
})();
