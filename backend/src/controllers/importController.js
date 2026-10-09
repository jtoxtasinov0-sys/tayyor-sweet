// Papkadagi rasmlardan mahsulot yuklash (rasmlar/NN_nomi.jpg)
const fs = require('fs');
const path = require('path');
const config = require('../config/default');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Image = require('../models/Image');
const seed = require('../database/seed-data');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// "07_san_sebastyan_bolak.jpg" -> "San sebastyan bolak"
function nameFromFile(file) {
  const base = path.basename(file, path.extname(file)).replace(/^\d+[_-]?/, '').replace(/[_-]+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

async function importFolder(dir = config.rasmlarDir) {
  if (!fs.existsSync(dir)) throw Object.assign(new Error(`Papka topilmadi: ${dir}`), { status: 404 });
  const files = fs
    .readdirSync(dir)
    .filter((f) => MIME[path.extname(f).toLowerCase()] && !/logo/i.test(f))
    .sort();

  const catIds = {};
  for (const c of seed.categories) {
    catIds[c.key] = (await Category.findOrCreate(c.name_uz, { name_ru: c.name_ru, emoji: c.emoji, sort: c.sort })).id;
  }

  const result = { created: [], skipped: [] };
  for (const [index, file] of files.entries()) {
    const source = `rasmlar/${file}`;
    if (await Product.bySource(source)) {
      result.skipped.push(file);
      continue;
    }
    const buf = fs.readFileSync(path.join(dir, file));
    const imageId = await Image.create(buf, MIME[path.extname(file).toLowerCase()], source);
    const known = seed.products.find((p) => p.file === file);
    const data = known
      ? {
          ...known,
          category_id: catIds[known.cat] || null,
          preorder_days: known.cat === 'Tortlar' ? 2 : 0,
        }
      : {
          // Yangi rasm: qoralama sifatida qo'shiladi, admin narxini kiritib faollashtiradi
          name_uz: nameFromFile(file),
          price: 0,
          active: false,
        };
    delete data.file;
    delete data.cat;
    const p = await Product.create({ ...data, image_id: imageId, source, sort: index + 1 });
    result.created.push({ id: p.id, name: p.name_uz, active: p.active });
  }
  cache.clear();
  logger.info(`Import: ${result.created.length} ta yangi, ${result.skipped.length} ta bor edi`);
  return result;
}

module.exports = { importFolder, nameFromFile };
