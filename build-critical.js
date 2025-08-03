// build-critical.js

// Импортируем только нужную функцию 'generate' в фигурных скобках
import { generate } from 'critical'

// Поскольку 'critical' теперь не является объектом,
// а 'generate' — это уже функция, то мы вызываем её напрямую
const options = {
  base: './',
  src: 'index.html',
  css: ['css/style.css'],
  inline: true,
  target: {
    html: 'index-optimized.html'
  },
  width: 1300,
  height: 900
}

// Вызываем функцию 'generate'
generate(options, (err, output) => {
  if (err) {
    console.error('Ошибка при генерации Critical CSS:', err)
    return
  }

  console.log('Critical CSS успешно сгенерирован и сохранен в index-optimized.html!')
})
