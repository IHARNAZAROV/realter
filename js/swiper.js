// Ждем, пока HTML полностью загрузится
document.addEventListener('DOMContentLoaded', function () {
  // Инициализируем Swiper
  const swiper = new Swiper('.swiper', {

    // Ваши основные настройки
    direction: 'horizontal',
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    speed: 1500,

    // Включаем параллакс (он просто будет работать)
    parallax: true,

    // Навигация (новый синтаксис)
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },

    // Автопрокрутка (новый синтаксис)
    autoplay: {
      delay: 2500,
      disableOnInteraction: false // Продолжать после клика
    }

    // Если нужна пагинация (точки)
    // 1. Добавьте <div class="swiper-pagination"></div> в HTML
    // 2. Раскомментируйте код ниже:
    // pagination: {
    //   el: '.swiper-pagination',
    //   clickable: true,
    // },
  })
})
