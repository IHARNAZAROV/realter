"use strict";

/* ============================================================
   CALENDAR SIDEBAR — calendar-sidebar.js
   Интерактивный календарь публикаций блога.
   Без сторонних библиотек. Vanilla JS.
   ============================================================ */

(function () {
  /* ----------------------------------------------------------
     КОНСТАНТЫ
  ---------------------------------------------------------- */
  const MONTHS_RU = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];

  const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  /* Стрелка «вправо» (SVG path) */
  const ARROW_RIGHT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
  /* Стрелка «влево» */
  const ARROW_LEFT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  /* Стрелка «вправо» малая (для ссылки) */
  const ARROW_LINK =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  /* Шеврон вниз (для аккордеона) */
  const CHEVRON_DOWN =
    '<svg viewBox="0 0 24 24" class="calendar-mobile-toggle__icon" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  /* ----------------------------------------------------------
     СОСТОЯНИЕ
  ---------------------------------------------------------- */
  let articlesByDate = {};   // { "YYYY-MM-DD": [article, ...] }
  let currentYear;
  let currentMonth;
  let activeDate = null;     // Активная выбранная дата (строка YYYY-MM-DD)

  /* ----------------------------------------------------------
     DOM-ЭЛЕМЕНТЫ (заполняются после DOMContentLoaded)
  ---------------------------------------------------------- */
  let elTitle;
  let elGrid;
  let elPopup;
  let elPopupContent;

  /* ----------------------------------------------------------
     УТИЛИТА: парсинг даты статьи
     Поддерживает форматы: "DD.MM.YYYY" и "YYYY-MM-DD"
  ---------------------------------------------------------- */
  function parseArticleDate(str) {
    if (!str || typeof str !== "string") return null;
    let day, month, year;

    if (str.includes(".")) {
      // Формат DD.MM.YYYY (используется в проекте)
      [day, month, year] = str.split(".");
    } else if (str.includes("-") && str.length === 10) {
      // Формат YYYY-MM-DD
      [year, month, day] = str.split("-");
    } else {
      return null;
    }

    day   = parseInt(day, 10);
    month = parseInt(month, 10);
    year  = parseInt(year, 10);

    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  }

  /* ----------------------------------------------------------
     УТИЛИТА: дата → ключ "YYYY-MM-DD"
  ---------------------------------------------------------- */
  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /* ----------------------------------------------------------
     УТИЛИТА: ключ "YYYY-MM-DD" → читаемая дата на русском
  ---------------------------------------------------------- */
  function formatDateRu(key) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /* ----------------------------------------------------------
     ШАГ 1: Загрузка статей
     Попытка переиспользовать уже загруженные данные из
     blog-list.js. Если переменная allArticles недоступна —
     загружаем JSON самостоятельно.
  ---------------------------------------------------------- */
  function loadArticles(callback) {
    /* Проверяем, доступен ли глобальный массив из blog-list.js */
    if (typeof allArticles !== "undefined" && Array.isArray(allArticles) && allArticles.length > 0) {
      callback(allArticles);
      return;
    }

    /* Если данные ещё не загружены — ждём кастомного события
       или загружаем самостоятельно */
    const onArticlesReady = function (e) {
      document.removeEventListener("blog:articlesLoaded", onArticlesReady);
      callback(e.detail || []);
    };

    document.addEventListener("blog:articlesReady", onArticlesReady);

    /* Параллельно — загружаем сами, на случай если событие
       не будет выброшено */
    fetch("/data/blog-articles.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Ошибка загрузки blog-articles.json");
        return res.json();
      })
      .then(function (articles) {
        document.removeEventListener("blog:articlesReady", onArticlesReady);
        callback(articles);
      })
      .catch(function (err) {
        console.warn("[CalendarSidebar] Не удалось загрузить статьи:", err);
        document.removeEventListener("blog:articlesReady", onArticlesReady);
        callback([]);
      });
  }

  /* ----------------------------------------------------------
     ШАГ 2: Группировка статей по датам
  ---------------------------------------------------------- */
  function groupArticlesByDate(articles) {
    const map = {};

    articles.forEach(function (article) {
      if (!article.date) return;

      const dateObj = parseArticleDate(article.date);
      if (!dateObj || isNaN(dateObj.getTime())) return;

      const key = toDateKey(dateObj);
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(article);
    });

    return map;
  }

  /* ----------------------------------------------------------
     ШАГ 3: Рендер календаря
  ---------------------------------------------------------- */
  function renderCalendar() {
    if (!elTitle || !elGrid) return;

    /* Заголовок: «Апрель 2026» */
    elTitle.textContent = `${MONTHS_RU[currentMonth]} ${currentYear}`;

    elGrid.innerHTML = "";

    const today = new Date();
    const todayKey = toDateKey(today);

    /* Первый день отображаемого месяца */
    const firstDay = new Date(currentYear, currentMonth, 1);

    /* День недели первого дня (0=Вс → конвертируем в 0=Пн) */
    let startDow = firstDay.getDay(); // 0–6 (0=Вс)
    startDow = (startDow + 6) % 7;   // Конвертация: 0=Пн, 6=Вс

    /* Кол-во дней в месяце */
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    /* Дни предыдущего месяца (для заполнения начала сетки) */
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    /* Всего ячеек: заполняем до полных 6 строк (42 ячейки) */
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");

      let dayNum, dateKey, isCurrentMonth;

      if (i < startDow) {
        /* Дни предыдущего месяца */
        dayNum = daysInPrevMonth - startDow + 1 + i;
        const d = new Date(currentYear, currentMonth - 1, dayNum);
        dateKey = toDateKey(d);
        isCurrentMonth = false;
      } else if (i < startDow + daysInMonth) {
        /* Дни текущего месяца */
        dayNum = i - startDow + 1;
        const d = new Date(currentYear, currentMonth, dayNum);
        dateKey = toDateKey(d);
        isCurrentMonth = true;
      } else {
        /* Дни следующего месяца */
        dayNum = i - startDow - daysInMonth + 1;
        const d = new Date(currentYear, currentMonth + 1, dayNum);
        dateKey = toDateKey(d);
        isCurrentMonth = false;
      }

      cell.className = "calendar-day";
      cell.textContent = dayNum;

      /* Флаги */
      if (!isCurrentMonth) {
        cell.classList.add("calendar-day--other-month");
      }
      if (dateKey === todayKey && isCurrentMonth) {
        cell.classList.add("calendar-day--today");
      }
      if (dateKey === activeDate) {
        cell.classList.add("calendar-day--active");
      }

      /* Есть публикации? */
      if (articlesByDate[dateKey] && articlesByDate[dateKey].length > 0) {
        cell.classList.add("calendar-day--has-posts");
        cell.setAttribute("aria-label", `${dayNum} — ${articlesByDate[dateKey].length} статья(и). Нажмите для просмотра.`);
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");

        /* Точка-индикатор */
        const dot = document.createElement("span");
        dot.className = "calendar-day__dot";
        dot.setAttribute("aria-hidden", "true");
        cell.appendChild(dot);

        /* Обработчик клика */
        cell.addEventListener("click", function () {
          openPopup(dateKey);
        });

        /* Открытие по Enter/Space */
        cell.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPopup(dateKey);
          }
        });
      }

      elGrid.appendChild(cell);
    }

    /* Скрываем последнюю строку, если она вся из дней другого месяца */
    trimExtraRow();
  }

  /* ----------------------------------------------------------
     ВСПОМОГАТЕЛЬНАЯ: убрать лишнюю строку
  ---------------------------------------------------------- */
  function trimExtraRow() {
    const cells = elGrid.querySelectorAll(".calendar-day");
    if (cells.length < 36) return;

    /* Проверяем последние 7 ячеек */
    const lastRowStart = cells.length - 7;
    let allOther = true;
    for (let i = lastRowStart; i < cells.length; i++) {
      if (!cells[i].classList.contains("calendar-day--other-month")) {
        allOther = false;
        break;
      }
    }
    if (allOther) {
      for (let i = lastRowStart; i < cells.length; i++) {
        cells[i].style.display = "none";
      }
    }
  }

  /* ----------------------------------------------------------
     POPUP: открыть
  ---------------------------------------------------------- */
  function openPopup(dateKey) {
    activeDate = dateKey;
    renderCalendar(); /* Перерисовать календарь, чтобы подсветить активный день */

    const articles = articlesByDate[dateKey] || [];
    if (!articles.length || !elPopup || !elPopupContent) return;

    /* Заголовок */
    const headerHTML = `
      <div class="calendar-popup__header">
        <div class="calendar-popup__eyebrow">Публикации блога</div>
        <h2 class="calendar-popup__title">${formatDateRu(dateKey)}</h2>
      </div>
    `;

    /* Список статей */
    const articlesHTML = articles
      .map(function (a) {
        const slug = a.slug || a.id || "";
        const href = slug ? `/blog/${slug}` : "#";
        const img  = a.image || "";
        const alt  = a.imageAlt || a.title || "";

        return `
          <article class="calendar-popup__article">
            ${img ? `<img class="calendar-popup__thumb" src="${img}" alt="${alt}" loading="lazy">` : ""}
            <div class="calendar-popup__info">
              ${a.category ? `<span class="calendar-popup__category">${a.category}</span>` : ""}
              <h3 class="calendar-popup__article-title">${a.title || "Без названия"}</h3>
              <span class="calendar-popup__date">${formatDateRu(dateKey)}</span>
              <a href="${href}" class="calendar-popup__link" aria-label="Читать статью «${a.title || ""}»">
                Читать статью ${ARROW_LINK}
              </a>
            </div>
          </article>
        `;
      })
      .join("");

    elPopupContent.innerHTML = `
      <button class="calendar-popup__close" aria-label="Закрыть" data-cs-close>
        &times;
      </button>
      ${headerHTML}
      <div class="calendar-popup__list">${articlesHTML}</div>
    `;

    /* Показываем */
    elPopup.classList.remove("is-hidden");
    elPopup.setAttribute("aria-hidden", "false");

    /* Фокус на содержимое для доступности */
    elPopupContent.focus({ preventScroll: true });

    /* Кнопка закрытия внутри попапа */
    const closeBtn = elPopupContent.querySelector("[data-cs-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", closePopup);
    }
  }

  /* ----------------------------------------------------------
     POPUP: закрыть
  ---------------------------------------------------------- */
  function closePopup() {
    if (!elPopup) return;
    elPopup.classList.add("is-hidden");
    elPopup.setAttribute("aria-hidden", "true");
    activeDate = null;
    renderCalendar(); /* Снять подсветку активного дня */
  }

  /* ----------------------------------------------------------
     НАВИГАЦИЯ: предыдущий / следующий месяц
  ---------------------------------------------------------- */
  function goToPrevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  }

  function goToNextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  }

  /* ----------------------------------------------------------
     МОБИЛЬНЫЙ АККОРДЕОН
  ---------------------------------------------------------- */
  function initMobileToggle(sidebar) {
    const toggleBtn = sidebar.querySelector(".calendar-mobile-toggle");
    const mobileBody = sidebar.querySelector(".calendar-mobile-body");
    if (!toggleBtn || !mobileBody) return;

    toggleBtn.addEventListener("click", function () {
      const isOpen = mobileBody.classList.contains("is-open");
      mobileBody.classList.toggle("is-open", !isOpen);
      toggleBtn.classList.toggle("is-open", !isOpen);
      toggleBtn.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  /* ----------------------------------------------------------
     ИНИЦИАЛИЗАЦИЯ
  ---------------------------------------------------------- */
  function init() {
    const sidebar = document.querySelector(".blog-calendar-sidebar");
    if (!sidebar) return;

    /* Найти DOM-элементы */
    elTitle   = sidebar.querySelector(".calendar-title");
    elGrid    = sidebar.querySelector(".calendar-grid");
    elPopup   = document.querySelector(".calendar-popup");
    elPopupContent = elPopup
      ? elPopup.querySelector(".calendar-popup__content")
      : null;

    if (!elTitle || !elGrid) {
      console.warn("[CalendarSidebar] Не найдены обязательные элементы календаря.");
      return;
    }

    /* Вставить SVG в кнопки навигации */
    const prevBtn = sidebar.querySelector(".calendar-prev");
    const nextBtn = sidebar.querySelector(".calendar-next");
    if (prevBtn) prevBtn.innerHTML = ARROW_LEFT;
    if (nextBtn) nextBtn.innerHTML = ARROW_RIGHT;

    /* Вставить шеврон в кнопку аккордеона */
    const toggleBtn = sidebar.querySelector(".calendar-mobile-toggle");
    if (toggleBtn) {
      const iconSpan = toggleBtn.querySelector(".calendar-mobile-toggle__icon-wrap");
      if (iconSpan) iconSpan.innerHTML = CHEVRON_DOWN;
    }

    /* Заполнить дни недели */
    const weekdaysEl = sidebar.querySelector(".calendar-weekdays");
    if (weekdaysEl) {
      weekdaysEl.innerHTML = WEEKDAYS_RU.map(function (day) {
        return `<span class="calendar-weekday">${day}</span>`;
      }).join("");
    }

    /* Установить текущий месяц */
    const now = new Date();
    currentYear  = now.getFullYear();
    currentMonth = now.getMonth();

    /* Навигация по месяцам */
    if (prevBtn) {
      prevBtn.addEventListener("click", goToPrevMonth);
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", goToNextMonth);
    }

    /* Мобильный аккордеон */
    initMobileToggle(sidebar);

    /* Закрытие попапа по Esc */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePopup();
    });

    /* Закрытие попапа по клику вне содержимого */
    if (elPopup) {
      elPopup.addEventListener("click", function (e) {
        if (e.target === elPopup) closePopup();
      });
    }

    /* Загрузить статьи и отрисовать */
    loadArticles(function (articles) {
      articlesByDate = groupArticlesByDate(articles);
      renderCalendar();
    });
  }

  /* ----------------------------------------------------------
     СТАРТ
  ---------------------------------------------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
