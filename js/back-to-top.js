/**
 * Back-to-Top Button Module
 * Плавающая кнопка для прокрутки в начало страницы
 */

(function initBackToTop() {
  // Элементы
  const backToTopBtn = document.querySelector('.back-to-top');
  
  if (!backToTopBtn) {
    console.warn('Back-to-Top: кнопка не найдена в DOM');
    return;
  }

  // Конфигурация
  const scrollThreshold = window.innerHeight * 0.5; // 50vh (как в требованиях)
  let isVisible = false;

  /**
   * Показать/скрыть кнопку в зависимости от позиции скролла
   */
  function handleScroll() {
    const currentScroll = window.scrollY;
    const shouldShow = currentScroll > scrollThreshold;

    // Оптимизация: обновляем только при изменении видимости
    if (shouldShow && !isVisible) {
      backToTopBtn.classList.add('show');
      isVisible = true;
    } else if (!shouldShow && isVisible) {
      backToTopBtn.classList.remove('show');
      isVisible = false;
    }
  }

  /**
   * Плавная прокрутка в начало страницы
   */
  function scrollToTop() {
    // Используем современный API с поддержкой smooth поведения
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // Плавная анимация (fallback для старых браузеров)
      left: 0,
    });

    // Для браузеров, которые не поддерживают smooth
    // (обычно не требуется, но на всякий случай)
  }

  /**
   * Обработка клика на кнопку
   */
  function handleClick(e) {
    e.preventDefault();
    scrollToTop();
  }

  /**
   * Инициализация слушателей
   */
  function init() {
    // Слушаем скролл с throttling для производительности
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = requestAnimationFrame(() => {
          handleScroll();
          scrollTimeout = null;
        });
      }
    });

    // Клик на кнопку
    backToTopBtn.addEventListener('click', handleClick);

    // Начальная проверка (если пользователь зашёл с якорем)
    handleScroll();
  }

  // Инициализируем при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
