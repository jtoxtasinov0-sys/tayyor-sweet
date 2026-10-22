// "Admin panel qo'llanmasi" videosi uchun admin panel ekranlari (iPhone, bosh ekrandagi "Tayyor Admin" ilovasi).
// Har bir holat alohida qatlam: menyu tasmasi (butun eni), bo'lim sahifasi (butun bo'yi), drawer (sarlavha, tanasi, pastki
// tugmalari). Video ularni o'zi siljitadi, almashtiradi va ustidan barmoq, klaviatura, yozilayotgan matnni chizadi.
// Backend kerak emas: /api so'rovlariga namuna javob (bank rekvizitlari soxta va xiralashtirilgan).
// Ishlatish: mini ilova ishga tushgan bo'lsin (npx next start -p 3100), keyin: node shots-admin.mjs [http://localhost:3100]
import { chromium } from 'playwright';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { L } from './src/strings.js';

const base = process.argv[2] || 'http://localhost:3100';
const OUT = 'assets/shots/admin';
// iPhone 390×845 pt: tepada holat qatori (54) — ilova oynasi 390×791
const VW = 390, VH = 791, DSF = 2;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const A = L.admin;
const NOW = '2026-10-22T10:41:00+09:00';

await mkdir(OUT, { recursive: true });
const boot = JSON.parse(await readFile('../miniapp/src/lib/fallback-bootstrap.json', 'utf8'));
const FILES = boot.image_files;
const RECEIPT_ID = 900;

// ---------- Namuna ma'lumotlar ----------
// Yangi qo'shiladigan mahsulot (A.product) katalogda hali yo'q — u saqlangandan keyin ro'yxat boshida chiqadi
const NEW = boot.products.find((p) => p.name_uz === A.product.name);
let products = boot.products
  .filter((p) => p !== NEW)
  .map((p, i) => ({ ...p, stock: i % 4 === 0 ? null : [3, 2, 9, 15, 1, 4, 10, 13, 0, 5][i % 10], stock_min: 3, pickup_only: !!p.pickup_only }));
const cats = boot.categories.map((c) => ({ ...c, products_count: boot.products.filter((p) => p.category_id === c.id).length }));
const NAMES = ['Dilnoza', 'Aziz', 'Shahnoza', 'Jasur', 'Madina', 'Kamola', 'Bobur', 'Nilufar'];
const STATUSES = ['receipt_sent', 'pending_payment', 'confirmed', 'shipped', 'delivered', 'confirmed', 'delivered', 'cancelled'];
const item = (p, qty, variant = null) => ({ product_id: p.id, name: p.name_uz, variant, color: null, unit: p.unit_uz, price: p.price, qty, image_id: p.image_id });
const byName = (n) => boot.products.find((p) => p.name_uz === n);
let orders = STATUSES.map((status, i) => {
  const items = i === 0 ? [item(byName('Mevali tort'), 1, "O'rta (20 sm)"), item(byName('Sinnabon'), 2)] : [item(products[(i * 5) % products.length], 1 + (i % 3))];
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
  const method = ['taekbae', 'pickup', 'taekbae', 'bus'][i % 4];
  const fee = method === 'taekbae' ? 4000 : 0;
  const day = String(22 - Math.floor(i / 2)).padStart(2, '0');
  return {
    id: 1040 - i, number: `TS-2610${day}-${4821 - i * 37}`, user_id: String(7000 + i), items, subtotal, delivery_fee: fee, total: subtotal + fee,
    status, delivery_method: method, customer_name: NAMES[i], phone: `010-${5523 + i * 111}-${7788 - i * 202}`,
    address: method === 'taekbae' ? '경기도 안산시 단원구 고잔동 123' : null, postal_code: null, desired_date: i === 0 ? '2026-10-25' : null,
    comment: i === 0 ? A.orderComment : null, receipt_image_id: status === 'pending_payment' ? null : RECEIPT_ID,
    courier: null, tracking_number: null, admin_note: null, username: i % 2 ? null : 'dilnoza_k',
    history: [{ status: 'pending_payment', at: `2026-10-${day}T10:41:00+09:00` }, ...(status !== 'pending_payment' ? [{ status: 'receipt_sent', at: `2026-10-${day}T10:43:00+09:00` }] : [])],
    created_at: `2026-10-${day}T1${i % 10}:41:00+09:00`, updated_at: NOW,
  };
});
const dash = () => ({
  stats: { orders_total: 1284, orders_today: 7, pending: 3, receipts: orders.filter((o) => o.status === 'receipt_sent').length, to_ship: 4, revenue: 48750000, revenue_month: 12345000, users_total: 2350, users_week: 41 },
  daily: Array.from({ length: 14 }, (_, i) => ({ day: `10-${String(9 + i).padStart(2, '0')}`, orders: [2, 5, 1, 7, 3, 4, 6, 4, 9, 6, 2, 8, 5, 7][i], revenue: 0 })),
  top: ['Mevali tort', 'Sinnabon', 'Paxlava', 'Kiyevskiy tort', 'Manti'].map((n, i) => ({ name: n, qty: 40 - i * 6, sum: (40 - i * 6) * byName(n).price })),
  latest: orders.slice(0, 5),
  stock: { tracked: 17, low: 3, empty: 1 },
});
const STOCK_ID = byName(A.stockProduct).id;
const moves = [];
const stockItems = () => products.map((p) => ({ id: p.id, name_uz: p.name_uz, unit_uz: p.unit_uz, image_id: p.image_id, frame: p.frame, stock: p.stock, stock_min: 3, in_stock: true, active: true, category_name: p.category_name, last_move_at: p.stock == null ? null : '2026-10-21T18:20:00+09:00' }));
const users = NAMES.map((n, i) => ({ id: String(5550000 + i), first_name: n, username: i % 3 ? null : 'dilnoza_k', phone: `010-${5523 + i * 111}-${7788 - i * 202}`, lang: i % 2 ? 'ru' : 'uz', is_admin: false, bot_blocked: false, orders_count: 9 - i, orders_sum: (9 - i) * 41000, created_at: '2026-09-01T10:00:00+09:00', last_seen: '2026-10-22T09:15:00+09:00' }));
let broadcasts = [{ id: 1, text: A.oldBroadcast, total: 2350, sent: 2311, failed: 39, status: 'done', created_at: '2026-10-18T12:00:00+09:00' }];
// Rekvizitlar soxta — videoda ham xira
const settings = { shop: boot.shop, payment: { ...boot.payment, bank_name: 'KB Kookmin Bank', account_number: '000000-00-000000', account_holder: 'TAYYOR SWEET' }, delivery: boot.delivery, app: { ...boot.app, announcement_uz: '', announcement_ru: '' } };

// To'lov cheki (namuna): bank ilovasidagi "o'tkazma bajarildi" ekrani
async function receiptPng(page, total) {
  const b64 = await page.evaluate((total) => {
    const cv = document.createElement('canvas');
    cv.width = 600;
    cv.height = 900;
    const c = cv.getContext('2d');
    c.fillStyle = '#F4F6F9';
    c.fillRect(0, 0, 600, 900);
    c.fillStyle = '#fff';
    c.beginPath();
    c.roundRect(40, 120, 520, 660, 36);
    c.fill();
    c.fillStyle = '#2BB673';
    c.beginPath();
    c.arc(300, 260, 70, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 16;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(265, 262);
    c.lineTo(292, 290);
    c.lineTo(340, 236);
    c.stroke();
    c.textAlign = 'center';
    c.fillStyle = '#1F2430';
    c.font = '700 40px sans-serif';
    c.fillText('이체 완료', 300, 400);
    c.font = '800 58px sans-serif';
    c.fillText(total.toLocaleString('ko-KR') + '원', 300, 490);
    c.fillStyle = '#8A93A3';
    c.font = '500 28px sans-serif';
    c.fillText('2026.10.22 10:43', 300, 550);
    c.fillStyle = '#EEF1F5';
    c.fillRect(90, 600, 420, 3);
    c.fillStyle = '#B7BEC9';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.roundRect(90, 640 + i * 36, i === 1 ? 260 : 360, 18, 9);
      c.fill();
    }
    return cv.toDataURL('image/png').slice(22);
  }, total);
  return Buffer.from(b64, 'base64');
}

// ---------- Brauzer va soxta API ----------
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, isMobile: true, hasTouch: true, userAgent: UA,
  locale: 'ru-RU', timezoneId: 'Asia/Seoul', serviceWorkers: 'block',
});
let receipt = null;
await ctx.route(/telegram\.org/, (r) => r.abort());
await ctx.route('**/api/**', async (r) => {
  const u = new URL(r.request().url());
  const m = r.request().method();
  const p = u.pathname;
  const body = () => JSON.parse(r.request().postData() || '{}');
  const json = (b) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
  let x;
  if ((x = p.match(/^\/api\/images\/(\d+)$/))) {
    if (+x[1] === RECEIPT_ID) return r.fulfill({ status: 200, contentType: 'image/png', body: receipt });
    const f = FILES[x[1]];
    return f ? r.fulfill({ status: 200, contentType: 'image/jpeg', body: await readFile(`../miniapp/public/rasmlar/${f}`) }) : r.fulfill({ status: 404, body: '' });
  }
  if (p === '/api/health') return json({ ok: true });
  if (p === '/api/admin/login') return json({ token: 'demo' });
  const a = p.replace('/api/admin', '');
  if (a === '/dashboard') return json(dash());
  if (a === '/upload') return json({ id: NEW.image_id });
  if (a === '/products' && m === 'POST') {
    const np = { ...NEW, ...body(), id: NEW.id, category_name: cats.find((c) => c.id === body().category_id)?.name_uz, stock: null };
    products = [np, ...products];
    return json(np);
  }
  if (a === '/products') return json(products);
  if (a === '/categories') return json(cats);
  if (a === '/price-list') return json({ text: '' });
  if (a.startsWith('/orders/') && m === 'PATCH') {
    const id = +a.split('/')[2], b = body();
    orders = orders.map((o) => (o.id === id ? { ...o, status: b.status, tracking_number: b.tracking_number ?? o.tracking_number, courier: b.courier ?? o.courier, history: [...o.history, ...(b.status !== o.status ? [{ status: b.status, at: NOW }] : [])] } : o));
    return json(orders.find((o) => o.id === id));
  }
  if (a.startsWith('/orders/')) return json(orders.find((o) => o.id === +a.split('/')[2]));
  if (a.startsWith('/orders')) return json({ rows: orders, total: orders.length, couriers: { cj: { name: 'CJ대한통운' }, lotte: { name: '롯데택배' }, post: { name: '우체국택배' } }, statuses: STATUSES });
  if (a === '/stock') return json({ products: stockItems(), stats: { tracked: 17, empty: 1, low: 3, units: 214 + (moves.length ? 10 : 0), in_today: moves.length ? 10 : 0, out_today: 4 }, moves: [...moves, { id: 1, product_id: byName('Paxlava').id, product_name: 'Paxlava', delta: -2, balance: 6, reason: 'order', order_number: 'TS-261021-4747', note: null, created_at: '2026-10-21T18:20:00+09:00' }] });
  if (/^\/stock\/\d+\/moves$/.test(a)) return json(moves.filter((mv) => mv.product_id === +a.split('/')[2]));
  if (/^\/stock\/\d+\/move$/.test(a)) {
    const id = +a.split('/')[2], b = body();
    products = products.map((x) => (x.id === id ? { ...x, stock: (x.stock ?? 0) + b.qty } : x));
    const pr = products.find((x) => x.id === id);
    moves.unshift({ id: 2 + moves.length, product_id: id, product_name: pr.name_uz, delta: b.qty, balance: pr.stock, reason: 'in', order_number: null, note: b.note || null, created_at: NOW });
    return json({ ok: true });
  }
  if (a === '/stories') return json(boot.stories);
  if (a === '/banners') return json(boot.banners);
  if (a.startsWith('/users')) return json({ rows: users, total: 2350 });
  if (a === '/broadcasts') return json(broadcasts);
  if (a === '/broadcast') {
    broadcasts = [{ id: 2, text: body().text, total: 2350, sent: 1182, failed: 3, status: 'running', created_at: NOW }, ...broadcasts];
    return json({ ok: true });
  }
  if (a === '/settings') return json(settings);
  return r.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not_found"}' });
});

const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('dialog', (d) => d.accept());
await page.goto(base + '/admin', { waitUntil: 'networkidle' });
receipt = await receiptPng(page, orders[0].total);
// Telefondagidek: pastda xavfsiz hudud; animatsiyalarsiz — kadrlar barqaror; xabarlar (toast) videoda chiziladi
await page.addStyleTag({
  content: `:root { --safe-b: 24px !important; }
    *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }
    .toast { display: none !important; }
    .bank-blur { filter: blur(5px); }`,
});
await page.waitForTimeout(500);

const layout = { view: { w: VW, h: VH }, dsf: DSF };
const shot = (name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, ...opts }).then(() => console.log('✓', name));
const pause = (ms = 250) => page.waitForTimeout(ms);
const rect = (el) => el.evaluate((e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
// Kechiktirib yuklanadigan rasmlar hammasi yuklansin
async function loadImages() {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
  });
  await pause(300);
}
async function css(content, fn) {
  const h = await page.addStyleTag({ content });
  await pause(80);
  const r = await fn();
  await h.evaluate((n) => n.remove());
  await pause(60);
  return r;
}
// Elementlar o'rni (root ichida, pt): { nom: selektor | [selektor, matn] }
async function boxes(rootSel, map) {
  const out = {};
  for (const [k, s] of Object.entries(map)) {
    const [sel, has] = Array.isArray(s) ? s : [s, null];
    let loc = page.locator(sel);
    if (has) loc = loc.filter({ hasText: has });
    loc = loc.first();
    if (!(await loc.count())) throw new Error(`topilmadi: ${k} (${sel} ${has || ''})`);
    out[k] = await loc.evaluate((e, rs) => {
      const r = document.querySelector(rs).getBoundingClientRect(), b = e.getBoundingClientRect();
      return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
    }, rootSel);
  }
  return out;
}
// Vaqtincha ekranni baland qilib, butun elementni bitta rasmga olish
async function tall(name, sel) {
  const b0 = await rect(page.locator(sel).first());
  await page.setViewportSize({ width: VW, height: Math.max(VH, Math.ceil(b0.y + b0.h)) });
  await pause(150);
  const b = await rect(page.locator(sel).first());
  await shot(name, { clip: { x: 0, y: b.y, width: VW, height: b.h } });
  await page.setViewportSize({ width: VW, height: VH });
  await pause(150);
  return { h: b.h };
}

// ---------- Kirish ----------
const pass = page.locator('.pass .input');
await page.click('.pass button'); // parol yashirin (nuqtalar)
await pass.evaluate((e) => e.blur());
await pause();
layout.login = await boxes('body', { field: '.pass .input', btn: '.login .btn-primary' });
await shot('login0');
await pass.fill(A.password);
await pass.evaluate((e) => e.blur());
await pause();
await shot('login1');
await page.click('.login .btn-primary');
await page.waitForSelector('.adm-side');
await page.waitForLoadState('networkidle');
await loadImages();

// ---------- Menyu tasmasi: butun eni, har bo'lim uchun alohida (tanlangan tugma pushti) ----------
const SECTIONS = ['dashboard', 'orders', 'products', 'stock', 'categories', 'promo', 'customers', 'settings'];
const LABELS = { dashboard: 'Dashboard', orders: 'Buyurtmalar', products: 'Mahsulotlar', stock: 'Ombor', categories: 'Kategoriyalar', promo: 'Story va bannerlar', customers: 'Mijozlar va rassilka', settings: 'Sozlamalar' };
const go = async (s) => {
  await page.locator('.adm-side .adm-nav', { hasText: LABELS[s] }).first().click();
  await page.waitForLoadState('networkidle');
  await loadImages();
  await pause(400);
};
async function navStrip(s) {
  const r = await css(
    `.adm-side { position: absolute !important; left: 0; top: 0; width: max-content !important; overflow: visible !important; padding-top: 8px !important; }
     .adm-main { visibility: hidden; }`,
    async () => {
      // ekran eni o'zgarmaydi (telefon ko'rinishi qoladi) — tasma ekrandan tashqariga cho'ziladi
      const b = await rect(page.locator('.adm-side'));
      await shot(`nav_${s}`, { fullPage: true, clip: { x: 0, y: 0, width: Math.ceil(b.w), height: Math.ceil(b.h) } });
      const items = await page.$$eval('.adm-side .adm-nav', (ns) => ns.map((n) => ({ x: n.offsetLeft, w: n.offsetWidth, y: n.offsetTop, h: n.offsetHeight, label: n.textContent.trim() })));
      return { w: Math.ceil(b.w), h: Math.ceil(b.h), items };
    }
  );
  layout.nav = r;
}
// Bo'lim sahifasi: menyusiz, butun bo'yi (sozlamalardagi "Saqlash" tasmasi alohida)
const PAGE_CSS = `.adm-side, .drawer, .drawer-bg, .save-bar { display: none !important; }`;
async function sectionPage(name, map = {}) {
  return css(PAGE_CSS, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(name, { fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    return { h, ...(await boxes('.adm-main', { head: '.adm-head', ...map })) };
  });
}
// Drawer: sarlavha, tanasi (butun bo'yi), pastki tugmalar
async function drawer(name, map = {}, { head = true, foot = true } = {}) {
  await pause(200);
  const out = {};
  if (head) {
    const hb = await rect(page.locator('.drawer-head'));
    await shot(`${name}_head`, { clip: { x: 0, y: hb.y, width: VW, height: hb.h } });
    out.headH = hb.h;
  }
  if (foot && (await page.locator('.drawer-foot').count())) {
    const fb = await rect(page.locator('.drawer-foot'));
    await css('.drawer-bg { display: none !important; } .adm { visibility: hidden !important; } html, body { background: transparent !important; } .drawer { background: transparent !important; box-shadow: none !important; } .drawer-foot, .drawer-foot * { visibility: visible !important; }', () =>
      shot(`${name}_foot`, { clip: { x: 0, y: fb.y, width: VW, height: VH - fb.y }, omitBackground: true })
    );
    out.footY = fb.y;
    out.foot = await boxes('.drawer-foot', { btn0: '.drawer-foot .btn', ...(map.foot || {}) });
  }
  const body = await css(
    `.drawer { position: absolute !important; bottom: auto !important; height: auto !important; overflow: visible !important; }
     .drawer-head, .drawer-foot { display: none !important; }`,
    async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      const t = await tall(name, '.drawer-body');
      const { foot: _f, ...m } = map;
      return { ...t, ...(await boxes('.drawer-body', m)) };
    }
  );
  return { ...out, ...body };
}
const closeDrawer = async () => {
  await page.click('.drawer-head .icon-btn');
  await pause(300);
};

// 1. Dashboard
await navStrip('dashboard');
layout.navs = { dashboard: layout.nav };
layout.dash = await sectionPage('dash', { chart: '.bars', top: ['.adm-card', 'Top mahsulotlar'], latest: ['.adm-card', 'Oxirgi buyurtmalar'] });

// 2. Mahsulotlar → yangi mahsulot
for (const s of SECTIONS.slice(1)) {
  await go(s);
  await navStrip(s);
  layout.navs[s] = layout.nav;
}
delete layout.nav;
await go('products');
layout.prod0 = await sectionPage('prod0', { add: ['.toolbar .btn', '+ Yangi mahsulot'], grid: '.pgrid' });
await page.locator('.toolbar .btn', { hasText: '+ Yangi mahsulot' }).click();
await pause(400);
const field = (label) => page.locator('.drawer .fgrid > div', { hasText: label }).locator('input, select, textarea').first();
const F = {
  img: '.drawer .img-pick label',
  name: ['.drawer .fgrid > div', "Nomi (o'zbekcha)"],
  nameRu: ['.drawer .fgrid > div', 'Nomi (ruscha)'],
  cat: ['.drawer .fgrid > div', 'Kategoriya'],
  price: ['.drawer .fgrid > div', 'Narxi'],
  unit: ['.drawer .fgrid > div', "O'lchov / miqdor (uz)"],
  desc: ['.drawer .fgrid > div', 'Tavsif (uz)'],
  pre: ['.drawer .fgrid > div', 'Necha kun oldin'],
  pickup: ['.drawer label.switch', 'Pochta qilib'],
  sizes: ['.drawer .box', "O'lchamlar (narx variantlari)"],
  main: ['.drawer .box', 'Asosiy'],
};
// maydonlar ichidagi input (label emas) o'rni
async function fieldBoxes(names) {
  const out = {};
  for (const n of names) {
    out[n] = await field(F[n][1]).evaluate((e) => {
      const r = document.querySelector('.drawer-body').getBoundingClientRect(), b = e.getBoundingClientRect();
      return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
    });
  }
  return out;
}
layout.pe0 = await drawer('pe0', { img: F.img, main: F.main });
// rasm yuklash
const photo = await readFile(`../miniapp/public/rasmlar/${FILES[NEW.image_id]}`);
await page.setInputFiles('.drawer .img-pick input[type=file]', { name: 'tort.jpg', mimeType: 'image/jpeg', buffer: photo });
await page.waitForSelector('.drawer .frame-stage img');
await loadImages();
layout.pe1 = await drawer('pe1', { img: '.drawer .img-pick .frame', frame: ['.drawer .box', 'Rasm ramkasi'], stage: '.frame-stage', range: '.drawer .range', main: F.main }, { head: false, foot: false });
// ramka: tortning yuqori qismi (bezak) — bosiladi, keyin kattalashtiriladi
const stage = await rect(page.locator('.frame-stage'));
await page.mouse.click(stage.x + stage.w * A.frame.x / 100, stage.y + stage.h * A.frame.y / 100);
await pause();
layout.pe2 = await drawer('pe2', {}, { head: false, foot: false });
await page.locator('.drawer .range').focus();
for (let i = 0; i < A.frame.steps; i++) await page.keyboard.press('ArrowRight');
await page.locator('.drawer .range').evaluate((e) => e.blur());
await pause();
layout.pe3 = await drawer('pe3', {}, { head: false, foot: false });
layout.pe3.fields = await fieldBoxes(['name', 'nameRu', 'cat', 'price', 'unit', 'desc', 'pre']);
// asosiy maydonlar
await field(F.name[1]).fill(A.product.name);
await field(F.nameRu[1]).fill(A.product.nameRu);
await field(F.price[1]).fill(String(A.product.price));
await field(F.cat[1]).selectOption({ label: A.product.cat });
await page.evaluate(() => document.activeElement?.blur());
await pause();
layout.pe4 = await drawer('pe4', {}, { head: false, foot: false });
// o'lchov (tayyor tugma) va tavsif
await page.locator('.drawer .presets button', { hasText: A.product.unit }).first().click();
await field(F.desc[1]).fill(A.product.desc);
await page.evaluate(() => document.activeElement?.blur());
await pause();
layout.pe5 = await drawer('pe5', { unitChip: ['.drawer .presets button', A.product.unit] }, { head: false, foot: false });
// necha kun oldin + faqat olib ketish
await field(F.pre[1]).fill('2');
await page.evaluate(() => document.activeElement?.blur());
await pause();
layout.pe6a = await drawer('pe6a', { pickup: F.pickup }, { head: false, foot: false });
await page.locator('.drawer label.switch', { hasText: 'Pochta qilib' }).click();
await pause();
layout.pe6 = await drawer('pe6', { pickup: F.pickup, sizes: F.sizes, kichik: ['.drawer .presets button', A.sizes[0]] }, { head: false, foot: false });
// o'lchamlar: ikkita tayyor tugma
await page.locator('.drawer .presets button', { hasText: A.sizes[0] }).first().click();
await pause();
layout.pe7 = await drawer('pe7', { sizes: F.sizes, katta: ['.drawer .presets button', A.sizes[1]] }, { head: false, foot: false });
await page.locator('.drawer .presets button', { hasText: A.sizes[1] }).first().click();
await pause();
layout.pe8 = await drawer('pe8', { sizes: F.sizes }, { foot: { save: ['.drawer-foot .btn', 'Saqlash'] } });
await page.locator('.drawer-foot .btn', { hasText: 'Saqlash' }).click();
await page.waitForSelector('.drawer', { state: 'detached' });
await loadImages();
layout.prod1 = await sectionPage('prod1', { first: '.pgrid .pitem' });

// 3. Buyurtmalar: chekni tasdiqlash, trek raqam, jo'natish
await go('orders');
layout.ord0 = await sectionPage('ord0', { first: '.tbl-orders tbody tr' });
await page.locator('.tbl-orders tbody tr').first().click();
await page.waitForSelector('.drawer .receipt-img');
await loadImages();
layout.od1 = await drawer('od1', { receipt: ['.drawer .box', "To'lov cheki"], items: ['.drawer .box', 'Mahsulotlar'], status: '.drawer .status' }, { foot: { confirm: ['.drawer-foot .btn', 'Chekni tasdiqlash'] } });
await page.locator('.drawer-foot .btn', { hasText: 'Chekni tasdiqlash' }).click();
await pause(600);
layout.od2 = await drawer('od2', { track: ['.drawer .box', 'trek raqami'], trackInput: ['.drawer .box .fgrid > div', 'Trek raqam'], status: '.drawer .status' }, { foot: { ship: ['.drawer-foot .btn', "Jo'natildi"] } });
await page.locator('.drawer .fgrid > div', { hasText: 'Trek raqam' }).locator('input').fill(A.tracking);
await page.evaluate(() => document.activeElement?.blur());
await pause();
layout.od3 = await drawer('od3', {}, { head: false, foot: false });
await page.locator('.drawer-foot .btn', { hasText: "Jo'natildi" }).click();
await pause(600);
layout.od4 = await drawer('od4', { status: '.drawer .status' }, { head: false });
await closeDrawer();
await loadImages();
layout.ord1 = await sectionPage('ord1', { first: '.tbl-orders tbody tr' });

// 4. Ombor: kirim
await go('stock');
const row = page.locator('.stock-tbl tbody tr', { hasText: A.stockProduct }).first();
layout.st0 = await sectionPage('st0', {});
layout.st0.row = await row.evaluate((e) => { const r = document.querySelector('.adm-main').getBoundingClientRect(), b = e.getBoundingClientRect(); return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }; });
// sahifa menyusiz olingan — o'rinlar ham menyusiz holatda o'lchanadi
layout.st0 = { ...layout.st0, ...(await css(PAGE_CSS, async () => {
  const r = await row.evaluate((e) => { const m = document.querySelector('.adm-main').getBoundingClientRect(), b = e.getBoundingClientRect(); return { x: b.left - m.left, y: b.top - m.top, w: b.width, h: b.height }; });
  const inBtn = await row.locator('.stock-actions .btn').first().evaluate((e) => { const m = document.querySelector('.adm-main').getBoundingClientRect(), b = e.getBoundingClientRect(); return { x: b.left - m.left, y: b.top - m.top, w: b.width, h: b.height }; });
  return { row: r, inBtn };
})) };
await row.locator('.stock-actions .btn').first().click();
await pause(500);
layout.sd0 = await drawer('sd0', { qty: '.drawer .qty-input', plus10: ['.drawer .presets button', '+10'], head: '.drawer .stock-head' });
await page.locator('.drawer .presets button', { hasText: '+10' }).first().click();
await pause();
layout.sd1 = await drawer('sd1', {}, { head: false, foot: { save: '.drawer-foot .btn' } });
await page.locator('.drawer-foot .btn').click();
await pause(700);
layout.sd2 = await drawer('sd2', { moves: ['.drawer .box', 'Tarix'] }, { head: false });
await closeDrawer();
await loadImages();
layout.st1 = await sectionPage('st1', {});

// 5. Kategoriyalar, story va bannerlar
await go('categories');
layout.cat0 = await sectionPage('cat0', {});
await go('promo');
layout.promo0 = await sectionPage('promo0', { banners: ['h3', 'Karusel bannerlari'] });

// 6. Mijozlar va rassilka
await go('customers');
layout.cu0 = await sectionPage('cu0', { text: '.adm-card .textarea', send: ['.adm-card .btn', 'Yuborish'], list: '.tbl-users' });
await page.locator('.adm-card .textarea').first().fill(A.broadcast);
await page.evaluate(() => document.activeElement?.blur());
await pause();
layout.cu1 = await sectionPage('cu1', {});
await page.locator('.adm-card .btn', { hasText: 'Yuborish' }).click();
await pause(700);
layout.cu2 = await sectionPage('cu2', {});

// 7. Sozlamalar
await go('settings');
await page.evaluate(() => {
  // Rekvizitlar videoda xira
  document.querySelectorAll('.fgrid > div').forEach((d) => {
    const l = d.querySelector('.label')?.textContent || '';
    if (/^(Bank|Hisob raqami|Hisob egasi)$/.test(l)) d.querySelector('.input')?.classList.add('bank-blur');
  });
});
const SET = { pay: ['.box', "To'lov rekvizitlari"], delivery: ['.box', 'Yetkazish'], app: ['.box', 'Mini ilova'], ann: ['.box .fgrid > div', "E'lon (uz)"] };
layout.set0 = await sectionPage('set0', SET);
const annBox = await css(PAGE_CSS, () => page.locator('.fgrid > div', { hasText: "E'lon (uz)" }).locator('textarea').evaluate((e) => { const m = document.querySelector('.adm-main').getBoundingClientRect(), b = e.getBoundingClientRect(); return { x: b.left - m.left, y: b.top - m.top, w: b.width, h: b.height }; }));
layout.set0.annInput = annBox;
const sb = await rect(page.locator('.save-bar'));
await page.evaluate(() => window.scrollTo(0, 600));
await pause();
const sb2 = await rect(page.locator('.save-bar'));
await css('.adm { visibility: hidden !important; } .save-bar, .save-bar * { visibility: visible !important; } html, body { background: transparent !important; } .save-bar { background: transparent !important; }', () =>
  shot('savebar', { clip: { x: 0, y: sb2.y, width: VW, height: VH - sb2.y }, omitBackground: true })
);
layout.savebar = { y: sb2.y, btn: await boxes('.save-bar', { btn: '.save-bar .btn' }).then((b) => b.btn), y0: sb.y };
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator('.fgrid > div', { hasText: "E'lon (uz)" }).locator('textarea').fill(A.announcement);
await page.evaluate(() => document.activeElement?.blur());
await pause();
layout.set1 = await sectionPage('set1', {});

await writeFile(`${OUT}/layout.json`, JSON.stringify(layout, null, 1));
console.log('✓ layout.json');
await browser.close();
