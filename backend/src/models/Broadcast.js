// Rassilkalar tarixi
const db = require('../database/connection');

const create = (d) =>
  db.one('INSERT INTO broadcasts (text, image_id, button, total) VALUES ($1,$2,$3,$4) RETURNING *', [
    d.text, d.image_id || null, d.button || null, d.total || 0,
  ]);

const get = (id) => db.one('SELECT * FROM broadcasts WHERE id = $1', [id]);

// O'chirish boshlangan bo'lsa, yuborish sikli holatni qaytarib "running"/"done" qilib qo'ymasin
const progress = (id, sent, failed, status = 'running') =>
  db.query(
    `UPDATE broadcasts SET sent = $2, failed = $3,
            status = CASE WHEN status IN ('deleting', 'deleted') THEN status ELSE $4 END
      WHERE id = $1`,
    [id, sent, failed, status]
  );

const setStatus = (id, status) => db.query('UPDATE broadcasts SET status = $2 WHERE id = $1', [id, status]);

const deleteProgress = (id, deleted, status = 'deleting') =>
  db.query('UPDATE broadcasts SET deleted = $2, status = $3 WHERE id = $1', [id, deleted, status]);

// stored — hali o'chirilmagan, yuborilgan xabarlar soni
const list = () =>
  db.many(
    `SELECT b.*, (SELECT COUNT(*) FROM broadcast_messages m WHERE m.broadcast_id = b.id)::int AS stored
       FROM broadcasts b ORDER BY b.id DESC LIMIT 20`
  );

// Yuborilgan har bir xabar (o'chirish uchun)
const addMessage = (id, chatId, messageId) =>
  db.query('INSERT INTO broadcast_messages (broadcast_id, chat_id, message_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [
    id, chatId, messageId,
  ]);

const messages = (id) => db.many('SELECT chat_id, message_id FROM broadcast_messages WHERE broadcast_id = $1', [id]);

const dropMessage = (id, chatId) =>
  db.query('DELETE FROM broadcast_messages WHERE broadcast_id = $1 AND chat_id = $2', [id, chatId]);

module.exports = { create, get, progress, setStatus, deleteProgress, list, addMessage, messages, dropMessage };
