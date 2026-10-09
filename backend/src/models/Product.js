// Mahsulotlar
const db = require('../database/connection');

const FIELDS = [
  'category_id', 'name_uz', 'name_ru', 'description_uz', 'description_ru', 'unit_uz', 'unit_ru',
  'price', 'old_price', 'image_id', 'gallery', 'frame', 'variants', 'colors', 'size_table',
  'badge', 'preorder_days', 'in_stock', 'active', 'sort', 'source',
];
const JSON_FIELDS = new Set(['frame', 'variants', 'colors', 'size_table']);

function pick(d) {
  const out = {};
  for (const f of FIELDS) {
    if (d[f] === undefined) continue;
    out[f] = JSON_FIELDS.has(f) ? JSON.stringify(d[f] ?? (f === 'frame' ? {} : [])) : d[f];
  }
  return out;
}

const list = (all = false) =>
  db.many(
    `SELECT p.*, c.name_uz AS category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      ${all ? '' : 'WHERE p.active'} ORDER BY p.sort, p.id`
  );

const get = (id) => db.one('SELECT * FROM products WHERE id = $1', [id]);
const getMany = (ids) => db.many('SELECT * FROM products WHERE id = ANY($1::int[])', [ids]);

async function create(d) {
  const data = pick(d);
  const keys = Object.keys(data);
  return db.one(
    `INSERT INTO products (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`,
    Object.values(data)
  );
}

async function update(id, d) {
  const data = pick(d);
  const keys = Object.keys(data);
  if (!keys.length) return get(id);
  const set = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  return db.one(`UPDATE products SET ${set} WHERE id = $1 RETURNING *`, [id, ...Object.values(data)]);
}

const remove = (id) => db.query('DELETE FROM products WHERE id = $1', [id]);
const bySource = (source) => db.one('SELECT * FROM products WHERE source = $1', [source]);

module.exports = { list, get, getMany, create, update, remove, bySource };
