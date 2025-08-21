// build-purge.js

// Импортируем класс PurgeCSS напрямую
import { PurgeCSS } from 'purgecss';
import { promises as fs } from 'fs';
import path from 'path'; // Добавляем модуль path для работы с путями
import purgecssConfig from './purgecss.config.js'; // Импортируем конфигурацию PurgeCSS

async function purgeAndSave() {
  try {
    console.log('Запуск PurgeCSS...');

    // Выполняем очистку CSS, используя импортированную конфигурацию
    const purgeCSSResult = await new PurgeCSS().purge(purgecssConfig);

    // Проверяем, вернул ли PurgeCSS какой-либо результат
    if (!purgeCSSResult || purgeCSSResult.length === 0) {
      // Если результат пуст, выводим предупреждение. Это может означать проблемы
      // с путями в 'content' или 'css' в purgecss.config.js
      console.warn('Внимание: PurgeCSS не вернул никакого CSS. Проверьте опции "content" и "css" в purgecss.config.js.');
      return; // Выходим, если нет результата для сохранения
    }

    // Определяем выходную директорию и полный путь к выходному файлу
    const outputDir = './css'; // Путь к директории, где будет сохранен очищенный CSS
    const outputPath = path.join(outputDir, 'style-purged.css'); // Имя выходного файла

    // Проверяем, существует ли выходная директория. Если нет, создаем ее рекурсивно.
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Директория ${outputDir} проверена/создана.`);

    // Записываем очищенный CSS в файл.
    // purgeCSSResult[0].css содержит строку с очищенным CSS.
    await fs.writeFile(outputPath, purgeCSSResult[0].css);

    // Выводим сообщение об успешном завершении и статистику
    console.log(`Неиспользуемые стили успешно удалены! Файл сохранен по пути: ${outputPath}`);
    console.log(`Размер очищенного CSS: ${purgeCSSResult[0].css.length} байт.`);

  } catch (error) {
    // Обработка любых ошибок, которые могут возникнуть в процессе
    console.error('Произошла ошибка при выполнении PurgeCSS или при записи файла:', error);
    if (error.code === 'ENOENT') {
      // Если ошибка связана с отсутствием файла/директории
      console.error('Возможно, PurgeCSS не нашел входной CSS файл или указанный путь для сохранения неверен. Проверьте пути в purgecss.config.js и существование директории ./css/');
    }
  }
}

// Запускаем асинхронную функцию
purgeAndSave();