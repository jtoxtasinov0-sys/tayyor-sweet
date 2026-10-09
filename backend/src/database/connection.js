// PostgreSQL (Neon) ulanishi
const { Pool } = require('pg');
const config = require('../config/default');
const logger = require('../utils/logger');

if (!config.databaseUrl) {
  logger.error('DATABASE_URL topilmadi. backend/.env faylini to\'ldiring.');
}

const needsSsl = /neon\.tech|sslmode=require/.test(config.databaseUrl);

// SSL ni o'zimiz sozlaymiz — URL dagi sslmode/channel_binding pg ogohlantirishini chiqarmasin
function cleanUrl(raw) {
  try {
    const u = new URL(raw);
    u.searchParams.delete('sslmode');
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch {
    return raw;
  }
}

const pool = new Pool({
  connectionString: cleanUrl(config.databaseUrl),
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 8,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => logger.error('PG pool xatosi:', err.message));

const query = (text, params) => pool.query(text, params);

async function one(text, params) {
  const { rows } = await pool.query(text, params);
  return rows[0] || null;
}

async function many(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await fn(client);
    await client.query('COMMIT');
    return res;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, one, many, tx };
