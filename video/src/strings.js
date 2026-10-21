// Video matnlari (faqat o'zbekcha). Telefon tizimi (Safari, Chrome, iOS menyulari) ekranda inglizcha —
// iPhone'da o'zbek tili yo'q; yozuvlarda tugma nomi va uning o'zbekcha ma'nosi beriladi.
const LINK = 'https://tayyor-sweet.vercel.app/ilova';

export const L = {
  link: LINK,
  intro: { iphone: ["iPhone'ga", "ilovani o'rnatish"], samsung: ["Samsung'ga", "ilovani o'rnatish"] },
  intro_sub: '5 ta oson qadam',
  step: (n) => `${n}-QADAM`,
  steps: {
    iphone: [
      ["Botda /start → «📲 Ilovani o'rnatish» ni bosing", 'Bot sizga link yuboradi'],
      ['Linkni bosib turing va «Nusxa olish» ni tanlang', 'Link telefon xotirasiga nusxalanadi'],
      ["Safari'ni oching va linkni joylang", "Manzil qatorini bosing → «Paste and Go» (joylash va o'tish)"],
      ['Pastdagi «⋯» → «Share» ni bosing', "Share — Ulashish. Eski iPhone'da pastdagi □↑ tugmasi"],
      ['«Add to Home Screen» → «Add» ni bosing', "Bosh ekranga qo'shish → Qo'shish"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
    samsung: [
      ["Botda /start → «📲 Ilovani o'rnatish» ni bosing", 'Bot sizga link yuboradi'],
      ['Linkni bosib turing va «Nusxa olish» ni tanlang', 'Link telefon xotirasiga nusxalanadi'],
      ["Chrome'ni oching va linkni joylang", 'Manzil qatorini bosing → «Link you copied»'],
      ["Sahifadagi «📲 Ilovani o'rnatish» ni bosing", 'Tugma chiqmasa: ⋮ menyu → «Install app»'],
      ['«Install» ni bosing', "Install — O'rnatish. Belgi bosh ekranga qo'shiladi"],
      ["Tayyor! Belgini bosing — do'kon ochiladi", "Endi Telegram'siz ham buyurtma bera olasiz"],
    ],
  },
  outro: ['Yoqimli ishtaha! 🍰', "Savol bo'lsa — botga yozing 💬"],
  homeSearch: 'Search',
  // Telegram (o'zbekcha)
  tg: {
    back: 'Chatlar',
    bot: 'bot',
    input: 'Xabar',
    today: 'Bugun',
    m1: "Assalomu alaykum, **Aziza**! 👋\n\n**Tayyor & Sweet** do'koniga xush kelibsiz 🍰\nShirinliklar, tortlar va yarim tayyor mahsulotlar — Koreya bo'ylab 택배 orqali.\n\n🛍 Do'kondagi mahsulotlarni ko'ring 👇",
    m1btns: [["🛍 Do'konni ochish"], ["📲 Ilovani o'rnatish"], ['📦 Buyurtmalarim', '📞 Aloqa'], ['📸 Instagram'], ["🇺🇿 O'zbekcha", '🇷🇺 Русский']],
    menu: "🛍 Do'kon",
    m4: `📲 **Tayyor & Sweet ilovasini o'rnating**\n\nDo'kon telefoningiz bosh ekranida bo'ladi — bir bosishda ochiladi.\n\n🔗 [${LINK}]\n\n👆 Linkni **bosib turing** → «Nusxa olish», keyin **Safari** (iPhone) yoki **Chrome** (Samsung) da oching.\n\n🎬 Batafsil — video qo'llanmada 👇`,
    m4btn: ['🍏 iPhone — video', '🤖 Samsung — video'],
    open: 'Ochish',
    copy: 'Nusxa olish',
    share: 'Ulashish',
    cancel: 'Bekor qilish',
    copied: 'Havola nusxalandi',
  },
  // iPhone tizimi (inglizcha)
  ios: {
    apps: { phone: 'Phone', messages: 'Messages', safari: 'Safari', music: 'Music', camera: 'Camera', photos: 'Photos', settings: 'Settings', telegram: 'Telegram', calendar: 'Calendar', clock: 'Clock', weather: 'Weather', maps: 'Maps', notes: 'Notes', mail: 'Mail', store: 'App Store', contacts: 'Contacts' },
    search: 'Search or enter website',
    favorites: 'Favorites',
    paste: 'Paste and Go',
    menu: ['Share', 'Add to Favorites', 'Add Bookmark', 'Find on Page', 'New Tab'],
    sheetTitle: 'Tayyor & Sweet',
    options: 'Options',
    targets: ['AirDrop', 'Messages', 'Mail', 'Telegram', 'Notes'],
    actions: ['Copy', 'Add to Reading List', 'Add Bookmark', 'Add to Favorites', 'Find on Page', 'Add to Home Screen', 'Markup'],
    cancel: 'Cancel',
    addTitle: 'Add to Home Screen',
    add: 'Add',
    webapp: 'Open as Web App',
    foot: 'An icon will be added to your Home Screen so you can quickly access this website.',
  },
  // Android tizimi (inglizcha)
  and: {
    apps: { phone: 'Phone', messages: 'Messages', chrome: 'Chrome', camera: 'Camera', gallery: 'Gallery', settings: 'Settings', telegram: 'Telegram', calendar: 'Calendar', clock: 'Clock', contacts: 'Contacts', weather: 'Weather', notes: 'Notes' },
    search: 'Search or type URL',
    copied: 'Link you copied',
    installTitle: 'Install app',
    cancel: 'Cancel',
    install: 'Install',
    installing: 'Installing Tayyor & Sweet…',
    added: 'Tayyor & Sweet installed',
  },
};
