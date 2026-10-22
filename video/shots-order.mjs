// "Qanday buyurtma beriladi" videosi uchun mini ilova ekranlari: har bir holat alohida qatlam (sahifa, pastki menyu,
// oyna, oyna tugmasi) — video ularni o'zi siljitadi, ochadi-yopadi. Backend kerak emas: /api so'rovlariga soxta javob.
// Ishlatish: mini ilova ishga tushgan bo'lsin (npx next start -p 3100), keyin: node shots-order.mjs [http://localhost:3100]
import { chromium } from 'playwright';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { L } from './src/strings.js';

const base = process.argv[2] || 'http://localhost:3100';
const OUT = 'assets/shots/order';
// iPhone 390×845 pt, tepada Telegram paneli (holat qatori 54 + sarlavha 44) — mini ilova oynasi 390×747
const VW = 390, VH = 747, DSF = 2;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const PRODUCT = 'Mevali tort';
const VARIANT = 'Mini';
const NOW = '2026-10-22T10:41:00+09:00';
const { phone: PHONE, address: ADDRESS } = L.order;

await mkdir(OUT, { recursive: true });
const boot = JSON.parse(await readFile('../miniapp/src/lib/fallback-bootstrap.json', 'utf8'));
// Rekvizitlar videoda xiralashtiriladi (haqiqiy hisob raqami emas)
boot.payment = { ...boot.payment, bank_name: 'KB Kookmin Bank', account_number: '000000-00-000000', account_holder: 'TAYYOR SWEET' };
const p = boot.products.find((x) => x.name_uz === PRODUCT);
const v = p.variants.find((x) => x.name === VARIANT);
const fee = boot.delivery.taekbae_fee;
const order = (status) => ({
  id: 1024, number: 'TS-261022-4821', user_id: '1',
  items: [{ product_id: p.id, name: p.name_uz, variant: v.name, color: null, unit: p.unit_uz, price: v.price, qty: 1, image_id: p.image_id }],
  subtotal: v.price, delivery_fee: fee, total: v.price + fee, status, delivery_method: 'taekbae',
  customer_name: 'Aziza', phone: PHONE, address: ADDRESS, postal_code: null,
  desired_date: null, comment: null, receipt_image_id: status === 'pending_payment' ? null : 1, courier: null, tracking_number: null, admin_note: null,
  history: [
    { status: 'pending_payment', at: NOW },
    ...(status !== 'pending_payment' ? [{ status: 'receipt_sent', at: '2026-10-22T10:43:00+09:00' }] : []),
    ...(status === 'confirmed' ? [{ status: 'confirmed', at: '2026-10-22T10:52:00+09:00' }] : []),
  ],
  created_at: NOW, updated_at: NOW,
});
let status = 'pending_payment';
let holdOrder = null; // "Buyurtmani tasdiqlash" bosilganda javobni ushlab turish (tugmadagi aylanayotgan belgi uchun)

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, isMobile: true, hasTouch: true, userAgent: UA, locale: 'ru-RU', timezoneId: 'Asia/Seoul' });
await ctx.route(/telegram\.org/, (r) => r.abort());
await ctx.route('**/api/**', async (r) => {
  const u = new URL(r.request().url());
  const m = r.request().method();
  const json = (body) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  if (u.pathname === '/api/bootstrap') return json(boot);
  if (u.pathname === '/api/me') return json({ id: '1', first_name: 'Aziza', last_name: null, username: null, phone: null, lang: 'uz', is_admin: false, created_at: NOW });
  if (u.pathname === '/api/orders' && m === 'POST') {
    if (holdOrder) await holdOrder;
    return json(order('pending_payment'));
  }
  if (u.pathname === '/api/orders') return json(status === 'pending_payment' ? [] : [order(status)]);
  if (u.pathname.endsWith('/receipt')) {
    status = 'receipt_sent';
    return json(order(status));
  }
  if (u.pathname.startsWith('/api/orders/')) return json(order(status));
  return r.fulfill({ status: 404, body: '' });
});
await ctx.addInitScript(() => {
  localStorage.setItem('ts-onboarded', '1');
  localStorage.setItem('ts-lang', 'uz');
  localStorage.removeItem('ts-cart');
  localStorage.removeItem('ts-checkout');
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(base + '/', { waitUntil: 'networkidle' });
// Telegram iPhone'da pastdan xavfsiz hudud beradi; animatsiyalarsiz — kadrlar barqaror chiqadi
await page.addStyleTag({
  content: `:root { --safe-b: 20px !important; }
    *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition: none !important; caret-color: transparent !important; }
    .toast { display: none !important; }
    /* bo'sh sana maydoni iPhone'dagidek toza (brauzerning mm/dd/yyyy shabloni va belgisi ko'rinmaydi) */
    input[type=date]::-webkit-datetime-edit { color: transparent; }
    input[type=date]::-webkit-calendar-picker-indicator { opacity: 0; }`,
});
await page.waitForTimeout(1200);
// Kechiktirib yuklanadigan rasmlar: sahifa oxirigacha aylantiriladi, hammasi yuklanguncha kutiladi
async function loadImages() {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
  });
  await page.waitForTimeout(400);
}
await loadImages();

const layout = { view: { w: VW, h: VH }, dsf: DSF };
const box = async (sel, root = null) => {
  const el = typeof sel === 'string' ? await page.$(sel) : sel;
  const b = await el.boundingBox();
  return root ? { x: b.x - root.x, y: b.y - root.y, w: b.width, h: b.height } : { x: b.x, y: b.y, w: b.width, h: b.height };
};
// Qatlam rejimi: faqat kerakli qism ko'rinadi, foni shaffof
const ONLY = (sel) => `html, body, .app { background: transparent !important; }
  body > *:not(.app) { visibility: hidden !important; }
  .app * { visibility: hidden !important; }
  ${sel}, ${sel} * { visibility: visible !important; }`;
async function layer(css, fn) {
  const h = await page.addStyleTag({ content: css });
  await page.waitForTimeout(80);
  const r = await fn();
  await h.evaluate((n) => n.remove());
  await page.waitForTimeout(50);
  return r;
}
const shot = (name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, omitBackground: true, ...opts }).then(() => console.log('✓', name));

// Pastki menyu (ko'tarilgan savat tugmasi bilan) — ekran pastidagi tasma
async function nav(name) {
  const nb = await box('.bottom-nav');
  const y = Math.floor(nb.y - 30);
  await layer(ONLY('.bottom-nav'), () => shot(name, { clip: { x: 0, y, width: VW, height: VH - y } }));
  return { y, cart: await box('.nav-cart-btn'), orders: await box('.bottom-nav > button:nth-child(4)') };
}

// Oyna (bottom sheet): butun mazmuni (cho'zilgan holda) + ekrandagi haqiqiy o'rni
async function sheet(name, sel = '.sheet') {
  const real = await box(sel);
  const r = await layer(
    `${ONLY(sel)}
     ${sel} { max-height: none !important; overflow: visible !important; position: absolute !important; top: 0 !important; bottom: auto !important; }
     .sheet-backdrop { display: none !important; }`,
    async () => {
      // Oyna ekrandan uzun bo'lsa — vaqtincha oynaning o'zi bo'yi ekran
      await page.evaluate(() => window.scrollTo(0, 0));
      const b0 = await box(sel);
      await page.setViewportSize({ width: VW, height: Math.max(VH, Math.ceil(b0.y + b0.h)) });
      await page.waitForTimeout(120);
      const b = await box(sel);
      await shot(name, { clip: { x: 0, y: b.y, width: VW, height: b.h } });
      await page.setViewportSize({ width: VW, height: VH });
      await page.waitForTimeout(120);
      return b;
    }
  );
  return { top: real.y, h: r.h, viewH: real.h };
}
async function footer(name) {
  const fb = await box('.sheet-footer');
  await layer(ONLY('.sheet-footer'), () => shot(name, { clip: { x: 0, y: fb.y, width: VW, height: VH - fb.y } }));
  return { y: fb.y, btn: await box('.sheet-footer .btn') };
}
// Oyna ichidagi element o'rni (oyna mazmunining yuqorisiga nisbatan)
async function inSheet(sel, sheetSel = '.sheet') {
  return page.evaluate(([s, ss]) => {
    const sh = document.querySelector(ss);
    const el = typeof s === 'string' ? document.querySelector(s) : null;
    const a = sh.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { x: b.left - a.left, y: b.top - a.top + sh.scrollTop, w: b.width, h: b.height };
  }, [sel, sheetSel]);
}

// ---------- 1. Bosh sahifa (butun uzunligi) ----------
layout.home = await layer('.bottom-nav { display: none !important; }', async () => {
  await shot('home', { fullPage: true, omitBackground: false });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const cards = await page.$$('.pcard');
  let card = null;
  for (const c of cards) if ((await c.$eval('h3', (e) => e.textContent)) === PRODUCT) card = c;
  return { h, card: await box(card), add: await box(await card.$('.add-btn')) };
});
layout.nav0 = await nav('nav0');

// ---------- 2. Mahsulot oynasi ----------
const cardEl = (await page.$$('.pcard'))[(await page.$$eval('.pcard h3', (hs, n) => hs.findIndex((h) => h.textContent === n), PRODUCT))];
await cardEl.click();
await page.waitForTimeout(700);
layout.ps = await sheet('ps0');
layout.ps.variant = await page.evaluate((name) => {
  const sh = document.querySelector('.sheet');
  const b = [...sh.querySelectorAll('.opt')].find((o) => o.querySelector('b').textContent === name).getBoundingClientRect();
  const a = sh.getBoundingClientRect();
  return { x: b.left - a.left, y: b.top - a.top + sh.scrollTop, w: b.width, h: b.height };
}, VARIANT);
layout.ps.gallery = await inSheet('.gallery');
layout.pf = await footer('pf0');
await page.$$eval('.sheet .opt', (os, name) => os.find((o) => o.querySelector('b').textContent === name).click(), VARIANT);
await page.waitForTimeout(300);
await sheet('ps1');
await footer('pf1');
await page.click('.sheet-footer .btn');
await page.waitForTimeout(900);
layout.nav1 = await nav('nav1');

// ---------- 3. Savat ----------
await page.click('.nav-cart');
await page.waitForTimeout(700);
layout.cart = await layer('.bottom-nav, .sticky-cta { display: none !important; }', async () => {
  await shot('cart', { fullPage: true, omitBackground: false });
  return { h: await page.evaluate(() => document.documentElement.scrollHeight), item: await box('.cart-item') };
});
layout.cta = await (async () => {
  const b = await box('.sticky-cta');
  await layer(ONLY('.sticky-cta'), () => shot('cta', { clip: { x: 0, y: b.y, width: VW, height: b.h } }));
  return { y: b.y, btn: await box('.sticky-cta .btn') };
})();
layout.navc = await nav('navc');

// ---------- 4. Rasmiylashtirish ----------
await page.click('.sticky-cta .btn');
await page.waitForTimeout(800);
layout.cs = await sheet('cs0');
const fields = await page.$$('.sheet .input, .sheet .textarea');
layout.cs.fields = [];
for (const f of fields) layout.cs.fields.push(await page.evaluate((el) => {
  const sh = document.querySelector('.sheet');
  const a = sh.getBoundingClientRect(), b = el.getBoundingClientRect();
  return { x: b.left - a.left, y: b.top - a.top + sh.scrollTop, w: b.width, h: b.height, type: el.tagName, value: el.value };
}, f));
layout.cs.method = await inSheet('.method.on');
layout.cs.summary = await inSheet('.summary');
layout.cf = await footer('cf');
// Telefon va manzil yoziladi (ism Telegram'dan olingan)
const typeIn = async (i, val) => {
  await fields[i].fill(val);
  await fields[i].evaluate((el) => el.blur());
  await page.waitForTimeout(150);
};
await typeIn(1, PHONE);
await sheet('cs1');
await typeIn(2, ADDRESS);
await sheet('cs2');
// Tasdiqlash: javob kelguncha tugmada aylanayotgan belgi
let release;
holdOrder = new Promise((r) => (release = r));
await page.click('.sheet-footer .btn');
await page.waitForTimeout(250);
await footer('cfb');
release();
holdOrder = null;
await page.waitForTimeout(1000);

// ---------- 5. To'lov ----------
// Rekvizitlar (bank, hisob raqami, egasi) xira — videoda haqiqiy raqam ko'rinmaydi
await page.addStyleTag({ content: '.bank > div:not(.acc), .bank .acc:not(:first-of-type) { filter: blur(5px); }' });
await page.waitForTimeout(150);
layout.pay = await sheet('pay0');
layout.pay.upload = await inSheet('.upload');
layout.pay.btn = await inSheet('.sheet .btn-primary');
layout.pay.bank = await inSheet('.bank');
// Chek rasmi (namuna): bank ilovasidagi "o'tkazma bajarildi" ekrani
const receipt = await page.evaluate((total) => {
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
}, v.price + fee);
await page.setInputFiles('.upload input', { name: 'chek.png', mimeType: 'image/png', buffer: Buffer.from(receipt, 'base64') });
await page.waitForTimeout(500);
const pay1 = await sheet('pay1');
layout.pay.h1 = pay1.h;
layout.pay.btn1 = await inSheet('.sheet .btn-primary');
layout.pay.upload1 = await inSheet('.upload');

// ---------- 6. Buyurtma holati ----------
await page.click('.sheet .btn-primary');
await page.waitForTimeout(1200);
layout.ord = await sheet('ord1');
layout.ord.timeline = await inSheet('.timeline');
layout.navo = await nav('navo');
layout.orders = await layer('.bottom-nav, .sheet, .sheet-backdrop { display: none !important; }', async () => {
  await shot('orders', { omitBackground: false });
  return { card: await box('.order-card') };
});
status = 'confirmed';
await page.evaluate(() => window.dispatchEvent(new Event('focus')));
// Holatni yangilash: oynani yopib qayta ochish
await page.click('.sheet-close');
await page.waitForTimeout(500);
await page.click('.order-card');
await page.waitForTimeout(900);
await sheet('ord2');

await writeFile(`${OUT}/layout.json`, JSON.stringify(layout, null, 1));
console.log('✓ layout.json');
await browser.close();
