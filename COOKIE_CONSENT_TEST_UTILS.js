/**
 * ТЕСТОВЫЙ СКРИПТ для проверки работоспособности cookie-consent.js
 * 
 * Используйте этот скрипт в консоли браузера (F12 → Console) для тестирования всех функций
 */

// ==========================================
// 1. ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ
// ==========================================

console.log('%c=== ЧТЕНИЕ КУКИ ===', 'color: blue; font-size: 16px; font-weight: bold;');

// Функция для чтения куки
function getCookieData() {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('cookieConsent='))
    ?.split('=')[1];
  
  if (!cookieValue) {
    console.log('❌ Куки не найдены');
    return null;
  }
  
  try {
    const data = JSON.parse(decodeURIComponent(cookieValue));
    console.log('✅ Куки найдены:', data);
    console.table(data);
    return data;
  } catch (e) {
    console.log('❌ Ошибка чтения куки:', e.message);
    return null;
  }
}

// Функция для удаления куки
function deleteCookie() {
  document.cookie = 'cookieConsent=; max-age=0; path=/';
  console.log('✅ Куки удалены. Перезагрузите страницу (F5)');
}

// Функция для установки куки вручную
function setCookieManually(necessary = true, analytics = true, marketing = false) {
  const data = {
    necessary,
    analytics,
    marketing,
    updatedAt: new Date().toISOString()
  };
  const maxAge = 24 * 180 * 60 * 60;
  document.cookie = `cookieConsent=${encodeURIComponent(JSON.stringify(data))}; max-age=${maxAge}; path=/; SameSite=Lax`;
  console.log('✅ Куки установлены:', data);
}

// ==========================================
// 2. ФУНКЦИИ ДЛЯ ТЕСТИРОВАНИЯ UI
// ==========================================

console.log('%c=== УПРАВЛЕНИЕ UI ===', 'color: green; font-size: 16px; font-weight: bold;');

// Открыть модальное окно согласия
function showCookieModal() {
  const modal = document.getElementById('cookieModal');
  if (modal) {
    modal.classList.add('show');
    console.log('✅ Окно согласия открыто');
  } else {
    console.log('❌ Модалка не найдена');
  }
}

// Закрыть модальное окно
function hideCookieModal() {
  const modal = document.getElementById('cookieModal');
  if (modal) {
    modal.classList.remove('show');
    console.log('✅ Окно согласия закрыто');
  }
}

// Открыть настройки из любого места
function openSettings() {
  if (typeof window.openCookieSettings === 'function') {
    window.openCookieSettings();
    console.log('✅ Настройки открыты');
  } else {
    console.log('❌ Функция openCookieSettings не найдена');
  }
}

// ==========================================
// 3. ПРОВЕРКА СТАТУСОВ
// ==========================================

console.log('%c=== ПРОВЕРКА СТАТУСОВ ===', 'color: orange; font-size: 16px; font-weight: bold;');

// Проверить, что аналитика ВСЕГДА включена
function checkAnalyticsAlwaysEnabled() {
  const cookie = getCookieData();
  if (cookie && cookie.analytics === true) {
    console.log('✅ ВЕРНО: analytics = true (ВСЕГДА включена)');
    return true;
  } else {
    console.log('❌ ОШИБКА: analytics не равна true!');
    return false;
  }
}

// Проверить наличие кнопок
function checkButtons() {
  const buttons = {
    'Accept All': document.getElementById('cookieAcceptAll'),
    'Decline All': document.getElementById('cookieDeclineAll'),
    'Settings': document.getElementById('cookieSettingsBtn'),
    'Save Settings': document.getElementById('cookieSaveSettings'),
    'Back': document.getElementById('cookieBackBtn'),
    'Close': document.getElementById('cookieCloseBtn'),
  };
  
  console.log('%c--- Проверка кнопок ---', 'color: purple;');
  let allFound = true;
  Object.entries(buttons).forEach(([name, element]) => {
    if (element) {
      console.log(`✅ ${name} - найдена`);
    } else {
      console.log(`❌ ${name} - НЕ найдена`);
      allFound = false;
    }
  });
  
  return allFound;
}

// Проверить Toggle состояния
function checkToggles() {
  const analyticToggle = document.getElementById('cookieAnalytics');
  const marketingToggle = document.getElementById('cookieMarketing');
  
  console.log('%c--- Проверка Toggle переключателей ---', 'color: purple;');
  
  if (analyticToggle) {
    console.log(`✅ Analytics Toggle найден (disabled: ${analyticToggle.disabled})`);
    if (analyticToggle.disabled && analyticToggle.checked) {
      console.log('✅ ВЕРНО: Analytics отключен для редактирования и ВСЕГДА включен');
    } else {
      console.log('⚠️ ПРЕДУПРЕЖДЕНИЕ: Analytics должен быть disabled и checked');
    }
  } else {
    console.log('❌ Analytics Toggle НЕ найден');
  }
  
  if (marketingToggle) {
    console.log(`✅ Marketing Toggle найден (disabled: ${marketingToggle.disabled})`);
  } else {
    console.log('❌ Marketing Toggle НЕ найден');
  }
}

// ==========================================
// 4. СИМУЛЯЦИЯ ДЕЙСТВИЙ ПОЛЬЗОВАТЕЛЯ
// ==========================================

console.log('%c=== СИМУЛЯЦИЯ ДЕЙСТВИЙ ===', 'color: red; font-size: 16px; font-weight: bold;');

// Симуляция клика "Принять всё"
function simulateAcceptAll() {
  console.log('%c--- Симуляция: Принять всё ---', 'color: green;');
  const btn = document.getElementById('cookieAcceptAll');
  if (btn) {
    btn.click();
    console.log('✅ Клик выполнен');
    setTimeout(() => {
      checkAnalyticsAlwaysEnabled();
      getCookieData();
    }, 100);
  } else {
    console.log('❌ Кнопка не найдена');
  }
}

// Симуляция клика "Отклонить"
function simulateDeclineAll() {
  console.log('%c--- Симуляция: Отклонить ---', 'color: red;');
  console.log('⚠️ Сначала удалите куки: deleteCookie(), затем перезагрузите страницу');
  showCookieModal();
  const btn = document.getElementById('cookieDeclineAll');
  if (btn) {
    btn.click();
    console.log('✅ Клик выполнен');
    setTimeout(() => {
      checkAnalyticsAlwaysEnabled();
      getCookieData();
    }, 100);
  } else {
    console.log('❌ Кнопка не найдена');
  }
}

// Симуляция клика Close (X)
function simulateClose() {
  console.log('%c--- Симуляция: Закрыть (X) ---', 'color: red;');
  console.log('⚠️ Сначала удалите куки: deleteCookie(), затем перезагрузите страницу');
  showCookieModal();
  const btn = document.getElementById('cookieCloseBtn');
  if (btn) {
    btn.click();
    console.log('✅ Клик выполнен');
    setTimeout(() => {
      checkAnalyticsAlwaysEnabled();
      getCookieData();
    }, 100);
  } else {
    console.log('❌ Кнопка не найдена');
  }
}

// ==========================================
// 5. ПОЛНАЯ ДИАГНОСТИКА
// ==========================================

console.log('%c=== ПОЛНАЯ ДИАГНОСТИКА ===', 'color: blue; font-size: 16px; font-weight: bold;');

function fullDiagnostics() {
  console.log('%c\n========== ПОЛНАЯ ДИАГНОСТИКА ==========\n', 'color: blue; font-size: 18px; font-weight: bold;');
  
  console.log('1️⃣ Чтение куки:');
  getCookieData();
  
  console.log('\n2️⃣ Проверка кнопок:');
  checkButtons();
  
  console.log('\n3️⃣ Проверка Toggle переключателей:');
  checkToggles();
  
  console.log('\n4️⃣ Проверка analytics:');
  checkAnalyticsAlwaysEnabled();
  
  console.log('\n5️⃣ Проверка ym (Яндекс.Метрика):');
  if (typeof ym === 'function') {
    console.log('✅ Яндекс.Метрика загружена');
  } else {
    console.log('⚠️ Яндекс.Метрика НЕ загружена или загрузиться позже');
  }
  
  console.log('\n6️⃣ Проверка window.__applyCookieConsent:');
  if (typeof window.__applyCookieConsent === 'function') {
    console.log('✅ Функция определена');
  } else {
    console.log('⚠️ Функция НЕ определена (добавьте её на страницу)');
  }
  
  console.log('\n========== КОНЕЦ ДИАГНОСТИКИ ==========\n', 'color: blue; font-size: 18px; font-weight: bold;');
}

// ==========================================
// 6. СПРАВКА
// ==========================================

function help() {
  console.log('%c\n╔════════════════════════════════════════════╗', 'color: cyan;');
  console.log('%c║  СПРАВКА ПО ФУНКЦИЯМ ТЕСТИРОВАНИЯ         ║', 'color: cyan;');
  console.log('%c╚════════════════════════════════════════════╝\n', 'color: cyan;');
  
  console.log('%cЧТЕНИЕ/УДАЛЕНИЕ КУКИ:', 'font-weight: bold; color: #FF6B6B;');
  console.log('  getCookieData()           - Прочитать текущие куки');
  console.log('  deleteCookie()            - Удалить куки (потом F5)');
  console.log('  setCookieManually(n, a, m) - Установить куки вручную\n');
  
  console.log('%cУПРАВЛЕНИЕ UI:', 'font-weight: bold; color: #4ECDC4;');
  console.log('  showCookieModal()         - Открыть окно согласия');
  console.log('  hideCookieModal()         - Закрыть окно согласия');
  console.log('  openSettings()            - Открыть настройки\n');
  
  console.log('%cПРОВЕРКА СТАТУСОВ:', 'font-weight: bold; color: #95E1D3;');
  console.log('  checkAnalyticsAlwaysEnabled() - Проверить что analytics = true');
  console.log('  checkButtons()            - Проверить наличие кнопок');
  console.log('  checkToggles()            - Проверить переключатели\n');
  
  console.log('%cСИМУЛЯЦИЯ ДЕЙСТВИЙ:', 'font-weight: bold; color: #F38181;');
  console.log('  simulateAcceptAll()       - Нажать "Принять всё"');
  console.log('  simulateDeclineAll()      - Нажать "Отклонить"');
  console.log('  simulateClose()           - Нажать крестик (X)\n');
  
  console.log('%cДИАГНОСТИКА:', 'font-weight: bold; color: #AA96DA;');
  console.log('  fullDiagnostics()         - Полная проверка всех функций\n');
  
  console.log('%cСПРАВКА:', 'font-weight: bold; color: #FCBAD3;');
  console.log('  help()                    - Показать эту справку\n');
}

// ==========================================
// АВТОМАТИЧЕСКИЙ ВЫВОД СПРАВКИ
// ==========================================

console.clear();
console.log('%c\n🍪 ДОБРО ПОЖАЛОВАТЬ В ТЕСТОВУЮ КОНСОЛЬ COOKIE-CONSENT\n', 'color: #FFD700; font-size: 18px; font-weight: bold;');
help();
