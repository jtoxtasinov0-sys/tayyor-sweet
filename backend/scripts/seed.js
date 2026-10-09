// Bazani tayyorlash va rasmlar/ papkasidan 24 ta mahsulotni yuklash:  npm run seed
const { migrate } = require('../src/database/migrate');
const { importFolder } = require('../src/controllers/importController');
const { stories, banners } = require('../src/models/Story');
const Product = require('../src/models/Product');
const db = require('../src/database/connection');

(async () => {
  await migrate();
  const res = await importFolder();
  console.log(`✅ ${res.created.length} ta mahsulot qo'shildi, ${res.skipped.length} ta oldin bor edi`);

  // Boshlang'ich story va bannerlar (faqat bo'sh bo'lsa)
  const products = await Product.list(true);
  const byName = (n) => products.find((p) => p.name_uz === n);
  if (!(await stories.list(true)).length) {
    for (const n of ['Rafaello torti', 'Medovik', 'Sinnabon', 'Manti', 'San-Sebastyan tort']) {
      const p = byName(n);
      if (p) await stories.create({ title: p.name_uz, text: p.description_uz || p.unit_uz, product_id: p.id, image_id: p.image_id });
    }
    console.log('✅ Storylar qo‘shildi');
  }
  if (!(await banners.list(true)).length) {
    const items = [
      ['Kiyevskiy tort', 'Tortlar 2–3 kun oldin', 'Bayramingiz uchun buyurtma bering 🎂'],
      ['Chuchvara', 'Yarim tayyor mahsulotlar', 'Uydagidek mazali — 택배 orqali 🚚'],
      ['Paxlava', 'Shirinliklar', 'Choy uchun eng yaxshi hamroh ☕️'],
    ];
    for (const [n, title, subtitle] of items) {
      const p = byName(n);
      if (p) await banners.create({ title, subtitle, product_id: p.id });
    }
    console.log('✅ Bannerlar qo‘shildi');
  }
  await db.pool.end();
})().catch(async (e) => {
  console.error('❌', e.message);
  await db.pool.end();
  process.exit(1);
});
