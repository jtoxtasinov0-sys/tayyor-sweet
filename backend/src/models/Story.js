// Storylar va karusel bannerlari
const db = require('../database/connection');

const storyParams = (d) => [
  d.title || null, d.text || null, d.image_id || null, d.product_id || null, d.active !== false, Number(d.sort) || 0,
];

const stories = {
  list: (all = false) =>
    db.many(
      `SELECT s.*, COALESCE(s.image_id, p.image_id) AS cover_id, p.name_uz AS product_name,
              p.frame AS product_frame, p.price AS product_price
         FROM stories s LEFT JOIN products p ON p.id = s.product_id
        ${all ? '' : 'WHERE s.active'} ORDER BY s.sort, s.id DESC`
    ),
  create: (d) =>
    db.one(
      'INSERT INTO stories (title, text, image_id, product_id, active, sort) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      storyParams(d)
    ),
  update: (id, d) =>
    db.one(
      `UPDATE stories SET title=$2, text=$3, image_id=$4, product_id=$5, active=$6, sort=$7 WHERE id=$1 RETURNING *`,
      [id, ...storyParams(d)]
    ),
  remove: (id) => db.query('DELETE FROM stories WHERE id = $1', [id]),
};

const bannerParams = (d) => [
  d.title || null, d.subtitle || null, d.image_id || null, d.product_id || null, d.category_id || null,
  d.active !== false, Number(d.sort) || 0,
];

const banners = {
  list: (all = false) =>
    db.many(
      `SELECT b.*, COALESCE(b.image_id, p.image_id) AS cover_id FROM banners b
         LEFT JOIN products p ON p.id = b.product_id
        ${all ? '' : 'WHERE b.active'} ORDER BY b.sort, b.id`
    ),
  create: (d) =>
    db.one(
      `INSERT INTO banners (title, subtitle, image_id, product_id, category_id, active, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      bannerParams(d)
    ),
  update: (id, d) =>
    db.one(
      `UPDATE banners SET title=$2, subtitle=$3, image_id=$4, product_id=$5, category_id=$6, active=$7, sort=$8
        WHERE id = $1 RETURNING *`,
      [id, ...bannerParams(d)]
    ),
  remove: (id) => db.query('DELETE FROM banners WHERE id = $1', [id]),
};

module.exports = { stories, banners };
