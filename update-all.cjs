/**
 * update-all.cjs
 * Запускает все обслуживающие скрипты в правильном порядке:
 *   1. split-objects.cjs       — разбивает objects.json на отдельные файлы
 *   2. update-meta-descriptions.cjs — обновляет мета-описания
 *   3. generate-sitemap.cjs    — генерирует sitemap.xml
 *
 * Использование: node update-all.cjs
 */

const { execSync } = require('child_process');

const scripts = [
  'split-objects.cjs',
  'update-meta-descriptions.cjs',
  'generate-sitemap.cjs',
];

console.log('=== Запуск обновления ===\n');

for (const script of scripts) {
  console.log(`▶ ${script}...`);
  try {
    execSync(`node ${script}`, { stdio: 'inherit' });
    console.log(`✓ ${script} выполнен\n`);
  } catch (err) {
    console.error(`✗ Ошибка в ${script}. Остановка.`);
    process.exit(1);
  }
}

console.log('=== Всё готово ===');
