// Sozlamalar (kalit → JSON)
const db = require('../database/connection');
const cache = require('../utils/cache');

async function all() {
  return cache.wrap('settings', 60_000, async () => {
    const rows = await db.many('SELECT key, value FROM settings');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  });
}

async function get(key) {
  return (await all())[key] || {};
}

async function update(key, value) {
  await db.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = settings.value || $2::jsonb`,
    [key, JSON.stringify(value)]
  );
  cache.clear();
  return get(key);
}

module.exports = { all, get, update };
