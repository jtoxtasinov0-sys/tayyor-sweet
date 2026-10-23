// Video matnlari: yozuvlar o'zbekcha, telefon interfeysi (Telegram, Safari, Chrome, menyular) ruscha —
// ko'p o'zbeklar telefonni rus tilida ishlatadi. Bot xabarlari va sayt — o'zbekcha.
const LINK = 'https://tayyor-sweet.vercel.app/ilova';

export const L = {
  link: LINK,
  intro: { iphone: ["iPhone'ga", "ilovani o'rnatish"], samsung: ["Samsung'ga", "ilovani o'rnatish"] },
  intro_sub: '5 ta oson qadam',
  step: (n) => `${n}-QADAM`,
  steps: {
    iphone: [
      ["Botda /start → «📲 Ilovani o'rnatish» ni bosing", "Bot video qo'llanma va link yuboradi"],
      ['Linkni bosib turing va «Копировать» ni tanlang', 'Nusxa olish — link telefon xotirasiga saqlanadi'],
      ["Safari'ni oching va linkni joylang", "Manzil qatorini bosing → «Вставить и перейти»"],
      ['Pastdagi «⋯» → «Поделиться» ni bosing', "Ulashish. Eski iPhone'da pastdagi □↑ tugmasi"],
      ['«На экран «Домой»» → «Добавить» ni bosing', "Bosh ekranga qo'shish → Qo'shish"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
    samsung: [
      ["Botda /start → «📲 Ilovani o'rnatish» ni bosing", "Bot video qo'llanma va link yuboradi"],
      ['Linkni bosib turing va «Копировать» ni tanlang', 'Nusxa olish — link telefon xotirasiga saqlanadi'],
      ["Chrome'ni oching va linkni joylang", 'Manzil qatorini bosing → «Скопированная ссылка»'],
      ["Sahifadagi «📲 Ilovani o'rnatish» ni bosing", 'Tugma chiqmasa: ⋮ menyu → «Установить приложение»'],
      ['«Установить» ni bosing', "O'rnatish — belgi bosh ekranga qo'shiladi"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
  },
  outro: ['Yoqimli ishtaha! 🍰', "Savol bo'lsa — botga yozing 💬"],
  homeSearch: 'Поиск',
  // Telegram: ilova ruscha, bot xabarlari o'zbekcha
  tg: {
    back: 'Чаты',
    bot: 'бот',
    input: 'Сообщение',
    today: 'Сегодня',
    m1: "Assalomu alaykum, **Aziza**! 👋\n\n**Tayyor & Sweet** do'koniga xush kelibsiz 🍰\nShirinliklar, tortlar va yarim tayyor mahsulotlar — Koreya bo'ylab 택배 orqali.\n\n🛍 Do'kondagi mahsulotlarni ko'ring 👇",
    m1btns: [["🛍 Do'konni ochish"], ["📲 Ilovani o'rnatish"], ['📦 Buyurtmalarim', '📞 Aloqa'], ['📸 Instagram'], ["🇺🇿 O'zbekcha", '🇷🇺 Русский']],
    menu: "🛍 Do'kon",
    // «Ilovani o'rnatish» javobi: albom (iPhone va Samsung videolari), izohida link
    m4: `📲 **Tayyor & Sweet ilovasini o'rnating**\n\n[${LINK}]\n\n👆 Linkni **bosib turing** → «Копировать» (Nusxa olish), keyin **Safari** (iPhone) yoki **Chrome** (Samsung) da oching.\n\n🎬 Video qo'llanma: 1 — iPhone, 2 — Samsung`,
    durs: ['0:35', '0:33'],
    open: 'Открыть',
    copy: 'Копировать',
    share: 'Поделиться',
    cancel: 'Отмена',
    copied: 'Ссылка скопирована',
  },
  // iPhone tizimi (ruscha)
  ios: {
    apps: { phone: 'Телефон', messages: 'Сообщения', safari: 'Safari', music: 'Музыка', camera: 'Камера', photos: 'Фото', settings: 'Настройки', telegram: 'Telegram', calendar: 'Календарь', clock: 'Часы', weather: 'Погода', maps: 'Карты', notes: 'Заметки', mail: 'Почта', store: 'App Store', contacts: 'Контакты' },
    search: 'Поиск или имя сайта',
    favorites: 'Избранное',
    paste: 'Вставить и перейти',
    menu: ['Поделиться', 'Добавить в Избранное', 'Добавить закладку', 'Найти на странице', 'Новая вкладка'],
    sheetTitle: 'Tayyor & Sweet',
    options: 'Параметры',
    targets: ['AirDrop', 'Сообщения', 'Почта', 'Telegram', 'Заметки'],
    actions: ['Скопировать', 'Добавить в список чтения', 'Добавить закладку', 'Добавить в Избранное', 'Найти на странице', 'На экран «Домой»', 'Разметка'],
    cancel: 'Отменить',
    addTitle: 'На экран «Домой»',
    add: 'Добавить',
    webapp: 'Открыть как веб‑приложение',
    foot: 'Значок будет добавлен на экран «Домой» для быстрого доступа к этому сайту.',
  },
  // Android tizimi (ruscha)
  and: {
    apps: { phone: 'Телефон', messages: 'Сообщения', chrome: 'Chrome', camera: 'Камера', gallery: 'Галерея', settings: 'Настройки', telegram: 'Telegram', calendar: 'Календарь', clock: 'Часы', contacts: 'Контакты', weather: 'Погода', notes: 'Заметки' },
    search: 'Введите запрос или URL',
    copied: 'Скопированная ссылка',
    installTitle: 'Установить приложение',
    cancel: 'Отмена',
    install: 'Установить',
    installing: 'Установка Tayyor & Sweet…',
    added: 'Tayyor & Sweet установлено',
  },
};
