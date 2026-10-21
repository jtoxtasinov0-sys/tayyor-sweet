// Ombor: qoldiqlar, kirim/chiqim tarixi, buyurtma bilan bog'liq harakatlar
const db = require('../database/connection');

const fail = (status, message) => Object.assign(new Error(message), { status });

const list = () =>
  db.many(
    `SELECT p.id, p.name_uz, p.unit_uz, p.image_id, p.frame, p.price, p.stock, p.stock_min, p.in_stock, p.active,
            c.name_uz AS category_name,
            (SELECT MAX(m.created_at) FROM stock_moves m WHERE m.product_id = p.id) AS last_move_at
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.sort, p.id`
  );

const stats = () =>
  db.one(`
    SELECT
      COUNT(*) FILTER (WHERE stock IS NOT NULL)::int AS tracked,
      COUNT(*) FILTER (WHERE stock IS NOT NULL AND stock <= 0)::int AS empty,
      COUNT(*) FILTER (WHERE stock > 0 AND stock <= stock_min)::int AS low,
      COALESCE(SUM(stock) FILTER (WHERE stock > 0), 0)::int AS units,
      (SELECT COALESCE(SUM(delta) FILTER (WHERE delta > 0), 0)::int
         FROM stock_moves WHERE created_at >= date_trunc('day', now())) AS in_today,
      (SELECT COALESCE(-SUM(delta) FILTER (WHERE delta < 0), 0)::int
         FROM stock_moves WHERE created_at >= date_trunc('day', now())) AS out_today
    FROM products WHERE active`);

const moves = ({ productId = null, limit = 50 } = {}) =>
  db.many(
    `SELECT m.*, p.name_uz AS product_name, o.number AS order_number
       FROM stock_moves m JOIN products p ON p.id = m.product_id
       LEFT JOIN orders o ON o.id = m.order_id
      WHERE ($1::int IS NULL OR m.product_id = $1)
      ORDER BY m.id DESC LIMIT $2`,
    [productId, limit]
  );

// Qoldiqni o'zgartirib tarixga yozadi (tranzaksiya ichida). Hisob yuritilmasa — null.
// "Mavjud" belgisi qoldiqqa qarab o'zi yangilanadi (SET ichida stock — eski qiymat)
async function apply(c, productId, delta, reason, { orderId = null, note = null } = {}) {
  const { rows } = await c.query(
    `UPDATE products SET stock = stock + $2, in_stock = stock + $2 > 0
      WHERE id = $1 AND stock IS NOT NULL RETURNING id, name_uz, stock, stock_min`,
    [productId, delta]
  );
  const p = rows[0];
  if (!p) return null;
  await c.query(
    'INSERT INTO stock_moves (product_id, delta, balance, reason, order_id, note) VALUES ($1, $2, $3, $4, $5, $6)',
    [productId, delta, p.stock, reason, orderId, note]
  );
  return p;
}

const productRow = (c, id) => c.query('SELECT * FROM products WHERE id = $1', [id]).then((r) => r.rows[0]);

// Admin: kirim (in), chiqim (out) yoki sanoq (set — aniq qoldiqni yozish). Birinchi kirim/sanoq hisobni boshlaydi
async function move(productId, type, rawQty, note = null) {
  const qty = Math.trunc(Number(rawQty));
  if (!['in', 'out', 'set'].includes(type)) throw fail(400, "Noto'g'ri amal");
  if (!Number.isFinite(qty) || qty < 0 || (type !== 'set' && qty === 0)) throw fail(400, 'Miqdorni kiriting');
  if (qty > 1_000_000) throw fail(400, 'Juda katta son');
  return db.tx(async (c) => {
    const { rows } = await c.query('SELECT id, stock FROM products WHERE id = $1 FOR UPDATE', [productId]);
    const p = rows[0];
    if (!p) throw fail(404, 'Mahsulot topilmadi');
    if (p.stock === null) {
      if (type === 'out') throw fail(400, 'Bu mahsulot uchun ombor hisobi yuritilmaydi');
      await c.query('UPDATE products SET stock = 0 WHERE id = $1', [productId]);
      p.stock = 0;
    }
    if (type === 'out' && qty > p.stock) throw fail(400, `Omborda faqat ${p.stock} ta bor`);
    const delta = type === 'in' ? qty : type === 'out' ? -qty : qty - p.stock;
    await apply(c, productId, delta, type === 'set' ? 'adjust' : type, { note });
    return productRow(c, productId);
  });
}

// "Kam qoldi" chegarasi va hisobni to'xtatish (tracked: false — qoldiq o'chadi, mahsulot "mavjud" bo'ladi)
async function configure(productId, { tracked, stock_min }) {
  const sets = [];
  const params = [productId];
  if (stock_min !== undefined) {
    params.push(Math.max(0, Math.trunc(Number(stock_min)) || 0));
    sets.push(`stock_min = $${params.length}`);
  }
  if (tracked === false) sets.push('stock = NULL', 'in_stock = true');
  if (!sets.length) return db.one('SELECT * FROM products WHERE id = $1', [productId]);
  return db.one(`UPDATE products SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, params);
}

const qtyByProduct = (items) => {
  const m = new Map();
  for (const i of items || []) m.set(Number(i.product_id), (m.get(Number(i.product_id)) || 0) + Number(i.qty));
  return m;
};

// Yangi buyurtma: hisobdagi mahsulotlar qoldig'idan ayiriladi. Yetmasa — xato va buyurtma yaratilmaydi.
// Qaytaradi: qoldig'i chegaradan tushgan mahsulotlar (adminga ogohlantirish uchun)
async function reserve(c, order) {
  const low = [];
  for (const [productId, qty] of qtyByProduct(order.items)) {
    const p = await apply(c, productId, -qty, 'order', { orderId: order.id });
    if (!p) continue;
    if (p.stock < 0) throw fail(409, `${p.name_uz}: omborda faqat ${p.stock + qty} ta qoldi`);
    if (p.stock <= p.stock_min) low.push(p);
  }
  return low;
}

// Holat o'zgargach: bekor qilinsa — qoldiq qaytadi, bekordan qaytarilsa — yana ayiriladi (takror chaqirish xavfsiz)
async function syncOrder(order) {
  return db.tx(async (c) => {
    await c.query('SELECT id FROM orders WHERE id = $1 FOR UPDATE', [order.id]);
    const { rows } = await c.query(
      `SELECT product_id, SUM(delta)::int AS net, BOOL_OR(reason = 'order') AS reserved
         FROM stock_moves WHERE order_id = $1 GROUP BY product_id`,
      [order.id]
    );
    const qty = qtyByProduct(order.items);
    for (const r of rows) {
      if (order.status === 'cancelled' && r.net < 0) {
        await apply(c, r.product_id, -r.net, 'cancel', { orderId: order.id });
      } else if (order.status !== 'cancelled' && r.net === 0 && r.reserved && qty.get(r.product_id)) {
        await apply(c, r.product_id, -qty.get(r.product_id), 'order', { orderId: order.id });
      }
    }
  });
}

module.exports = { list, stats, moves, move, configure, reserve, syncOrder };
