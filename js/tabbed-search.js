(function () {
  "use strict";

  const STORAGE_KEY = "tabbedSearch:activeTab";
  const DEFAULT_TAB = "buy";
  const VALID_TABS = ["buy", "sell", "support"];

  function init() {
    const roots = document.querySelectorAll("[data-tabbed-search]");
    if (!roots.length) return;
    roots.forEach(setupRoot);
  }

  function setupRoot(root) {
    const tabs = Array.from(root.querySelectorAll("[data-tabbed-search-tab]"));
    const panels = Array.from(root.querySelectorAll("[data-tabbed-search-panel]"));
    if (!tabs.length || !panels.length) return;

    const initialTab = resolveInitialTab(tabs);
    activateTab(root, tabs, panels, initialTab, { focus: false, persist: false });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const name = tab.getAttribute("data-tabbed-search-tab");
        activateTab(root, tabs, panels, name, { focus: false, persist: true });
      });

      tab.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
          return;
        }
        event.preventDefault();
        const currentIndex = tabs.indexOf(tab);
        let nextIndex = currentIndex;

        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft")  nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (event.key === "Home")       nextIndex = 0;
        if (event.key === "End")        nextIndex = tabs.length - 1;

        const nextTab = tabs[nextIndex];
        const nextName = nextTab.getAttribute("data-tabbed-search-tab");
        activateTab(root, tabs, panels, nextName, { focus: true, persist: true });
      });
    });

    panels.forEach(function (panel) {
      const form = panel.querySelector("form[data-tabbed-search-form]");
      if (!form) return;
      const tabName = panel.getAttribute("data-tabbed-search-panel");
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        handleSubmit(tabName, form);
      });
    });
  }

  function resolveInitialTab(tabs) {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (err) { /* localStorage may be unavailable */ }

    if (stored && VALID_TABS.indexOf(stored) !== -1 && tabs.some(function (t) {
      return t.getAttribute("data-tabbed-search-tab") === stored;
    })) {
      return stored;
    }
    const firstName = tabs[0].getAttribute("data-tabbed-search-tab");
    return firstName || DEFAULT_TAB;
  }

  function activateTab(root, tabs, panels, name, options) {
    options = options || {};

    tabs.forEach(function (tab) {
      const tabName = tab.getAttribute("data-tabbed-search-tab");
      const isActive = tabName === name;
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
      if (isActive && options.focus) {
        tab.focus({ preventScroll: true });
      }
    });

    panels.forEach(function (panel) {
      const panelName = panel.getAttribute("data-tabbed-search-panel");
      const isActive = panelName === name;
      panel.hidden = !isActive;
    });

    if (options.persist) {
      try {
        localStorage.setItem(STORAGE_KEY, name);
      } catch (err) { /* ignore quota / disabled storage */ }
    }
  }

  function handleSubmit(tabName, form) {
    clearErrors(form);

    if (tabName === "buy") {
      submitBuy(form);
    } else if (tabName === "sell") {
      submitSell(form);
    } else if (tabName === "support") {
      submitSupport(form);
    }
  }

  function submitBuy(form) {
    const district = form.elements.namedItem("district");
    const rooms = form.elements.namedItem("rooms");
    const priceTo = form.elements.namedItem("priceTo");

    const errors = [];
    if (!district.value) errors.push(district);
    if (!rooms.value) errors.push(rooms);
    if (errors.length) {
      flagErrors(errors);
      return;
    }

    const params = new URLSearchParams();
    params.set("type", "buy");
    params.set("district", district.value);
    params.set("rooms", rooms.value);
    if (priceTo.value && Number(priceTo.value) > 0) {
      params.set("price", String(Number(priceTo.value)));
    }
    const targetUrl = "/nedvizhimost-lida.html?" + params.toString();
    window.location.href = targetUrl;
  }

  function submitSell(form) {
    const district = form.elements.namedItem("district");
    const rooms = form.elements.namedItem("rooms");
    const desiredPrice = form.elements.namedItem("desiredPrice");

    const errors = [];
    if (!district.value) errors.push(district);
    if (!rooms.value) errors.push(rooms);
    if (errors.length) {
      flagErrors(errors);
      return;
    }

    const lines = [
      "Заявка на оценку и продажу недвижимости",
      "",
      "Район: " + district.value,
      "Комнат: " + rooms.value
    ];
    if (desiredPrice.value && Number(desiredPrice.value) > 0) {
      lines.push("Желаемая цена: " + Number(desiredPrice.value).toLocaleString("ru-RU") + " BYN");
    }
    sendViaTelegram(lines.join("\n"));
  }

  function submitSupport(form) {
    const service = form.elements.namedItem("service");
    const objectType = form.elements.namedItem("objectType");
    const comment = form.elements.namedItem("comment");

    const errors = [];
    if (!service.value) errors.push(service);
    if (!objectType.value) errors.push(objectType);
    if (errors.length) {
      flagErrors(errors);
      return;
    }

    const lines = [
      "Заявка на консультацию",
      "",
      "Услуга: " + service.options[service.selectedIndex].text,
      "Тип объекта: " + objectType.options[objectType.selectedIndex].text
    ];
    if (comment.value && comment.value.trim()) {
      lines.push("");
      lines.push("Комментарий:");
      lines.push(comment.value.trim());
    }
    sendViaTelegram(lines.join("\n"));
  }

  function sendViaTelegram(message) {
    const shareUrl = "https://t.me/share/url?url=" +
      encodeURIComponent(window.location.href) +
      "&text=" + encodeURIComponent(message);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  function flagErrors(fields) {
    fields.forEach(function (field) {
      const wrapper = field.closest(".tabbed-search__field");
      if (wrapper) wrapper.classList.add("is-invalid");
    });
    if (fields[0]) {
      fields[0].focus({ preventScroll: false });
    }
  }

  function clearErrors(form) {
    form.querySelectorAll(".tabbed-search__field.is-invalid").forEach(function (field) {
      field.classList.remove("is-invalid");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
