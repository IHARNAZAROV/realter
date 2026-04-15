(function () {
  'use strict';

  const INFLATION_RATE = 0.06;
  const PRICE_GROWTH_RATE = 0.08;
  const MORTGAGE_RATE = 0.15;
  const MORTGAGE_YEARS = 20;

  function calcMortgageMultiplier() {
    var r = MORTGAGE_RATE / 12;
    var n = MORTGAGE_YEARS * 12;
    var m = r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return m * n;
  }

  var MORTGAGE_MULTIPLIER = calcMortgageMultiplier();

  function formatBYN(amount) {
    return Math.round(amount).toLocaleString('ru-BY') + ' BYN';
  }

  function calculate(budget) {
    var inflationLoss = budget * INFLATION_RATE;
    var priceIncrease = budget * PRICE_GROWTH_RATE;
    var mortgageOnExtra = priceIncrease * MORTGAGE_MULTIPLIER;
    var mortgageOverpay = mortgageOnExtra - priceIncrease;
    var total = inflationLoss + priceIncrease + mortgageOverpay;
    return {
      inflationLoss: inflationLoss,
      priceIncrease: priceIncrease,
      mortgageOverpay: mortgageOverpay,
      total: total
    };
  }

  function animateValue(el, targetNum) {
    var start = 0;
    var duration = 700;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * targetNum);
      el.textContent = current.toLocaleString('ru-BY');
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function updateResults(results, elements) {
    animateValue(elements.inflationVal, results.inflationLoss);
    animateValue(elements.priceVal, results.priceIncrease);
    animateValue(elements.mortgageVal, results.mortgageOverpay);
    animateValue(elements.totalVal, results.total);
  }

  function init() {
    var form = document.getElementById('delayCalcForm');
    var resultsEl = document.getElementById('delayCalcResults');
    var inputEl = document.getElementById('delayCalcBudget');

    if (!form || !resultsEl || !inputEl) return;

    var elements = {
      inflationVal: document.getElementById('dcInflationVal'),
      priceVal: document.getElementById('dcPriceVal'),
      mortgageVal: document.getElementById('dcMortgageVal'),
      totalVal: document.getElementById('dcTotalVal')
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var raw = parseFloat(inputEl.value.replace(/\s/g, '').replace(',', '.'));
      if (!raw || raw < 1000) {
        inputEl.focus();
        inputEl.style.borderColor = '#c05c5c';
        setTimeout(function () { inputEl.style.borderColor = ''; }, 1500);
        return;
      }

      var results = calculate(raw);
      updateResults(results, elements);

      if (!resultsEl.classList.contains('is-visible')) {
        resultsEl.classList.add('is-visible');
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    inputEl.addEventListener('input', function () {
      if (resultsEl.classList.contains('is-visible')) {
        resultsEl.classList.remove('is-visible');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
