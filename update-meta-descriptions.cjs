const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'objects-list.json');

try {
  //읽기
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Update each object with metaDescription
  data.forEach(obj => {
    if (!obj.metaDescription) {
      // Приоритет: cardDescription → description
      const source = obj.cardDescription || obj.description || '';
      
      // Обрезать до 160 символов (оптимально для Google)
      const metaDesc = source
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 160);
      
      obj.metaDescription = metaDesc.endsWith('.') ? metaDesc : metaDesc + '.';
    }
  });

  // Запись
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Обновлено ${data.length} объектов. Meta-descriptions добавлены.`);
} catch (err) {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
}
