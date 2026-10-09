// Admin paneli: parol, IP bloklash (15 daqiqa) va imzolangan token
const crypto = require('crypto');
const config = require('../config/default');
const { verifyInitData } = require('./auth.middleware');
const User = require('../models/User');

const attempts = new Map(); // key -> { count, blockedUntil }

function clientIp(req) {
  return (req.get('x-forwarded-for') || '').split(',')[0].trim() || req.ip || 'unknown';
}

// Urinishlar hisoblagichi (bot /admin parol uchun ham ishlatiladi)
const limiter = {
  blockedFor(key) {
    const a = attempts.get(key);
    if (!a?.blockedUntil) return 0;
    const left = a.blockedUntil - Date.now();
    if (left <= 0) {
      attempts.delete(key);
      return 0;
    }
    return Math.ceil(left / 60000);
  },
  fail(key) {
    const a = attempts.get(key) || { count: 0, blockedUntil: 0 };
    a.count += 1;
    if (a.count >= config.admin.maxAttempts) {
      a.blockedUntil = Date.now() + config.admin.blockMinutes * 60000;
      a.count = 0;
    }
    attempts.set(key, a);
    return config.admin.maxAttempts - a.count;
  },
  reset(key) {
    attempts.delete(key);
  },
};

function checkPassword(input) {
  const pass = config.admin.password;
  if (!pass) return false;
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(pass).digest();
  return crypto.timingSafeEqual(a, b);
}

const sign = (payload) => crypto.createHmac('sha256', config.admin.secret).update(payload).digest('base64url');

function issueToken(sub = 'admin') {
  const exp = Date.now() + config.admin.sessionHours * 3600_000;
  const payload = Buffer.from(JSON.stringify({ sub, exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

// POST /api/admin/login  { password }  yoki  { initData } (Telegram ichida admin bo'lsa)
async function login(req, res) {
  const ip = clientIp(req);
  const wait = limiter.blockedFor(ip);
  if (wait) return res.status(429).json({ error: 'blocked', minutes: wait });

  const { password, initData } = req.body || {};
  if (initData) {
    const tg = verifyInitData(initData);
    if (tg?.id) {
      const u = await User.get(tg.id);
      if (u?.is_admin || config.admin.ids.includes(Number(tg.id))) {
        limiter.reset(ip);
        return res.json({ token: issueToken(`tg:${tg.id}`) });
      }
    }
    if (!password) return res.status(401).json({ error: 'not_admin' });
  }

  if (checkPassword(password)) {
    limiter.reset(ip);
    return res.json({ token: issueToken('password') });
  }
  const left = limiter.fail(ip);
  const blocked = limiter.blockedFor(ip);
  res.status(blocked ? 429 : 401).json({ error: blocked ? 'blocked' : 'wrong_password', left, minutes: blocked });
}

function requireAdmin(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const data = readToken(token);
  if (!data) return res.status(401).json({ error: 'unauthorized' });
  req.admin = data;
  next();
}

module.exports = { login, requireAdmin, limiter, checkPassword, clientIp };
