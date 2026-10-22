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
      ["Botda /start → «📲 Ilovani o'rnatish» ni bosing", 'Bot sizga link yuboradi'],
      ['Linkni bosib turing va «Копировать» ni tanlang', 'Nusxa olish — link telefon xotirasiga saqlanadi'],
      ["Safari'ni oching va linkni joylang", "Manzil qatorini bosing → «Вставить и перейти»"],
      ['Pastdagi «⋯» → «Поделиться» ni bosing', "Ulashish. Eski iPhone'da pastdagi □↑ tugmasi"],
      ['«На экран «Домой»» → «Добавить» ni bosing', "Bosh ekranga qo'shish → Qo'shish"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
    samsung: [
      ["Botda /start → «📲 Ilovani o'rnatish» ni bosing", 'Bot sizga link yuboradi'],
      ['Linkni bosib turing va «Копировать» ni tanlang', 'Nusxa olish — link telefon xotirasiga saqlanadi'],
      ["Chrome'ni oching va linkni joylang", 'Manzil qatorini bosing → «Скопированная ссылка»'],
      ["Sahifadagi «📲 Ilovani o'rnatish» ni bosing", 'Tugma chiqmasa: ⋮ menyu → «Установить приложение»'],
      ['«Установить» ni bosing', "O'rnatish — belgi bosh ekranga qo'shiladi"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
  },
  outro: ['Yoqimli ishtaha! 🍰', "Savol bo'lsa — botga yozing 💬"],
  // "Qanday buyurtma beriladi" videosi (iPhone; mini ilova o'zbekcha, Telegram ruscha).
  // Yozuvlar ovozli matnga mos (video/assets/voice/buyurtma-uz.flac)
  order: {
    intro: ['Buyurtma berish', 'endi juda oson!'],
    intro_sub: 'Tortlar va yarim tayyor mahsulotlar',
    steps: [
      ["Botda «Do'konni ochish» tugmasini bosing", 'yoki ilovani telefoningizdan oching 📲'],
      ['Yoqqan mahsulotni tanlang', "Rasmini bosing — batafsil ma'lumot ochiladi"],
      ["O'lchami va bezak rangini belgilang", "so'ng «Savatga qo'shish» ni bosing"],
      ['Savatda «Rasmiylashtirish» ni bosing', 'Mahsulot, soni va narxini tekshiring'],
      ['Yetkazish usulini tanlang', "📦 Pochta (택배) yoki 🏠 olib ketish"],
      ['Ism, telefon va manzilni yozing', "Ism Telegram'dan o'zi olinadi ✨"],
      ["Tort bo'lsa, kerakli sanani tanlang", 'Tortlar 2–3 kun oldin buyurtma qilinadi'],
      ['«Buyurtmani tasdiqlash» ni bosing', 'Jami summani tekshiring'],
      ["Hisob raqamiga pul o'tkazing va chekni yuklang", "So'ng «Chekni yuborish» ni bosing"],
      ['Qolganini biz qilamiz 💕', "Tekshiramiz, tasdiqlaymiz, tayyorlaymiz va jo'natamiz"],
      ["Buyurtma holati haqida Telegram'da xabar olasiz", "🔔 Har bir o'zgarishda bot yozadi"],
    ],
    app: '📲 Ilova',
    tgClose: 'Закрыть',
    added: "✓ Savatga qo'shildi",
    created: '🎉 Buyurtma qabul qilindi!',
    sent: '🧾 Chek yuborildi! Tez orada tasdiqlaymiz.',
    notifTitle: 'Tayyor & Sweet',
    // bot xabari (backend: status_changed) — iPhone bildirishnomasida
    notif: ["🔔 Buyurtma #TS-261022-4821 holati o'zgardi:", "🚚 Jo'natildi"],
    now: 'сейчас',
    phone: '010-5523-7788',
    address: '경기도 안산시 단원구 고잔동 123',
    // iOS sana tanlagichi (ruscha): 2026-yil oktabr, eng erta — bugundan 2 kun keyin
    month: 'октябрь 2026 г.',
    weekdays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
    date: '25 окт. 2026 г.',
  },
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
    m4: `📲 **Tayyor & Sweet ilovasini o'rnating**\n\nDo'kon telefoningiz bosh ekranida bo'ladi — bir bosishda ochiladi.\n\n🔗 [${LINK}]\n\n👆 Linkni **bosib turing** → «Nusxa olish» (ruscha: «Копировать»), keyin **Safari** (iPhone) yoki **Chrome** (Samsung) da oching.\n\n🎬 Batafsil — video qo'llanmada 👇`,
    m4btn: ['🍏 iPhone — video', '🤖 Samsung — video'],
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
