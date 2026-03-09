"use strict";

(function () {
  const FILTERS_SCOPE = ".objects-filters";
  const SELECTOR = `${FILTERS_SCOPE} select`;

  function closeAll(except) {
    document.querySelectorAll(".filter-select-ui.is-open").forEach((el) => {
      if (el !== except) {
        el.classList.remove("is-open");
        el.querySelector(".filter-select-trigger")?.setAttribute("aria-expanded", "false");
      }
    });
  }

  function createCustomSelect(nativeSelect) {
    if (nativeSelect.dataset.customReady === "1") return;

    const wrapper = document.createElement("div");
    wrapper.className = "filter-select-ui";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "filter-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const triggerText = document.createElement("span");
    triggerText.className = "filter-select-trigger-text";

    const menu = document.createElement("div");
    menu.className = "filter-select-menu";
    menu.setAttribute("role", "listbox");

    wrapper.appendChild(trigger);
    trigger.appendChild(triggerText);
    wrapper.appendChild(menu);

    nativeSelect.classList.add("is-customized-select");
    nativeSelect.dataset.customReady = "1";
    nativeSelect.insertAdjacentElement("afterend", wrapper);

    function buildOptions() {
      menu.innerHTML = "";

      Array.from(nativeSelect.options).forEach((option) => {
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = "filter-select-option";
        optionBtn.textContent = option.textContent;
        optionBtn.dataset.value = option.value;
        optionBtn.disabled = option.disabled;

        optionBtn.addEventListener("click", () => {
          if (nativeSelect.disabled || optionBtn.disabled) return;

          nativeSelect.value = optionBtn.dataset.value;
          nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));

          syncFromNative();
          wrapper.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
          trigger.focus();
        });

        menu.appendChild(optionBtn);
      });
    }

    function syncFromNative() {
      const selected = nativeSelect.options[nativeSelect.selectedIndex];
      triggerText.textContent = selected ? selected.textContent : "";

      menu.querySelectorAll(".filter-select-option").forEach((btn) => {
        btn.classList.toggle("is-selected", btn.dataset.value === nativeSelect.value);
      });

      wrapper.classList.toggle("is-disabled", nativeSelect.disabled);
      wrapper.classList.toggle("is-active", nativeSelect.classList.contains("is-active"));
      trigger.disabled = nativeSelect.disabled;
    }

    trigger.addEventListener("click", () => {
      if (nativeSelect.disabled) return;

      const willOpen = !wrapper.classList.contains("is-open");
      closeAll(wrapper);
      wrapper.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    nativeSelect.addEventListener("change", syncFromNative);

    const observer = new MutationObserver(() => {
      syncFromNative();
    });
    observer.observe(nativeSelect, {
      attributes: true,
      attributeFilter: ["disabled", "class"],
    });

    buildOptions();
    syncFromNative();
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".filter-select-ui")) {
      closeAll();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAll();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(SELECTOR).forEach(createCustomSelect);
  });
})();
