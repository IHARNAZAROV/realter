document.addEventListener('DOMContentLoaded', function () {
  const swiper = new Swiper('.swiper', {

     direction: 'horizontal',
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    speed: 1500,

  
    parallax: true,

     navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },

    autoplay: {
      delay: 2500,
      disableOnInteraction: false 
    }

    
  })
})
