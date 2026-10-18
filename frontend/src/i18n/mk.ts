import type { Dict } from './en'

export const mk: Dict = {
  appName: 'Run My Errands',
  nav: { home: 'Почетна', post: 'Објави услуга', bookings: 'Мои договори', giverHome: 'Табла за давател', requester: 'Барател', browse: 'Отворени барања', notifications: 'Известувања', logout: 'Одјави се', login: 'Најави се' },
  auth: { loginTitle: 'Добредојдовте назад', registerTitle: 'Создадете профил', email: 'Е-пошта', password: 'Лозинка', name: 'Име и презиме', neighbourhood: 'Населба', neighbourhoodPlaceholder: 'пр. Дебар Маало', neighbourhoodHint: 'Точната адреса се споделува дури откако договорот е потврден.', phone: 'Телефон (опционално)', phoneHint: 'Бројот се споделува дури откако договорот е потврден.', signIn: 'Најава', createAccount: 'Нов профил', continue: 'Продолжи', terms: 'Со продолжување ги прифаќате правилата на заедницата.', heroTitle: 'Некој две улици подалеку веќе ја врши таа задача.', heroSub: 'Објавете ја услугата со ваша цена, видете ги давателите и нивните населби, и закажете. Парите ги договарате меѓусебно.', login: 'Најави се', register: 'Регистрирај се', noAccount: 'Немате профил?', haveAccount: 'Веќе имате профил?' },
  dash: {
    morning: 'Добро утро', afternoon: 'Добар ден', evening: 'Добра вечер',
    summary: (live: number, confirmed: number) =>
      live === 0 && confirmed === 0 ? 'Моментално нема ништо активно — објавете услуга кога ќе ви треба помош.'
        : `Имате ${live === 1 ? 'едно активно барање' : `${live} активни барања`} и ${confirmed === 1 ? 'еден потврден договор' : `${confirmed} потврдени договори`}.`,
    completedCount: 'Завршени барања', yourRating: 'Ваша оцена', spentThisMonth: 'Потрошено овој месец', den: 'ден',
    yourRequests: 'Ваши барања', noRequests: 'Сè уште нема барања.', open: 'Отвори',
    live: 'Активно', requested: 'Побарано', confirmed: 'Потврдено', rate: 'Оцени', done: 'Завршено',
    matches: (n: number) => (n === 1 ? '1 давател' : `${n} даватели`),
    waitingFor: (name: string) => `се чека ${name}`,
    confirmedWith: (name: string) => `потврдено со ${name}`,
    completed: 'Завршено', needsRating: 'треба оцена', today: 'Денес', tomorrow: 'Утре', yesterday: 'вчера',
    waitingOnRating: 'Чека ваша оцена', ratingTwoWay: 'Оценувањето е двонасочно — вашата оцена се објавува кога двете страни ќе оценат.',
    rateName: (name: string) => `Оцени: ${name}`,
  },
  common: { loading: 'Се вчитува…', empty: 'Засега нема ништо.', save: 'Зачувај', cancel: 'Откажи', back: 'Назад', error: 'Нешто тргна наопаку' },
  favor: { postTitle: 'Побарај услуга', category: 'Категорија', title: 'Што ви треба?', description: 'Детали', budget: 'Вашата цена (МКД)', when: 'Кога', asap: 'Што побрзо', scheduled: 'Избери датум и час', neighbourhood: 'Населба', submit: 'Најди даватели', mine: 'Мои барања', matches: 'Достапни даватели', noMatches: 'Сè уште нема совпаѓања — пробајте со друга цена или навратете подоцна.', book: 'Побарај договор', offers: 'Добиени понуди', byRating: 'Најдобро оценети', byPrice: 'Најниска цена' },
  giver: { dashTitle: 'Давател', onboardingTitle: 'Поставете профил на давател', pickCategories: 'Изберете што работите и поставете цена за секое', bio: 'За вас', save: 'Зачувај профил', profile: 'Профил на давател', rating: 'Оцена', completed: 'завршени', verified: 'Верификуван', browseTitle: 'Отворени барања', makeOffer: 'Испрати понуда', offerMessage: 'Порака', offerPrice: 'Вашата цена (МКД)', myOffers: 'Мои понуди' },
  booking: { title: 'Мои договори', detail: 'Договор', status: 'Статус', accept: 'Прифати', decline: 'Одбиј', cancel: 'Откажи', complete: 'Означи како завршено', rate: 'Остави оценка', contact: 'Контакт', contactHidden: 'Телефонскиот број се појавува овде откако договорот ќе се потврди.', asRequester: 'Како барател', asGiver: 'Како давател' },
  rate: { title: 'Оцени го искуството', stars: 'Ѕвезди', text: 'Коментар (опционално)', submit: 'Испрати оценка', blind: 'Оценките се скриени додека не ги испратите и двајцата, или да поминат 7 дена.', done: 'Фала — оценката е испратена.' },
  notifications: { title: 'Известувања', todo: 'Известувањата сè уште не се изградени (планирано: табела за известувања во бекенд + ажурирање во живо).' },
}
