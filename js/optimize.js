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
  initScopedClickDelegation(); // INP FIX
  initStickyHeader();
  bg_moving();
  initBlogMasonryFilter();
  initServiceCardsAnimation();
});


(function () {
  if (!window.SITE_VERSION) return;

  // CSS
  document.querySelectorAll('link[data-versioned]').forEach(link => {
    if (!link.href.includes('?v=')) {
      link.href += `?v=${window.SITE_VERSION}`;
    }
  });

  // JS
  document.querySelectorAll('script[data-versioned]').forEach(script => {
    if (!script.src.includes('?v=')) {
      script.src += `?v=${window.SITE_VERSION}`;
    }
  });
})();

// legacy stub (for backward compatibility)
function handleMobileDrawer(e) {
  // intentionally empty — mobile menu handled elsewhere
}

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

    if (href === currentPath || (href !== "/" && currentPath.startsWith(href))) {
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
 * OwlCarousel
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

  const $about = jQuery(".about-home");
  const autoplayTimeout = 5000;

  function startProgress() {
    const dots = $about.find(".owl-dots")[0];
    if (!dots) return;

    dots.style.setProperty("--progress-transition", "0ms");
    dots.style.setProperty("--progress-width", "0%");

    requestAnimationFrame(() => {
      dots.style.setProperty("--progress-transition", `${autoplayTimeout}ms`);
      dots.style.setProperty("--progress-width", "100%");
    });
  }

  function resetProgress() {
    const dots = $about.find(".owl-dots")[0];
    if (!dots) return;
    dots.style.setProperty("--progress-transition", "0ms");
    dots.style.setProperty("--progress-width", "0%");
  }

  if ($about.length) {
    $about.on("initialized.owl.carousel", startProgress);
    $about.on("translate.owl.carousel", resetProgress);
    $about.on("translated.owl.carousel", startProgress);
  }

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
 * Contact slide (INP FIX)
 * =====================================================
 */
function initContactSlide() {
  const panel = document.querySelector(".contact-slide-hide");
  const content = panel?.querySelector(".contact-slide-content");
  const overlay = panel?.querySelector(".contact-slide-overlay");
  const openBtn = document.querySelector(".contact-slide-show");
  const closeBtn = panel?.querySelector(".contact_close");

  if (!panel || !content || !overlay || !openBtn || !closeBtn) return;

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
    if (e.key === "Escape" && panel.classList.contains("is-open")) close();
  });

  /* focus trap — сохранён */
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
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  };

  /* swipe — passive */
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;

  const resetSwipe = () => {
    content.style.transform = "";
    isSwiping = false;
  };

  content.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    isSwiping = true;
  }, { passive: true });

  content.addEventListener("touchmove", (e) => {
    if (!isSwiping) return;
    const t = e.touches[0];
    currentX = t.clientX;
    if (Math.abs(t.clientY - startY) > 30) return resetSwipe();
    const dx = currentX - startX;
    if (dx > 0) content.style.transform = `translateX(${dx}px)`;
  }, { passive: true });

  content.addEventListener("touchend", () => {
    if (currentX - startX > 80) close();
    else content.style.transform = "";
    resetSwipe();
  });
}

/**
 * =====================================================
 * CounterUp (INP FIX)
 * =====================================================
 */
function initCounterUp() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const finalValue = parseInt(el.innerText.replace(/\D/g, ""), 10);

      if (reduce) {
        el.innerText = finalValue;
        return observer.unobserve(el);
      }

      const start = performance.now();
      const duration = 2000;

      function animate(time) {
        const progress = Math.min((time - start) / duration, 1);
        el.innerText = Math.floor(progress * finalValue);
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

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
 * Scoped click delegation (INP FIX)
 * =====================================================
 */
function initScopedClickDelegation() {
  const faq = document.querySelector(".faq-1");
  if (faq) faq.addEventListener("click", handleAccordion);

  const nav = document.querySelector(".header-nav");
  if (nav) nav.addEventListener("click", handleSubmenu);

  const mobileBtn = document.querySelector("#mobile-side-drawer");
  if (mobileBtn) mobileBtn.addEventListener("click", handleMobileDrawer);
}

/**
 * =====================================================
 * Accordion (без дубликатов)
 * =====================================================
 */
function handleAccordion(e) {
  const head = e.target.closest(".acod-head");
  if (!head) return;

  const faq = head.closest(".faq-1");
  if (!faq) return;

  faq.querySelectorAll(".acod-head").forEach((h) => {
    h.classList.remove("acc-actives");
    const icon = h.querySelector(".indicator i");
    if (icon) icon.className = "fa fa-plus";
  });

  head.classList.add("acc-actives");
  const icon = head.querySelector(".indicator i");
  if (icon) icon.className = "fa fa-minus";
}

/**
 * =====================================================
 * Mobile drawer
 * =====================================================
 */

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
 * Bootstrap modal centering (без изменений)
 * =====================================================
 */
(function () {
  function repositionModal(modal) {
    const dialog = modal.querySelector(".modal-dialog");
    if (!dialog) return;

    modal.style.display = "block";
    const h = dialog.getBoundingClientRect().height;
    const wh = window.innerHeight;
    dialog.style.marginTop = Math.max(0, (wh - h) / 2) + "px";
  }

  document.addEventListener("shown.bs.modal", (e) => {
    if (e.target.classList.contains("modal")) repositionModal(e.target);
  });

  window.addEventListener("resize", () => {
    const opened = document.querySelector(".modal.show");
    if (opened) repositionModal(opened);
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
  const submenu = li.querySelector(":scope > .sub-menu, :scope > .mega-menu");
  if (!submenu) return;

  const isOpen = li.classList.toggle("nav-active");
  submenu.style.display = isOpen ? "block" : "none";
  toggle.setAttribute("aria-expanded", String(isOpen));
  e.preventDefault();
}

/**
 * =====================================================
 * Masonry
 * =====================================================
 */
function initBlogMasonryFilter() {
  const container = document.querySelector(".news-masonry");
  if (!container || !window.Masonry) return;

  const items = Array.from(container.querySelectorAll(".masonry-item"));
  const masonry = new Masonry(container, {
    itemSelector: ".masonry-item",
    percentPosition: true,
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest(".masonry-filter a");
    if (!link) return;

    e.preventDefault();
    const filter = link.dataset.filter;

    document
      .querySelectorAll(".masonry-filter li")
      .forEach((li) => li.classList.remove("active"));
    link.parentElement.classList.add("active");

    items.forEach((item) => {
      item.style.display =
        filter === "*" || item.matches(filter) ? "" : "none";
    });

    masonry.reloadItems();
    masonry.layout();
  });
}

/**
 * =====================================================
 * BG moving
 * =====================================================
 */
function bg_moving() {
  if (!window.scroll) return;
  BGScroll.init(".bg-moving", {
    scrollSpeed: 20,
    direction: "h",
    pauseWhenHidden: true,
  });
}

/**
 * =====================================================
 * Service hover cards (INP FIX)
 * =====================================================
 */
document.querySelectorAll(".service-hover-card").forEach((card) => {
  const img = card.querySelector(".service-bg img");
  let rect = null;
  let active = false;

  card.addEventListener("mouseenter", () => {
    rect = card.getBoundingClientRect();
    setTimeout(() => (active = true), 300);
  });

  card.addEventListener("mousemove", (e) => {
    if (!active || !rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    img.style.transform = `translate(${x}px, ${y}px)`;
  });

  card.addEventListener("mouseleave", () => {
    active = false;
    img.style.transform = "translate(0,0)";
  });
});

/**
 * =====================================================
 * Service cards reveal
 * =====================================================
 */
function initServiceCardsAnimation() {
  const cards = document.querySelectorAll(".number-block-three");
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  cards.forEach((card) => observer.observe(card));
}

/**
 * =====================================================
 * Favorites (без изменений)
 * =====================================================
 */
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
  idx >= 0 ? favs.splice(idx, 1) : favs.push(slug);
  saveFavorites(favs);
  return favs.includes(slug);
}


document.addEventListener("DOMContentLoaded", () => {
  const textBlock = document.querySelector(".about-home-3");
  if (!textBlock) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        textBlock.classList.add("is-visible");
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(textBlock);
});


/* =====================================================
   MOBILE NAV — ADVANCED (SWIPE + ACTIVE + CTA)
   ===================================================== */
(function () {
  const btn = document.getElementById("mobile-side-drawer");
  const nav = document.getElementById("mnav");
  const overlay = document.getElementById("mnavOverlay");
  const links = nav ? nav.querySelectorAll("a[data-path]") : [];

  if (!btn || !nav || !overlay) return;

  /* ---------- OPEN / CLOSE ---------- */
  const openMenu = () => {
    nav.classList.add("is-open");
    overlay.classList.add("is-open");
    btn.classList.add("is-active");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    nav.classList.remove("is-open");
    overlay.classList.remove("is-open");
    btn.classList.remove("is-active");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    nav.classList.contains("is-open") ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);

  /* ---------- ACTIVE STATE ---------- */
  const setActiveLink = () => {
    const path = location.pathname.replace(/\/$/, "") || "/";
    links.forEach((link) => {
      const linkPath = link.dataset.path;
      link.classList.toggle("is-active", linkPath === path);
    });
  };

  setActiveLink();

  links.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  /* ---------- SWIPE CLOSE ---------- */
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;

  nav.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
  }, { passive: true });

  nav.addEventListener("touchmove", (e) => {
    if (!isSwiping) return;
    currentX = e.touches[0].clientX;
    const dx = currentX - startX;

    if (dx < 0) return;
    nav.style.transform = `translateX(${dx}px)`;
  }, { passive: true });

  nav.addEventListener("touchend", () => {
    if (!isSwiping) return;
    isSwiping = false;

    const dx = currentX - startX;
    nav.style.transform = "";

    if (dx > 80) closeMenu();
  });

  /* ---------- SAFETY ---------- */
  window.addEventListener("resize", () => {
    if (window.innerWidth > 991) closeMenu();
  });

  document.addEventListener("DOMContentLoaded", closeMenu);
})();


(function () {
  const steps = document.querySelectorAll('.turko-step');
  const lines = document.querySelectorAll('.turko-step-line');

  const title = document.getElementById('turkoStepTitle');
  const text = document.getElementById('turkoStepText');
  const counter = document.getElementById('turkoStepCounter');
  const nextBtn = document.getElementById('turkoNextStep');
  const card = document.getElementById('turkoCard');

  const imageStage = document.querySelector('.turko-stack-image');
  const layers = imageStage
    ? imageStage.querySelectorAll('.image-layer')
    : [];

  if (!steps.length || layers.length !== 2) {
    return;
  }

  /* ===============================
     DATA
     =============================== */

  const data = [
    {
      title: 'Подбор недвижимости',
      text: 'Анализирую рынок Лиды и района, подбираю только реальные варианты.',
      image: 'images/steps/st1.webp'
    },
    {
      title: 'Организация показов',
      text: 'Согласовываю показы и сопровождаю клиентов.',
      image: 'images/steps/st2.webp'
    },
    {
      title: 'Юридическая сделка',
      text: 'Проверка документов и безопасность сделки.',
      image: 'images/steps/st3.webp'
    },
    {
      title: 'Передача ключей',
      text: 'Контроль расчётов и финальная передача объекта.',
      image: 'images/steps/st4.webp'
    }
  ];

  let current = 0;
  let activeLayer = 0;

  /* ===============================
     PRELOAD
     =============================== */

  data.forEach(item => {
    const img = new Image();
    img.src = item.image;
  });

  /* ===============================
     INIT
     =============================== */

  layers[0].style.backgroundImage = `url(${data[0].image})`;
  layers[0].classList.add('active');
  layers[1].classList.remove('active');

  title.textContent = data[0].title;
  text.textContent = data[0].text;
  counter.textContent = `1 / ${data.length}`;

  steps.forEach(s => s.classList.remove('active'));
  steps[0].classList.add('active');
  lines.forEach(l => l.classList.remove('active'));

  /* ===============================
     IMAGE SWITCH
     =============================== */

  function changeImage(index) {
    const nextLayer = 1 - activeLayer;

    layers[nextLayer].style.backgroundImage =
      `url(${data[index].image})`;

    layers[nextLayer].classList.add('active');
    layers[activeLayer].classList.remove('active');

    activeLayer = nextLayer;
  }

  /* ===============================
     STEP SWITCH
     =============================== */

  function setStep(index) {
    if (index === current || !data[index]) return;

    steps.forEach(s => s.classList.remove('active'));
    steps[index].classList.add('active');

    lines.forEach(l => l.classList.remove('active'));
    for (let i = 0; i < index; i++) {
      if (lines[i]) lines[i].classList.add('active');
    }

    card.classList.add('fade');
    setTimeout(() => {
      title.textContent = data[index].title;
      text.textContent = data[index].text;
      counter.textContent = `${index + 1} / ${data.length}`;
      card.classList.remove('fade');
    }, 200);

    changeImage(index);
    current = index;
  }

  /* ===============================
     EVENTS
     =============================== */

  steps.forEach(step => {
    step.addEventListener('click', () => {
      setStep(+step.dataset.step);
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      setStep((current + 1) % data.length);
    });
  }

})();


/* =====================================================
   MOBILE NAV — TOP MENU (FINAL, WORKING)
===================================================== */
(function () {
  const btn = document.getElementById("mobile-side-drawer");
  const nav = document.getElementById("mnav");
  const overlay = document.getElementById("mnavOverlay");

  if (!btn || !nav || !overlay) return;

  const open = () => {
    nav.classList.add("is-open");
    overlay.classList.add("is-open");
    btn.classList.add("is-active");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    nav.classList.remove("is-open");
    overlay.classList.remove("is-open");
    btn.classList.remove("is-active");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    nav.classList.contains("is-open") ? close() : open();
  });

  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      close();
    }
  });

  // safety reset on load
  window.addEventListener("load", () => {
    close();
  });
})();

/* =====================================================
   MOBILE NAV — HARD BIND (BYPASS DELEGATION)
===================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("mobile-side-drawer");
  const nav = document.getElementById("mnav");
  const overlay = document.getElementById("mnavOverlay");

  if (!btn || !nav || !overlay) return;

  const open = () => {
    nav.classList.add("is-open");
    overlay.classList.add("is-open");
    btn.classList.add("is-active");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    nav.classList.remove("is-open");
    overlay.classList.remove("is-open");
    btn.classList.remove("is-active");
    document.body.style.overflow = "";
  };

  btn.addEventListener(
    "click",
    function (e) {
      e.stopPropagation(); // 🔑 важно
      e.preventDefault();
      nav.classList.contains("is-open") ? close() : open();
    },
    true // 🔑 capture phase — ОБХОД делегатов
  );

  overlay.addEventListener("click", close);
});

/* =====================================================
   MOBILE NAV — AUTO CLOSE ON SCROLL
===================================================== */
(function () {
  const nav = document.getElementById("mnav");
  const overlay = document.getElementById("mnavOverlay");
  const btn = document.getElementById("mobile-side-drawer");

  if (!nav || !overlay || !btn) return;

  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (!nav.classList.contains("is-open")) return;

    if (Math.abs(window.scrollY - lastScrollY) > 10) {
      nav.classList.remove("is-open");
      overlay.classList.remove("is-open");
      btn.classList.remove("is-active");
      document.body.style.overflow = "";
    }

    lastScrollY = window.scrollY;
  });
})();


(function () {
  const activeStep = document.querySelector('.turko-step.active');
  const nav = document.querySelector('.turko-steps-nav');

  if (activeStep && nav && window.innerWidth <= 768) {
    activeStep.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }
})();



        (function() {
          function drawHubLines() {
            var svg = document.getElementById('hubLinesSvg');
            var wrapper = document.getElementById('hubDiagram');
            var center = document.getElementById('hubCenter');
            if (!svg || !wrapper || !center) return;

            var wRect = wrapper.getBoundingClientRect();
            var cRect = center.getBoundingClientRect();
            var cx = cRect.left - wRect.left + cRect.width / 2;
            var cy = cRect.top - wRect.top + cRect.height / 2;

            svg.innerHTML = '';

            var NS    = 'http://www.w3.org/2000/svg';
            var hw    = cRect.width  / 2;
            var hh    = cRect.height / 2;
            var SPEED = 150;   // px per second (same for every ray)
            var RLEN  = 40;    // ray-segment length in px (fixed)

            var exits = {
              left:   { x: cx - hw, y: cy },
              right:  { x: cx + hw, y: cy },
              top:    { x: cx,      y: cy - hh },
              bottom: { x: cx,      y: cy + hh }
            };

            // Phase (0–1): where in the cycle each ray starts.
            // Spreading them avoids two rays sharing the trunk at the same moment.
            var PHASES = {
              'hcard-0': 0,     'hcard-1': 0.34,  'hcard-2': 0.67,
              'hcard-3': 0.17,  'hcard-4': 0.51,  'hcard-5': 0.84,
              'hcard-top': 0.10, 'hcard-bottom': 0.60
            };

            function f(n) { return (+n).toFixed(2); }

            function mkPath(d, sw, op) {
              var el = document.createElementNS(NS, 'path');
              el.setAttribute('d', d);
              el.setAttribute('fill', 'none');
              el.setAttribute('stroke', '#155945');
              el.setAttribute('stroke-width', sw || '1.5');
              el.setAttribute('stroke-linejoin', 'miter');
              el.setAttribute('stroke-linecap', 'round');
              if (op !== undefined) el.setAttribute('stroke-opacity', op);
              return el;
            }

            function mkDot(x, y, r, op) {
              var el = document.createElementNS(NS, 'circle');
              el.setAttribute('cx', f(x)); el.setAttribute('cy', f(y));
              el.setAttribute('r', r || 3.5);
              el.setAttribute('fill', '#155945');
              el.setAttribute('fill-opacity', op !== undefined ? op : 0.5);
              return el;
            }

            // Attach a phase-shifted loop animation.
            // The ray starts mid-cycle (determined by `phase`) and loops forever.
            // Using from/to instead of begin-delay avoids a frozen ray at t=0.
            function attachAnim(pathEl, phase) {
              var len = pathEl.getTotalLength();
              if (len < 1) return;
              var travel   = len + RLEN;              // total dashoffset travel per cycle
              var cycleDur = travel / SPEED;
              var fromOff  = -(phase * travel);       // start mid-cycle
              var toOff    = -((1 + phase) * travel); // end one full cycle later
              var gap      = Math.max(0, len - RLEN);

              pathEl.setAttribute('stroke-dasharray',  f(RLEN) + ' ' + f(gap));
              pathEl.setAttribute('stroke-dashoffset', f(fromOff)); // initial static position

              var anim = document.createElementNS(NS, 'animate');
              anim.setAttribute('attributeName', 'stroke-dashoffset');
              anim.setAttribute('from',          f(fromOff));
              anim.setAttribute('to',            f(toOff));
              anim.setAttribute('dur',           f(cycleDur) + 's');
              anim.setAttribute('begin',         '0s');
              anim.setAttribute('repeatCount',   'indefinite');
              anim.setAttribute('calcMode',      'linear');
              pathEl.appendChild(anim);
            }

            /* ---- draw layers (tracks → rays → dots) ---- */
            var gTracks = document.createElementNS(NS, 'g');
            var gRays   = document.createElementNS(NS, 'g');
            var gDots   = document.createElementNS(NS, 'g');
            svg.appendChild(gTracks);
            svg.appendChild(gRays);
            svg.appendChild(gDots);

            /* ---- side (left / right): each card gets its own full elbow path ---- */
            function processSide(side, ids) {
              var exit = exits[side];

              var cardsData = ids.map(function(id) {
                var card = document.getElementById(id);
                if (!card) return null;
                var r  = card.getBoundingClientRect();
                var tx = side === 'left' ? r.right - wRect.left : r.left - wRect.left;
                var ty = r.top - wRect.top + r.height / 2;
                return { id: id, tx: tx, ty: ty };
              }).filter(Boolean);
              if (!cardsData.length) return;

              // Elbow bend x (midpoint between logo edge and card edge, same for all 3)
              var midX = (exit.x + cardsData[0].tx) / 2;

              cardsData.forEach(function(cd) {
                // Full path: logo exit → midX (trunk) → card (branch)
                var d = Math.abs(cd.ty - cy) < 1
                  ? 'M ' + f(exit.x) + ',' + f(cy) + ' H ' + f(cd.tx)
                  : 'M ' + f(exit.x) + ',' + f(cy) +
                    ' H ' + f(midX) + ' V ' + f(cd.ty) + ' H ' + f(cd.tx);

                var track = mkPath(d, '1.5', '0.14');
                var ray   = mkPath(d, '2.8');
                gTracks.appendChild(track);
                gRays.appendChild(ray);
                attachAnim(ray, PHASES[cd.id] || 0);

                gDots.appendChild(mkDot(cd.tx, cd.ty, 3.5, 0.50));
              });

              // Junction dot at elbow bend, exit dot at logo
              gDots.appendChild(mkDot(midX,   cy, 4.5, 0.60));
              gDots.appendChild(mkDot(exit.x, cy, 4.0, 0.55));
            }

            /* ---- top / bottom: straight vertical ray ---- */
            function processStraight(side, id) {
              var exit = exits[side];
              var card = document.getElementById(id);
              if (!card) return;
              var r  = card.getBoundingClientRect();
              var tx = r.left - wRect.left + r.width / 2;
              var ty = side === 'top' ? r.bottom - wRect.top : r.top - wRect.top;
              var d  = 'M ' + f(exit.x) + ',' + f(exit.y) + ' V ' + f(ty);

              gTracks.appendChild(mkPath(d, '1.5', '0.14'));
              var ray = mkPath(d, '2.8');
              gRays.appendChild(ray);
              attachAnim(ray, PHASES[id] || 0);

              gDots.appendChild(mkDot(exit.x, exit.y, 4.0, 0.55));
              gDots.appendChild(mkDot(tx, ty, 3.5, 0.50));
            }

            /* ---- draw everything ---- */
            processSide('left',  ['hcard-0', 'hcard-1', 'hcard-2']);
            processSide('right', ['hcard-3', 'hcard-4', 'hcard-5']);
            processStraight('top',    'hcard-top');
            processStraight('bottom', 'hcard-bottom');
          }

          function init() {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() { setTimeout(drawHubLines, 200); });
            } else {
              setTimeout(drawHubLines, 200);
            }
            window.addEventListener('resize', function() { setTimeout(drawHubLines, 100); });
          }

          init();
        })();
