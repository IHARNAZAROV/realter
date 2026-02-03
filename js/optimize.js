"use strict";

/**
 * =====================================================
 * DOM READY
 * =====================================================
 */
document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("loaded");

  initMenuActiveAndUnderline();
  initCarousels();
  initContactSlide();
  initCounterUp();
  wrapResponsiveIframes();
  initGlobalClickDelegation();
  initStickyHeader();
  bg_moving();
  initBlogMasonryFilter();
  initServiceCardsAnimation();
});

/**
 * =====================================================
 * Menu active + underline
 * =====================================================
 */
function initMenuActiveAndUnderline() {
  const links = document.querySelectorAll(".header-nav .navbar-nav li a");
  if (!links.length) return;

  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  let activeLink = null;

  links.forEach((link) => {
    const li = link.closest("li");
    if (!li) return;

    li.classList.remove("active");

    let href = link.getAttribute("href");
    if (!href) return;
    href = href.replace(/\/$/, "") || "/";

    if (
      href === currentPath ||
      (href !== "/" && currentPath.startsWith(href))
    ) {
      li.classList.add("active");
      activeLink = link;
    }
  });

  function setUnderline(link, scale, x) {
    if (!link) return;
    link.style.setProperty("--scale", scale);
    link.style.setProperty("--x", x);
  }

  if (activeLink) setUnderline(activeLink, 1, "50%");

  links.forEach((link) => {
    link.addEventListener("mouseenter", (e) => {
      const rect = link.getBoundingClientRect();
      setUnderline(link, 1, e.clientX - rect.left + "px");
      if (activeLink && activeLink !== link) setUnderline(activeLink, 0, "50%");
    });

    link.addEventListener("mouseleave", () => {
      setUnderline(link, 0, "50%");
      if (activeLink) setUnderline(activeLink, 1, "50%");
    });
  });
}

/**
 * =====================================================
 * OwlCarousel (jQuery plugin)
 * =====================================================
 */
function initCarousels() {
  if (!window.jQuery || !jQuery.fn.owlCarousel) return;

  const carousels = [
    {
      selector: ".testimonial-home",
      loop: true,
      autoplay: true,
      margin: 30,
      nav: false,
      dots: true,
      responsive: { 0: { items: 1 }, 991: { items: 1 } },
    },
    {
      selector: ".testimonial-home-two",
      loop: true,
      autoplay: false,
      margin: 30,
      nav: true,
      dots: false,
      responsive: { 0: { items: 1 }, 991: { items: 2 } },
    },
    {
      selector: ".about-home",
      loop: true,
      autoplay: true,
      margin: 30,
      nav: true,
      dots: true,
      responsive: { 0: { items: 1 }, 991: { items: 1 } },
    },
    {
      selector: ".project-carousel4",
      loop: true,
      autoplay: false,
      items: 3,
      margin: 40,
      nav: true,
      dots: false,
      responsive: {
        0: { items: 1, margin: 15 },
        640: { items: 2, margin: 15 },
        800: { items: 3, margin: 20 },
        1200: { items: 4 },
      },
    },
    {
      selector: ".project-carousel3",
      loop: true,
      autoplay: true,
      items: 3,
      margin: 40,
      nav: true,
      autoplayTimeout: 4000, 
      smartSpeed: 800,
      dots: false,
      responsive: {
        0: { items: 1, margin: 15 },
        640: { items: 2, margin: 15 },
        800: { items: 3, margin: 20 },
        1200: { items: 4 },
      },
    },
    {
      selector: ".project-carousel1",
      loop: true,
      autoplay: false,
      items: 3,
      margin: 40,
      nav: true,
      dots: true,
      responsive: { 0: { items: 1 }, 768: { items: 1 }, 991: { items: 1 } },
    },
  ];

  carousels.forEach((cfg) => {
    const $el = jQuery(cfg.selector);
    if (!$el.length) return;

    $el.owlCarousel({
      ...cfg,
      navText: [
        '<i class="fa fa-angle-left"></i>',
        '<i class="fa fa-angle-right"></i>',
      ],
    });
  });
}

/**
 * =====================================================
 * Contact slide
 * =====================================================
 */

function initContactSlide() {
  const panel = document.querySelector(".contact-slide-hide");
  const content = panel?.querySelector(".contact-slide-content");
  const overlay = panel?.querySelector(".contact-slide-overlay");
  const openBtn = document.querySelector(".contact-slide-show");
  const closeBtn = panel?.querySelector(".contact_close");

  if (!panel || !content || !overlay || !openBtn || !closeBtn) return;

  /* =====================================================
     BODY SCROLL LOCK
  ===================================================== */
  let scrollY = 0;

  const lockBody = () => {
    scrollY = window.scrollY;
    document.body.classList.add("is-locked");
    document.body.style.top = `-${scrollY}px`;
  };

  const unlockBody = () => {
    document.body.classList.remove("is-locked");
    document.body.style.top = "";
    window.scrollTo(0, scrollY);
  };

  /* =====================================================
     OPEN / CLOSE
  ===================================================== */
  const open = () => {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    lockBody();
    trapFocus();
  };

  const close = () => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    unlockBody();
    releaseFocus();
    resetSwipe();
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) {
      close();
    }
  });

  /* =====================================================
     FOCUS TRAP
  ===================================================== */
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;

  const trapFocus = () => {
    focusableElements = content.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable.focus();
    document.addEventListener("keydown", handleTab);
  };

  const releaseFocus = () => {
    document.removeEventListener("keydown", handleTab);
    openBtn.focus();
  };

  const handleTab = (e) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  /* =====================================================
     SWIPE TO CLOSE (MOBILE)
  ===================================================== */
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;

  const SWIPE_THRESHOLD = 80;

  const resetSwipe = () => {
    content.style.transform = "";
    startX = 0;
    startY = 0;
    currentX = 0;
    isSwiping = false;
  };

  content.addEventListener("touchstart", (e) => {
    if (!panel.classList.contains("is-open")) return;

    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = true;
  });

  content.addEventListener("touchmove", (e) => {
    if (!isSwiping) return;

    const touch = e.touches[0];
    currentX = touch.clientX;

    const diffX = currentX - startX;
    const diffY = Math.abs(touch.clientY - startY);

    /* если пользователь скроллит вертикально — выходим */
    if (diffY > 30) {
      resetSwipe();
      return;
    }

    /* двигаем панель только вправо */
    if (diffX > 0) {
      content.style.transform = `translateX(${diffX}px)`;
    }
  });

  content.addEventListener("touchend", () => {
    if (!isSwiping) return;

    const diffX = currentX - startX;

    if (diffX > SWIPE_THRESHOLD) {
      close();
    } else {
      content.style.transform = "";
    }

    resetSwipe();
  });
}

/**
 * =====================================================
 * CounterUp
 * =====================================================
 */
function initCounterUp() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const finalValue = parseInt(el.innerText.replace(/\D/g, ""), 10);
        const start = performance.now();
        const duration = 5000;

        function animate(time) {
          const progress = Math.min((time - start) / duration, 1);
          const eased = progress * (2 - progress);
          el.innerText = Math.floor(eased * finalValue);
          if (progress < 1) requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((el) => observer.observe(el));
}

/**
 * =====================================================
 * iframe wrap
 * =====================================================
 */
function wrapResponsiveIframes() {
  document
    .querySelectorAll('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]')
    .forEach((iframe) => {
      if (iframe.parentElement.classList.contains("ratio")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "ratio ratio-16x9";
      iframe.parentNode.insertBefore(wrapper, iframe);
      wrapper.appendChild(iframe);
    });
}

/**
 * =====================================================
 * Global click delegation
 * =====================================================
 */
function initGlobalClickDelegation() {
  document.addEventListener("click", (e) => {
    handleAccordion(e);
    handleSubmenu(e);
    handleMobileDrawer(e);
  });
}

/**
 * =====================================================
 * Accordion
 * =====================================================
 */
function handleAccordion(e) {
  const head = e.target.closest(".acod-head");
  if (!head) return;

  const faq = head.closest(".faq-1");
  if (!faq) return;

  // закрываем все
  faq.querySelectorAll(".acod-head").forEach((h) => {
    h.classList.remove("acc-actives");

    const icon = h.querySelector(".indicator i");
    if (icon) {
      icon.classList.remove("fa-minus");
      icon.classList.add("fa-plus");
    }
  });

  // открываем текущий (если был закрыт)
  const willOpen = !head.classList.contains("acc-actives");
  if (willOpen) {
    head.classList.add("acc-actives");

    const icon = head.querySelector(".indicator i");
    if (icon) {
      icon.classList.remove("fa-plus");
      icon.classList.add("fa-minus");
    }
  }
}

document.addEventListener("click", handleAccordion);

/**
 * =====================================================
 * Mobile drawer
 * =====================================================
 */
function handleMobileDrawer(e) {
  const btn = e.target.closest("#mobile-side-drawer");
  if (!btn) return;

  const drawer = document.querySelector(".mobile-sider-drawer-menu");
  if (!drawer) return;

  e.preventDefault();
  drawer.classList.toggle("active");
}

/**
 * =====================================================
 * Sticky header
 * =====================================================
 */
function initStickyHeader() {
  const header = document.querySelector(".sticky-header");
  if (!header) return;

  const fixed = document.querySelectorAll(".is-fixed");

  const sentinel = document.createElement("div");
  sentinel.style.height = "1px";
  header.before(sentinel);

  new IntersectionObserver(([entry]) => {
    const stuck = !entry.isIntersecting;

    header.classList.toggle("is-stuck", stuck);

    fixed.forEach((el) => el.classList.toggle("color-fill", stuck));
  }).observe(sentinel);
}
/**
 * =====================================================
 * Bootstrap modal vertical centering
 * =====================================================
 */
(function () {
  "use strict";

  function repositionModal(modal) {
    const dialog = modal.querySelector(".modal-dialog");
    if (!dialog) return;

    modal.style.display = "block";

    const dialogHeight = dialog.getBoundingClientRect().height;
    const windowHeight = window.innerHeight;

    const marginTop = Math.max(0, (windowHeight - dialogHeight) / 2);
    dialog.style.marginTop = marginTop + "px";
  }

  document.addEventListener("shown.bs.modal", function (e) {
    const modal = e.target;
    if (!modal.classList.contains("modal")) return;
    repositionModal(modal);
  });

  window.addEventListener("resize", function () {
    const openedModal = document.querySelector(".modal.show");
    if (openedModal) {
      repositionModal(openedModal);
    }
  });
})();

/**
 * =====================================================
 * Submenu handler
 * =====================================================
 */
function handleSubmenu(e) {
  const toggle = e.target.closest(".submenu-toogle");
  if (!toggle) return;

  const li = toggle.parentElement;
  if (!li) return;

  const submenu = li.querySelector(":scope > .sub-menu, :scope > .mega-menu");
  if (!submenu) return;

  const isOpen = li.classList.contains("nav-active");

  // закрываем соседние пункты
  const siblings = li.parentElement.querySelectorAll(".has-child.nav-active");
  siblings.forEach((item) => {
    if (item !== li) {
      item.classList.remove("nav-active");
      const sm = item.querySelector(":scope > .sub-menu, :scope > .mega-menu");
      if (sm) sm.style.display = "none";
      const t = item.querySelector(":scope > .submenu-toogle");
      if (t) t.setAttribute("aria-expanded", "false");
    }
  });

  // toggle текущий
  li.classList.toggle("nav-active", !isOpen);
  submenu.style.display = isOpen ? "none" : "block";
  toggle.setAttribute("aria-expanded", String(!isOpen));

  e.preventDefault();
}

function initBlogMasonryFilter() {
  const container = document.querySelector(".news-masonry");
  if (!container || !window.Masonry) return;

  const items = Array.from(container.querySelectorAll(".masonry-item"));

  // Сначала гарантируем, что все карточки видимы
  items.forEach(item => {
    item.style.display = "";
  });

  // Ждём загрузки всех изображений
  const images = container.querySelectorAll("img");
  let loaded = 0;

  if (!images.length) {
    initMasonry();
    return;
  }

  images.forEach(img => {
    if (img.complete) {
      loaded++;
      if (loaded === images.length) initMasonry();
    } else {
      img.addEventListener("load", () => {
        loaded++;
        if (loaded === images.length) initMasonry();
      });
      img.addEventListener("error", () => {
        loaded++;
        if (loaded === images.length) initMasonry();
      });
    }
  });

  function initMasonry() {
    const masonry = new Masonry(container, {
      itemSelector: ".masonry-item",
      percentPosition: true,
    });

    // фильтрация
    document.addEventListener("click", (e) => {
      const link = e.target.closest(".masonry-filter a");
      if (!link) return;

      e.preventDefault();

      const filter = link.dataset.filter;

      document
        .querySelectorAll(".masonry-filter li")
        .forEach(li => li.classList.remove("active"));

      link.parentElement.classList.add("active");

      items.forEach(item => {
        item.style.display =
          filter === "*" || item.matches(filter)
            ? ""
            : "none";
      });

      masonry.reloadItems();
      masonry.layout();
    });
  }
}


function bg_moving() {
  BGScroll.init(".bg-moving", {
    scrollSpeed: 20,
    direction: "h",
    pauseWhenHidden: true, // важно
  });
}


document.querySelectorAll(".service-hover-card").forEach(card => {
  const img = card.querySelector(".service-bg img");
  let active = false;

  card.addEventListener("mouseenter", () => {
    active = false;
    setTimeout(() => active = true, 400); // ждём рост
  });

  card.addEventListener("mousemove", e => {
    if (!active) return;

    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

    img.style.transform = `translate(${x}px, ${y}px)`;
  });

  card.addEventListener("mouseleave", () => {
    active = false;
    img.style.transform = "translate(0,0)";
  });
});


function initServiceCardsAnimation() {
  const cards = document.querySelectorAll(".number-block-three");
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  cards.forEach(card => observer.observe(card));
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("favoriteObjects")) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem("favoriteObjects", JSON.stringify(list));
}

function isFavorite(slug) {
  return getFavorites().includes(slug);
}

function toggleFavorite(slug) {
  const favs = getFavorites();
  const idx = favs.indexOf(slug);

  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(slug);
  }

  saveFavorites(favs);
  return favs.includes(slug);
}