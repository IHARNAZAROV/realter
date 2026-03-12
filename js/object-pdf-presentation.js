(function () {
  "use strict";

  const OBJECTS_DATA_URL = "/data/objects.json";
  const BRAND_COLOR_HEX = "#155945";
  const MAPTILER_KEY = "ZSZnUbPl4oOTpdLavjmE";
  const BRAND_NAME = "Ольга Турко";
  const FONT_REGULAR_SOURCES = [
    "/fonts/inter/Inter-Regular.woff2",
    "/fonts/montserrat/Montserrat-Regular.woff2",
  ];
  const FONT_BOLD_SOURCES = [
    "/fonts/inter/Inter-Bold.woff2",
    "/fonts/montserrat/Montserrat-Bold.woff2",
    "/fonts/montserrat/Montserrat-ExtraBold.woff2",
  ];

  const DEPENDENCY_SOURCES = {
    pdfLib: [
      "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js",
      "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
    ],
    qrCode: [
      "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
      "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
      "https://unpkg.com/qrcodejs@1.0.0/qrcode.min.js",
    ],
    fontkit: [
      "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js",
      "https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js",
    ],
  };

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

  const qrTarget = (slug) => `https://turko.by/objects/${encodeURIComponent(slug)}`;

  const state = {
    activeObject: null,
  };


  function rgbFromHex(hex) {
    const value = String(hex).replace("#", "");
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    return { r, g, b };
  }

  function getBrandColor(rgb) {
    const c = rgbFromHex(BRAND_COLOR_HEX);
    return rgb(c.r, c.g, c.b);
  }

  const qs = (selector, root = document) => root.querySelector(selector);

  function getSlugFromUrl() {
    const url = new URL(window.location.href);
    const slugFromQuery = url.searchParams.get("slug");
    if (slugFromQuery) return slugFromQuery;

    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length === 2 && (parts[0] === "objects" || parts[0] === "object")) {
      return decodeURIComponent(parts[1]);
    }

    return "";
  }

  function fitRect(containerWidth, containerHeight, imageWidth, imageHeight) {
    if (!imageWidth || !imageHeight) {
      return { x: 0, y: 0, width: containerWidth, height: containerHeight };
    }

    const imgRatio = imageWidth / imageHeight;
    const boxRatio = containerWidth / containerHeight;

    let width;
    let height;
    if (imgRatio > boxRatio) {
      height = containerHeight;
      width = height * imgRatio;
    } else {
      width = containerWidth;
      height = width / imgRatio;
    }

    return {
      x: (containerWidth - width) / 2,
      y: (containerHeight - height) / 2,
      width,
      height,
    };
  }

  async function fetchObjects() {
    const response = await fetch(OBJECTS_DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Не удалось загрузить объекты");
    }
    return response.json();
  }

  function toAbsoluteUrl(path) {
    return new URL(path, window.location.origin).toString();
  }

  function getCoverImagePath(obj) {
    return previewImages[obj.slug] || (Array.isArray(obj.images) && obj.images[0]) || "/images/objects/pic1.webp";
  }

  async function imagePathToJpegDataUrl(path) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    const imageLoaded = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    img.src = toAbsoluteUrl(path);
    await imageLoaded;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1600;
    canvas.height = img.naturalHeight || 1200;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.9),
      width: canvas.width,
      height: canvas.height,
    };
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-runtime-src="${src}"]`);
      if (existing && existing.dataset.loaded === "1") {
        resolve();
        return;
      }

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.runtimeSrc = src;

      script.addEventListener("load", () => {
        script.dataset.loaded = "1";
        resolve();
      });

      script.addEventListener("error", () => {
        script.remove();
        reject(new Error(`Failed to load ${src}`));
      });

      document.head.appendChild(script);
    });
  }

  async function loadFromSources(sources, checker) {
    let lastError = null;

    for (const src of sources) {
      try {
        await loadScript(src);
        if (checker()) return true;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    return checker();
  }

  async function ensurePdfDependencies() {
    if (!window.PDFLib) {
      await loadFromSources(DEPENDENCY_SOURCES.pdfLib, () => Boolean(window.PDFLib));
    }

    if (!window.QRCode) {
      await loadFromSources(DEPENDENCY_SOURCES.qrCode, () => Boolean(window.QRCode));
    }

    if (!window.fontkit) {
      await loadFromSources(DEPENDENCY_SOURCES.fontkit, () => Boolean(window.fontkit));
    }

    return Boolean(window.PDFLib && window.QRCode && window.fontkit);
  }

  async function createQrPngDataUrl(slug) {
    const target = qrTarget(slug);

    if (window.QRCode && typeof window.QRCode.toDataURL === "function") {
      return window.QRCode.toDataURL(target, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 400,
        color: {
          dark: "#155945",
          light: "#ffffff",
        },
      });
    }

    if (typeof window.QRCode === "function") {
      const temp = document.createElement("div");
      temp.style.position = "fixed";
      temp.style.left = "-99999px";
      temp.style.top = "-99999px";
      document.body.appendChild(temp);

      try {
        const qr = new window.QRCode(temp, {
          text: target,
          width: 400,
          height: 400,
          colorDark: "#155945",
          colorLight: "#ffffff",
          correctLevel:
            window.QRCode.CorrectLevel && window.QRCode.CorrectLevel.H
              ? window.QRCode.CorrectLevel.H
              : undefined,
        });

        // библиотеки qrcodejs рисуют синхронно
        const canvas = temp.querySelector("canvas");
        if (canvas) return canvas.toDataURL("image/png");

        const img = temp.querySelector("img");
        if (img && img.src) return img.src;

        throw new Error("QR canvas not generated");
      } finally {
        temp.remove();
      }
    }

    throw new Error("QRCode library API is not supported");
  }

  function formatPrice(priceBYN) {
    if (typeof priceBYN !== "number") return "Цена по запросу";
    return `${priceBYN.toLocaleString("ru-RU")} BYN`;
  }

  function wrapText(text, maxCharsPerLine) {
    if (!text) return [];
    const words = String(text).trim().split(/\s+/);
    const lines = [];
    let current = "";

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCharsPerLine) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });

    if (current) lines.push(current);
    return lines;
  }

  async function fetchFontBytesWithFallback(urls) {
    let lastError = null;

    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Font load failed: ${url} (${response.status})`);
        return {
          bytes: await response.arrayBuffer(),
          source: url,
        };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Unable to load any font source");
  }

  function drawSectionTitle(page, fontBold, text, y, brandColor) {
    page.drawText(String(text || ""), {
      x: 48,
      y,
      size: 22,
      font: fontBold,
      color: brandColor,
    });

    page.drawRectangle({
      x: 48,
      y: y - 10,
      width: 160,
      height: 2,
      color: brandColor,
    });
  }

  async function buildPdfPresentation(obj) {
    const { PDFDocument, PageSizes, rgb } = window.PDFLib;
    const brandColor = getBrandColor(rgb);

    const pdf = await PDFDocument.create();
    pdf.registerFontkit(window.fontkit);

    const [regularFontCandidate, boldFontCandidate] = await Promise.all([
      fetchFontBytesWithFallback(FONT_REGULAR_SOURCES),
      fetchFontBytesWithFallback(FONT_BOLD_SOURCES),
    ]);

    let fontRegular;
    let fontBold;

    try {
      fontRegular = await pdf.embedFont(regularFontCandidate.bytes, { subset: true });
      fontBold = await pdf.embedFont(boldFontCandidate.bytes, { subset: true });
    } catch (error) {
      throw new Error(`Не удалось встроить шрифты Inter/Montserrat в PDF (${regularFontCandidate.source}, ${boldFontCandidate.source}).`);
    }

    const [a4Width, a4Height] = PageSizes.A4;

    const coverImageInfo = await imagePathToJpegDataUrl(getCoverImagePath(obj));
    const coverImage = await pdf.embedJpg(coverImageInfo.dataUrl);

    const gallerySources = (Array.isArray(obj.images) ? obj.images : []).slice(0, 6);
    const galleryEmbeds = [];
    for (const source of gallerySources) {
      try {
        const img = await imagePathToJpegDataUrl(source);
        const embed = await pdf.embedJpg(img.dataUrl);
        galleryEmbeds.push({ embed, width: img.width, height: img.height });
      } catch (error) {
        console.warn("Не удалось добавить фото в PDF:", source, error);
      }
    }

    const mapLat = obj.location && Number(obj.location.lat);
    const mapLng = obj.location && Number(obj.location.lng);
    const mapSources =
      Number.isFinite(mapLat) && Number.isFinite(mapLng)
        ? [
            `https://api.maptiler.com/maps/streets-v2/static/${mapLng},${mapLat},14/1200x700.png?markers=${mapLng},${mapLat},lightred&key=${MAPTILER_KEY}`,
            `https://staticmap.openstreetmap.de/staticmap.php?center=${mapLat},${mapLng}&zoom=14&size=1200x700&markers=${mapLat},${mapLng},red-pushpin`,
          ]
        : [];

    let mapEmbed = null;
    for (const mapUrl of mapSources) {
      try {
        const mapRes = await fetch(mapUrl);
        if (!mapRes.ok) throw new Error(`Map request failed: ${mapRes.status}`);
        const mapBytes = await mapRes.arrayBuffer();
        try {
          mapEmbed = await pdf.embedPng(mapBytes);
        } catch {
          mapEmbed = await pdf.embedJpg(mapBytes);
        }
        break;
      } catch (error) {
        console.warn("Не удалось загрузить карту для PDF", mapUrl, error);
      }
    }

    const qrDataUrl = await createQrPngDataUrl(obj.slug);
    const qrEmbed = await pdf.embedPng(qrDataUrl);

    // Page 1 - cover
    {
      const page = pdf.addPage([a4Width, a4Height]);
      const imageRect = fitRect(a4Width, a4Height, coverImage.width, coverImage.height);
      page.drawImage(coverImage, imageRect);

      page.drawRectangle({
        x: 0,
        y: 0,
        width: a4Width,
        height: a4Height,
        color: rgb(0, 0, 0),
        opacity: 0.35,
      });

      page.drawText(String(BRAND_NAME), {
        x: 48,
        y: a4Height - 60,
        size: 18,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      const titleLines = wrapText(obj.title || "Объект недвижимости", 33).slice(0, 3);
      let titleY = a4Height - 250;
      titleLines.forEach((line) => {
        page.drawText(String(line || ""), {
          x: 48,
          y: titleY,
          size: 36,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
        titleY -= 42;
      });

      page.drawText(String(formatPrice(obj.priceBYN)), {
        x: 48,
        y: 130,
        size: 28,
        font: fontBold,
        color: brandColor,
      });

      page.drawText(String([obj.city, obj.address].filter(Boolean).join(", ")), {
        x: 48,
        y: 95,
        size: 14,
        font: fontRegular,
        color: rgb(1, 1, 1),
      });
    }

    // Page 2 - specs
    {
      const page = pdf.addPage([a4Width, a4Height]);
      drawSectionTitle(page, fontBold, "ХАРАКТЕРИСТИКИ ОБЪЕКТА", a4Height - 60, brandColor);

      const rows = [
        ["Общая площадь", obj.areaTotal ? `${obj.areaTotal} м²` : "—"],
        ["Жилая площадь", obj.areaLiving ? `${obj.areaLiving} м²` : "—"],
        ["Площадь кухни", obj.areaKitchen ? `${obj.areaKitchen} м²` : "—"],
        ["Этаж", obj.floor || "—"],
        ["Этажей в доме", obj.floorsTotal || "—"],
        ["Тип недвижимости", obj.type || "—"],
      ];

      let y = a4Height - 120;
      rows.forEach((row, index) => {
        const rowHeight = 36;
        page.drawRectangle({
          x: 48,
          y: y - 8,
          width: a4Width - 96,
          height: rowHeight,
          color: index % 2 === 0 ? rgb(0.97, 0.98, 0.98) : rgb(1, 1, 1),
          borderColor: rgb(0.88, 0.9, 0.9),
          borderWidth: 1,
        });

        page.drawText(String(row[0] || ""), {
          x: 60,
          y: y + 5,
          size: 12,
          font: fontBold,
          color: rgb(0.18, 0.24, 0.22),
        });

        page.drawText(String(row[1] || ""), {
          x: 280,
          y: y + 5,
          size: 12,
          font: fontRegular,
          color: rgb(0.18, 0.24, 0.22),
        });

        y -= rowHeight;
      });

      page.drawText("Описание объекта", {
        x: 48,
        y: y - 22,
        size: 17,
        font: fontBold,
        color: brandColor,
      });

      const descriptionLines = wrapText(obj.description || "Описание отсутствует.", 95).slice(0, 14);
      let descY = y - 48;
      descriptionLines.forEach((line) => {
        page.drawText(String(line || ""), {
          x: 48,
          y: descY,
          size: 11,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
        descY -= 16;
      });
    }

    // Page 3 - gallery
    {
      const page = pdf.addPage([a4Width, a4Height]);
      drawSectionTitle(page, fontBold, "ФОТОГАЛЕРЕЯ", a4Height - 60, brandColor);

      const gridTop = a4Height - 110;
      const gap = 14;
      const columns = 2;
      const rows = 3;
      const cardWidth = (a4Width - 48 * 2 - gap) / columns;
      const cardHeight = (gridTop - 72 - gap * (rows - 1)) / rows;

      for (let i = 0; i < Math.min(galleryEmbeds.length, columns * rows); i += 1) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = 48 + col * (cardWidth + gap);
        const y = gridTop - (row + 1) * cardHeight - row * gap;

        page.drawRectangle({
          x,
          y,
          width: cardWidth,
          height: cardHeight,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: rgb(0.88, 0.88, 0.88),
          borderWidth: 1,
        });

        const current = galleryEmbeds[i];
        const rect = fitRect(cardWidth, cardHeight, current.width, current.height);
        page.drawImage(current.embed, {
          x: x + rect.x,
          y: y + rect.y,
          width: rect.width,
          height: rect.height,
        });
      }
    }

    // Page 4 - location
    {
      const page = pdf.addPage([a4Width, a4Height]);
      drawSectionTitle(page, fontBold, "РАСПОЛОЖЕНИЕ И КОНТАКТЫ", a4Height - 60, brandColor);

      const mapX = 48;
      const mapY = 250;
      const mapWidth = a4Width - 96;
      const mapHeight = 300;

      if (mapEmbed) {
        const rect = fitRect(mapWidth, mapHeight, mapEmbed.width, mapEmbed.height);
        page.drawImage(mapEmbed, {
          x: mapX + rect.x,
          y: mapY + rect.y,
          width: rect.width,
          height: rect.height,
        });
      } else {
        page.drawRectangle({
          x: mapX,
          y: mapY,
          width: mapWidth,
          height: mapHeight,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.85, 0.85, 0.85),
          borderWidth: 1,
        });
        page.drawText("Карта недоступна", {
          x: mapX + 20,
          y: mapY + mapHeight / 2,
          size: 14,
          font: fontBold,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      page.drawRectangle({
        x: 48,
        y: 58,
        width: a4Width - 96,
        height: 170,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
      });

      page.drawImage(qrEmbed, {
        x: 64,
        y: 74,
        width: 130,
        height: 130,
      });

      const contactLines = [
        'Агентство недвижимости «ГермесГрупп»',
        'г. Лида, б-р Князя Гедимина, 12, пом. 9',
        'Телефон: +375 (29) 180-95-16',
        'Instagram: @rielter_olga_lida',
        `Ссылка на объект: turko.by/objects/${obj.slug}`,
      ];

      let textY = 186;
      contactLines.forEach((line, index) => {
        page.drawText(String(line || ""), {
          x: 212,
          y: textY,
          size: index === 0 ? 12 : 11,
          font: index === 0 ? fontBold : fontRegular,
          color: index === 0 ? brandColor : rgb(0.23, 0.23, 0.23),
        });
        textY -= 24;
      });
    }

    return pdf.save();
  }

  function downloadBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function getFilenameForObject(obj) {
    if (obj.slug) return `${obj.slug}.pdf`;
    const base = (obj.title || "presentation")
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    return `${base || "presentation"}.pdf`;
  }

  async function loadActiveObject() {
    const slug = getSlugFromUrl();
    if (!slug) return null;

    const objects = await fetchObjects();
    if (!Array.isArray(objects)) return null;

    return objects.find((item) => item && item.slug === slug) || null;
  }

  function setButtonLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading
      ? "Формируем PDF..."
      : "Скачать презентацию объекта";
  }

  async function handleDownloadClick(button) {
    try {
      const dependenciesReady = await ensurePdfDependencies();
      if (!dependenciesReady) {
        alert("Не удалось загрузить библиотеки PDF. Проверьте блокировку сторонних скриптов и попробуйте снова.");
        return;
      }

      setButtonLoading(button, true);

      if (!state.activeObject) {
        state.activeObject = await loadActiveObject();
      }

      if (!state.activeObject) {
        alert("Объект не найден.");
        return;
      }

      const pdfBytes = await buildPdfPresentation(state.activeObject);
      downloadBytes(pdfBytes, getFilenameForObject(state.activeObject));
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
    } catch (error) {
      console.warn("Не удалось предварительно загрузить объект для PDF", error);
    }

    ensurePdfDependencies().catch((error) => {
      console.warn("Предзагрузка PDF библиотек не удалась", error);
    });

    button.addEventListener("click", () => handleDownloadClick(button));
  }

  document.addEventListener("DOMContentLoaded", initObjectPdfPresentation);
})();
