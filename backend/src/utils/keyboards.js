// Tugmalar shablonlari
const { Markup } = require('telegraf');
const config = require('../config/default');
const { t } = require('./i18n');

const webAppUrl = (path = '') => (config.miniappUrl ? config.miniappUrl + path : null);

const langKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("🇺🇿 O'zbekcha", 'lang:uz'), Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
  ]);

const phoneKeyboard = (lang) =>
  Markup.keyboard([[Markup.button.contactRequest(t(lang).send_phone)]])
    .resize()
    .oneTime();

function mainKeyboard(lang) {
  const L = t(lang);
  const rows = [];
  const url = webAppUrl();
  if (url && url.startsWith('https://')) rows.push([Markup.button.webApp(L.open_shop, url)]);
  rows.push([L.menu_prices, L.menu_orders]);
  rows.push([L.menu_contact, L.menu_lang]);
  return Markup.keyboard(rows).resize();
}

function openShopInline(lang, path = '') {
  const url = webAppUrl(path);
  if (!url || !url.startsWith('https://')) return undefined;
  return Markup.inlineKeyboard([[Markup.button.webApp(t(lang).open_shop, url)]]);
}

function adminInline(lang) {
  const url = webAppUrl('/admin');
  if (!url || !url.startsWith('https://')) return undefined;
  return Markup.inlineKeyboard([[Markup.button.webApp(t(lang).open_admin, url)]]);
}

// Admin uchun buyurtma ustidagi tezkor tugmalar
function orderAdminInline(order) {
  const rows = [];
  if (order.status === 'pending_payment' || order.status === 'receipt_sent') {
    rows.push([
      Markup.button.callback('✅ Tasdiqlash', `ord:${order.id}:confirmed`),
      Markup.button.callback('❌ Bekor', `ord:${order.id}:cancelled`),
    ]);
  } else if (order.status === 'confirmed') {
    rows.push([Markup.button.callback("🚚 Jo'natildi", `ord:${order.id}:shipped`)]);
  } else if (order.status === 'shipped') {
    rows.push([Markup.button.callback('🎉 Yetkazildi', `ord:${order.id}:delivered`)]);
  }
  return rows.length ? Markup.inlineKeyboard(rows) : undefined;
}

module.exports = { langKeyboard, phoneKeyboard, mainKeyboard, openShopInline, adminInline, orderAdminInline, webAppUrl };
