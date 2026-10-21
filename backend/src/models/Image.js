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

// Papkadan yuklangan rasmlar: { id: "01_paxlava.jpg" }. Mini ilovada ular public/rasmlar/ da ham bor —
// brauzer ularni backenddan emas, Vercel CDN'dan oladi (backend uxlab qolsa ham rasmlar chiqadi)
async function folderFiles() {
  const rows = await db.many("SELECT id, source FROM images WHERE source LIKE 'rasmlar/%'");
  return Object.fromEntries(rows.map((r) => [r.id, r.source.slice('rasmlar/'.length)]));
}

module.exports = { create, get, folderFiles };
