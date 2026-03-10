(function () {
  const form = document.getElementById('viewing-booking-form');
  if (!form) return;

  const dateInput = document.getElementById('booking-date');
  const timeInput = document.getElementById('booking-time');
  const nameInput = document.getElementById('booking-name');
  const phoneInput = document.getElementById('booking-phone');
  const submitBtn = form.querySelector('.booking-submit-btn');
  const feedback = document.getElementById('booking-feedback');
  const timeButtons = Array.from(form.querySelectorAll('.booking-time-btn'));

  const today = new Date();
  const localISODate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
  dateInput.min = localISODate;

  const phoneRegex = /^\+?[\d\s()\-]{9,20}$/;

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
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
      };

      const response = await fetch('/api/book-viewing.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      setFeedback('Спасибо! Мы свяжемся с вами для подтверждения просмотра.', 'success');
      form.reset();
      timeInput.value = '';
      timeButtons.forEach((btn) => btn.classList.remove('is-active'));
    } catch (error) {
      setFeedback('Не удалось отправить заявку. Попробуйте позже или свяжитесь по телефону.', 'error');
    } finally {
      submitBtn.textContent = 'Записаться на просмотр';
      refreshSubmitState();
    }
  });

  refreshSubmitState();
})();
