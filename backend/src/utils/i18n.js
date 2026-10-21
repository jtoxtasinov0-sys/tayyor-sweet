// Bot matnlari (o'zbek / rus)
const T = {
  uz: {
    choose_lang: "🇺🇿 Tilni tanlang\n🇷🇺 Выберите язык",
    welcome: (name, shop) =>
      `Assalomu alaykum, <b>${name}</b>! 👋\n\n<b>${shop}</b> do'koniga xush kelibsiz 🍰\nShirinliklar, tortlar va yarim tayyor mahsulotlar — Koreya bo'ylab 택배 orqali.\n\n🛍 Do'kondagi mahsulotlarni ko'ring 👇`,
    ask_phone: "📱 Buyurtmalar uchun telefon raqamingizni yuboring (pastdagi tugma).",
    send_phone: '📱 Raqamni yuborish',
    phone_saved: "✅ Rahmat! Raqamingiz saqlandi.",
    open_shop: "🛍 Do'konni ochish",
    menu_prices: '📋 Narxlar',
    menu_orders: '📦 Buyurtmalarim',
    menu_contact: "📞 Aloqa",
    menu_lang: '🌐 Til',
    menu_install: "📲 Ilovani o'rnatish",
    install: (link) =>
      `📲 <b>Tayyor &amp; Sweet ilovasini o'rnating</b>\n\nDo'kon telefoningiz bosh ekranida bo'ladi — bir bosishda ochiladi.\n\n🔗 ${link}\n\n👆 Linkni <b>bosib turing</b> → «Nusxa olish», keyin <b>Safari</b> (iPhone) yoki <b>Chrome</b> (Samsung) da oching.\n\n🎬 Batafsil — video qo'llanmada 👇`,
    guide_ios: '🍏 iPhone — video',
    guide_android: '🤖 Samsung — video',
    guide_caption_ios: (link) =>
      `🍏 <b>iPhone'ga o'rnatish</b>\n\n1. Linkni bosib turing → «Nusxa olish»\n2. Safari'ni oching, manzil qatoriga joylang\n3. «⋯» → «Ulashish» → «Bosh ekranga qo'shish»\n4. «Qo'shish» — tayyor! 🎉\n\n🔗 ${link}`,
    guide_caption_android: (link) =>
      `🤖 <b>Samsung'ga o'rnatish</b>\n\n1. Linkni bosib turing → «Nusxa olish»\n2. Chrome'ni oching, manzil qatoriga joylang\n3. «📲 Ilovani o'rnatish» → «O'rnatish»\n4. Bosh ekrandagi belgini bosing — tayyor! 🎉\n\n🔗 ${link}`,
    main_menu: "Quyidagi tugma orqali do'konni oching 👇",
    no_orders: "Sizda hali buyurtmalar yo'q. Do'konni ochib, birinchi buyurtmangizni bering 🍰",
    your_orders: '📦 <b>Oxirgi buyurtmalaringiz:</b>',
    contact: (s) =>
      `📞 <b>Aloqa</b>\n\n📍 ${s.address || '—'}\n🕘 ${s.working_hours || '—'}${s.phone ? `\n☎️ ${s.phone}` : ''}${s.instagram ? `\n📸 Instagram: ${s.instagram}` : ''}`,
    write_owner: "✍️ Egasiga yozish",
    prices_title: '📋 <b>Narxlar jadvali</b>',
    status_changed: (num, st) => `🔔 Buyurtma <b>#${num}</b> holati o'zgardi:\n<b>${st}</b>`,
    tracking: (c, n) => `🚚 ${c}: <code>${n}</code>`,
    track_btn: '🔎 Kuzatish',
    order_btn: "📦 Buyurtmani ko'rish",
    receipt_got: "🧾 Chek qabul qilindi! Tez orada tasdiqlaymiz.",
    send_receipt_hint: "🧾 Chekni mini ilovadagi buyurtma sahifasidan yuboring.",
    not_admin: '⛔️ Siz admin emassiz. Kirish uchun: <code>/admin parol</code>',
    admin_ok: "✅ Admin huquqi berildi.",
    wrong_pass: "❌ Parol noto'g'ri.",
    blocked: (m) => `⛔️ Juda ko'p urinish. ${m} daqiqadan keyin qayta urinib ko'ring.`,
    admin_panel: '🛠 <b>Admin panel</b>',
    open_admin: '🛠 Admin panelni ochish',
    lang_set: "✅ Til o'zgartirildi",
  },
  ru: {
    choose_lang: "🇺🇿 Tilni tanlang\n🇷🇺 Выберите язык",
    welcome: (name, shop) =>
      `Здравствуйте, <b>${name}</b>! 👋\n\nДобро пожаловать в <b>${shop}</b> 🍰\nСладости, торты и полуфабрикаты — доставка 택배 по всей Корее.\n\n🛍 Смотрите товары магазина 👇`,
    ask_phone: '📱 Отправьте номер телефона для заказов (кнопка ниже).',
    send_phone: '📱 Отправить номер',
    phone_saved: '✅ Спасибо! Номер сохранён.',
    open_shop: '🛍 Открыть магазин',
    menu_prices: '📋 Цены',
    menu_orders: '📦 Мои заказы',
    menu_contact: '📞 Контакты',
    menu_lang: '🌐 Язык',
    menu_install: '📲 Установить приложение',
    install: (link) =>
      `📲 <b>Установите приложение Tayyor &amp; Sweet</b>\n\nМагазин будет на главном экране телефона — открывается в одно касание.\n\n🔗 ${link}\n\n👆 <b>Нажмите и удерживайте</b> ссылку → «Копировать», затем откройте в <b>Safari</b> (iPhone) или <b>Chrome</b> (Samsung).\n\n🎬 Подробно — в видеоинструкции 👇`,
    guide_ios: '🍏 iPhone — видео',
    guide_android: '🤖 Samsung — видео',
    guide_caption_ios: (link) =>
      `🍏 <b>Установка на iPhone</b>\n\n1. Нажмите и удерживайте ссылку → «Копировать»\n2. Откройте Safari и вставьте в адресную строку\n3. «⋯» → «Поделиться» → «На экран «Домой»»\n4. «Добавить» — готово! 🎉\n\n🔗 ${link}`,
    guide_caption_android: (link) =>
      `🤖 <b>Установка на Samsung</b>\n\n1. Нажмите и удерживайте ссылку → «Копировать»\n2. Откройте Chrome и вставьте в адресную строку\n3. «📲 Установить приложение» → «Установить»\n4. Нажмите на значок на главном экране — готово! 🎉\n\n🔗 ${link}`,
    main_menu: 'Откройте магазин кнопкой ниже 👇',
    no_orders: 'У вас пока нет заказов. Откройте магазин и сделайте первый заказ 🍰',
    your_orders: '📦 <b>Ваши последние заказы:</b>',
    contact: (s) =>
      `📞 <b>Контакты</b>\n\n📍 ${s.address || '—'}\n🕘 ${s.working_hours || '—'}${s.phone ? `\n☎️ ${s.phone}` : ''}${s.instagram ? `\n📸 Instagram: ${s.instagram}` : ''}`,
    write_owner: '✍️ Написать владельцу',
    prices_title: '📋 <b>Прайс-лист</b>',
    status_changed: (num, st) => `🔔 Статус заказа <b>#${num}</b> изменён:\n<b>${st}</b>`,
    tracking: (c, n) => `🚚 ${c}: <code>${n}</code>`,
    track_btn: '🔎 Отследить',
    order_btn: '📦 Открыть заказ',
    receipt_got: '🧾 Чек получен! Скоро подтвердим.',
    send_receipt_hint: '🧾 Отправьте чек на странице заказа в мини-приложении.',
    not_admin: '⛔️ Вы не админ. Для входа: <code>/admin пароль</code>',
    admin_ok: '✅ Права администратора выданы.',
    wrong_pass: '❌ Неверный пароль.',
    blocked: (m) => `⛔️ Слишком много попыток. Повторите через ${m} мин.`,
    admin_panel: '🛠 <b>Админ-панель</b>',
    open_admin: '🛠 Открыть админ-панель',
    lang_set: '✅ Язык изменён',
  },
};

const t = (lang) => T[lang === 'ru' ? 'ru' : 'uz'];

module.exports = { t, T };
