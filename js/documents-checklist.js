(function () {
  const STORAGE_KEYS = {
    dealType: "dealType",
    purchase: "documentsChecklist_purchase",
    sale: "documentsChecklist_sale",
    exchange: "documentsChecklist_exchange"
  };

  const DEAL_LABELS = {
    purchase: "Покупка",
    sale: "Продажа",
    exchange: "Обмен"
  };

  const DEAL_DOCUMENTS = {
    purchase: [
      "Паспорт покупателя",
      "Свидетельство о браке или разводе",
      "Нотариальное согласие супруга",
      "Справка о доходах",
      "Кредитное решение банка или подтверждение наличия средств",
      "Предварительный договор или задаток",
      "ИНН / идентификационный номер",
      "Реквизиты для расчёта"
    ],
    sale: [
      "Паспорт собственника",
      "Документ, подтверждающий право собственности",
      "Технический паспорт объекта",
      "Выписка о зарегистрированных лицах",
      "Справка об отсутствии задолженности по коммунальным платежам",
      "Свидетельство о браке или нотариальное согласие супруга",
      "Документы-основания приобретения недвижимости",
      "Доверенность, если продажу проводит представитель"
    ],
    exchange: [
      "Паспорт обеих сторон",
      "Документы на оба объекта недвижимости",
      "Технические паспорта обоих объектов",
      "Выписки о зарегистрированных лицах",
      "Согласие супругов обеих сторон",
      "Документы-основания собственности",
      "Справки об отсутствии задолженности",
      "Предварительное соглашение об обмене"
    ]
  };

  document.addEventListener("DOMContentLoaded", function () {
    const section = document.querySelector(".documents-checklist");

    if (!section) {
      return;
    }

    const dealTypeSelect = section.querySelector("#dealTypeSelect");
    const listElement = section.querySelector("#documentsChecklistList");
    const progressTextElement = section.querySelector(".documents-checklist__progress-text");
    const progressBarElement = section.querySelector(".documents-checklist__progress-bar");
    const progressFillElement = section.querySelector(".documents-checklist__progress-fill");
    const telegramButton = section.querySelector(".documents-checklist__telegram-btn");

    if (
      !dealTypeSelect ||
      !listElement ||
      !progressTextElement ||
      !progressBarElement ||
      !progressFillElement ||
      !telegramButton
    ) {
      return;
    }

    const checkedByDealType = {
      purchase: loadCheckedIndexes(STORAGE_KEYS.purchase),
      sale: loadCheckedIndexes(STORAGE_KEYS.sale),
      exchange: loadCheckedIndexes(STORAGE_KEYS.exchange)
    };

    const savedDealType = localStorage.getItem(STORAGE_KEYS.dealType);

    if (savedDealType && DEAL_DOCUMENTS[savedDealType]) {
      dealTypeSelect.value = savedDealType;
      renderDocuments(savedDealType);
    } else {
      renderDocuments("");
    }

    dealTypeSelect.addEventListener("change", function () {
      const dealType = dealTypeSelect.value;

      if (dealType) {
        localStorage.setItem(STORAGE_KEYS.dealType, dealType);
      } else {
        localStorage.removeItem(STORAGE_KEYS.dealType);
      }

      renderDocuments(dealType);
    });

    telegramButton.addEventListener("click", function () {
      const dealType = dealTypeSelect.value;
      const documents = DEAL_DOCUMENTS[dealType] || [];

      if (!dealType || !documents.length) {
        return;
      }

      const checkedIndexes = checkedByDealType[dealType] || [];
      const preparedDocuments = documents.filter(function (_, index) {
        return checkedIndexes.includes(index);
      });
      const missingDocuments = documents.filter(function (_, index) {
        return !checkedIndexes.includes(index);
      });

      const preparedList = preparedDocuments.length
        ? preparedDocuments.map(function (doc) {
            return "• " + doc;
          }).join("\n")
        : "• Пока ничего не отмечено";

      const missingList = missingDocuments.length
        ? missingDocuments.map(function (doc) {
            return "• " + doc;
          }).join("\n")
        : "• Все документы собраны";

      const message = [
        "Тип сделки: " + DEAL_LABELS[dealType],
        "",
        "✅ Уже подготовлено:",
        "",
        preparedList,
        "",
        "⬜ Осталось собрать:",
        "",
        missingList
      ].join("\n");

      const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(window.location.href) + "&text=" + encodeURIComponent(message);
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    });

    function renderDocuments(dealType) {
      const documents = DEAL_DOCUMENTS[dealType] || [];
      const checkedIndexes = checkedByDealType[dealType] || [];

      listElement.innerHTML = "";

      if (!dealType || !documents.length) {
        const emptyState = document.createElement("p");
        emptyState.className = "documents-checklist__empty";
        emptyState.textContent = "Выберите тип сделки, чтобы увидеть чеклист документов.";
        listElement.appendChild(emptyState);
        telegramButton.disabled = true;
        updateProgress(0, 8);
        progressBarElement.setAttribute("aria-valuenow", "0");
        return;
      }

      documents.forEach(function (documentName, index) {
        const itemElement = document.createElement("div");
        itemElement.className = "documents-checklist__item";

        const labelElement = document.createElement("label");
        labelElement.className = "documents-checklist__checkbox";

        const inputElement = document.createElement("input");
        inputElement.type = "checkbox";
        inputElement.className = "documents-checklist__checkbox-input";
        inputElement.checked = checkedIndexes.includes(index);

        const markElement = document.createElement("span");
        markElement.className = "documents-checklist__checkbox-mark";

        const textElement = document.createElement("span");
        textElement.className = "documents-checklist__checkbox-text";
        textElement.textContent = documentName;

        inputElement.addEventListener("change", function () {
          const currentCheckedIndexes = checkedByDealType[dealType] || [];

          if (inputElement.checked) {
            if (!currentCheckedIndexes.includes(index)) {
              currentCheckedIndexes.push(index);
            }
          } else {
            const checkedIndexPosition = currentCheckedIndexes.indexOf(index);

            if (checkedIndexPosition !== -1) {
              currentCheckedIndexes.splice(checkedIndexPosition, 1);
            }
          }

          currentCheckedIndexes.sort(function (a, b) {
            return a - b;
          });

          checkedByDealType[dealType] = currentCheckedIndexes;
          saveCheckedIndexes(dealType, currentCheckedIndexes);
          updateProgress(currentCheckedIndexes.length, documents.length);
          progressBarElement.setAttribute("aria-valuenow", String(currentCheckedIndexes.length));
        });

        labelElement.appendChild(inputElement);
        labelElement.appendChild(markElement);
        labelElement.appendChild(textElement);
        itemElement.appendChild(labelElement);
        listElement.appendChild(itemElement);
      });

      telegramButton.disabled = false;
      updateProgress(checkedIndexes.length, documents.length);
      progressBarElement.setAttribute("aria-valuenow", String(checkedIndexes.length));
      progressBarElement.setAttribute("aria-valuemax", String(documents.length));
    }

    function updateProgress(checkedCount, totalCount) {
      const safeTotalCount = totalCount || 0;
      const progressPercent = safeTotalCount ? (checkedCount / safeTotalCount) * 100 : 0;

      progressTextElement.textContent = "Собрано: " + checkedCount + " из " + safeTotalCount + " документов";
      progressFillElement.style.width = progressPercent + "%";
      progressFillElement.classList.toggle("is-complete", safeTotalCount > 0 && checkedCount === safeTotalCount);
    }

    function loadCheckedIndexes(storageKey) {
      const rawStorageValue = localStorage.getItem(storageKey);

      if (!rawStorageValue) {
        return [];
      }

      try {
        const parsedValue = JSON.parse(rawStorageValue);

        if (!Array.isArray(parsedValue)) {
          return [];
        }

        return parsedValue.filter(function (value) {
          return Number.isInteger(value);
        });
      } catch (error) {
        return [];
      }
    }

    function saveCheckedIndexes(dealType, checkedIndexes) {
      const storageKey = STORAGE_KEYS[dealType];

      if (!storageKey) {
        return;
      }

      localStorage.setItem(storageKey, JSON.stringify(checkedIndexes));
    }
  });
})();
