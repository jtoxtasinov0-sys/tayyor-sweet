// Admin API: statistika, buyurtmalar, mahsulotlar, kategoriyalar, story/banner, mijozlar, rassilka, sozlamalar
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Setting = require('../models/Setting');
const Image = require('../models/Image');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');
const { stories, banners } = require('../models/Story');
const { STATUSES, COURIERS } = require('../utils/format');
const notify = require('./notifyController');
const { withTracking } = require('./cartController');
const { importFolder } = require('./importController');
const { buildPriceList } = require('./startController');
const cache = require('../utils/cache');

const changed = (res, data) => {
  cache.clear();
  res.json(data ?? { ok: true });
};
const num = (v) => (v === '' || v == null ? null : Number(v));

// 1. Dashboard
async function dashboard(req, res) {
  const [stats, daily, top, latest] = await Promise.all([
    Order.stats(),
    Order.daily(14),
    Order.topProducts(5),
    Order.list({ limit: 6 }),
  ]);
  res.json({ stats, daily, top, latest: latest.rows });
}

// 2. Buyurtmalar
async function orders(req, res) {
  const { status = '', q = '', page = 1 } = req.query;
  const limit = 30;
  const data = await Order.list({ status, q, limit, offset: (Number(page) - 1) * limit });
  res.json({ ...data, rows: data.rows.map(withTracking), couriers: COURIERS, statuses: STATUSES });
}

async function order(req, res) {
  const o = await Order.getWithUser(Number(req.params.id));
  if (!o) return res.status(404).json({ error: 'not_found' });
  res.json(withTracking(o));
}

async function updateOrder(req, res) {
  const id = Number(req.params.id);
  const before = await Order.get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  const { status = before.status, courier, tracking_number, admin_note, notify: doNotify = true } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'bad_status' });
  if (courier && !COURIERS[courier]) return res.status(400).json({ error: 'bad_courier' });
  const o = await Order.setStatus(id, status, { courier, tracking_number, admin_note });
  const trackingChanged = tracking_number && tracking_number !== before.tracking_number;
  if (doNotify && (status !== before.status || trackingChanged)) await notify.statusChanged(o);
  changed(res, withTracking(o));
}

// 3. Mahsulotlar
async function products(req, res) {
  res.json(await Product.list(true));
}

function productBody(b) {
  const out = { ...b };
  for (const k of ['price', 'old_price', 'category_id', 'image_id', 'preorder_days', 'sort']) {
    if (k in out) out[k] = num(out[k]);
  }
  if ('price' in out) out.price = out.price || 0;
  if ('preorder_days' in out) out.preorder_days = out.preorder_days || 0;
  if ('sort' in out) out.sort = out.sort || 0;
  if (Array.isArray(out.variants)) out.variants = out.variants.filter((v) => v.name).map((v) => ({ name: String(v.name), price: Number(v.price) || 0 }));
  if (Array.isArray(out.colors)) out.colors = out.colors.filter((c) => c.name).map((c) => ({ name: String(c.name), hex: String(c.hex || '#ffffff') }));
  if (out.frame) out.frame = { x: Number(out.frame.x) || 50, y: Number(out.frame.y) || 50, zoom: Number(out.frame.zoom) || 1 };
  delete out.id;
  delete out.source;
  delete out.created_at;
  delete out.category_name;
  return out;
}

async function createProduct(req, res) {
  if (!req.body?.name_uz) return res.status(400).json({ error: 'Nomini kiriting' });
  changed(res, await Product.create(productBody(req.body)));
}

async function updateProduct(req, res) {
  const p = await Product.update(Number(req.params.id), productBody(req.body || {}));
  if (!p) return res.status(404).json({ error: 'not_found' });
  changed(res, p);
}

async function deleteProduct(req, res) {
  await Product.remove(Number(req.params.id));
  changed(res);
}

async function runImport(req, res) {
  changed(res, await importFolder());
}

async function priceList(req, res) {
  res.json({ text: await buildPriceList('uz') });
}

// 4. Kategoriyalar
const categories = async (req, res) => res.json(await Category.list(true));
async function createCategory(req, res) {
  if (!req.body?.name_uz) return res.status(400).json({ error: 'Nomini kiriting' });
  changed(res, await Category.create(req.body));
}
const updateCategory = async (req, res) => changed(res, await Category.update(Number(req.params.id), req.body || {}));
async function deleteCategory(req, res) {
  await Category.remove(Number(req.params.id));
  changed(res);
}

// 5. Story va bannerlar
const listStories = async (req, res) => res.json(await stories.list(true));
const createStory = async (req, res) => changed(res, await stories.create(req.body || {}));
const updateStory = async (req, res) => changed(res, await stories.update(Number(req.params.id), req.body || {}));
async function deleteStory(req, res) {
  await stories.remove(Number(req.params.id));
  changed(res);
}
// Mahsulotdan bir bosishda story
async function storyFromProduct(req, res) {
  const p = await Product.get(Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'not_found' });
  changed(res, await stories.create({ title: p.name_uz, text: p.description_uz || p.unit_uz, product_id: p.id, image_id: p.image_id }));
}

const listBanners = async (req, res) => res.json(await banners.list(true));
const createBanner = async (req, res) => changed(res, await banners.create(req.body || {}));
const updateBanner = async (req, res) => changed(res, await banners.update(Number(req.params.id), req.body || {}));
async function deleteBanner(req, res) {
  await banners.remove(Number(req.params.id));
  changed(res);
}

// 6. Mijozlar va rassilka
async function users(req, res) {
  const { q = '', page = 1 } = req.query;
  const limit = 50;
  res.json(await User.list({ q, limit, offset: (Number(page) - 1) * limit }));
}

async function setUserAdmin(req, res) {
  res.json(await User.setAdmin(Number(req.params.id), !!req.body?.is_admin));
}

async function broadcast(req, res) {
  const { text, image_id, button } = req.body || {};
  if (!String(text || '').trim()) return res.status(400).json({ error: 'Matn kiriting' });
  res.json(await notify.runBroadcast({ text: String(text).slice(0, image_id ? 1024 : 4000), image_id: num(image_id), button }));
}

const broadcasts = async (req, res) => res.json(await Broadcast.list());

// 7. Sozlamalar
const settings = async (req, res) => res.json(await Setting.all());
async function updateSettings(req, res) {
  const body = req.body || {};
  for (const key of ['shop', 'payment', 'delivery', 'app']) {
    if (body[key] && typeof body[key] === 'object') await Setting.update(key, body[key]);
  }
  changed(res, await Setting.all());
}

// Rasm yuklash (admin)
async function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Rasm yuklang' });
  const id = await Image.create(req.file.buffer, req.file.mimetype);
  res.json({ id });
}

module.exports = {
  dashboard, orders, order, updateOrder,
  products, createProduct, updateProduct, deleteProduct, runImport, priceList,
  categories, createCategory, updateCategory, deleteCategory,
  listStories, createStory, updateStory, deleteStory, storyFromProduct,
  listBanners, createBanner, updateBanner, deleteBanner,
  users, setUserAdmin, broadcast, broadcasts,
  settings, updateSettings, upload,
};
