// build-critical.js

import { generate } from 'critical'

async function generateCritical () {
  try {
    const output = await generate({
      base: './', // Базовая директория (корень проекта)
      src: '/', // Исходный HTML
      css: [
        'css/bootstrap.min.css',
        'css/owl.carousel.min.css',
        'css/magnific-popup.min.css',
        'css/loader.min.css',
        'css/flaticon.min.css',
        'css/style.css', //
        'css/skin/skin-1.css',
        'plugins/revolution/revolution/css/settings.css',
        'plugins/revolution/revolution/css/navigation.css'
      ], // Путь к CSS (можно добавить несколько файлов)
      inline: true, // Встраивать critical CSS в HTML
      target: {
        html: 'index-optimized.html', // Оптимизированный HTML
        css: 'style-critical.css' // Отдельный файл с critical CSS (опционально)
      },
      dimensions: [ // Несколько размеров viewport для responsive
        { width: 1300, height: 900 }, // Десктоп (как в вашем скрипте)
        { width: 768, height: 1024 }, // Планшет
        { width: 360, height: 640 } // Мобильный
      ],
      extract: false, // Не извлекать non-critical CSS (если нужно, поставьте true)
      ignore: ['@font-face', /url\(/], // Игнорировать шрифты и URL (если они не above-the-fold)
      penthouse: { // Опции для Penthouse (движок critical)
        timeout: 60000, // Таймаут 60 сек
        strict: false // Не прерывать на ошибках
      }
    })

    console.log('Critical CSS успешно сгенерирован и сохранен в index-optimized.html!')
  } catch (err) {
    console.error('Ошибка при генерации Critical CSS:', err)
  }
}

generateCritical()
