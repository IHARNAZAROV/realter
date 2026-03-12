(function () {
  "use strict";

  const OBJECTS_DATA_URL = "/data/objects.json";
  const MAPTILER_KEY = "ZSZnUbPl4oOTpdLavjmE";
  const BRAND_COLOR = "#155945";
  const BRAND_NAME = "Ольга Турко";

  const PDFMAKE_SOURCES = [
    {
      lib: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.15/build/pdfmake.min.js",
      vfs: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.15/build/vfs_fonts.min.js",
    },
    {
      lib: "https://unpkg.com/pdfmake@0.2.15/build/pdfmake.min.js",
      vfs: "https://unpkg.com/pdfmake@0.2.15/build/vfs_fonts.js",
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
      script.async = true;
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
    if (window.pdfMake && window.pdfMake.vfs) return true;

    let lastError = null;
    for (const source of PDFMAKE_SOURCES) {
      try {
        await loadScript(source.lib);
        await loadScript(source.vfs);
        if (window.pdfMake && window.pdfMake.vfs) return true;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
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

    const gallerySources = Array.isArray(obj.images) ? obj.images.slice(0, 6) : [];
    const galleryDataUrls = [];
    for (const src of gallerySources) {
      try {
        galleryDataUrls.push(await imagePathToDataUrl(src, "image/jpeg", 0.86));
      } catch (error) {
        console.warn("Не удалось загрузить фото для PDF", src, error);
      }
    }

    const mapDataUrl = await fetchMapDataUrl(obj);

    const galleryRows = [];
    for (let i = 0; i < 6; i += 2) {
      galleryRows.push([
        galleryDataUrls[i]
          ? { image: galleryDataUrls[i], fit: [240, 160], margin: [0, 0, 0, 10] }
          : { text: "", margin: [0, 0, 0, 10] },
        galleryDataUrls[i + 1]
          ? { image: galleryDataUrls[i + 1], fit: [240, 160], margin: [0, 0, 0, 10] }
          : { text: "", margin: [0, 0, 0, 10] },
      ]);
    }

    const specsTable = {
      table: {
        widths: [200, "*"],
        body: buildSpecRows(obj).map((row, index) => [
          { text: row[0], bold: true, fillColor: index % 2 === 0 ? "#F6FAF8" : "#FFFFFF", margin: [8, 10, 8, 10] },
          { text: row[1], fillColor: index % 2 === 0 ? "#F6FAF8" : "#FFFFFF", margin: [8, 10, 8, 10] },
        ]),
      },
      layout: {
        hLineColor: () => "#D8E4DE",
        vLineColor: () => "#D8E4DE",
      },
      margin: [0, 0, 0, 24],
    };

    return {
      pageSize: "A4",
      pageMargins: [28, 28, 28, 28],
      info: {
        title: obj.title || "Презентация объекта",
        author: BRAND_NAME,
        subject: "Презентация объекта недвижимости",
      },
      styles: {
        sectionTitle: { fontSize: 26, bold: true, color: BRAND_COLOR, margin: [0, 0, 0, 16] },
        cardTitle: { fontSize: 18, bold: true, color: BRAND_COLOR },
        body: { fontSize: 12, lineHeight: 1.35, color: "#202524" },
      },
      content: [
        // Page 1 cover
        {
          stack: [
            {
              canvas: [{ type: "rect", x: 0, y: 0, w: 539, h: 786, color: "#000000", opacity: 0.34 }],
              absolutePosition: { x: 28, y: 28 },
            },
            { image: coverDataUrl, fit: [539, 786], absolutePosition: { x: 28, y: 28 } },
            { text: BRAND_NAME, absolutePosition: { x: 46, y: 48 }, color: "#FFFFFF", fontSize: 17, bold: true },
            {
              text: obj.title || "Объект недвижимости",
              absolutePosition: { x: 46, y: 220 },
              color: "#FFFFFF",
              fontSize: 34,
              bold: true,
              width: 500,
            },
            {
              text: formatPrice(obj.priceBYN),
              absolutePosition: { x: 46, y: 700 },
              color: BRAND_COLOR,
              fontSize: 28,
              bold: true,
            },
            {
              text: [obj.city, obj.address].filter(Boolean).join(", "),
              absolutePosition: { x: 46, y: 740 },
              color: "#FFFFFF",
              fontSize: 13,
              width: 500,
            },
          ],
          pageBreak: "after",
        },

        // Page 2 specs
        { text: "ХАРАКТЕРИСТИКИ ОБЪЕКТА", style: "sectionTitle" },
        specsTable,
        { text: "Описание объекта", style: "cardTitle", margin: [0, 0, 0, 10] },
        {
          text: obj.description || "Описание отсутствует.",
          style: "body",
          margin: [0, 0, 0, 0],
          pageBreak: "after",
        },

        // Page 3 gallery
        { text: "ФОТОГАЛЕРЕЯ", style: "sectionTitle" },
        {
          table: {
            widths: ["*", "*"],
            body: galleryRows,
          },
          layout: "noBorders",
          pageBreak: "after",
        },

        // Page 4 location + contacts
        { text: "РАСПОЛОЖЕНИЕ И КОНТАКТЫ", style: "sectionTitle" },
        mapDataUrl
          ? { image: mapDataUrl, fit: [539, 300], margin: [0, 0, 0, 20] }
          : {
              stack: [
                { canvas: [{ type: "rect", x: 0, y: 0, w: 539, h: 300, color: "#F0F1F0", lineColor: "#D0D0D0" }] },
                { text: "Карта недоступна", margin: [14, -170, 0, 0], color: "#666", bold: true, fontSize: 17 },
              ],
              margin: [0, 0, 0, 20],
            },
        {
          columns: [
            {
              qr: `https://turko.by/objects/${encodeURIComponent(obj.slug || "")}`,
              fit: 120,
              foreground: BRAND_COLOR,
              margin: [0, 6, 20, 0],
            },
            {
              stack: [
                { text: 'Агентство недвижимости «ГермесГрупп»', bold: true, color: BRAND_COLOR, fontSize: 13 },
                { text: 'г. Лида, б-р Князя Гедимина, 12, пом. 9', margin: [0, 8, 0, 0] },
                { text: 'Телефон: +375 (29) 180-95-16', margin: [0, 8, 0, 0] },
                { text: 'Instagram: @rielter_olga_lida', margin: [0, 8, 0, 0] },
                { text: `Ссылка на объект: turko.by/objects/${obj.slug || ""}`, margin: [0, 8, 0, 0] },
              ],
            },
          ],
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
