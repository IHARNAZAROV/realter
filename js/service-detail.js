document.addEventListener("DOMContentLoaded", async () => {
  /* ================= ENV ================= */

  const isDev =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";

  const log = (...args) => isDev && console.log("[ServiceDetail]", ...args);
  const warn = (...args) => isDev && console.warn("[ServiceDetail]", ...args);
  const errorLog = (...args) => isDev && console.error("[ServiceDetail]", ...args);

  /* ================= HELPERS ================= */

  const $ = (id) => document.getElementById(id);

  const safeText = (id, value) => {
    const el = $(id);
    if (el && value !== undefined && value !== null) {
      el.textContent = value;
    }
  };

  const safeHTML = (id, html) => {
    const el = $(id);
    if (el && html !== undefined) {
      el.innerHTML = html;
    }
  };

  /* ================= RENDER FUNCTIONS ================= */

  const renderText = (section) => {
    const highlight =
      section.role === "highlight" ? "service-highlight-block" : "";

    return `
      <div class="${highlight}">
        <h3 class="m-t30 sx-tilte">${section.heading || ""}</h3>
        <p>${section.content || ""}</p>
      </div>
    `;
  };

  const renderList = (section) => {
    if (!Array.isArray(section.items)) return "";

    return `
      <h4 class="m-t30 sx-tilte">${section.heading || ""}</h4>
      <ul class="list-angle-right anchor-line">
        ${section.items.map(item => `<li>${item}</li>`).join("")}
      </ul>
    `;
  };

  const renderSteps = (section) => {
    if (!Array.isArray(section.items)) return "";

    return `
      <h4 class="m-t30 sx-tilte">${section.heading || ""}</h4>
      <ol class="service-steps">
        ${section.items.map(item => `<li>${item}</li>`).join("")}
      </ol>
    `;
  };

  const renderFAQ = (section) => {
    if (!Array.isArray(section.items)) return "";

    return `
      <div class="service-faq m-t50">
        <h3 class="service-faq-title">${section.heading || ""}</h3>
        <div class="service-faq-list">
          ${section.items.map(item => `
            <div class="service-faq-item">
              <button class="service-faq-question" type="button">
                ${item.question}
                <span class="faq-icon">+</span>
              </button>
              <div class="service-faq-answer">
                <p>${item.answer}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  };

  const renderCTA = (section) => {
    return `
      <div class="sx-call-action m-t40">
        <h4>${section.heading || ""}</h4>
        <p>${section.content || ""}</p>
        <a href="/contact" class="site-button-secondry btn-half">
          ${section.button_text || "Связаться"}
        </a>
      </div>
    `;
  };

  /* ================= MAIN ================= */

  try {
    log("Init");

    const params = new URLSearchParams(window.location.search);
    let slug = params.get("slug");

    const response = await fetch("/data/services.json");
    if (!response.ok) throw new Error("services.json not found");

    const data = await response.json();
    if (!Array.isArray(data.services)) {
      throw new Error("Invalid services structure");
    }

    if (!slug) {
      slug = data.services[0]?.slug;
      warn("Slug missing, fallback to:", slug);
    }

    const service = data.services.find(s => s.slug === slug);
    if (!service) {
      warn("Service not found:", slug);
      if (!isDev) window.location.href = "/404.html";
      return;
    }

    /* ================= META ================= */

    if (service.meta) {
      document.title = service.meta.title || document.title;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && service.meta.description) {
        metaDesc.setAttribute("content", service.meta.description);
      }
    }

    /* ================= HERO ================= */

    safeText("service-title", service.hero?.heading || service.title);
    safeText("service-lead", service.hero?.lead || "");
    safeText("service-breadcrumb-title", service.title);

    /* ================= CONTENT ================= */

    let contentHTML = "";

    if (Array.isArray(service.sections)) {
      service.sections.forEach(section => {
        if (!section || !section.type) return;

        switch (section.type) {
          case "text":
            contentHTML += renderText(section);
            break;
          case "list":
            contentHTML += renderList(section);
            break;
          case "steps":
            contentHTML += renderSteps(section);
            break;
          case "faq":
            contentHTML += renderFAQ(section);
            break;
          case "cta":
            contentHTML += renderCTA(section);
            break;
          default:
            warn("Unknown section type:", section.type);
        }
      });
    }

    safeHTML("service-content", contentHTML);

    /* ================= FAQ ACCORDION ================= */

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".service-faq-question");
      if (!btn) return;

      const currentItem = btn.closest(".service-faq-item");
      const allItems = document.querySelectorAll(".service-faq-item");

      allItems.forEach(item => {
        if (item !== currentItem) item.classList.remove("is-open");
      });

      currentItem.classList.toggle("is-open");
    });

    /* ================= SIDEBAR ================= */

    const listEl = $("services-list");
    if (listEl) {
      listEl.innerHTML = "";
      data.services.forEach(item => {
        listEl.innerHTML += `
          <li class="${item.slug === slug ? "active" : ""}">
            <a href="/services-detail.html?slug=${item.slug}">
              ${item.title}
            </a>
          </li>
        `;
      });
    }

    /* ================= SCHEMA ================= */

    const breadcrumbScript = $("schema-breadcrumbs");
    if (breadcrumbScript) {
      breadcrumbScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://turko.by/" },
          { "@type": "ListItem", "position": 2, "name": "Услуги", "item": "https://turko.by/about.html" },
          { "@type": "ListItem", "position": 3, "name": service.title, "item": `https://turko.by/services-detail.html?slug=${service.slug}` }
        ]
      });
    }

    log("Render complete");

  } catch (err) {
    errorLog("Fatal error:", err);
    if (!isDev) window.location.href = "/404.html";
  }
});
