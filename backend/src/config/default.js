// Sozlamalar va o'zgaruvchilar (.env fayldan o'qiladi)
const path = require('path');

const env = process.env;

const list = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const trimSlash = (v) => String(v || '').replace(/\/+$/, '');

module.exports = {
  env: env.NODE_ENV || 'development',
  isProd: env.NODE_ENV === 'production',
  port: Number(env.PORT) || 4000,

  shop: {
    name: env.SHOP_NAME || 'Tayyor & Sweet',
    shortName: env.SHOP_SHORT_NAME || 'TS',
    orderPrefix: env.ORDER_PREFIX || 'TS',
    currency: '₩',
  },

  bot: {
    token: env.BOT_TOKEN || '',
    username: env.BOT_USERNAME || '',
    // Render avtomatik beradi; o'zingiz ham PUBLIC_URL qo'yishingiz mumkin
    publicUrl: trimSlash(env.PUBLIC_URL || env.RENDER_EXTERNAL_URL || ''),
    webhookSecret: env.WEBHOOK_SECRET || '',
    // Mahalliy kompyuterda polling ishlatiladi (USE_POLLING=1)
    usePolling: env.USE_POLLING === '1' || !(env.PUBLIC_URL || env.RENDER_EXTERNAL_URL),
  },

  miniappUrl: trimSlash(env.MINIAPP_URL || ''),
  ownerLink: env.OWNER_LINK || '',

  admin: {
    password: env.ADMIN_PASSWORD || '',
    secret: env.ADMIN_SECRET || env.BOT_TOKEN || 'change-me',
    ids: list(env.ADMIN_IDS).map(Number).filter(Boolean),
    maxAttempts: 5,
    blockMinutes: 15,
    sessionHours: 24 * 7,
  },

  databaseUrl: env.DATABASE_URL || '',
  corsOrigins: list(env.CORS_ORIGINS),
  // Brauzerda (Telegramsiz) sinash uchun: ALLOW_DEV_AUTH=1
  allowDevAuth: env.ALLOW_DEV_AUTH === '1' && env.NODE_ENV !== 'production',
  // Saytdan (Telegramsiz) buyurtma: brauzer "mehmon" kaliti bilan. O'chirish: ALLOW_GUEST_ORDERS=0
  allowGuests: env.ALLOW_GUEST_ORDERS !== '0',
  // Render'da server uxlab qolmasligi uchun o'ziga ping. O'chirish: KEEP_ALIVE=0
  keepAlive: !!env.RENDER_EXTERNAL_URL && env.KEEP_ALIVE !== '0',
  rasmlarDir: path.resolve(__dirname, '../..', env.RASMLAR_DIR || '../rasmlar'),
};
