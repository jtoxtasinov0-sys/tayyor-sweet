// Buyurtmalar
const db = require('../database/connection');
const { orderNumber } = require('../utils/format');

async function create(d) {
  // Raqam takrorlanib qolsa, qayta urinamiz
  for (let i = 0; i < 5; i++) {
    try {
      return await db.one(
        `INSERT INTO orders (number, user_id, items, subtotal, delivery_fee, total, delivery_method,
           customer_name, phone, address, postal_code, desired_date, comment, history)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          orderNumber(), d.user_id, JSON.stringify(d.items), d.subtotal, d.delivery_fee, d.total,
          d.delivery_method, d.customer_name, d.phone, d.address || null, d.postal_code || null,
          d.desired_date || null, d.comment || null,
          JSON.stringify([{ status: 'pending_payment', at: new Date().toISOString() }]),
        ]
      );
    } catch (e) {
      if (e.code !== '23505') throw e;
    }
  }
  throw new Error('Buyurtma raqamini yaratib bo‘lmadi');
}

const get = (id) => db.one('SELECT * FROM orders WHERE id = $1', [id]);

const getWithUser = (id) =>
  db.one(
    `SELECT o.*, u.username, u.lang FROM orders o
       LEFT JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
    [id]
  );

const byUser = (userId, limit = 50) =>
  db.many('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [userId, limit]);

async function list({ status = '', q = '', limit = 50, offset = 0 } = {}) {
  const like = `%${q}%`;
  const where = `($1 = '' OR o.status = $1) AND ($2 = '' OR o.number ILIKE $3 OR o.customer_name ILIKE $3 OR o.phone ILIKE $3)`;
  const rows = await db.many(
    `SELECT o.*, u.username FROM orders o LEFT JOIN users u ON u.id = o.user_id
      WHERE ${where} ORDER BY o.created_at DESC LIMIT $4 OFFSET $5`,
    [status, q, like, limit, offset]
  );
  const { count } = await db.one(`SELECT COUNT(*)::int AS count FROM orders o WHERE ${where}`, [status, q, like]);
  return { rows, total: count };
}

const setStatus = (id, status, extra = {}) =>
  db.one(
    `UPDATE orders SET status = $2::text,
       courier = COALESCE($3, courier), tracking_number = COALESCE($4, tracking_number),
       admin_note = COALESCE($5, admin_note), updated_at = now(),
       history = CASE WHEN status = $2::text THEN history
                      ELSE history || jsonb_build_array(jsonb_build_object('status', $2::text, 'at', now())) END
     WHERE id = $1 RETURNING *`,
    [id, status, extra.courier || null, extra.tracking_number || null, extra.admin_note ?? null]
  );

const setReceipt = (id, imageId) =>
  db.one('UPDATE orders SET receipt_image_id = $2, updated_at = now() WHERE id = $1 RETURNING *', [id, imageId]);

const stats = () =>
  db.one(`
    SELECT
      COUNT(*)::int AS orders_total,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS orders_today,
      COUNT(*) FILTER (WHERE status = 'pending_payment')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'receipt_sent')::int AS receipts,
      COUNT(*) FILTER (WHERE status = 'confirmed')::int AS to_ship,
      COALESCE(SUM(total) FILTER (WHERE status IN ('confirmed','shipped','delivered')), 0)::int AS revenue,
      COALESCE(SUM(total) FILTER (WHERE status IN ('confirmed','shipped','delivered')
                                  AND created_at >= date_trunc('month', now())), 0)::int AS revenue_month,
      (SELECT COUNT(*)::int FROM users) AS users_total,
      (SELECT COUNT(*)::int FROM users WHERE created_at >= now() - interval '7 days') AS users_week
    FROM orders`);

const daily = (days = 14) =>
  db.many(
    `SELECT to_char(d, 'MM-DD') AS day,
            COUNT(o.id)::int AS orders,
            COALESCE(SUM(o.total) FILTER (WHERE o.status IN ('confirmed','shipped','delivered')), 0)::int AS revenue
       FROM generate_series(date_trunc('day', now()) - ($1::int - 1) * interval '1 day',
                            date_trunc('day', now()), interval '1 day') d
       LEFT JOIN orders o ON date_trunc('day', o.created_at) = d
      GROUP BY d ORDER BY d`,
    [days]
  );

const topProducts = (limit = 5) =>
  db.many(
    `SELECT (i->>'name') AS name, SUM((i->>'qty')::int)::int AS qty,
            SUM((i->>'price')::int * (i->>'qty')::int)::int AS sum
       FROM orders, jsonb_array_elements(items) i
      WHERE status <> 'cancelled' GROUP BY 1 ORDER BY qty DESC LIMIT $1`,
    [limit]
  );

module.exports = { create, get, getWithUser, byUser, list, setStatus, setReceipt, stats, daily, topProducts };
