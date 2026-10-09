// Mijoz API: do'kon ma'lumotlari (keshlanadi), rasmlar, profil
const Product = require('../models/Product');
const Category = require('../models/Category');
const Setting = require('../models/Setting');
const Image = require('../models/Image');
const User = require('../models/User');
const { stories, banners } = require('../models/Story');
const cache = require('../utils/cache');
const config = require('../config/default');

const publicProduct = ({ source, created_at, ...p }) => p;

async function bootstrap(req, res) {
  const data = await cache.wrap('bootstrap', 30_000, async () => {
    const [settings, categories, products, storyList, bannerList] = await Promise.all([
      Setting.all(),
      Category.list(),
      Product.list(),
      stories.list(),
      banners.list(),
    ]);
    return {
      shop: { ...settings.shop, owner_link: settings.shop?.owner_link || config.ownerLink, bot_username: config.bot.username },
      payment: settings.payment,
      delivery: settings.delivery,
      app: settings.app,
      categories,
      products: products.map(publicProduct),
      stories: storyList,
      banners: bannerList,
    };
  });
  res.set('Cache-Control', 'no-store').json(data);
}

async function me(req, res) {
  const u = req.user;
  res.json({
    id: u.id, first_name: u.first_name, last_name: u.last_name, username: u.username,
    phone: u.phone, lang: u.lang, is_admin: u.is_admin, created_at: u.created_at,
  });
}

async function updateMe(req, res) {
  const { lang, phone } = req.body || {};
  let u = req.user;
  // Mehmon hali bazada bo'lmasa UPDATE hech narsa qaytarmaydi — joriy qiymat qoladi
  if (lang === 'uz' || lang === 'ru') u = (await User.setLang(u.id, lang)) || u;
  if (typeof phone === 'string' && phone.trim()) u = (await User.setPhone(u.id, phone.trim().slice(0, 32))) || u;
  req.user = u;
  return me(req, res);
}

async function image(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).end();
  const etag = `"img-${id}"`;
  if (req.get('if-none-match') === etag) return res.status(304).end();
  const img = await cache.wrap(`img:${id}`, 10 * 60_000, () => Image.get(id));
  if (!img) return res.status(404).end();
  res.set({
    'Content-Type': img.mime,
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: etag,
  });
  res.send(img.data);
}

module.exports = { bootstrap, me, updateMe, image };
