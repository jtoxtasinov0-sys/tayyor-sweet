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
const { Markup } = require('telegraf');

const langOf = (ctx) => ctx.state.user?.lang || 'uz';

async function start(ctx) {
  // Til tanlanmagan bo'lsa — Telegram tilidan (keyin xabar ostidagi tugmalar bilan almashtiriladi)
  if (!ctx.state.user?.lang) ctx.state.user = await User.setLang(ctx.from.id, ctx.from.language_code === 'ru' ? 'ru' : 'uz');
  return greet(ctx);
}

// Eski pastki menyu (reply klaviatura) — endi barcha tugmalar xabar ostida. Bir marta olib tashlanadi
const keyboardCleared = new Set();
async function hideReplyKeyboard(ctx) {
  if (keyboardCleared.has(ctx.from.id)) return;
  keyboardCleared.add(ctx.from.id);
  const m = await ctx.reply('…', { ...Markup.removeKeyboard(), disable_notification: true }).catch(() => null);
  if (m) await ctx.deleteMessage(m.message_id).catch(() => {});
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
  if (user?.phone) await hideReplyKeyboard(ctx);
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
}

async function chooseLang(ctx) {
  const lang = ctx.match[1] === 'ru' ? 'ru' : 'uz';
  ctx.state.user = await User.setLang(ctx.from.id, lang);
  await ctx.answerCbQuery(t(lang).lang_set);
  await ctx.deleteMessage().catch(() => {});
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
  keyboardCleared.add(ctx.from.id);
  return ctx.reply(t(lang).phone_saved, Markup.removeKeyboard());
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

// Ilovani telefonga o'rnatish (PWA): link + iPhone / Samsung video qo'llanma
const installLink = (lang) => (config.miniappUrl ? `${config.miniappUrl}/ilova${lang === 'ru' ? '?lang=ru' : ''}` : '');

async function install(ctx) {
  const lang = langOf(ctx);
  const link = installLink(lang);
  if (!link) return ctx.reply(t(lang).main_menu, kb.openShopInline(lang));
  return ctx.reply(t(lang).install(link), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...kb.installInline(lang),
  });
}

// Telegram file_id: video serverdan bir marta yuklanadi, keyin qayta yuborilmaydi
const videoIds = new Map();

async function guideVideo(ctx) {
  const lang = langOf(ctx);
  const L = t(lang);
  const ios = ctx.match[1] === 'ios';
  await ctx.answerCbQuery().catch(() => {});
  // Video faqat o'zbekcha (izoh matni foydalanuvchi tilida); serverda fayl yo'q bo'lsa — mini ilova saytidan (Vercel)
  const name = `ilova-${ios ? 'iphone' : 'samsung'}-uz.mp4`;
  const file = path.join(config.videoDir, name);
  const source = videoIds.get(name) || (fs.existsSync(file) ? { source: file } : `${config.miniappUrl}/video/${name}`);
  // Telegram chatdagi kichik rasm (bo'lmasa video birinchi kadri — bo'sh fon — chiqadi)
  const thumb = file.replace(/\.mp4$/, '-thumb.jpg');
  await ctx.sendChatAction('upload_video').catch(() => {});
  const msg = await ctx.replyWithVideo(source, {
    caption: (ios ? L.guide_caption_ios : L.guide_caption_android)(installLink(lang)),
    parse_mode: 'HTML',
    width: 1080,
    height: 1920,
    supports_streaming: true,
    ...(source.source && fs.existsSync(thumb) ? { thumbnail: { source: thumb } } : {}),
  });
  if (msg.video?.file_id) videoIds.set(name, msg.video.file_id);
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
