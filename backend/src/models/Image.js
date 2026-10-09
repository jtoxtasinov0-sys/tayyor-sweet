// Rasmlar bazada (BYTEA) saqlanadi — Render diskiga bog'liq emas
const db = require('../database/connection');

async function create(buffer, mime, source = null) {
  const row = await db.one('INSERT INTO images (mime, data, source) VALUES ($1, $2, $3) RETURNING id', [
    mime || 'image/jpeg',
    buffer,
    source,
  ]);
  return row.id;
}

const get = (id) => db.one('SELECT id, mime, data FROM images WHERE id = $1', [id]);

module.exports = { create, get };
