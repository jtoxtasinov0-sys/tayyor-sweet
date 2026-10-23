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

// Pastki klaviatura: bosilgach yopiladi, yozish qatoridagi ⊞ belgisi uni qayta ochadi
const installKeyboard = (lang) => Markup.keyboard([[t(lang).menu_install]]).resize().oneTime();

// /start xabari ostidagi tugmalar
function welcomeInline(lang, instagram) {
  const L = t(lang);
  const rows = [];
  const url = webAppUrl();
  if (url && url.startsWith('https://')) rows.push([Markup.button.webApp(L.open_shop, url)]);
  rows.push([Markup.button.callback(L.menu_install, 'menu:install')]);
  rows.push([Markup.button.callback(L.menu_orders, 'menu:orders'), Markup.button.callback(L.menu_contact, 'menu:contact')]);
  const ig = instagramUrl(instagram);
  if (ig) rows.push([Markup.button.url('📸 Instagram', ig)]);
  rows.push([Markup.button.callback("🇺🇿 O'zbekcha", 'lang:uz'), Markup.button.callback('🇷🇺 Русский', 'lang:ru')]);
  return Markup.inlineKeyboard(rows);
}

// "@nom" yoki to'liq link → https://instagram.com/nom
function instagramUrl(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  if (/^https?:\/\//.test(s)) return s;
  return `https://instagram.com/${s.replace(/^@/, '')}`;
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

module.exports = { langKeyboard, phoneKeyboard, installKeyboard, welcomeInline, openShopInline, adminInline, orderAdminInline, webAppUrl };
