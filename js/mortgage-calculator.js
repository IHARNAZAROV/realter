(function () {
  const STORAGE_KEY = "mortgageCalculatorBank";
  const DEFAULT_BANK = "belarusbank";

  function groupProgramsByBank(programs) {
    return programs.reduce((acc, program) => {
      if (!acc[program.bankSlug]) {
        acc[program.bankSlug] = {
          bankName: program.bankName,
          bankSlug: program.bankSlug,
          bankLogo: program.bankLogo,
          programs: [],
        };
      }

      acc[program.bankSlug].programs.push(program);
      return acc;
    }, {});
  }

  function calculateMortgage({ price, downPayment, years, annualRate }) {
    const loanAmount = Math.max(price - downPayment, 0);
    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;

    let monthlyPayment = 0;

    if (loanAmount <= 0 || months <= 0) {
      monthlyPayment = 0;
    } else if (monthlyRate === 0) {
      monthlyPayment = loanAmount / months;
    } else {
      monthlyPayment =
        loanAmount *
        ((monthlyRate * (1 + monthlyRate) ** months) /
          ((1 + monthlyRate) ** months - 1));
    }

    const totalPayment = monthlyPayment * months;
    const overpayment = Math.max(totalPayment - loanAmount, 0);

    return { loanAmount, monthlyPayment, totalPayment, overpayment };
  }


  function refreshCustomSelect(selectEl) {
    if (!selectEl || !window.initCustomSelectUI) return;

    if (selectEl.dataset.customReady === "1") {
      const customUi = selectEl.nextElementSibling;
      if (customUi && customUi.classList.contains("filter-select-ui")) {
        customUi.remove();
      }
      delete selectEl.dataset.customReady;
      selectEl.classList.remove("is-customized-select");
    }

    window.initCustomSelectUI(selectEl);
  }

  function formatByn(value) {
    return `${Math.round(value).toLocaleString("ru-RU")} BYN`;
  }

  function initMultiBankMortgageCalculator(obj) {
    const root = document.querySelector("[data-mortgage-calculator]");
    const programs = Array.isArray(window.MORTGAGE_PROGRAMS)
      ? window.MORTGAGE_PROGRAMS
      : [];

    if (!root || !programs.length) return;

    const bankSelect = root.querySelector("[data-mortgage-bank]");
    const bankTitle = root.querySelector("[data-mortgage-bank-title]");
    const programSelect = root.querySelector("[data-mortgage-program]");
    const descriptionEl = root.querySelector("[data-mortgage-description]");
    const priceInput = root.querySelector("[data-mortgage-price]");
    const downPaymentInput = root.querySelector("[data-mortgage-down-payment]");
    const termInput = root.querySelector("[data-mortgage-term]");
    const rateInput = root.querySelector("[data-mortgage-rate]");

    const loanEl = root.querySelector("[data-mortgage-loan]");
    const paymentEl = root.querySelector("[data-mortgage-payment]");
    const overpayEl = root.querySelector("[data-mortgage-overpay]");
    const totalEl = root.querySelector("[data-mortgage-total]");

    if (
      !bankSelect ||
      !programSelect ||
      !priceInput ||
      !downPaymentInput ||
      !termInput ||
      !rateInput
    ) {
      return;
    }

    const bankMap = groupProgramsByBank(programs);
    const banks = Object.values(bankMap);

    bankSelect.innerHTML = banks
      .map(
        (bank) =>
          `<option value="${bank.bankSlug}">${bank.bankName}</option>`
      )
      .join("");

    const defaultPrice =
      typeof obj?.priceBYN === "number" && obj.priceBYN > 0 ? obj.priceBYN : 90000;

    priceInput.value = String(defaultPrice);

    function fillPrograms(bankSlug) {
      const bank = bankMap[bankSlug] || bankMap[DEFAULT_BANK] || banks[0];
      const options = bank.programs
        .map(
          (program, index) =>
            `<option value="${index}">${program.programName} · ${program.interestRate}%</option>`
        )
        .join("");

      programSelect.innerHTML = options;
      refreshCustomSelect(programSelect);


      if (bankTitle) {
        bankTitle.textContent = `Ипотечный калькулятор — ${bank.bankName}`;
      }
    }

    function getCurrentProgram() {
      const bank = bankMap[bankSelect.value] || banks[0];
      const index = Number(programSelect.value) || 0;
      return bank.programs[index] || bank.programs[0];
    }

    function recalc() {
      const program = getCurrentProgram();
      if (!program) return;

      const price = Math.max(Number(priceInput.value) || 0, 0);
      const minDownPayment = Math.round((price * program.minDownPaymentPercent) / 100);

      downPaymentInput.min = String(minDownPayment);

      if (!downPaymentInput.value || Number(downPaymentInput.value) < minDownPayment) {
        downPaymentInput.value = String(minDownPayment);
      }

      const downPayment = Math.min(Math.max(Number(downPaymentInput.value) || 0, 0), price);

      termInput.max = String(program.maxTermYears);
      if (!termInput.value || Number(termInput.value) > program.maxTermYears) {
        termInput.value = String(Math.min(20, program.maxTermYears));
      }

      if (Number(termInput.value) < 1) {
        termInput.value = "1";
      }

      rateInput.value = String(program.interestRate);

      const result = calculateMortgage({
        price,
        downPayment,
        years: Number(termInput.value) || 1,
        annualRate: Number(rateInput.value) || 0,
      });

      if (descriptionEl) {
        descriptionEl.textContent = `${program.description} Мин. взнос: ${program.minDownPaymentPercent}%. Макс. срок: ${program.maxTermYears} лет.`;
      }

      if (loanEl) loanEl.textContent = formatByn(result.loanAmount);
      if (paymentEl) paymentEl.textContent = formatByn(result.monthlyPayment);
      if (overpayEl) overpayEl.textContent = formatByn(result.overpayment);
      if (totalEl) totalEl.textContent = formatByn(result.totalPayment);
    }

    bankSelect.addEventListener("change", () => {
      fillPrograms(bankSelect.value);
      programSelect.value = "0";
      localStorage.setItem(STORAGE_KEY, bankSelect.value);
      recalc();
    });

    programSelect.addEventListener("change", recalc);

    [priceInput, downPaymentInput, termInput, rateInput].forEach((element) => {
      element.addEventListener("input", recalc);
      element.addEventListener("change", recalc);
    });

    const savedBank = localStorage.getItem(STORAGE_KEY);
    const initialBank = bankMap[savedBank] ? savedBank : DEFAULT_BANK;

    bankSelect.value = bankMap[initialBank] ? initialBank : banks[0].bankSlug;
    fillPrograms(bankSelect.value);
    programSelect.value = "0";

    refreshCustomSelect(bankSelect);
    refreshCustomSelect(programSelect);

    recalc();
  }

  window.initMultiBankMortgageCalculator = initMultiBankMortgageCalculator;
})();
