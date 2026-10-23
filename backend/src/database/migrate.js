// Jadvallarni yaratish va standart sozlamalarni qo'yish
const fs = require('fs');
const path = require('path');
const db = require('./connection');
const config = require('../config/default');
const { shopCategories } = require('./seed-data');

const DEFAULT_SETTINGS = {
  shop: {
    name: config.shop.name,
    title: 'Korea yarimtayyor maxsulotlar',
    short_name: config.shop.shortName,
    instagram: '@koreya_yarimtayyor_mahsulotlar',
    address: '경기도 안산시 상록구 이화로 34사동',
    phone: '',
    owner_link: config.ownerLink,
    working_hours: '09:00 – 21:00',
    about_uz:
      "🍰 Shirinliklar · 🍱 Yarim tayyor mahsulotlar · 🛒 Oziq-ovqat do'koni · 🚚 배달 가능. Tortlar 2–3 kun oldin buyurtma qilinadi.",
    about_ru:
      '🍰 Сладости · 🍱 Полуфабрикаты · 🛒 Продуктовый магазин · 🚚 배달 가능. Торты заказываются за 2–3 дня.',
  },
  payment: {
    bank_name: '',
    account_number: '',
    account_holder: '',
    note_uz: "To'lovdan so'ng chek (skrinshot) yuboring — buyurtmangiz tasdiqlanadi.",
    note_ru: 'После оплаты отправьте чек (скриншот) — заказ будет подтверждён.',
  },
  delivery: {
    taekbae_fee: 4000,
    bus_fee: 0,
    pickup_fee: 0,
    free_from: 80000,
    min_order: 0,
    taekbae_note_uz: "Koreya bo'ylab pochta (택배) — 1–2 kun.",
    bus_note_uz: 'Kremli tortlar 버스터미널 orqali yuboriladi (yo\'l haqi qabul qiluvchidan).',
    pickup_note_uz: "Do'kondan olib ketish: 경기도 안산시 상록구 이화로 34사동",
  },
  app: {
    announcement_uz: '',
    announcement_ru: '',
    onboarding: true,
  },
};

// Bir martalik qo'shimchalar: har biri bazada faqat bir marta bajariladi —
// admin keyin o'chirib yuborsa, server qayta ishga tushganda qaytib kelmaydi
const ONCE = {
  'shop-categories': async () => {
    for (const c of shopCategories) {
      await db.query(
        `INSERT INTO categories (name_uz, name_ru, emoji, sort)
         SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE lower(name_uz) = lower($1))`,
        [c.name_uz, c.name_ru, c.emoji, c.sort]
      );
    }
  },
};

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    // Yangi kalitlar qo'shilsa, mavjud qiymatlar saqlanib qoladi
    await db.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb || settings.value`,
      [key, JSON.stringify(value)]
    );
  }
  for (const [key, run] of Object.entries(ONCE)) {
    if (await db.one('SELECT 1 FROM seeds WHERE key = $1', [key])) continue;
    await run();
    await db.query('INSERT INTO seeds (key) VALUES ($1) ON CONFLICT DO NOTHING', [key]);
  }
}

module.exports = { migrate, DEFAULT_SETTINGS };
