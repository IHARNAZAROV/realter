(function () {
  const form = document.getElementById('viewing-booking-form');
  const modal = document.querySelector('[data-booking-modal]');
  const openBtn = document.querySelector('[data-open-booking-modal]');
  const closeBtns = Array.from(document.querySelectorAll('[data-close-booking-modal]'));
  if (!form || !modal || !openBtn) return;

  const dateInput = document.getElementById('booking-date');
  const dateTrigger = document.getElementById('booking-date-trigger');
  const dateLabel = form.querySelector('[data-date-label]');
  const calendar = document.getElementById('booking-calendar-popover');
  const calMonth = form.querySelector('[data-cal-month]');
  const calGrid = form.querySelector('[data-cal-grid]');
  const calPrev = form.querySelector('[data-cal-prev]');
  const calNext = form.querySelector('[data-cal-next]');
  const timeInput = document.getElementById('booking-time');
  const objectTitleInput = document.getElementById('booking-object-title');
  const nameInput = document.getElementById('booking-name');
  const phoneInput = document.getElementById('booking-phone');
  const submitBtn = form.querySelector('.booking-submit-btn');
  const feedback = document.getElementById('booking-feedback');
  const timeButtons = Array.from(form.querySelectorAll('.booking-time-btn'));
  const endpoint = form.dataset.apiEndpoint || 'api/book-viewing.php';

  const phoneRegex = /^\+?[\d\s()\-]{9,20}$/;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.hidden = true;
    closeCalendar();
    document.body.style.overflow = '';
  }

  function formatISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatRU(date) {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  function openCalendar() {
    calendar.hidden = false;
    dateTrigger.setAttribute('aria-expanded', 'true');
  }

  function closeCalendar() {
    calendar.hidden = true;
    dateTrigger.setAttribute('aria-expanded', 'false');
  }

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    calMonth.textContent = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calGrid.innerHTML = '';

    for (let i = 0; i < startOffset; i += 1) {
      const empty = document.createElement('button');
      empty.type = 'button';
      empty.className = 'booking-calendar__day is-empty';
      empty.textContent = ' ';
      calGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking-calendar__day';
      btn.textContent = String(day);
      const d = new Date(year, month, day);
      const iso = formatISO(d);

      if (d < today) {
        btn.classList.add('is-disabled');
      } else {
        btn.addEventListener('click', () => {
          dateInput.value = iso;
          dateLabel.textContent = formatRU(d);
          calGrid.querySelectorAll('.booking-calendar__day').forEach((el) => el.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          closeCalendar();
          refreshSubmitState();
          setFeedback('');
        });
      }

      if (dateInput.value === iso) {
        btn.classList.add('is-selected');
      }

      calGrid.appendChild(btn);
    }
  }

  function syncObjectTitle() {
    if (!objectTitleInput) return;
    const titleEl = document.querySelector('[data-hero-title]');
    const fallback = document.querySelector('[data-page-title]');
    const title = (titleEl && titleEl.textContent.trim()) || (fallback && fallback.textContent.trim()) || document.title;
    objectTitleInput.value = title;
  }

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

  openBtn.addEventListener('click', openModal);
  closeBtns.forEach((btn) => btn.addEventListener('click', closeModal));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  dateTrigger.addEventListener('click', () => {
    if (calendar.hidden) openCalendar();
    else closeCalendar();
  });

  calPrev.addEventListener('click', () => {
    const candidate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (candidate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      currentMonth = candidate;
      renderCalendar();
    }
  });

  calNext.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  document.addEventListener('click', (event) => {
    if (modal.hidden) return;
    if (!form.contains(event.target) && !openBtn.contains(event.target)) closeCalendar();
  });

  timeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      timeButtons.forEach((btn) => btn.classList.remove('is-active'));
      button.classList.add('is-active');
      timeInput.value = button.dataset.time || '';
      refreshSubmitState();
      setFeedback('');
    });
  });

  [nameInput, phoneInput].forEach((field) => {
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
      dateLabel.textContent = 'Выберите дату';
      timeInput.value = '';
      syncObjectTitle();
      timeButtons.forEach((btn) => btn.classList.remove('is-active'));
      renderCalendar();
      closeModal();
    } catch (error) {
      setFeedback('Не удалось отправить заявку. Попробуйте позже или свяжитесь по телефону.', 'error');
    } finally {
      submitBtn.textContent = 'Записаться на просмотр';
      refreshSubmitState();
    }
  });

  syncObjectTitle();
  setTimeout(syncObjectTitle, 400);
  setTimeout(syncObjectTitle, 1200);
  renderCalendar();
  refreshSubmitState();
})();
