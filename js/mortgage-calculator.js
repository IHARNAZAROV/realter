
(function () {
  const STORAGE_KEY = "mortgageCalculatorBank";
  const DEFAULT_BANK_SLUG = "belarusbank";

  function rebuildCustomSelect(selectElement) {
    if (!selectElement || !window.initCustomSelectUI) {
      return;
    }

    if (selectElement.dataset.customReady === "1") {
      const customSelect = selectElement.nextElementSibling;

      if (
        customSelect &&
        customSelect.classList.contains("filter-select-ui")
      ) {
        customSelect.remove();
      }

      delete selectElement.dataset.customReady;
      selectElement.classList.remove("is-customized-select");
    }

    window.initCustomSelectUI(selectElement);
  }

  function formatMoney(value) {
    return `${Math.round(value).toLocaleString("ru-RU")}`;
  }

  function calculateAnnuityPayment(loanAmount, annualRate, monthsCount) {
    if (loanAmount <= 0 || monthsCount <= 0) {
      return 0;
    }

    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      return loanAmount / monthsCount;
    }

    return (
      loanAmount *
      ((monthlyRate * Math.pow(1 + monthlyRate, monthsCount)) /
        (Math.pow(1 + monthlyRate, monthsCount) - 1))
    );
  }

  function calculateMortgageWithGracePeriod({
    propertyPrice,
    downPayment,
    years,
    baseInterestRate,
    graceInterestRate
  }) {
    const loanAmount = Math.max(propertyPrice - downPayment, 0);
    const totalMonths = years * 12;

    if (!graceInterestRate || loanAmount <= 0) {
      const monthlyPayment = calculateAnnuityPayment(
        loanAmount,
        baseInterestRate,
        totalMonths
      );

      const totalPayment = monthlyPayment * totalMonths;

      return {
        loanAmount,
        firstMonthlyPayment: monthlyPayment,
        secondMonthlyPayment: null,
        totalPayment,
        overpayment: Math.max(totalPayment - loanAmount, 0)
      };
    }

    const graceMonths = Math.min(
      Number(graceInterestRate.periodMonths) || 0,
      totalMonths
    );

    const firstPeriodRate =
      typeof graceInterestRate.value === "number"
        ? graceInterestRate.value
        : typeof graceInterestRate.min === "number"
          ? graceInterestRate.min
          : baseInterestRate;

    const firstMonthlyPayment = calculateAnnuityPayment(
      loanAmount,
      firstPeriodRate,
      totalMonths
    );

    let remainingLoan = loanAmount;
    const firstPeriodMonthlyRate = firstPeriodRate / 100 / 12;

    for (let monthIndex = 0; monthIndex < graceMonths; monthIndex++) {
      const interestPart = remainingLoan * firstPeriodMonthlyRate;
      const principalPart = firstMonthlyPayment - interestPart;

      remainingLoan -= principalPart;
    }

    const remainingMonths = totalMonths - graceMonths;

    const secondMonthlyPayment =
      remainingMonths > 0
        ? calculateAnnuityPayment(
            remainingLoan,
            baseInterestRate,
            remainingMonths
          )
        : null;

    const totalPayment =
      firstMonthlyPayment * graceMonths +
      (secondMonthlyPayment ? secondMonthlyPayment * remainingMonths : 0);

    return {
      loanAmount,
      firstMonthlyPayment,
      secondMonthlyPayment,
      totalPayment,
      overpayment: Math.max(totalPayment - loanAmount, 0)
    };
  }

  function getRateLabel(program) {
    if (!program.graceInterestRate) {
      return `${program.interestRate}%`;
    }

    if (typeof program.graceInterestRate.value === "number") {
      return `${program.graceInterestRate.value}% → ${program.interestRate}%`;
    }

    return `${program.graceInterestRate.min}-${program.graceInterestRate.max}% → ${program.interestRate}%`;
  }

  function buildProgramDescription(program) {
    let description = `${program.description} Мин. взнос: ${program.minDownPaymentPercent}%. Макс. срок: ${program.maxTermYears} лет.`;

    if (program.graceInterestRate) {
      if (typeof program.graceInterestRate.value === "number") {
        description += ` Льготная ставка ${program.graceInterestRate.value}% на ${program.graceInterestRate.periodMonths} мес., затем ${program.interestRate}%.`;
      } else {
        description += ` Льготная ставка ${program.graceInterestRate.min}-${program.graceInterestRate.max}% на ${program.graceInterestRate.periodMonths} мес., затем ${program.interestRate}%.`;
      }
    }

    return description;
  }

  window.initMultiBankMortgageCalculator = function (realEstateObject) {
    const calculator = document.querySelector("[data-mortgage-calculator]");

    if (!calculator || !Array.isArray(window.MORTGAGE_PROGRAMS)) {
      return;
    }

    const bankSelect = calculator.querySelector("[data-mortgage-bank]");
    const calculatorTitle = calculator.querySelector("[data-mortgage-bank-title]");
    const programSelect = calculator.querySelector("[data-mortgage-program]");
    const descriptionElement = calculator.querySelector("[data-mortgage-description]");

    const propertyPriceInput = calculator.querySelector("[data-mortgage-price]");
    const downPaymentInput = calculator.querySelector("[data-mortgage-down-payment]");
    const termInput = calculator.querySelector("[data-mortgage-term]");
    const rateInput = calculator.querySelector("[data-mortgage-rate]");

    const loanAmountElement = calculator.querySelector("[data-mortgage-loan]");
    const monthlyPaymentElement = calculator.querySelector("[data-mortgage-payment]");
    const overpaymentElement = calculator.querySelector("[data-mortgage-overpay]");
    const totalPaymentElement = calculator.querySelector("[data-mortgage-total]");

    if (
      !bankSelect ||
      !programSelect ||
      !propertyPriceInput ||
      !downPaymentInput ||
      !termInput ||
      !rateInput
    ) {
      return;
    }

    const banksMap = {};

    window.MORTGAGE_PROGRAMS.forEach((program) => {
      if (!banksMap[program.bankSlug]) {
        banksMap[program.bankSlug] = {
          bankName: program.bankName,
          bankSlug: program.bankSlug,
          bankLogo: program.bankLogo,
          programs: []
        };
      }

      banksMap[program.bankSlug].programs.push(program);
    });

    const banks = Object.values(banksMap);

    bankSelect.innerHTML = banks
      .map(
        (bank) =>
          `<option value="${bank.bankSlug}">${bank.bankName}</option>`
      )
      .join("");

    function getPropertyPrice() {
      if (typeof window.RealterPrice?.getLiveBynPriceSync === "function") {
        const livePrice = window.RealterPrice.getLiveBynPriceSync(realEstateObject);

        if (typeof livePrice === "number" && livePrice > 0) {
          return livePrice;
        }
      }

      if (
        typeof realEstateObject?.priceBYN === "number" &&
        realEstateObject.priceBYN > 0
      ) {
        return realEstateObject.priceBYN;
      }

      return 90000;
    }

    function renderPrograms(bankSlug) {
      const selectedBank =
        banksMap[bankSlug] ||
        banksMap[DEFAULT_BANK_SLUG] ||
        banks[0];

      programSelect.innerHTML = selectedBank.programs
        .map(
          (program, index) =>
            `<option value="${index}">${program.programName} · ${getRateLabel(program)}</option>`
        )
        .join("");

      rebuildCustomSelect(programSelect);

      if (calculatorTitle) {
        calculatorTitle.textContent = `Ипотечный калькулятор — ${selectedBank.bankName}`;
      }
    }

    function getSelectedProgram() {
      const selectedBank = banksMap[bankSelect.value] || banks[0];
      const selectedProgramIndex = Number(programSelect.value) || 0;

      return (
        selectedBank.programs[selectedProgramIndex] ||
        selectedBank.programs[0]
      );
    }

    function updateCalculator() {
      const selectedProgram = getSelectedProgram();

      if (!selectedProgram) {
        return;
      }

      const propertyPrice = Math.max(Number(propertyPriceInput.value) || 0, 0);

      const minimumDownPayment = Math.round(
        (propertyPrice * selectedProgram.minDownPaymentPercent) / 100
      );

      downPaymentInput.min = String(minimumDownPayment);

      if (
        !downPaymentInput.value ||
        Number(downPaymentInput.value) < minimumDownPayment
      ) {
        downPaymentInput.value = String(minimumDownPayment);
      }

      const downPayment = Math.min(
        Math.max(Number(downPaymentInput.value) || 0, 0),
        propertyPrice
      );

      termInput.max = String(selectedProgram.maxTermYears);

      if (
        !termInput.value ||
        Number(termInput.value) > selectedProgram.maxTermYears
      ) {
        termInput.value = String(selectedProgram.maxTermYears);
      }

      if (Number(termInput.value) < 1) {
        termInput.value = "1";
      }

      rateInput.value = String(selectedProgram.interestRate);

      const calculation = calculateMortgageWithGracePeriod({
        propertyPrice,
        downPayment,
        years: Number(termInput.value),
        baseInterestRate: Number(selectedProgram.interestRate),
        graceInterestRate: selectedProgram.graceInterestRate || null
      });

      if (descriptionElement) {
        descriptionElement.textContent = buildProgramDescription(selectedProgram);
      }

      if (loanAmountElement) {
        loanAmountElement.textContent = formatMoney(calculation.loanAmount);
      }

      if (monthlyPaymentElement) {
        if (calculation.secondMonthlyPayment) {
          monthlyPaymentElement.textContent = `${formatMoney(calculation.firstMonthlyPayment)} → ${formatMoney(calculation.secondMonthlyPayment)}`;
        } else {
          monthlyPaymentElement.textContent = formatMoney(calculation.firstMonthlyPayment);
        }
      }

      if (overpaymentElement) {
        overpaymentElement.textContent = formatMoney(calculation.overpayment);
      }

      if (totalPaymentElement) {
        totalPaymentElement.textContent = formatMoney(calculation.totalPayment);
      }
    }

    propertyPriceInput.value = String(getPropertyPrice());

    bankSelect.addEventListener("change", () => {
      renderPrograms(bankSelect.value);
      programSelect.value = "0";

      localStorage.setItem(STORAGE_KEY, bankSelect.value);

      updateCalculator();
    });

    programSelect.addEventListener("change", updateCalculator);

    [
      propertyPriceInput,
      downPaymentInput,
      termInput,
      rateInput
    ].forEach((input) => {
      input.addEventListener("input", updateCalculator);
      input.addEventListener("change", updateCalculator);
    });

    const savedBankSlug = localStorage.getItem(STORAGE_KEY);
    const initialBankSlug = banksMap[savedBankSlug]
      ? savedBankSlug
      : DEFAULT_BANK_SLUG;

    bankSelect.value = banksMap[initialBankSlug]
      ? initialBankSlug
      : banks[0].bankSlug;

    renderPrograms(bankSelect.value);

    programSelect.value = "0";

    rebuildCustomSelect(bankSelect);
    rebuildCustomSelect(programSelect);

    updateCalculator();
  };
})();

