// Mijoz uchun bot logikasi: /start, til, telefon, menyu, narxlar, buyurtmalar
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
  const user = ctx.state.user;
  if (!user?.lang) return ctx.reply(T.uz.choose_lang, kb.langKeyboard());
  return greet(ctx);
}

async function greet(ctx) {
  const user = ctx.state.user;
  const lang = langOf(ctx);
  const L = t(lang);
  const shop = (await Setting.get('shop')).name || config.shop.name;
  await ctx.reply(L.welcome(esc(ctx.from.first_name || ''), esc(shop)), {
    parse_mode: 'HTML',
    ...kb.openShopInline(lang),
  });
  if (!user?.phone) return ctx.reply(L.ask_phone, kb.phoneKeyboard(lang));
  return ctx.reply(L.main_menu, kb.mainKeyboard(lang));
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
  return ctx.reply(t(lang).phone_saved, kb.mainKeyboard(lang));
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
      parts.push(`  ${esc(name)}${unit ? ` · ${esc(unit)}` : ''} — <b>${won(p.price)}</b>${variants}${p.in_stock ? '' : ' ⛔️'}`);
    }
    parts.push('');
  }
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

// Pastki menyu matnli tugmalari (ikkala tilda)
const menuMatchers = {
  prices: [T.uz.menu_prices, T.ru.menu_prices],
  orders: [T.uz.menu_orders, T.ru.menu_orders],
  contact: [T.uz.menu_contact, T.ru.menu_contact],
  lang: [T.uz.menu_lang, T.ru.menu_lang],
};

async function photo(ctx) {
  // Mijoz chekni botga yuborsa — mini ilovaga yo'naltiramiz
  return ctx.reply(t(langOf(ctx)).send_receipt_hint, kb.openShopInline(langOf(ctx)));
}

module.exports = { start, greet, chooseLang, askLang, contact, prices, myOrders, contactInfo, menuMatchers, buildPriceList, photo };
