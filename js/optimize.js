/**
 * =====================================================
 * 1. Добавление класса "loaded" к body
 * =====================================================
 * Используется для запуска CSS-анимаций после загрузки DOM
 */
document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("loaded");
});


/**
 * =====================================================
 * 2. Active пункт меню по URL
 * =====================================================
 * Автоматически ставит class="active"
 * в зависимости от текущего URL
 */
(function () {
  const links = document.querySelectorAll(
    '.header-nav .navbar-nav li a'
  );

  if (!links.length) return;

  const currentPath =
    window.location.pathname.replace(/\/$/, '') || '/';

  links.forEach(link => {
    const li = link.closest('li');
    if (!li) return;

    li.classList.remove('active');

    let href = link.getAttribute('href');
    if (!href) return;

    href = href.replace(/\/$/, '') || '/';

    if (
      href === currentPath ||
      (href !== '/' && currentPath.startsWith(href + '/'))
    ) {
      li.classList.add('active');
    }
  });
})();


/**
 * =====================================================
 * 3. Underline: active + hover (КЛЮЧЕВАЯ ЛОГИКА)
 * =====================================================
 * - Active пункт подчёркнут всегда
 * - Hover временно переносит подчёркивание
 * - Mouseleave возвращает подчёркивание active пункту
 */

(function () {
  const links = document.querySelectorAll(
    '.header-nav .navbar-nav li a'
  );

  if (!links.length) return;

  let activeLink = null;

  // ищем активный пункт
  links.forEach(link => {
    const li = link.closest('li');
    if (li && li.classList.contains('active')) {
      activeLink = link;
    }
  });

  // функция установки underline
  function setUnderline(link, scale, x) {
    if (!link) return;
    link.style.setProperty('--scale', scale);
    link.style.setProperty('--x', x);
  }

  // включаем underline у active сразу
  if (activeLink) {
    setUnderline(activeLink, 1, '50%');
  }

  links.forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // временно убираем underline с active
      if (activeLink && activeLink !== link) {
        setUnderline(activeLink, 0, '50%');
      }

      // включаем underline на hover
      setUnderline(link, 1, x + 'px');
    });

    link.addEventListener('mouseleave', () => {
      // убираем underline с hover
      setUnderline(link, 0, '50%');

      // возвращаем underline active
      if (activeLink) {
        setUnderline(activeLink, 1, '50%');
      }
    });
  });
})();


/**
 * =====================================================
 * 4. GLightbox (только если есть галерея)
 * =====================================================
 * Безопасно для остальных страниц
 */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof GLightbox !== "function") return;

  const gallery = document.querySelector(".glightbox");
  if (!gallery) return;

  GLightbox({
    selector: ".glightbox",
    touchNavigation: true,
    loop: true,
  });
});
