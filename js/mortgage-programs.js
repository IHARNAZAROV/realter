(function () {
  // Ориентировочные рыночные ставки по популярным программам покупки жилья в РБ (обновление: март 2026).
  const MORTGAGE_PROGRAMS = [
    {
      bankName: "Беларусбанк",
      bankSlug: "belarusbank",
      bankLogo: "ББ",
      programName: "Ипотека Экспресс (вторичный рынок)",
      interestRate: 17.5,
      maxTermYears: 20,
      minDownPaymentPercent: 10,
      description:
        "Стандартный ипотечный кредит на покупку квартиры на вторичном рынке.",
    },
    {
      bankName: "Беларусбанк",
      bankSlug: "belarusbank",
      bankLogo: "ББ",
      programName: "Партнёрская новостройка",
      interestRate: 16.9,
      maxTermYears: 25,
      minDownPaymentPercent: 15,
      description:
        "Льготная ставка при покупке жилья у аккредитованных застройщиков-партнёров.",
    },
    {
      bankName: "Банк БелВЭБ",
      bankSlug: "belveb",
      bankLogo: "ВЭБ",
      programName: "Кредит на приобретение недвижимости",
      interestRate: 18.4,
      maxTermYears: 20,
      minDownPaymentPercent: 15,
      description:
        "Классический кредит на покупку квартиры с аннуитетным погашением.",
    },
    {
      bankName: "Белгазпромбанк",
      bankSlug: "belgazprombank",
      bankLogo: "БГПБ",
      programName: "Скоро новоселье",
      interestRate: 17.99,
      maxTermYears: 20,
      minDownPaymentPercent: 10,
      description:
        "Популярная программа на готовое и строящееся жильё у партнёров банка.",
    },
    {
      bankName: "Белинвестбанк",
      bankSlug: "belinvestbank",
      bankLogo: "БИБ",
      programName: "Недвижимость в кредит",
      interestRate: 18.75,
      maxTermYears: 25,
      minDownPaymentPercent: 15,
      description:
        "Финансирование покупки квартиры на первичном и вторичном рынке.",
    },
    {
      bankName: "БТА Банк",
      bankSlug: "bta",
      bankLogo: "BTA",
      programName: "Кредит на покупку жилья",
      interestRate: 19.5,
      maxTermYears: 15,
      minDownPaymentPercent: 20,
      description:
        "Базовый жилищный кредит с повышенным первоначальным взносом.",
    },
    {
      bankName: "Приорбанк",
      bankSlug: "priorbank",
      bankLogo: "PB",
      programName: "Недвижимость в кредит",
      interestRate: 18.9,
      maxTermYears: 20,
      minDownPaymentPercent: 20,
      description:
        "Стандартная ипотечная программа на покупку квартиры в BYN.",
    },
    {
      bankName: "Приорбанк",
      bankSlug: "priorbank",
      bankLogo: "PB",
      programName: "Недвижимость у партнёров",
      interestRate: 17.8,
      maxTermYears: 20,
      minDownPaymentPercent: 15,
      description:
        "Сниженная ставка при покупке объектов из партнёрской сети банка.",
    },
  ];

  window.MORTGAGE_PROGRAMS = MORTGAGE_PROGRAMS;
})();
