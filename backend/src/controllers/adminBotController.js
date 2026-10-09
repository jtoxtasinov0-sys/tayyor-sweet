// Admin buyruqlari: /admin, /panel va buyurtma tugmalari
const config = require('../config/default');
const User = require('../models/User');
const Order = require('../models/Order');
const { t } = require('../utils/i18n');
const { won, STATUS_TEXT } = require('../utils/format');
const kb = require('../utils/keyboards');
const { limiter, checkPassword } = require('../middlewares/admin.middleware');
const notify = require('./notifyController');
const cache = require('../utils/cache');

const isAdmin = (ctx) => ctx.state.user?.is_admin || config.admin.ids.includes(Number(ctx.from?.id));
const langOf = (ctx) => ctx.state.user?.lang || 'uz';

async function admin(ctx) {
  const lang = langOf(ctx);
  const L = t(lang);
  const password = ctx.message.text.split(/\s+/).slice(1).join(' ');

  if (!isAdmin(ctx)) {
    if (!password) return ctx.reply(L.not_admin, { parse_mode: 'HTML' });
    const key = `tg:${ctx.from.id}`;
    const wait = limiter.blockedFor(key);
    if (wait) return ctx.reply(L.blocked(wait));
    // Parolni chatda qoldirmaslik uchun xabarni o'chiramiz
    await ctx.deleteMessage().catch(() => {});
    if (!checkPassword(password)) {
      limiter.fail(key);
      const w = limiter.blockedFor(key);
      return ctx.reply(w ? L.blocked(w) : L.wrong_pass);
    }
    limiter.reset(key);
    ctx.state.user = await User.setAdmin(ctx.from.id, true);
    await ctx.reply(L.admin_ok);
  }
  return panel(ctx);
}

// /id: hammaga Telegram ID, adminga qo'shimcha admin paroli
async function myId(ctx) {
  const lines = [`🆔 Sizning Telegram ID: <code>${ctx.from.id}</code>`];
  if (isAdmin(ctx) && config.admin.password) {
    lines.push(`🔑 Admin parol: <tg-spoiler><code>${config.admin.password.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c])}</code></tg-spoiler>`);
  }
  return ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
}

async function panel(ctx) {
  const lang = langOf(ctx);
  const L = t(lang);
  if (!isAdmin(ctx)) return ctx.reply(L.not_admin, { parse_mode: 'HTML' });
  const s = await Order.stats();
  const text = [
    L.admin_panel,
    '',
    `📦 Bugun: <b>${s.orders_today}</b> ta buyurtma`,
    `⏳ To'lov kutilmoqda: <b>${s.pending}</b>`,
    `🧾 Chek tekshirish: <b>${s.receipts}</b>`,
    `🚚 Jo'natish kerak: <b>${s.to_ship}</b>`,
    `💰 Shu oy: <b>${won(s.revenue_month)}</b>`,
    `👥 Mijozlar: <b>${s.users_total}</b> (+${s.users_week} hafta)`,
  ].join('\n');
  await ctx.reply(text, { parse_mode: 'HTML', ...kb.adminInline(lang) });

  // Harakat kerak bo'lgan buyurtmalar
  const { rows } = await Order.list({ status: 'receipt_sent', limit: 5 });
  const { rows: toShip } = await Order.list({ status: 'confirmed', limit: 5 });
  for (const o of [...rows, ...toShip]) {
    await ctx.reply(notify.orderSummary(o), { parse_mode: 'HTML', ...kb.orderAdminInline(o) });
  }
}

// Inline tugma: ord:<id>:<status>
async function orderAction(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('⛔️');
  const [, id, status] = ctx.match;
  const order = await Order.setStatus(Number(id), status);
  if (!order) return ctx.answerCbQuery('Topilmadi');
  cache.clear();
  await ctx.answerCbQuery(STATUS_TEXT.uz[status]);
  const full = await Order.getWithUser(order.id);
  const caption = notify.orderSummary(full);
  const markup = kb.orderAdminInline(full)?.reply_markup || { inline_keyboard: [] };
  if (ctx.callbackQuery.message?.photo) {
    await ctx.editMessageCaption(caption.slice(0, 1024), { parse_mode: 'HTML', reply_markup: markup }).catch(() => {});
  } else {
    await ctx.editMessageText(caption, { parse_mode: 'HTML', reply_markup: markup }).catch(() => {});
  }
  if (status === 'shipped') {
    await ctx.reply(`🔎 Trek raqamini admin panelda kiriting: #${full.number}`, kb.adminInline(langOf(ctx)));
  }
  await notify.statusChanged(full);
}

module.exports = { admin, panel, myId, orderAction, isAdmin };
