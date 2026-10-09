// HTTP API yo'llari: mijoz (/api/...) va admin (/api/admin/...)
const express = require('express');
const multer = require('multer');
const { requireTelegramUser } = require('../middlewares/auth.middleware');
const { login, requireAdmin } = require('../middlewares/admin.middleware');
const shop = require('../controllers/shopController');
const cart = require('../controllers/cartController');
const admin = require('../controllers/adminController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

// Express 5 async xatolarni o'zi ushlaydi
const api = express.Router();

api.get('/health', (req, res) => res.json({ ok: true }));
api.get('/images/:id', shop.image);
api.get('/bootstrap', shop.bootstrap);

api.get('/me', requireTelegramUser, shop.me);
api.patch('/me', requireTelegramUser, shop.updateMe);
api.post('/orders/preview', requireTelegramUser, cart.preview);
api.post('/orders', requireTelegramUser, cart.create);
api.get('/orders', requireTelegramUser, cart.mine);
api.get('/orders/:id', requireTelegramUser, cart.one);
api.post('/orders/:id/receipt', requireTelegramUser, upload.single('receipt'), cart.receipt);

// --- Admin ---
const a = express.Router();
a.post('/login', login);
a.use(requireAdmin);
a.get('/me', (req, res) => res.json({ ok: true, sub: req.admin.sub }));
a.get('/dashboard', admin.dashboard);

a.get('/orders', admin.orders);
a.get('/orders/:id', admin.order);
a.patch('/orders/:id', admin.updateOrder);

a.get('/products', admin.products);
a.post('/products', admin.createProduct);
a.patch('/products/:id', admin.updateProduct);
a.delete('/products/:id', admin.deleteProduct);
a.post('/products/:id/story', admin.storyFromProduct);
a.post('/import-folder', admin.runImport);
a.get('/price-list', admin.priceList);

a.get('/categories', admin.categories);
a.post('/categories', admin.createCategory);
a.patch('/categories/:id', admin.updateCategory);
a.delete('/categories/:id', admin.deleteCategory);

a.get('/stories', admin.listStories);
a.post('/stories', admin.createStory);
a.patch('/stories/:id', admin.updateStory);
a.delete('/stories/:id', admin.deleteStory);

a.get('/banners', admin.listBanners);
a.post('/banners', admin.createBanner);
a.patch('/banners/:id', admin.updateBanner);
a.delete('/banners/:id', admin.deleteBanner);

a.get('/users', admin.users);
a.patch('/users/:id', admin.setUserAdmin);
a.post('/broadcast', admin.broadcast);
a.get('/broadcasts', admin.broadcasts);

a.get('/settings', admin.settings);
a.put('/settings', admin.updateSettings);
a.post('/upload', upload.single('image'), admin.upload);

api.use('/admin', a);

module.exports = api;
