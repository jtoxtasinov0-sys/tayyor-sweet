// Kategoriyalar
const db = require('../database/connection');

const list = (all = false) =>
  db.many(
    `SELECT c.*, (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id) AS products_count
       FROM categories c ${all ? '' : 'WHERE c.active'} ORDER BY c.sort, c.id`
  );

const create = (d) =>
  db.one(
    'INSERT INTO categories (name_uz, name_ru, emoji, sort, active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [d.name_uz, d.name_ru || null, d.emoji || null, d.sort || 0, d.active !== false]
  );

const update = (id, d) =>
  db.one(
    `UPDATE categories SET name_uz = COALESCE($2, name_uz), name_ru = COALESCE($3, name_ru),
       emoji = COALESCE($4, emoji), sort = COALESCE($5, sort), active = COALESCE($6, active)
     WHERE id = $1 RETURNING *`,
    [id, d.name_uz ?? null, d.name_ru ?? null, d.emoji ?? null, d.sort ?? null, d.active ?? null]
  );

const remove = (id) => db.query('DELETE FROM categories WHERE id = $1', [id]);

async function findOrCreate(name_uz, extra = {}) {
  const hit = await db.one('SELECT * FROM categories WHERE lower(name_uz) = lower($1)', [name_uz]);
  return hit || create({ name_uz, ...extra });
}

module.exports = { list, create, update, remove, findOrCreate };
