// Foydalanuvchilar
const db = require('../database/connection');
const config = require('../config/default');

async function upsertFromTelegram(u) {
  return db.one(
    `INSERT INTO users (id, first_name, last_name, username, is_admin)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
       username = EXCLUDED.username, last_seen = now(), bot_blocked = false,
       is_admin = users.is_admin OR EXCLUDED.is_admin
     RETURNING *`,
    [u.id, u.first_name || null, u.last_name || null, u.username || null, config.admin.ids.includes(Number(u.id))]
  );
}

// Saytdan kirgan mehmon (manfiy ID, Telegram'siz). Bazaga faqat buyurtma berganda yoziladi —
// shunchaki ko'rib chiqqanlar mijozlar ro'yxatini to'ldirib yubormasin.
const isGuest = (id) => Number(id) < 0;

async function findGuest(id) {
  const u = await db.one('UPDATE users SET last_seen = now() WHERE id = $1 RETURNING *', [id]);
  return u || { id: String(id), first_name: null, last_name: null, username: null, phone: null, lang: null, is_admin: false, created_at: null };
}

// Ism/telefon buyurtmadan olinadi (admin ro'yxatida ko'rinishi uchun)
const saveGuest = (id, name, phone) =>
  db.one(
    `INSERT INTO users (id, first_name, phone) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, phone = EXCLUDED.phone, last_seen = now()
     RETURNING *`,
    [id, name, phone]
  );

const get = (id) => db.one('SELECT * FROM users WHERE id = $1', [id]);
const setLang = (id, lang) => db.one('UPDATE users SET lang = $2 WHERE id = $1 RETURNING *', [id, lang]);
const setPhone = (id, phone) => db.one('UPDATE users SET phone = $2 WHERE id = $1 RETURNING *', [id, phone]);
const setAdmin = (id, v = true) => db.one('UPDATE users SET is_admin = $2 WHERE id = $1 RETURNING *', [id, v]);
const markBlocked = (id) => db.query('UPDATE users SET bot_blocked = true WHERE id = $1', [id]);

const admins = () =>
  db.many('SELECT * FROM users WHERE is_admin = true OR id = ANY($1::bigint[])', [config.admin.ids]);

async function list({ q = '', limit = 50, offset = 0 } = {}) {
  const like = `%${q}%`;
  const rows = await db.many(
    `SELECT u.*, COALESCE(o.cnt, 0)::int AS orders_count, COALESCE(o.sum, 0)::int AS orders_sum
       FROM users u
       LEFT JOIN (SELECT user_id, COUNT(*) cnt, SUM(total) FILTER (WHERE status <> 'cancelled') sum
                    FROM orders GROUP BY user_id) o ON o.user_id = u.id
      WHERE ($1 = '' OR u.first_name ILIKE $2 OR u.username ILIKE $2 OR u.phone ILIKE $2 OR u.id::text = $1)
      ORDER BY u.last_seen DESC LIMIT $3 OFFSET $4`,
    [q, like, limit, offset]
  );
  const { count } = await db.one('SELECT COUNT(*)::int AS count FROM users');
  return { rows, total: count };
}

// Mehmonlarga (id < 0) Telegram xabar yuborib bo'lmaydi
const broadcastTargets = () => db.many('SELECT id, lang FROM users WHERE bot_blocked = false AND id > 0 ORDER BY id');

module.exports = { upsertFromTelegram, isGuest, findGuest, saveGuest, get, setLang, setPhone, setAdmin, markBlocked, admins, list, broadcastTargets };
