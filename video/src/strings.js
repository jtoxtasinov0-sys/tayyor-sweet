// Video matnlari: yozuvlar o'zbekcha, telefon interfeysi (Telegram, Safari, Chrome, menyular) ruscha —
// ko'p o'zbeklar telefonni rus tilida ishlatadi. Bot xabarlari va sayt — o'zbekcha.
const LINK = 'https://tayyor-sweet.vercel.app/ilova';

export const L = {
  link: LINK,
  intro: { iphone: ["iPhone'ga", "ilovani o'rnatish"], samsung: ["Samsung'ga", "ilovani o'rnatish"], chrome: ["Chrome orqali", "ilovani o'rnatish"] },
  intro_sub: (n) => `${n} ta oson qadam`,
  step: (n) => `${n}-QADAM`,
  steps: {
    iphone: [
      ["Botda ⊞ ni bosing → «📲 Ilovani o'rnatish»", "Bot video qo'llanma va link yuboradi"],
      ['Linkni bosib turing va «Открыть в браузере» ni tanlang', "Brauzerda ochish — sahifa Safari'da ochiladi"],
      ['Pastdagi «⋯» → «Поделиться» ni bosing', "Ulashish. Eski iPhone'da pastdagi □↑ tugmasi"],
      ['«На экран «Домой»» → «Добавить» ni bosing', "Bosh ekranga qo'shish → Qo'shish"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
    samsung: [
      ["Botda ⊞ ni bosing → «📲 Ilovani o'rnatish»", "Bot video qo'llanma va link yuboradi"],
      ['Linkni bosib turing va «Открыть в браузере» ni tanlang', 'Keyin «Открыть» — sahifa brauzerda ochiladi'],
      ["Sahifadagi «📲 Ilovani o'rnatish» ni bosing", 'Tugma chiqmasa: ⋮ menyu → «Установить и создать ярлык»'],
      ['«Установить» ni bosing', "O'rnatish — belgi bosh ekranga qo'shiladi"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
    // Chrome'da allaqachon ochilgan do'kondan (masalan, eski linkdan kirgan mijoz)
    chrome: [
      ["O'ng yuqoridagi «⋮» ni bosing", 'Chrome menyusi ochiladi'],
      ['Pastga suring → «Установить и создать ярлык»', "Menyuning pastki qismida"],
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
    m4: `📲 **Tayyor & Sweet ilovasini o'rnating**\n\n[${LINK}]\n\n👆 Linkni **bosib turing** → «Открыть в браузере» (Open in Browser). Sahifa brauzerda ochiladi — o'sha yerda o'rnatasiz.\n\n🎬 Video qo'llanma: 1 — iPhone, 2 — Samsung`,
    durs: ['0:30', '0:29'],
    // pastki klaviatura (⊞) tugmasi va uni bosganda chatga ketadigan xabar
    kbBtn: "📲 Ilovani o'rnatish",
    mUser: "📲 Ilovani o'rnatish",
    // link bosib turilganda chiqadigan menyu va Android'dagi tasdiqlash oynasi
    linkText: LINK,
    ctx: {
      ios: ['Открыть', 'Открыть в браузере', 'Копировать ссылку', 'Добавить в список чтения'],
      and: ['Открыть в приложении', 'Открыть в браузере', 'Копировать ссылку', 'Добавить закладку'],
    },
    alert: { title: 'Открыть ссылку', always: 'Всегда открывать этот сайт в браузере', open: 'Открыть', cancel: 'Отмена' },
  },
  // iPhone tizimi (ruscha)
  ios: {
    apps: { phone: 'Телефон', messages: 'Сообщения', safari: 'Safari', music: 'Музыка', camera: 'Камера', photos: 'Фото', settings: 'Настройки', telegram: 'Telegram', calendar: 'Календарь', clock: 'Часы', weather: 'Погода', maps: 'Карты', notes: 'Заметки', mail: 'Почта', store: 'App Store', contacts: 'Контакты' },
    crumb: 'Telegram',
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
    installTitle: 'Установить приложение',
    // Chrome ⋮ menyusi (mijozning Samsung'idagi skrinshotdan); '-' — ajratuvchi chiziq
    menu: ['Новая вкладка', 'Новая вкладка инкогнито', 'Добавить в новую группу', '-', 'История', 'Удалить данные о работе в браузере', 'Настройки сайта', '-',
      'Скачанные файлы', 'Закладки', 'Недавние вкладки', '-', 'Поделиться…', 'Найти на странице', 'Перевести…', 'Перейти в Режим чтения',
      'Установить и создать ярлык', 'Версия для ПК', '-', 'Настройки', 'Справка/отзыв'],
    menuInstall: 'Установить и создать ярлык',
    cancel: 'Отмена',
    install: 'Установить',
    installing: 'Установка Tayyor & Sweet…',
    added: 'Tayyor & Sweet установлено',
  },
};
