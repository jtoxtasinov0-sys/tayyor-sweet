// Savat → buyurtma: narxlarni serverda qayta hisoblash, chek yuklash, buyurtmalar tarixi
const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const Image = require('../models/Image');
const notify = require('./notifyController');
const cache = require('../utils/cache');
const { trackingUrl, COURIERS } = require('../utils/format');
const logger = require('../utils/logger');

const METHODS = ['taekbae', 'bus', 'pickup'];

function withTracking(o) {
  return {
    ...o,
    tracking_url: trackingUrl(o.courier, o.tracking_number),
    courier_name: COURIERS[o.courier]?.name || null,
  };
}

async function quote(rawItems, method) {
  const items = (Array.isArray(rawItems) ? rawItems : []).slice(0, 50);
  const ids = [...new Set(items.map((i) => Number(i.product_id)).filter(Boolean))];
  if (!ids.length) throw Object.assign(new Error('Savat bo‘sh'), { status: 400 });
  const products = new Map((await Product.getMany(ids)).map((p) => [p.id, p]));
  const lines = [];
  for (const i of items) {
    const p = products.get(Number(i.product_id));
    const qty = Math.min(Math.max(parseInt(i.qty, 10) || 0, 0), 99);
    if (!p || !p.active || !qty) continue;
    if (!p.in_stock) throw Object.assign(new Error(`${p.name_uz} hozir mavjud emas`), { status: 409 });
    const variant = (p.variants || []).find((v) => v.name === i.variant);
    const color = (p.colors || []).find((c) => c.name === i.color);
    lines.push({
      product_id: p.id,
      name: p.name_uz,
      variant: variant?.name || null,
      color: color?.name || null,
      unit: p.unit_uz || null,
      price: Number(variant?.price || p.price),
      qty,
      image_id: p.image_id,
    });
  }
  if (!lines.length) throw Object.assign(new Error('Savat bo‘sh'), { status: 400 });
  const delivery = await Setting.get('delivery');
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let fee = Number(delivery[`${method}_fee`] || 0);
  if (method === 'taekbae' && delivery.free_from && subtotal >= Number(delivery.free_from)) fee = 0;
  return { items: lines, subtotal, delivery_fee: fee, total: subtotal + fee, min_order: Number(delivery.min_order || 0) };
}

async function create(req, res) {
  const b = req.body || {};
  const method = METHODS.includes(b.delivery_method) ? b.delivery_method : null;
  if (!method) return res.status(400).json({ error: 'Yetkazish usulini tanlang' });
  const name = String(b.customer_name || '').trim().slice(0, 100);
  const phone = String(b.phone || req.user.phone || '').trim().slice(0, 32);
  if (!name || !phone) return res.status(400).json({ error: 'Ism va telefon kerak' });
  if (method === 'taekbae' && !String(b.address || '').trim()) return res.status(400).json({ error: 'Manzilni kiriting' });

  const q = await quote(b.items, method);
  if (q.min_order && q.subtotal < q.min_order) return res.status(400).json({ error: 'Minimal buyurtma summasidan kam' });

  const desired = /^\d{4}-\d{2}-\d{2}$/.test(b.desired_date || '') ? b.desired_date : null;
  const order = await Order.create({
    user_id: req.user.id,
    ...q,
    delivery_method: method,
    customer_name: name,
    phone,
    address: String(b.address || '').trim().slice(0, 300),
    postal_code: String(b.postal_code || '').trim().slice(0, 12),
    desired_date: desired,
    comment: String(b.comment || '').trim().slice(0, 500),
  });
  cache.clear();
  notify.newOrder({ ...order, username: req.user.username }).catch((e) => logger.warn('notify:', e.message));
  res.status(201).json(withTracking(order));
}

async function preview(req, res) {
  const b = req.body || {};
  res.json(await quote(b.items, METHODS.includes(b.delivery_method) ? b.delivery_method : 'taekbae'));
}

async function mine(req, res) {
  res.json((await Order.byUser(req.user.id)).map(withTracking));
}

async function one(req, res) {
  const o = await Order.get(Number(req.params.id));
  if (!o || String(o.user_id) !== String(req.user.id)) return res.status(404).json({ error: 'not_found' });
  res.json(withTracking(o));
}

async function receipt(req, res) {
  const o = await Order.get(Number(req.params.id));
  if (!o || String(o.user_id) !== String(req.user.id)) return res.status(404).json({ error: 'not_found' });
  if (!['pending_payment', 'receipt_sent'].includes(o.status)) return res.status(409).json({ error: 'Buyurtma allaqachon tasdiqlangan' });
  if (!req.file) return res.status(400).json({ error: 'Rasm yuklang' });
  const imageId = await Image.create(req.file.buffer, req.file.mimetype);
  await Order.setReceipt(o.id, imageId);
  const updated = await Order.setStatus(o.id, 'receipt_sent');
  cache.clear();
  notify
    .receiptUploaded({ ...updated, username: req.user.username }, { data: req.file.buffer })
    .catch((e) => logger.warn('notify:', e.message));
  res.json(withTracking(updated));
}

module.exports = { create, preview, mine, one, receipt, withTracking };
