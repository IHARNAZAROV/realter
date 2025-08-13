// build-purge.js

// Импортируем класс PurgeCSS напрямую
import { PurgeCSS } from 'purgecss';
import { promises as fs } from 'fs';
import purgecssConfig from './purgecss.config.js';

async function purgeAndSave() {
  const purgeCSSResult = await new PurgeCSS().purge(purgecssConfig);

  if (!purgeCSSResult || !purgeCSSResult.length) {
    console.error('Ошибка: PurgeCSS не вернул результат.');
    return;
  }

  await fs.writeFile('./css/style-purged.css', purgeCSSResult[0].css);

  console.log('Неиспользуемые стили успешно удалены!');
}

purgeAndSave();
