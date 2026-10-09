// Foydalanuvchini tekshirish: Telegram WebApp initData (API) va bot ctx
const crypto = require('crypto');
const config = require('../config/default');
const User = require('../models/User');
const logger = require('../utils/logger');

const MAX_AGE_SEC = 24 * 60 * 60;

// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyInitData(initData) {
  if (!initData || !config.bot.token) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheck = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(config.bot.token).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
  const a = Buffer.from(calc, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SEC) return null;
  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

// Express: mijoz API uchun
async function requireTelegramUser(req, res, next) {
  try {
    let tg = verifyInitData(req.get('X-Telegram-Init-Data'));
    if (!tg && config.allowDevAuth) {
      // Faqat mahalliy sinov uchun (Telegramdan tashqarida)
      tg = { id: Number(req.get('X-Dev-User-Id') || 1), first_name: 'Dev', username: 'dev' };
    }
    if (!tg?.id) return res.status(401).json({ error: 'unauthorized' });
    req.user = await User.upsertFromTelegram(tg);
    next();
  } catch (e) {
    logger.error('auth:', e.message);
    res.status(500).json({ error: 'server_error' });
  }
}

// Telegraf: har bir xabarda foydalanuvchini bazaga yozish
async function botUser(ctx, next) {
  if (ctx.from && !ctx.from.is_bot) {
    try {
      ctx.state.user = await User.upsertFromTelegram(ctx.from);
    } catch (e) {
      logger.error('botUser:', e.message);
    }
  }
  return next();
}

module.exports = { verifyInitData, requireTelegramUser, botUser };
