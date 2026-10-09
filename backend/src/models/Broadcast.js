// Rassilkalar tarixi
const db = require('../database/connection');

const create = (d) =>
  db.one('INSERT INTO broadcasts (text, image_id, button, total) VALUES ($1,$2,$3,$4) RETURNING *', [
    d.text, d.image_id || null, d.button || null, d.total || 0,
  ]);

const progress = (id, sent, failed, status = 'running') =>
  db.query('UPDATE broadcasts SET sent = $2, failed = $3, status = $4 WHERE id = $1', [id, sent, failed, status]);

const list = () => db.many('SELECT * FROM broadcasts ORDER BY id DESC LIMIT 20');

module.exports = { create, progress, list };
