// Mijoz uchun bot logikasi: /start, til, telefon, menyu, narxlar, buyurtmalar
const fs = require('fs');
const path = require('path');
const config = require('../config/default');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Setting = require('../models/Setting');
const { t, T } = require('../utils/i18n');
const { won, esc, STATUS_TEXT } = require('../utils/format');
const kb = require('../utils/keyboards');
const logger = require('../utils/logger');
const { Markup } = require('telegraf');

const langOf = (ctx) => ctx.state.user?.lang || 'uz';

async function start(ctx) {
  // Til tanlanmagan bo'lsa — Telegram tilidan (keyin xabar ostidagi tugmalar bilan almashtiriladi)
  if (!ctx.state.user?.lang) ctx.state.user = await User.setLang(ctx.from.id, ctx.from.language_code === 'ru' ? 'ru' : 'uz');
  return greet(ctx);
}

// Pastki klaviatura (yozish qatoridagi ⊞ belgisi ochadi): «📲 Ilovani o'rnatish».
// Eski katta pastki menyuni ham almashtiradi. Har foydalanuvchiga bir marta (server qayta ishga tushguncha)
const keyboardSent = new Set();
async function sendInstallKeyboard(ctx) {
  if (keyboardSent.has(ctx.from.id)) return;
  keyboardSent.add(ctx.from.id);
  const lang = langOf(ctx);
  await ctx.reply(t(lang).install_kb_hint, { ...kb.installKeyboard(lang), disable_notification: true }).catch(() => {});
}

// Rasm Telegram'ga bir marta yuklanadi, keyin file_id bilan yuboriladi
let welcomePhotoId = null;

async function greet(ctx) {
  const user = ctx.state.user;
  const lang = langOf(ctx);
  const L = t(lang);
  const shop = await Setting.get('shop');
  const caption = L.welcome(esc(ctx.from.first_name || ''), esc(shop.name || config.shop.name));
  const extra = { parse_mode: 'HTML', ...kb.welcomeInline(lang, shop.instagram) };
  const photo =
    welcomePhotoId ||
    (fs.existsSync(config.welcomePhoto) ? { source: config.welcomePhoto } : config.miniappUrl ? `${config.miniappUrl}/og.jpg` : null);
  try {
    if (!photo) throw new Error('rasm yo\'q');
    const msg = await ctx.replyWithPhoto(photo, { caption, ...extra });
    welcomePhotoId = msg.photo?.[msg.photo.length - 1]?.file_id || welcomePhotoId;
  } catch {
    await ctx.reply(caption, extra);
  }
  if (!user?.phone) return ctx.reply(L.ask_phone, kb.phoneKeyboard(lang));
  return sendInstallKeyboard(ctx);
}

async function chooseLang(ctx) {
  const lang = ctx.match[1] === 'ru' ? 'ru' : 'uz';
  ctx.state.user = await User.setLang(ctx.from.id, lang);
  await ctx.answerCbQuery(t(lang).lang_set);
  await ctx.deleteMessage().catch(() => {});
  // pastki tugma ham yangi tilda qayta yuboriladi
  keyboardSent.delete(ctx.from.id);
  return greet(ctx);
}

async function askLang(ctx) {
  return ctx.reply(T.uz.choose_lang, kb.langKeyboard());
}

async function contact(ctx) {
  const c = ctx.message.contact;
  // Faqat o'z raqamini qabul qilamiz
  if (c.user_id && c.user_id !== ctx.from.id) return;
  let phone = String(c.phone_number || '');
  if (!phone.startsWith('+')) phone = `+${phone}`;
  ctx.state.user = await User.setPhone(ctx.from.id, phone);
  const lang = langOf(ctx);
  keyboardSent.add(ctx.from.id);
  return ctx.reply(t(lang).phone_saved, kb.installKeyboard(lang));
}

async function buildPriceList(lang = 'uz') {
  const [cats, products] = await Promise.all([Category.list(), Product.list()]);
  const L = t(lang);
  const parts = [L.prices_title, ''];
  const groups = [...cats, { id: null, name_uz: 'Boshqa', name_ru: 'Другое', emoji: '🍽' }];
  for (const c of groups) {
    const items = products.filter((p) => (p.category_id ?? null) === c.id);
    if (!items.length) continue;
    parts.push(`${c.emoji || '•'} <b>${esc(lang === 'ru' ? c.name_ru || c.name_uz : c.name_uz)}</b>`);
    for (const p of items) {
      const name = lang === 'ru' ? p.name_ru || p.name_uz : p.name_uz;
      const unit = lang === 'ru' ? p.unit_ru || p.unit_uz : p.unit_uz;
      const variants = (p.variants || []).length
        ? ` <i>(${p.variants.map((v) => `${esc(v.name)} ${won(v.price)}`).join(' / ')})</i>`
        : '';
      parts.push(`  ${esc(name)}${unit ? ` · ${esc(unit)}` : ''} — <b>${won(p.price)}</b>${variants}${p.pickup_only ? ' 🏠' : ''}${p.in_stock ? '' : ' ⛔️'}`);
    }
    parts.push('');
  }
  if (products.some((p) => p.pickup_only)) parts.push(L.pickup_only_note);
  return parts.join('\n');
}

async function prices(ctx) {
  const lang = langOf(ctx);
  const text = await buildPriceList(lang);
  // Telegram limiti 4096 belgi
  for (let i = 0; i < text.length; i += 4000) {
    const chunk = text.slice(i, i + 4000);
    const last = i + 4000 >= text.length;
    await ctx.reply(chunk, { parse_mode: 'HTML', ...(last ? kb.openShopInline(lang) : {}) });
  }
}

async function myOrders(ctx) {
  const lang = langOf(ctx);
  const L = t(lang);
  const orders = await Order.byUser(ctx.from.id, 5);
  if (!orders.length) return ctx.reply(L.no_orders, kb.openShopInline(lang));
  const lines = orders.map(
    (o) => `<b>#${o.number}</b> · ${won(o.total)}\n${STATUS_TEXT[lang][o.status]}${o.tracking_number ? ` · 🔎 <code>${esc(o.tracking_number)}</code>` : ''}`
  );
  return ctx.reply(`${L.your_orders}\n\n${lines.join('\n\n')}`, { parse_mode: 'HTML', ...kb.openShopInline(lang) });
}

async function contactInfo(ctx) {
  const lang = langOf(ctx);
  const L = t(lang);
  const shop = await Setting.get('shop');
  const owner = shop.owner_link || config.ownerLink;
  return ctx.reply(L.contact(shop), {
    parse_mode: 'HTML',
    ...(owner?.startsWith('http') ? Markup.inlineKeyboard([[Markup.button.url(L.write_owner, owner)]]) : {}),
  });
}

// Ilovani telefonga o'rnatish (PWA): bitta xabar — iPhone va Samsung video qo'llanma, izohida link
const installLink = (lang) => (config.miniappUrl ? `${config.miniappUrl}/ilova${lang === 'ru' ? '?lang=ru' : ''}` : '');

// Video faqat o'zbekcha (izoh matni foydalanuvchi tilida)
const GUIDES = ['ilova-iphone-uz.mp4', 'ilova-samsung-uz.mp4'];
// Telegram file_id: video serverdan bir marta yuklanadi, keyin qayta yuborilmaydi
const videoIds = new Map();

function guideMedia(name) {
  if (videoIds.has(name)) return { media: videoIds.get(name) };
  // Telegram chatdagi kichik rasm (bo'lmasa video birinchi kadri — bo'sh fon — chiqadi)
  const file = path.join(config.videoDir, name);
  const thumb = file.replace(/\.mp4$/, '-thumb.jpg');
  if (fs.existsSync(file)) return { media: { source: file }, ...(fs.existsSync(thumb) ? { thumbnail: { source: thumb } } : {}) };
  // Render'da faqat backend papkasi bor — video va muqovani mini ilova saytidan (Vercel) yuklab olib o'zimiz yuboramiz.
  // Linkni Telegram'ga bersak, u eski videoni keshdan berishi mumkin va muqova qo'yib bo'lmaydi
  const url = `${config.miniappUrl}/video/${name}`;
  return { media: { url, filename: name }, thumbnail: { url: url.replace(/\.mp4$/, '-thumb.jpg'), filename: 'thumb.jpg' } };
}

async function install(ctx) {
  const lang = langOf(ctx);
  const L = t(lang);
  const link = installLink(lang);
  if (!link) return ctx.reply(L.main_menu, kb.openShopInline(lang));
  await ctx.sendChatAction('upload_video').catch(() => {});
  const album = GUIDES.map((name, i) => ({
    type: 'video',
    ...guideMedia(name),
    width: 1080,
    height: 1920,
    supports_streaming: true,
    ...(i === 0 ? { caption: `${L.install(link)}\n\n${L.install_videos}`, parse_mode: 'HTML' } : {}),
  }));
  try {
    const msgs = await ctx.replyWithMediaGroup(album);
    msgs.forEach((m, i) => m.video?.file_id && videoIds.set(GUIDES[i], m.video.file_id));
  } catch (e) {
    // Video yuborilmasa ham link yetib borsin
    logger.warn('install video:', e.message);
    return ctx.reply(L.install(link), { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
  }
}

// Eski xabarlardagi «iPhone — video» / «Samsung — video» tugmalari
async function guideVideo(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  return install(ctx);
}

// /start xabari ostidagi tugmalar
const MENU = { install, orders: myOrders, contact: contactInfo };
async function menuAction(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  return MENU[ctx.match[1]](ctx);
}

// Eski pastki menyu matnli tugmalari (ikkala tilda) — tugmasi qolgan foydalanuvchilar uchun
const menuMatchers = {
  prices: [T.uz.menu_prices, T.ru.menu_prices],
  orders: [T.uz.menu_orders, T.ru.menu_orders],
  contact: [T.uz.menu_contact, T.ru.menu_contact],
  lang: [T.uz.menu_lang, T.ru.menu_lang],
  install: [T.uz.menu_install, T.ru.menu_install],
};

async function photo(ctx) {
  // Mijoz chekni botga yuborsa — mini ilovaga yo'naltiramiz
  return ctx.reply(t(langOf(ctx)).send_receipt_hint, kb.openShopInline(langOf(ctx)));
}

module.exports = { start, greet, chooseLang, askLang, contact, prices, myOrders, contactInfo, install, guideVideo, menuAction, menuMatchers, buildPriceList, photo };
