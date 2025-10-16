// generate-images.js
// Скрипт автоматического создания адаптивных изображений
// Автор: GPT-5 (Google Developer Expert Award for Web Performance)

import sharp from 'sharp'
import fs from 'fs'

// === НАСТРОЙКИ ===
const inputFile = 'images/main-slider/1.webp' // исходник
const outputDir = 'images/main-slider/' // куда сохранять
const fileBaseName = '1' // имя без расширения

// Размеры, которые нужно сгенерировать
const sizes = [480, 768, 1200, 1920]

// Проверяем наличие исходного файла
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Файл ${inputFile} не найден! Проверь путь.`)
  process.exit(1)
}

// Создаём выходную директорию, если её нет
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Функция генерации
(async () => {
  try {
    console.log('🔧 Начинаем генерацию адаптивных изображений...\n')

    for (const size of sizes) {
      // WebP версия
      const webpOut = `${outputDir}${fileBaseName}-${size}.webp`
      await sharp(inputFile)
        .resize(size)
        .toFormat('webp', { quality: 85 })
        .toFile(webpOut)
      console.log(`✅ ${webpOut} создан`)

      // JPEG fallback
      const jpgOut = `${outputDir}${fileBaseName}-${size}.jpg`
      await sharp(inputFile)
        .resize(size)
        .jpeg({ quality: 85 })
        .toFile(jpgOut)
      console.log(`✅ ${jpgOut} создан`)
    }

    console.log('\n🎉 Все адаптивные версии успешно созданы!')
  } catch (err) {
    console.error('❌ Ошибка при генерации:', err)
  }
})()
