/* ==========================================
   КРАТКОЕ РЕЗЮМЕ ИЗМЕНЕНИЙ
   ========================================== */

/*
 * 🍪 COOKIE CONSENT v2.0
 * 
 * Дата обновления: 28 марта 2026 г.
 * 
 * ✅ Что было изменено:
 * 1. GA4, GTM и Яндекс.Метрика ВСЕГДА включены (analytics: true)
 * 2. Даже если пользователь нажимает "Отклонить" или закрывает окно
 * 3. Раздел Analytics в UI отмечен как "всегда включено" (disabled)
 * 4. Пользователь может управлять только Marketing куками
 * 
 * ✅ Файлы:
 * - js/cookie-consent.js - основной файл (переписан, теперь читаемый)
 * - COOKIE_CONSENT_TEST_UTILS.js - функции для тестирования
 * - COOKIE_CONSENT_CHANGES.md - полная документация
 * - COOKIE_CONSENT_HTML_EXAMPLE.html - пример интеграции
 * - COOKIE_CONSENT_CHECKLIST.md - чеклист проверки
 * 
 * 🧪 БЫСТРАЯ ПРОВЕРКА В КОНСОЛИ (F12):
 */

// Загрузить тестовые функции (если они не загружены):
// <script src="/COOKIE_CONSENT_TEST_UTILS.js"></script>

// Затем используйте в консоли:
fullDiagnostics()              // 📊 Полная диагностика
getCookieData()                // 📖 Чтение куки
checkAnalyticsAlwaysEnabled()  // ✅ Проверка что analytics = true
deleteCookie()                 // 🗑️ Удалить куки для тестирования
showCookieModal()              // 🪟 Показать модалку
help()                         // ℹ️ Справка

/*
 * 📋 КЛЮЧЕВЫЕ МОМЕНТЫ:
 * 
 * 1. ANALYTICS ВСЕГДА ВКЛЮЧЕНА
 *    ┌────────────────────────────────────────────┐
 *    │ "Принять всё"   → analytics: true, marketing: true   │
 *    │ "Отклонить"     → analytics: true, marketing: false  │
 *    │ "Закрыть (X)"   → analytics: true, marketing: false  │
 *    │ "Сохранить"     → analytics: true, marketing: <выбор> │
 *    └────────────────────────────────────────────┘
 * 
 * 2. UI ИЗМЕНЕНИЯ
 *    ├─ Necessary: всегда включен (disabled)
 *    ├─ Analytics: всегда включен (disabled) ← НОВОЕ
 *    └─ Marketing: можно менять (enabled)
 * 
 * 3. ТЕКСТ ОБНОВЛЕН
 *    "GA4 / GTM / Яндекс.Метрика (всегда включены)"
 *    "Аналитика всегда включена. Можно управлять только маркетингом."
 */

/*
 * 🔧 ИНТЕГРАЦИЯ НА СТРАНИЦЕ:
 */

// 1. В зарвать вашей HTML страницы добавьте:
// <script>
// window.__applyCookieConsent = function() {
//   console.log('✅ Куки приняты, инициализируем аналитику...');
//   // Инициализируйте GA4, GTM, Яндекс.Метрику здесь
// };
// </script>

// 2. Загрузите cookie-consent.js:
// <script src="/js/cookie-consent.js"></script>

// 3. Загрузите аналитику (она будет работать с куками):
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
// Яндекс.Метрика код...

/*
 * ✅ ЕСЛИ НУЖНО ОТКРЫТЬ НАСТРОЙКИ ИЗ ДРУГОГО МЕСТА:
 */

// <a href="#" onclick="window.openCookieSettings(); return false;">
//   ⚙️ Управление куками
// </a>

/*
 * 🧪 СЦЕНАРИИ ТЕСТИРОВАНИЯ:
 */

// Сценарий 1: Первый визит → Принять всё
// deleteCookie(); location.reload();  // Удалить куки и перезагрузить
// Нажать "Принять всё" → getCookieData() → { ..., analytics: true, marketing: true }

// Сценарий 2: Первый визит → Отклонить
// deleteCookie(); location.reload();  // Удалить куки и перезагрузить
// Нажать "Отклонить" → getCookieData() → { ..., analytics: true, marketing: false }
// ⚠️ КЛЮЧный момент: analytics ВСЕГДА true!

// Сценарий 3: Открыть настройки и изменить Marketing
// openSettings();  // Открыть настройки
// Измените Marketing → Нажмите "Сохранить"
// getCookieData() → analytics: true, marketing: <ваш выбор>

// Сценарий 4: Повторный визит (куки уже существуют)
// location.reload();  // Перезагрузиться
// ✅ Окно согласия НЕ должно появляться
// Окно должно быть скрыто, куки загружены

/*
 * ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ:
 * 
 * 1. Убедитесь что Яндекс.Метрика загружается ПОСЛЕ cookie-consent.js
 * 2. Убедитесь что window.__applyCookieConsent() определена ДО нажатия кнопок
 * 3. GTM и GA4 должны быть готовы к работе с куками
 * 4. Проверьте в Яндекс.Метрике: реальные события должны отправляться
 * 5. Проверьте в GA4 Real-time: события должны быть видны
 */

/*
 * 🐛 ОТЛАДКА:
 * 
 * Если что-то не работает, выполните в консоли:
 */

// 1. Полная диагностика
fullDiagnostics();

// 2. Если analytics не true:
const cookie = JSON.parse(decodeURIComponent(
  document.cookie
    .split('; ')
    .find(c => c.startsWith('cookieConsent'))
    .split('=')[1]
));
console.log('analytics равна true?', cookie.analytics === true);

// 3. Если Яндекс.Метрика не работает:
console.log('ym доступна?', typeof ym === 'function');
if (typeof ym === 'function') {
  ym(105770392, 'reachGoal', 'test');
  console.log('✅ Яндекс.Метрика работает');
}

// 4. Если GA4 не работает:
console.log('gtag доступна?', typeof gtag === 'function');

/*
 * 📚 ДОПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ:
 * 
 * - COOKIE_CONSENT_CHANGES.md - подробное описание всех изменений
 * - COOKIE_CONSENT_HTML_EXAMPLE.html - пример HTML файла
 * - COOKIE_CONSENT_CHECKLIST.md - полный чеклист для проверки
 */

/* ========================================== */
console.log('%c🍪 Cookie Consent v2.0 загружена и готова к использованию', 'color: green; font-size: 14px; font-weight: bold;');
/* ========================================== */
