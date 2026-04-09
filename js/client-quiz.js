(function () {
  const modal = document.getElementById("clientQuizModal");
  const openButton = document.querySelector("[data-client-quiz-open]");
  const closeButtons = Array.from(document.querySelectorAll("[data-client-quiz-close]"));
  const form = document.getElementById("clientQuizForm");

  if (!modal || !openButton || !form) return;

  const progressLabel = form.querySelector("[data-client-quiz-progress-label]");
  const progressFill = form.querySelector("[data-client-quiz-progress-fill]");
  const stepTitle = form.querySelector("[data-client-quiz-step-title]");
  const stepHint = form.querySelector("[data-client-quiz-step-hint]");
  const choicesContainer = form.querySelector("[data-client-quiz-choices]");
  const backButton = form.querySelector("[data-client-quiz-back]");
  const nextButton = form.querySelector("[data-client-quiz-next]");
  const feedback = form.querySelector("[data-client-quiz-feedback]");

  const steps = [
    {
      key: "goal",
      title: "Шаг 1. Цель обращения",
      hint: "Что для вас сейчас актуальнее?",
      type: "single",
      options: ["Купить недвижимость", "Продать недвижимость", "Продать и купить одновременно", "Нужна консультация"],
    },
    {
      key: "type",
      title: "Шаг 2. Тип недвижимости",
      hint: "Можно выбрать несколько вариантов.",
      type: "multi",
      options: ["Квартира", "Дом", "Участок", "Коммерческая недвижимость"],
    },
    {
      key: "budget",
      title: "Шаг 3. Бюджет / ожидания по цене",
      hint: "Укажите диапазон, который вам комфортен.",
      type: "single",
      options: ["До $30 000", "$30 000–$60 000", "$60 000–$100 000", "Свыше $100 000 / обсуждаемо"],
    },
    {
      key: "timeline",
      title: "Шаг 4. Сроки",
      hint: "Когда планируете начать сделку?",
      type: "single",
      options: ["Срочно, в течение 1 месяца", "В течение 2–3 месяцев", "До полугода", "Пока присматриваюсь"],
    },
    {
      key: "district",
      title: "Шаг 5. Район / локация",
      hint: "Какой район в приоритете?",
      type: "single",
      options: ["Центр", "Северный", "Южный", "Другой район / пригород"],
    },
    {
      key: "contact",
      title: "Шаг 6. Контакты",
      hint: "Оставьте телефон, чтобы получить подборку и консультацию.",
      type: "contact",
    },
  ];

  const state = {
    stepIndex: 0,
    answers: {},
  };

  function resetFeedback() {
    feedback.textContent = "";
    feedback.classList.remove("is-error", "is-success");
  }

  function setFeedback(text, type) {
    feedback.textContent = text;
    feedback.classList.remove("is-error", "is-success");
    if (type) feedback.classList.add(type === "error" ? "is-error" : "is-success");
  }

  function toggleChoiceState() {
    const choices = choicesContainer.querySelectorAll(".client-quiz__choice");
    choices.forEach((item) => {
      const input = item.querySelector("input");
      item.classList.toggle("is-selected", Boolean(input && input.checked));
    });
  }

  function updateProgress() {
    const current = state.stepIndex + 1;
    const total = steps.length;
    const percent = (current / total) * 100;
    progressLabel.textContent = `Шаг ${current} из ${total}`;
    progressFill.style.width = `${percent}%`;
  }

  function renderChoices(step) {
    choicesContainer.innerHTML = "";

    if (step.type === "contact") {
      choicesContainer.innerHTML = `
        <div class="client-quiz__contact-grid">
          <div class="client-quiz__field">
            <label for="clientQuizName">Имя</label>
            <input id="clientQuizName" name="name" type="text" placeholder="Как к вам обращаться" value="${state.answers.name || ""}">
          </div>
          <div class="client-quiz__field">
            <label for="clientQuizPhone">Телефон *</label>
            <input id="clientQuizPhone" name="phone" type="tel" placeholder="+375 ..." value="${state.answers.phone || ""}" required>
          </div>
          <div class="client-quiz__field">
            <label for="clientQuizComment">Комментарий</label>
            <textarea id="clientQuizComment" name="comment" placeholder="Например: нужна квартира с ремонтом в центре">${state.answers.comment || ""}</textarea>
          </div>
        </div>
      `;
      return;
    }

    const name = `quiz-${step.key}`;
    const selected = state.answers[step.key];

    step.options.forEach((option) => {
      const isChecked = step.type === "multi"
        ? Array.isArray(selected) && selected.includes(option)
        : selected === option;

      const wrapper = document.createElement("label");
      wrapper.className = `client-quiz__choice${isChecked ? " is-selected" : ""}`;

      wrapper.innerHTML = `
        <input
          type="${step.type === "multi" ? "checkbox" : "radio"}"
          name="${name}"
          value="${option}"
          ${isChecked ? "checked" : ""}
        />
        <span>${option}</span>
      `;

      choicesContainer.appendChild(wrapper);
    });

  }

  function renderStep() {
    const step = steps[state.stepIndex];
    stepTitle.textContent = step.title;
    stepHint.textContent = step.hint;

    backButton.disabled = state.stepIndex === 0;
    nextButton.textContent = state.stepIndex === steps.length - 1 ? "Отправить" : "Далее";

    updateProgress();
    renderChoices(step);
    resetFeedback();
  }

  function collectStepData() {
    const step = steps[state.stepIndex];

    if (step.type === "contact") {
      const nameInput = form.querySelector("#clientQuizName");
      const phoneInput = form.querySelector("#clientQuizPhone");
      const commentInput = form.querySelector("#clientQuizComment");

      state.answers.name = (nameInput && nameInput.value.trim()) || "";
      state.answers.phone = (phoneInput && phoneInput.value.trim()) || "";
      state.answers.comment = (commentInput && commentInput.value.trim()) || "";

      if (state.answers.phone.length < 7) {
        setFeedback("Укажите корректный телефон, пожалуйста.", "error");
        return false;
      }

      return true;
    }

    const checked = Array.from(choicesContainer.querySelectorAll("input:checked")).map((item) => item.value);

    if (!checked.length) {
      setFeedback("Выберите хотя бы один вариант, чтобы продолжить.", "error");
      return false;
    }

    state.answers[step.key] = step.type === "multi" ? checked : checked[0];
    return true;
  }

  async function submitQuiz() {
    const payload = {
      ...state.answers,
      source: "homepage-client-quiz",
      createdAt: new Date().toISOString(),
    };

    nextButton.disabled = true;
    nextButton.textContent = "Отправляем...";

    try {
      const response = await fetch("/api/client-quiz.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result || result.ok !== true) {
        throw new Error("REQUEST_FAILED");
      }

      setFeedback("Спасибо! Я получила ваши ответы и свяжусь с вами.", "success");
      nextButton.textContent = "Готово";
      setTimeout(closeModal, 900);
    } catch (error) {
      setFeedback("Не удалось отправить квиз. Попробуйте чуть позже.", "error");
      nextButton.disabled = false;
      nextButton.textContent = "Отправить";
    }
  }

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    state.stepIndex = 0;
    state.answers = {};
    renderStep();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    nextButton.disabled = false;
    nextButton.textContent = "Далее";
  }

  openButton.addEventListener("click", openModal);

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  backButton.addEventListener("click", function () {
    if (state.stepIndex === 0) return;
    state.stepIndex -= 1;
    renderStep();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!collectStepData()) return;

    if (state.stepIndex < steps.length - 1) {
      state.stepIndex += 1;
      renderStep();
      return;
    }

    submitQuiz();
  });

  choicesContainer.addEventListener("change", toggleChoiceState);
})();
