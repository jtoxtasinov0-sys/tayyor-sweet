// Jadvallarni yaratish va standart sozlamalarni qo'yish
const fs = require('fs');
const path = require('path');
const db = require('./connection');
const config = require('../config/default');

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
}

module.exports = { migrate, DEFAULT_SETTINGS };
