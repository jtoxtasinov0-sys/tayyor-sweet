// Xabarnomalar: adminlarga yangi buyurtma/chek, mijozga holat o'zgarishi, rassilka
const { Markup } = require('telegraf');
const bot = require('../core/bot');
const config = require('../config/default');
const User = require('../models/User');
const Image = require('../models/Image');
const Broadcast = require('../models/Broadcast');
const { t } = require('../utils/i18n');
const { won, esc, STATUS_TEXT, DELIVERY_TEXT, COURIERS, trackingUrl } = require('../utils/format');
const { orderAdminInline, webAppUrl } = require('../utils/keyboards');
const logger = require('../utils/logger');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function orderSummary(o, lang = 'uz') {
  const items = (o.items || [])
    .map((i) => `• ${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''}${i.color ? `, ${esc(i.color)}` : ''} × ${i.qty} — ${won(i.price * i.qty)}`)
    .join('\n');
  const lines = [
    `🧾 <b>#${o.number}</b> — ${STATUS_TEXT[lang][o.status]}`,
    '',
    items,
    '',
    `🚚 ${DELIVERY_TEXT[lang][o.delivery_method] || o.delivery_method}${o.delivery_fee ? ` — ${won(o.delivery_fee)}` : ''}`,
    `💰 <b>${won(o.total)}</b>`,
    '',
    `👤 ${esc(o.customer_name)} · ${esc(o.phone)}${o.username ? ` · @${esc(o.username)}` : ''}`,
  ];
  if (o.address) lines.push(`📍 ${esc(o.address)}${o.postal_code ? ` (${esc(o.postal_code)})` : ''}`);
  if (o.desired_date) lines.push(`📅 ${new Date(o.desired_date).toISOString().slice(0, 10)}`);
  if (o.comment) lines.push(`💬 ${esc(o.comment)}`);
  if (o.tracking_number) lines.push(`🔎 ${COURIERS[o.courier]?.name || ''} <code>${esc(o.tracking_number)}</code>`);
  return lines.join('\n');
}

async function toAdmins(fn) {
  const admins = await User.admins();
  const ids = new Set([...admins.map((a) => Number(a.id)), ...config.admin.ids]);
  for (const id of ids) {
    try {
      await fn(id);
    } catch (e) {
      logger.warn(`Adminga yuborilmadi (${id}):`, e.message);
    }
  }
}

async function newOrder(order) {
  await toAdmins((id) =>
    bot.telegram.sendMessage(id, `🆕 <b>Yangi buyurtma!</b>\n\n${orderSummary(order)}`, {
      parse_mode: 'HTML',
      ...orderAdminInline(order),
    })
  );
}

async function receiptUploaded(order, image) {
  await toAdmins((id) =>
    bot.telegram.sendPhoto(
      id,
      { source: image.data },
      { caption: `🧾 <b>Chek keldi!</b>\n\n${orderSummary(order)}`.slice(0, 1024), parse_mode: 'HTML', ...orderAdminInline(order) }
    )
  );
}

async function statusChanged(order) {
  if (!order.user_id) return;
  const user = await User.get(order.user_id);
  const lang = user?.lang || 'uz';
  const L = t(lang);
  let text = L.status_changed(order.number, STATUS_TEXT[lang][order.status]);
  if (order.status === 'shipped' && order.tracking_number) {
    text += `\n\n${L.tracking(COURIERS[order.courier]?.name || '택배', esc(order.tracking_number))}`;
  }
  if (order.admin_note) text += `\n\n💬 ${esc(order.admin_note)}`;
  const buttons = [];
  const track = trackingUrl(order.courier, order.tracking_number);
  if (order.status === 'shipped' && track) buttons.push(Markup.button.url(L.track_btn, track));
  const url = webAppUrl(`/?order=${order.id}`);
  if (url?.startsWith('https://')) buttons.push(Markup.button.webApp(L.order_btn, url));
  try {
    await bot.telegram.sendMessage(order.user_id, text, {
      parse_mode: 'HTML',
      ...(buttons.length ? Markup.inlineKeyboard([buttons]) : {}),
    });
  } catch (e) {
    if (e.code === 403) await User.markBlocked(order.user_id);
    logger.warn('Mijozga xabar ketmadi:', e.message);
  }
}

// Rassilka: fon rejimida, Telegram limitiga mos (~20 xabar/soniya)
async function runBroadcast({ text, image_id, button }) {
  const users = await User.broadcastTargets();
  const rec = await Broadcast.create({ text, image_id, button, total: users.length });
  const image = image_id ? await Image.get(image_id) : null;
  let photoFileId = null;
  const shopUrl = webAppUrl();

  (async () => {
    let sent = 0;
    let failed = 0;
    for (const u of users) {
      const extra = { parse_mode: 'HTML' };
      if (button && shopUrl?.startsWith('https://')) {
        Object.assign(extra, Markup.inlineKeyboard([[Markup.button.webApp(button, shopUrl)]]));
      }
      try {
        if (image) {
          const msg = await bot.telegram.sendPhoto(u.id, photoFileId || { source: image.data }, { caption: text, ...extra });
          photoFileId = photoFileId || msg.photo?.at(-1)?.file_id;
        } else {
          await bot.telegram.sendMessage(u.id, text, extra);
        }
        sent++;
      } catch (e) {
        failed++;
        if (e.code === 403) await User.markBlocked(u.id).catch(() => {});
        if (e.code === 429) await sleep((e.parameters?.retry_after || 3) * 1000);
      }
      if ((sent + failed) % 25 === 0) await Broadcast.progress(rec.id, sent, failed).catch(() => {});
      await sleep(50);
    }
    await Broadcast.progress(rec.id, sent, failed, 'done').catch(() => {});
    logger.info(`Rassilka #${rec.id}: ${sent} yuborildi, ${failed} xato`);
  })();

  return rec;
}

module.exports = { orderSummary, newOrder, receiptUploaded, statusChanged, runBroadcast };
