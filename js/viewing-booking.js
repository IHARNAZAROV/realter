(function () {
  const form = document.getElementById('viewing-booking-form');
  if (!form) return;

  const dateInput = document.getElementById('booking-date');
  const timeInput = document.getElementById('booking-time');
  const objectTitleInput = document.getElementById('booking-object-title');
  const nameInput = document.getElementById('booking-name');
  const phoneInput = document.getElementById('booking-phone');
  const submitBtn = form.querySelector('.booking-submit-btn');
  const feedback = document.getElementById('booking-feedback');
  const timeButtons = Array.from(form.querySelectorAll('.booking-time-btn'));
  const endpoint = form.dataset.apiEndpoint || 'api/book-viewing.php';

  const today = new Date();
  const localISODate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
  dateInput.min = localISODate;

  const phoneRegex = /^\+?[\d\s()\-]{9,20}$/;

  function syncObjectTitle() {
    if (!objectTitleInput) return;
    const titleEl = document.querySelector('[data-hero-title]');
    const fallback = document.querySelector('[data-page-title]');
    const title = (titleEl && titleEl.textContent.trim()) || (fallback && fallback.textContent.trim()) || document.title;
    objectTitleInput.value = title;
  }

  syncObjectTitle();
  setTimeout(syncObjectTitle, 400);
  setTimeout(syncObjectTitle, 1200);

  function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.classList.remove('is-success', 'is-error');
    if (type) feedback.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function isFormValid() {
    return (
      dateInput.value &&
      timeInput.value &&
      nameInput.value.trim().length > 1 &&
      phoneRegex.test(phoneInput.value.trim())
    );
  }

  function refreshSubmitState() {
    submitBtn.disabled = !isFormValid();
  }

  timeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      timeButtons.forEach((btn) => btn.classList.remove('is-active'));
      button.classList.add('is-active');
      timeInput.value = button.dataset.time || '';
      refreshSubmitState();
      setFeedback('');
    });
  });

  [dateInput, nameInput, phoneInput].forEach((field) => {
    field.addEventListener('input', () => {
      refreshSubmitState();
      setFeedback('');
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    syncObjectTitle();

    if (!isFormValid()) {
      setFeedback('Пожалуйста, заполните все поля и проверьте телефон.', 'error');
      refreshSubmitState();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем...';

    try {
      const payload = {
        date: dateInput.value,
        time: timeInput.value,
        objectTitle: objectTitleInput ? objectTitleInput.value : '',
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        throw new Error('ENDPOINT_NOT_FOUND');
      }

      let result = null;
      try {
        result = await response.json();
      } catch (_) {
        result = null;
      }

      if (!response.ok || (result && result.ok === false)) {
        throw new Error((result && result.error) || 'REQUEST_FAILED');
      }

      setFeedback('Спасибо! Мы свяжемся с вами для подтверждения просмотра.', 'success');
      form.reset();
      timeInput.value = '';
      syncObjectTitle();
      timeButtons.forEach((btn) => btn.classList.remove('is-active'));
    } catch (error) {
      if (error.message === 'ENDPOINT_NOT_FOUND') {
        setFeedback('Ошибка 404: обработчик формы не найден. Проверьте путь к API и PHP на сервере.', 'error');
      } else if (error.message && error.message.toLowerCase().includes('telegram')) {
        setFeedback('Заявка не отправлена: Telegram не настроен на сервере. Проверьте токен и chat_id.', 'error');
      } else {
        setFeedback('Не удалось отправить заявку. Попробуйте позже или свяжитесь по телефону.', 'error');
      }
    } finally {
      submitBtn.textContent = 'Записаться на просмотр';
      refreshSubmitState();
    }
  });

  refreshSubmitState();
})();
