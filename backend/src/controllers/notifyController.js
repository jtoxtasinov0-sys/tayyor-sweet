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
  if (User.isGuest(o.user_id)) lines.push("🌐 Saytdan (Telegram'siz) — mijozga telefon orqali bog'laning");
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

// Buyurtmadagi mahsulot rasmlari (takrorlarsiz, Telegram albomi uchun ko'pi bilan 10 ta)
async function orderPhotos(order) {
  const seen = new Set();
  const photos = [];
  for (const i of order.items || []) {
    if (!i.image_id || seen.has(i.image_id) || photos.length >= 10) continue;
    seen.add(i.image_id);
    const img = await Image.get(i.image_id).catch(() => null);
    if (img) photos.push({ media: { source: img.data }, caption: i.name });
  }
  return photos;
}

// Rasm har bir adminga qayta yuklanmasin — birinchi yuborishdan keyin Telegram file_id ishlatiladi
const keepFileId = (photo, msg) => {
  if (msg?.photo?.length) photo.media = msg.photo.at(-1).file_id;
};

// Tahrirlanganda ham sig'ishi uchun Telegram chegarasidan (1024) biroz kam
const CAPTION_MAX = 900;

async function newOrder(order) {
  const text = `🆕 <b>Yangi buyurtma!</b>\n\n${orderSummary(order)}`;
  const extra = { parse_mode: 'HTML', ...orderAdminInline(order) };
  const photos = await orderPhotos(order);

  await toAdmins(async (id) => {
    try {
      // Bitta mahsulot: rasm + matn + tugmalar bitta xabarda
      if (photos.length === 1 && text.length <= CAPTION_MAX) {
        return keepFileId(photos[0], await bot.telegram.sendPhoto(id, photos[0].media, { caption: text, ...extra }));
      }
      // Bir nechta mahsulot: avval rasmlar albomi, keyin tugmali matn
      if (photos.length === 1) {
        keepFileId(photos[0], await bot.telegram.sendPhoto(id, photos[0].media, { caption: photos[0].caption }));
      } else if (photos.length > 1) {
        const msgs = await bot.telegram.sendMediaGroup(id, photos.map((p) => ({ type: 'photo', ...p })));
        msgs.forEach((m, k) => keepFileId(photos[k], m));
      }
    } catch (e) {
      logger.warn(`Buyurtma rasmi yuborilmadi (${id}):`, e.message);
    }
    await bot.telegram.sendMessage(id, text, extra);
  });
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

// Buyurtmadan keyin qoldig'i "kam qoldi" chegarasiga tushgan mahsulotlar
async function lowStock(products) {
  const lines = products.map((p) => `• ${esc(p.name_uz)} — ${p.stock > 0 ? `<b>${p.stock}</b> ta qoldi` : '<b>tugadi</b>'}`);
  const text = `⚠️ <b>Omborda kam qoldi</b>\n\n${lines.join('\n')}\n\nAdmin panel → 🏬 Ombor`;
  await toAdmins((id) => bot.telegram.sendMessage(id, text, { parse_mode: 'HTML' }));
}

async function statusChanged(order) {
  if (!order.user_id || User.isGuest(order.user_id)) return;
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

// Davom etayotgan rassilkalar: id → { stop, done } — o'chirilganda avval yuborish to'xtatiladi
const sending = new Map();
const deleting = new Set();

// Rassilka: fon rejimida, Telegram limitiga mos (~20 xabar/soniya)
async function runBroadcast({ text, image_id, button }) {
  const users = await User.broadcastTargets();
  const image = image_id ? await Image.get(image_id) : null;
  const rec = await Broadcast.create({ text, image_id, button, total: users.length });
  let photoFileId = null;
  const shopUrl = webAppUrl();
  const job = { stop: false };
  sending.set(rec.id, job);

  job.done = (async () => {
    let sent = 0;
    let failed = 0;
    for (const u of users) {
      if (job.stop) break;
      const extra = { parse_mode: 'HTML' };
      if (button && shopUrl?.startsWith('https://')) {
        Object.assign(extra, Markup.inlineKeyboard([[Markup.button.webApp(button, shopUrl)]]));
      }
      try {
        let msg;
        if (image) {
          msg = await bot.telegram.sendPhoto(u.id, photoFileId || { source: image.data }, { caption: text, ...extra });
          photoFileId = photoFileId || msg.photo?.at(-1)?.file_id;
        } else {
          msg = await bot.telegram.sendMessage(u.id, text, extra);
        }
        sent++;
        await Broadcast.addMessage(rec.id, u.id, msg.message_id).catch((e) => logger.warn('Rassilka xabari saqlanmadi:', e.message));
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
  })().finally(() => sending.delete(rec.id));

  return rec;
}

// Server qayta ishga tushsa, yarim qolgan yuborish/o'chirish "davom etmoqda" bo'lib qotib qolmasin
async function broadcastList() {
  const rows = await Broadcast.list();
  return rows.map((b) => {
    if (b.status === 'running' && !sending.has(b.id)) return { ...b, status: 'done' };
    if (b.status === 'deleting' && !deleting.has(b.id)) return { ...b, status: 'deleted' };
    return b;
  });
}

// Telegram bot xabarini faqat 48 soat ichida o'chira oladi
const DELETE_WINDOW = 48 * 3600_000;

// Xato yuborilgan rassilkani hammadan o'chirish (fon rejimida). Tarmoq xatosida xabar ro'yxatda qoladi —
// tugmani qayta bossa, qolganlari o'chiriladi
async function deleteBroadcast(id) {
  const rec = await Broadcast.get(id);
  if (!rec) return { error: 'not_found', status: 404 };
  const job = sending.get(id);
  const left = await Broadcast.messages(id);
  if (deleting.has(id)) return { rec };
  if (!left.length && !job) {
    return {
      status: 400,
      error: rec.status === 'deleted' ? "Bu rassilka allaqachon o'chirilgan" : "Bu rassilka xabarlari saqlanmagan (o'chirish qo'shilishidan oldin yuborilgan) — o'chirib bo'lmaydi",
    };
  }
  if (Date.now() - new Date(rec.created_at).getTime() > DELETE_WINDOW) {
    return { status: 400, error: "48 soatdan o'tgan — Telegram eski xabarlarni o'chirishga ruxsat bermaydi" };
  }
  deleting.add(id);
  if (job) job.stop = true;

  (async () => {
    let deleted = rec.deleted;
    try {
      await Broadcast.setStatus(id, 'deleting');
      await job?.done;
      let n = 0;
      for (const m of await Broadcast.messages(id)) {
        try {
          await tgRetry(() => bot.telegram.deleteMessage(m.chat_id, m.message_id));
          deleted++;
          await Broadcast.dropMessage(id, m.chat_id);
        } catch (e) {
          // Telegram rad etdi (mijoz botni bloklagan, xabarni o'zi o'chirgan...) — qayta urinishdan foyda yo'q.
          // Tarmoq xatosi (code — matn) bo'lsa, xabar ro'yxatda qoladi
          if (typeof e.code === 'number') await Broadcast.dropMessage(id, m.chat_id);
          logger.warn(`Rassilka #${id} xabari o'chmadi (${m.chat_id}):`, e.message);
        }
        if (++n % 25 === 0) await Broadcast.deleteProgress(id, deleted).catch(() => {});
        await sleep(50);
      }
      logger.info(`Rassilka #${id}: ${deleted} ta xabar o'chirildi`);
    } finally {
      await Broadcast.deleteProgress(id, deleted, 'deleted');
    }
  })()
    .catch((e) => logger.error(`Rassilka #${id} o'chirilmadi:`, e.message))
    .finally(() => deleting.delete(id));

  return { rec: { ...rec, status: 'deleting' } };
}

// HTML teglarsiz matn — Telegram'dagi xabar matni bilan solishtirish uchun
const plain = (s) =>
  String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

// Xabarlari saqlanmagan (o'chirish qo'shilishidan oldingi) rassilkani o'chirish. Admin o'zidagi nusxaga javob
// qilib /ochir yozadi. Bot xabarlarining raqami ketma-ket, shuning uchun boshqa mijozlardagi nusxalar shu raqam
// atrofida bo'ladi. Har bir nomzod adminga jim forward qilib tekshiriladi (nusxa darhol o'chiriladi) —
// faqat botning aynan shu matnli xabari o'chiriladi
async function deleteBroadcastByCopy(adminChat, copy, botId) {
  if (Date.now() - copy.date * 1000 > DELETE_WINDOW) {
    return { error: "48 soatdan o'tgan — Telegram eski xabarlarni o'chirishga ruxsat bermaydi" };
  }
  const text = plain(copy.text || copy.caption);
  const rec = (await Broadcast.since(new Date(Date.now() - DELETE_WINDOW))).find((b) => plain(b.text) === text);
  if (!rec) return { error: "Bu xabar so'nggi 48 soatdagi rassilkalar ichida topilmadi" };
  // Yangi rassilka — xabarlari saqlangan, oddiy yo'l bilan o'chiriladi
  if (rec.stored > 0 || sending.has(rec.id)) return deleteBroadcast(rec.id);
  if (deleting.has(rec.id)) return { rec };
  deleting.add(rec.id);

  (async () => {
    let deleted = rec.deleted;
    try {
      await Broadcast.setStatus(rec.id, 'deleting');
      if (await bot.telegram.deleteMessage(adminChat, copy.message_id).catch(() => false)) deleted++;
      const users = (await User.targetsBefore(rec.created_at)).filter((u) => String(u.id) !== String(adminChat));
      for (const u of users) {
        const id = await findCopy(adminChat, u.id, copy.message_id, text, botId);
        if (id && (await tgRetry(() => bot.telegram.deleteMessage(u.id, id)).catch(() => false))) deleted++;
        await Broadcast.deleteProgress(rec.id, deleted).catch(() => {});
      }
    } finally {
      await Broadcast.deleteProgress(rec.id, deleted, 'deleted');
    }
    logger.info(`Rassilka #${rec.id} (eski): ${deleted} ta xabar o'chirildi`);
    await bot.telegram.sendMessage(adminChat, `🗑 Rassilka o'chirildi: ${deleted} ta mijozdan (yuborilgan edi: ${rec.sent})`);
  })()
    .catch((e) => logger.error(`Rassilka #${rec.id} o'chirilmadi:`, e.message))
    .finally(() => deleting.delete(rec.id));

  return { rec: { ...rec, status: 'deleting' } };
}

// Mijoz chatida botning shu matnli xabarini anchor raqami atrofidan qidiradi (avval eng yaqinlari)
const SCAN = 100;
async function findCopy(adminChat, chatId, anchor, text, botId) {
  for (let d = 1; d <= SCAN; d++) {
    for (const id of [anchor - d, anchor + d]) {
      if (id <= 0) continue;
      let fwd;
      try {
        fwd = await tgRetry(() => bot.telegram.forwardMessage(adminChat, chatId, id, { disable_notification: true }));
      } catch (e) {
        // mijoz botni bloklagan / chat yo'q — bu mijozni qidirishdan foyda yo'q; aks holda bu raqamda xabar yo'q
        if (e.code === 403 || /chat not found/i.test(e.message)) return null;
        continue;
      } finally {
        await sleep(40);
      }
      await bot.telegram.deleteMessage(adminChat, fwd.message_id).catch(() => {});
      const from = fwd.forward_origin?.sender_user?.id ?? fwd.forward_from?.id;
      if (from === botId && plain(fwd.text || fwd.caption) === text) return id;
    }
  }
  return null;
}

// 429 (juda tez) bo'lsa, Telegram aytgan vaqtni kutib qayta urinadi
async function tgRetry(fn, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.code !== 429 || i >= tries) throw e;
      await sleep((e.parameters?.retry_after || 3) * 1000);
    }
  }
}

module.exports = { orderSummary, newOrder, receiptUploaded, lowStock, statusChanged, runBroadcast, broadcastList, deleteBroadcast, deleteBroadcastByCopy };
