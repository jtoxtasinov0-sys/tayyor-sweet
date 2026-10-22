// "Admin panel qo'llanmasi" videosi (iPhone, bosh ekrandagi "Tayyor Admin" ilovasi): kirish → dashboard → yangi mahsulot
// (rasm, ramka, nomi, narxi, o'lchamlar, saqlash) → buyurtma (chek, trek raqam) → ombor → kategoriyalar, story → rassilka
// → sozlamalar. Ekranlar — haqiqiy admin panel qatlamlari (shots-admin.mjs); video ularni siljitadi, almashtiradi va
// ustidan barmoq, klaviatura, yozilayotgan matn, tizim oynalarini chizadi. Hammasi ekran pt birligida (390×845).
// Ovozli matn va musiqa yo'q — faqat ovoz effektlari.
import { C, E, S, F, clamp, lerp, pr, vis, rr, fillRR, text, IMG, shadow, noShadow } from './core.js';
import { L } from './strings.js';
import * as UI from './ui.js';

const A = L.admin;
const { SW, SH, SB } = UI.DEV.ios;
const AT = SB; // ilova oynasining yuqorisi (holat qatori ostida)

const SHOTS = [
  'login0', 'login1', 'dash', 'prod0', 'prod1',
  'pe0', 'pe0_head', 'pe0_foot', 'pe1', 'pe2', 'pe3', 'pe4', 'pe5', 'pe6a', 'pe6', 'pe7', 'pe8',
  'ord0', 'ord1', 'od1', 'od1_head', 'od1_foot', 'od2', 'od2_foot', 'od3', 'od4', 'od4_foot',
  'st0', 'st1', 'sd0', 'sd0_head', 'sd0_foot', 'sd1', 'sd1_foot', 'sd2', 'sd2_foot',
  'cat0', 'promo0', 'cu0', 'cu1', 'cu2', 'set0', 'set1', 'savebar',
];
const NAVS = ['dashboard', 'orders', 'products', 'stock', 'categories', 'promo', 'customers', 'settings'];
export const ADMIN_IMAGES = Object.fromEntries([
  ...SHOTS.map((k) => ['a_' + k, `/video/assets/shots/admin/${k}.png`]),
  ...NAVS.map((k) => ['a_nav_' + k, `/video/assets/shots/admin/nav_${k}.png`]),
]);

export function buildAdmin(env, lay) {
  const { touch, cam, cue } = env;
  const DS = lay.dsf;
  const NAV = lay.navs.dashboard;
  const NAV_H = NAV.h;
  const CT = AT + NAV_H; // bo'lim sahifasining yuqorisi
  const VIEW_H = SH - CT;
  const HEAD = lay.pe0.headH; // drawer sarlavhasi
  const BODY = AT + HEAD; // drawer tanasining yuqorisi

  // ---------- Vaqt jadvali ----------
  const T = {
    introOut: 2.1, phoneIn: 2.3,
    s1: 2.9, tapPass: 3.9, typePass: 4.15, kb1: 5.0, tapLogin: 5.6, shell: 6.1,
    s2: 6.6, dScroll1: 8.4, dScroll2: 10.0,
    s3: 11.9, tapNavProd: 12.8, tapAdd: 14.3, d1: 14.4,
    s4: 15.2, tapImg: 16.4, tapLib: 17.2, upload: 17.3, img: 17.9,
    s5: 18.9, peScroll1: 19.2, tapStage: 20.7, zoom0: 21.7, zoom1: 22.3,
    s6: 23.4, peScroll2: 23.6, tapName: 24.6, typeName: 24.8, tapRu: 25.85, typeRu: 26.0, kb2: 26.8,
    tapCat: 27.3, tapCatOpt: 28.0, tapPrice: 28.7, typePrice: 28.95, kb3: 29.5, pe4: 29.6,
    s7: 30.0, peScroll3: 30.2, tapUnit: 31.4, tapDesc: 32.1, typeDesc: 32.3, kb4: 33.9,
    s8: 34.6, peScroll4: 34.8, tapPre: 35.9, typePre: 36.1, kb5: 36.5, tapPickup: 37.1,
    s9: 39.0, peScroll5: 39.2, tapKichik: 40.4, tapKatta: 41.3,
    s10: 42.8, tapSave: 43.8, d1Close: 44.1, saved: 44.45,
    s11: 46.6, tapNavOrd: 47.6, tapOrder: 48.6, d2: 48.7, odScroll1: 49.4, tapConfirm: 51.6,
    s12: 53.2, odScroll2: 53.4, tapTrack: 54.6, typeTrack: 54.8, kb6: 55.9, tapShip: 56.5, tapClose2: 58.2,
    s13: 59.0, navSwipe1: 59.5, tapNavStock: 60.3, stScroll: 60.9, tapIn: 62.2, d3: 62.3, tapPlus: 63.4, tapStockSave: 64.4, tapClose3: 66.0,
    s14: 66.8, tapNavCat: 67.5, tapNavPromo: 69.4, prScroll: 70.3,
    s15: 72.6, tapNavCu: 73.4, tapText: 74.3, typeText: 74.5, kb7: 76.9, tapSend: 77.5, alert: 77.6, tapOk: 78.6,
    s16: 80.6, tapNavSet: 81.4, setScroll1: 82.2, setScroll2: 84.0, tapAnn: 85.6, typeAnn: 85.8, kb8: 88.0, tapSetSave: 88.6,
    s17: 90.2, navSwipe2: 90.6, tapNavDash: 91.4, phoneOut: 93.6, dur: 97.2,
  };
  const KEY = 0.06; // bitta harf yozilish vaqti
  const typeEnd = (t0, str, k = KEY) => t0 + [...str].length * k;
  T.typePassEnd = typeEnd(T.typePass, A.password, 0.075);
  T.typeNameEnd = typeEnd(T.typeName, A.product.name);
  T.typeRuEnd = typeEnd(T.typeRu, A.product.nameRu);
  T.typePriceEnd = typeEnd(T.typePrice, String(A.product.price), 0.08);
  T.typeDescEnd = typeEnd(T.typeDesc, A.product.desc, 0.045);
  T.typeTrackEnd = typeEnd(T.typeTrack, A.tracking, 0.055);
  T.typeTextEnd = typeEnd(T.typeText, A.broadcast, 0.034);
  T.typeAnnEnd = typeEnd(T.typeAnn, A.announcement, 0.04);

  // ---------- Joylashuv yordamchilari (ekran pt) ----------
  const center = (r, dx = 0, dy = 0) => ({ x: r.x + r.w / 2 + dx, y: r.y + r.h / 2 + dy });
  const pageAt = (r, scroll) => ({ x: r.x, y: CT + r.y - scroll, w: r.w, h: r.h });
  const bodyAt = (r, scroll) => ({ x: r.x, y: BODY + r.y - scroll, w: r.w, h: r.h });
  const footAt = (g, r) => ({ x: r.x, y: AT + g.footY + r.y, w: r.w, h: r.h });
  // Field (yozuv + input) dan faqat input qismi
  const inputOf = (r, h = 50) => ({ x: r.x, y: r.y + r.h - h, w: r.w, h });
  const navItem = (s) => NAV.items[NAVS.indexOf(s)];
  const navCenter = (s) => {
    const it = navItem(s);
    return clamp(it.x + it.w / 2 - SW / 2, 0, NAV.w - SW);
  };
  // Menyudagi bo'lim tugmasi ekranda (berilgan surilishda); tugma chetda qisman ko'rinsa — ko'rinadigan qismining o'rtasi
  const navPt = (s, off) => {
    const it = navItem(s);
    const x0 = Math.max(it.x - off, 8), x1 = Math.min(it.x + it.w - off, SW - 8);
    return { x: (x0 + x1) / 2, y: AT + it.y + it.h / 2 };
  };

  // Silliq o'zgaruvchi qiymat: boshlang'ich v0, keyin [t0, t1, v] bo'yicha
  const track = (v0, keys) => (t) => {
    let v = v0;
    for (const [t0, t1, x] of keys) {
      if (t < t0) break;
      v = lerp(v, x, E.io3(pr(t, t0, t1)));
    }
    return v;
  };

  // ---------- Holatlar: menyu, sahifalar, drawerlar ----------
  const NAVSEQ = [
    [0, 'dashboard'], [T.tapNavProd, 'products'], [T.tapNavOrd, 'orders'], [T.tapNavStock, 'stock'], [T.tapNavCat, 'categories'],
    [T.tapNavPromo, 'promo'], [T.tapNavCu, 'customers'], [T.tapNavSet, 'settings'], [T.tapNavDash, 'dashboard'],
  ];
  const navOff = track(0, [
    [T.tapNavProd + 0.05, T.tapNavProd + 0.5, navCenter('products')],
    [T.tapNavOrd + 0.05, T.tapNavOrd + 0.5, navCenter('orders')],
    [T.navSwipe1, T.navSwipe1 + 0.4, 250],
    [T.tapNavStock + 0.05, T.tapNavStock + 0.5, navCenter('stock')],
    [T.tapNavCat + 0.05, T.tapNavCat + 0.5, navCenter('categories')],
    [T.tapNavPromo + 0.05, T.tapNavPromo + 0.5, navCenter('promo')],
    [T.tapNavCu + 0.05, T.tapNavCu + 0.5, navCenter('customers')],
    [T.tapNavSet + 0.05, T.tapNavSet + 0.5, navCenter('settings')],
    [T.navSwipe2, T.navSwipe2 + 0.4, 0],
  ]);
  const navAt = (t) => NAVSEQ.filter(([t0]) => t >= t0).pop();
  const navPrev = (t) => {
    const i = NAVSEQ.indexOf(navAt(t));
    return i > 0 ? NAVSEQ[i - 1] : null;
  };

  // Sahifa almashinuvi (bo'lim tugmasi bosilganda) va bir bo'lim ichidagi holatlar (yangilangan sahifa)
  const PAGES = [
    { t: T.shell, im: 'dash', scroll: track(0, [[T.dScroll1, T.dScroll1 + 0.8, 520], [T.dScroll2, T.dScroll2 + 0.8, 1000]]) },
    { t: T.tapNavProd + 0.1, im: 'prod0', states: [[T.saved - 0.2, 'prod1']] },
    { t: T.tapNavOrd + 0.1, im: 'ord0', states: [[T.tapClose2, 'ord1']] },
    { t: T.tapNavStock + 0.1, im: 'st0', states: [[T.tapClose3, 'st1']], scroll: track(0, [[T.stScroll, T.stScroll + 0.6, 480]]) },
    { t: T.tapNavCat + 0.1, im: 'cat0' },
    { t: T.tapNavPromo + 0.1, im: 'promo0', scroll: track(0, [[T.prScroll, T.prScroll + 1.0, 1500]]) },
    { t: T.tapNavCu + 0.1, im: 'cu0', states: [[T.kb7, 'cu1'], [T.tapOk + 0.15, 'cu2']] },
    { t: T.tapNavSet + 0.1, im: 'set0', states: [[T.kb8, 'set1']], scroll: track(0, [[T.setScroll1, T.setScroll1 + 1.0, 900], [T.setScroll2, T.setScroll2 + 1.0, lay.set0.h - VIEW_H]]) },
    { t: T.tapNavDash + 0.1, im: 'dash' },
  ];
  const STOCK_SCROLL = 480, SET_SCROLL = lay.set0.h - VIEW_H;

  // Drawer holatlari: [vaqt, tanasi, pastki tugmalari]; holat almashganda yengil o'tish
  const PE = {
    open: T.d1, close: T.d1Close, head: 'pe0_head', g: lay.pe0,
    states: [[T.d1, 'pe0', 'pe0_foot'], [T.img, 'pe1'], [T.tapStage + 0.05, 'pe2'], [T.zoom0, 'pe3', null, T.zoom1 - T.zoom0], [T.pe4, 'pe4'], [T.kb4, 'pe5'], [T.kb5, 'pe6a'], [T.tapPickup + 0.05, 'pe6'], [T.tapKichik + 0.05, 'pe7'], [T.tapKatta + 0.05, 'pe8']],
  };
  const peField = lay.pe3.fields;
  const PE_S1 = 190;
  const PE_S2 = peField.name.y - 110; // nom maydoni drawer tepasiga yaqin
  const PE_S2b = PE_S2 + 150; // narx yozilganda klaviatura ustida qolishi uchun
  const PE_S3 = peField.unit.y - 110;
  const PE_S4 = peField.pre.y - 180;
  const PE_S5 = lay.pe6.sizes.y - 80;
  const peScroll = track(0, [
    [T.peScroll1, T.peScroll1 + 0.6, PE_S1], [T.peScroll2, T.peScroll2 + 0.7, PE_S2], [T.tapPrice - 0.25, T.tapPrice + 0.1, PE_S2b],
    [T.peScroll3, T.peScroll3 + 0.6, PE_S3], [T.peScroll4, T.peScroll4 + 0.6, PE_S4], [T.peScroll5, T.peScroll5 + 0.6, PE_S5],
  ]);
  const OD = {
    open: T.d2, close: T.tapClose2 + 0.05, head: 'od1_head', g: lay.od1,
    states: [[T.d2, 'od1', 'od1_foot'], [T.tapConfirm + 0.05, 'od2', 'od2_foot'], [T.kb6, 'od3'], [T.tapShip + 0.05, 'od4', 'od4_foot']],
  };
  const trackIn = inputOf(lay.od2.trackInput);
  const OD_S1 = lay.od1.receipt.y - 40, OD_S2 = trackIn.y - 200;
  const odScroll = track(0, [[T.odScroll1, T.odScroll1 + 0.6, OD_S1], [T.odScroll2, T.odScroll2 + 0.6, OD_S2]]);
  const SD = {
    open: T.d3, close: T.tapClose3 + 0.05, head: 'sd0_head', g: lay.sd0,
    states: [[T.d3, 'sd0', 'sd0_foot'], [T.tapPlus + 0.05, 'sd1', 'sd1_foot'], [T.tapStockSave + 0.05, 'sd2', 'sd2_foot']],
  };
  const DRAWERS = [[PE, peScroll], [OD, odScroll], [SD, () => 0]];
  const footG = { pe0_foot: lay.pe0, od1_foot: lay.od1, od2_foot: lay.od2, od4_foot: lay.od4, sd0_foot: lay.sd0, sd1_foot: lay.sd1, sd2_foot: lay.sd2 };

  // ---------- Yozilayotgan matnlar (maydon ichi keyingi holat rasmidan ochiladi) ----------
  // where: 'login' | 'page' | drawer obyekti; src — to'ldirilgan holat rasmi; until — asosiy rasm almashadigan vaqt
  const loginField = lay.login.field;
  const descF = peField.desc, preF = peField.pre;
  const FILLS = [
    { where: 'login', r: loginField, src: 'login1', str: '•'.repeat(A.password.length), t0: T.typePass, t1: T.typePassEnd, focus: T.tapPass, blur: T.kb1, until: T.shell, padR: 54 },
    { where: PE, r: peField.name, src: 'pe4', str: A.product.name, t0: T.typeName, t1: T.typeNameEnd, focus: T.tapName, blur: T.tapRu, until: T.pe4 },
    { where: PE, r: peField.nameRu, src: 'pe4', str: A.product.nameRu, t0: T.typeRu, t1: T.typeRuEnd, focus: T.tapRu, blur: T.kb2, until: T.pe4 },
    { where: PE, r: peField.cat, src: 'pe4', instant: T.tapCatOpt + 0.1, focus: T.tapCat, blur: T.tapCatOpt + 0.1, until: T.pe4 },
    { where: PE, r: peField.price, src: 'pe4', str: String(A.product.price), t0: T.typePrice, t1: T.typePriceEnd, focus: T.tapPrice, blur: T.kb3, until: T.pe4 },
    { where: PE, r: peField.unit, src: 'pe5', instant: T.tapUnit + 0.05, until: T.kb4 },
    { where: PE, r: descF, src: 'pe5', str: A.product.desc, t0: T.typeDesc, t1: T.typeDescEnd, focus: T.tapDesc, blur: T.kb4, until: T.kb4, area: true },
    { where: PE, r: preF, src: 'pe6a', str: '2', t0: T.typePre, t1: T.typePre + 0.1, focus: T.tapPre, blur: T.kb5, until: T.kb5 },
    { where: OD, r: trackIn, src: 'od3', str: A.tracking, t0: T.typeTrack, t1: T.typeTrackEnd, focus: T.tapTrack, blur: T.kb6, until: T.kb6 },
    { where: 'page', r: lay.cu0.text, src: 'cu1', str: A.broadcast, t0: T.typeText, t1: T.typeTextEnd, focus: T.tapText, blur: T.kb7, until: T.kb7, area: true },
    { where: 'page', r: lay.set0.annInput, src: 'set1', str: A.announcement, t0: T.typeAnn, t1: T.typeAnnEnd, focus: T.tapAnn, blur: T.kb8, until: T.kb8, area: true },
  ];
  const KB = [[T.tapPass, T.kb1], [T.tapName, T.kb2], [T.tapPrice, T.kb3], [T.tapDesc, T.kb4], [T.tapPre, T.kb5], [T.tapTrack, T.kb6], [T.tapText, T.kb7], [T.tapAnn, T.kb8]];

  // Matnni qatorlarga bo'lish (textarea uchun)
  const wrap = (c, str, maxW) => {
    const lines = [];
    let cur = '';
    for (const w of str.split(' ')) {
      const nx = cur ? cur + ' ' + w : w;
      if (c.measureText(nx).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = nx;
    }
    lines.push(cur);
    return lines;
  };
  // ---------- Barmoq ----------
  const L1 = lay.login;
  touch.show(3.45, { x: 260, y: 640 }).move(3.5, 3.8, center(loginField, -40)).tap(T.tapPass).hide(4.1);
  touch.show(5.2, { x: 260, y: 640 }).move(5.25, 5.5, center(L1.btn)).tap(T.tapLogin).hide(5.9);
  touch.swipe(T.dScroll1, T.dScroll1 + 0.45, { x: 280, y: 640 }, { x: 280, y: 330 });
  touch.swipe(T.dScroll2, T.dScroll2 + 0.45, { x: 280, y: 660 }, { x: 280, y: 330 });
  const navTap = (s, t, from) => touch.show(t - 0.45, from).move(t - 0.4, t - 0.1, navPt(s, navOff(t - 0.1))).tap(t).hide(t + 0.3);
  navTap('products', T.tapNavProd, { x: 250, y: 300 });
  touch.show(13.8, { x: 230, y: 480 }).move(13.85, 14.15, center(pageAt(lay.prod0.add, 0))).tap(T.tapAdd).hide(14.55);
  const imgR = bodyAt(lay.pe0.img, 0);
  // iOS fayl tanlash menyusi: "+" ostida
  const MENU = { x: imgR.x, y: imgR.y + imgR.h + 8, w: 250, rowH: 44 };
  touch.show(16.0, { x: 220, y: 420 }).move(16.05, 16.3, center(imgR)).tap(T.tapImg).move(16.85, 17.05, { x: MENU.x + 70, y: MENU.y + MENU.rowH / 2 }).tap(T.tapLib).hide(17.5);
  const stage = (s) => bodyAt(lay.pe1.stage, s);
  const stagePt = (s) => ({ x: stage(s).x + stage(s).w * A.frame.x / 100, y: stage(s).y + stage(s).h * A.frame.y / 100 });
  touch.show(20.3, { x: 300, y: 560 }).move(20.35, 20.6, stagePt(PE_S1)).tap(T.tapStage).hide(21.0);
  const range = bodyAt(lay.pe1.range, PE_S1);
  const thumbX = (z) => range.x + 8 + (range.w - 16) * (z - 1) / 1.5;
  touch.show(T.zoom0 - 0.3, { x: thumbX(1) + 30, y: range.y + 60 }).move(T.zoom0 - 0.25, T.zoom0 - 0.05, { x: thumbX(1), y: range.y + 8 })
    .move(T.zoom0, T.zoom1, { x: thumbX(1 + A.frame.steps * 0.05), y: range.y + 8 }).hide(T.zoom1 + 0.2);
  const pf = (k, s) => center(bodyAt(peField[k], s), -60);
  touch.show(24.2, { x: 300, y: 520 }).move(24.25, 24.5, pf('name', PE_S2)).tap(T.tapName).move(25.45, 25.7, pf('nameRu', PE_S2)).tap(T.tapRu).hide(26.1);
  const catR = bodyAt(peField.cat, PE_S2);
  const CATS = ['—', '🎂 Tortlar', '🧁 Shirinliklar', '🥟 Yarim tayyor'];
  const SEL = { x: catR.x + 40, y: catR.y + catR.h + 6, w: 240, rowH: 44 };
  touch.show(26.95, { x: 300, y: 560 }).move(27.0, 27.2, center(catR, -60)).tap(T.tapCat)
    .move(27.65, 27.9, { x: SEL.x + 90, y: SEL.y + SEL.rowH * 1.5 }).tap(T.tapCatOpt)
    .move(28.35, 28.6, pf('price', PE_S2b)).tap(T.tapPrice).hide(28.9);
  const unitChip = bodyAt(lay.pe5.unitChip, PE_S3);
  touch.show(31.0, { x: 300, y: 560 }).move(31.05, 31.3, center(unitChip)).tap(T.tapUnit).move(31.75, 32.0, center(bodyAt(descF, PE_S3), -60)).tap(T.tapDesc).hide(32.4);
  const pickupR = bodyAt(lay.pe6a.pickup, PE_S4);
  touch.show(35.5, { x: 300, y: 560 }).move(35.55, 35.8, center(bodyAt(preF, PE_S4), -60)).tap(T.tapPre).hide(36.2);
  touch.show(36.7, { x: 260, y: 600 }).move(36.75, 37.0, { x: pickupR.x + 21, y: pickupR.y + pickupR.h / 2 }).tap(T.tapPickup).hide(37.5);
  const kichik = bodyAt(lay.pe6.kichik, PE_S5), katta = bodyAt(lay.pe7.katta, PE_S5);
  touch.show(40.0, { x: 300, y: 560 }).move(40.05, 40.3, center(kichik)).tap(T.tapKichik).move(40.9, 41.2, center(katta)).tap(T.tapKatta).hide(41.6);
  const peSave = footAt(lay.pe0, lay.pe0.foot.btn0);
  touch.show(43.4, { x: 260, y: 640 }).move(43.45, 43.7, center(peSave)).tap(T.tapSave).hide(44.0);
  const card = pageAt(lay.prod1.first, 0);
  navTap('orders', T.tapNavOrd, { x: 250, y: 330 });
  touch.show(48.2, { x: 260, y: 560 }).move(48.25, 48.5, center(pageAt(lay.ord0.first, 0))).tap(T.tapOrder).hide(48.8);
  const confirmBtn = footAt(lay.od1, lay.od1.foot.btn0);
  touch.show(51.2, { x: 260, y: 640 }).move(51.25, 51.5, center(confirmBtn)).tap(T.tapConfirm).hide(51.9);
  touch.show(54.2, { x: 300, y: 560 }).move(54.25, 54.5, center(bodyAt(trackIn, OD_S2), -60)).tap(T.tapTrack).hide(54.8);
  const shipBtn = footAt(lay.od2, lay.od2.foot.btn0);
  touch.show(56.1, { x: 260, y: 640 }).move(56.15, 56.4, center(shipBtn)).tap(T.tapShip).hide(56.8);
  const closeBtn = { x: SW - 14 - 21, y: AT + HEAD / 2 };
  touch.show(57.8, { x: 280, y: 300 }).move(57.85, 58.1, closeBtn).tap(T.tapClose2).hide(58.5);
  touch.swipe(T.navSwipe1, T.navSwipe1 + 0.4, { x: 320, y: AT + NAV_H / 2 }, { x: 320 - (250 - navCenter('orders')), y: AT + NAV_H / 2 });
  navTap('stock', T.tapNavStock, { x: 250, y: 300 });
  touch.swipe(T.stScroll, T.stScroll + 0.45, { x: 120, y: 660 }, { x: 120, y: 330 });
  const inBtn = pageAt(lay.st0.inBtn, STOCK_SCROLL);
  touch.show(61.8, { x: 300, y: 560 }).move(61.85, 62.1, center(inBtn)).tap(T.tapIn).hide(62.5);
  const plus10 = bodyAt(lay.sd0.plus10, 0);
  touch.show(63.0, { x: 260, y: 560 }).move(63.05, 63.3, center(plus10)).tap(T.tapPlus).hide(63.7);
  const stockSave = footAt(lay.sd1, lay.sd1.foot.btn0);
  touch.show(64.0, { x: 260, y: 640 }).move(64.05, 64.3, center(stockSave)).tap(T.tapStockSave).hide(64.7);
  touch.show(65.6, { x: 280, y: 300 }).move(65.65, 65.9, closeBtn).tap(T.tapClose3).hide(66.3);
  navTap('categories', T.tapNavCat, { x: 250, y: 300 });
  navTap('promo', T.tapNavPromo, { x: 250, y: 300 });
  touch.swipe(T.prScroll, T.prScroll + 0.5, { x: 300, y: 680 }, { x: 300, y: 300 });
  navTap('customers', T.tapNavCu, { x: 250, y: 300 });
  const textR = pageAt(lay.cu0.text, 0);
  touch.show(73.9, { x: 300, y: 560 }).move(73.95, 74.2, center(textR)).tap(T.tapText).hide(74.5);
  const sendBtn = pageAt(lay.cu0.send, 0);
  // iOS tasdiqlash oynasi (confirm): o'lchami matnga qarab
  const mc = document.createElement('canvas').getContext('2d');
  mc.font = S(600, 16);
  const ALERT = { w: 270, x: (SW - 270) / 2 };
  ALERT.lines = wrap(mc, A.confirm, ALERT.w - 32);
  ALERT.h = 20 + ALERT.lines.length * 21 + 18 + 44;
  ALERT.y = (SH - ALERT.h) / 2;
  touch.show(77.1, { x: 260, y: 600 }).move(77.15, 77.4, center(sendBtn)).tap(T.tapSend)
    .move(78.15, 78.45, { x: ALERT.x + ALERT.w * 0.75, y: ALERT.y + ALERT.h - 22 }).tap(T.tapOk).hide(78.9);
  navTap('settings', T.tapNavSet, { x: 250, y: 300 });
  touch.swipe(T.setScroll1, T.setScroll1 + 0.5, { x: 300, y: 680 }, { x: 300, y: 300 });
  touch.swipe(T.setScroll2, T.setScroll2 + 0.5, { x: 300, y: 700 }, { x: 300, y: 260 });
  const annR = pageAt(lay.set0.annInput, SET_SCROLL);
  touch.show(85.2, { x: 300, y: 600 }).move(85.25, 85.5, center(annR)).tap(T.tapAnn).hide(85.8);
  const saveBar = { x: 14 + lay.savebar.btn.x, y: AT + lay.savebar.y + lay.savebar.btn.y, w: lay.savebar.btn.w, h: lay.savebar.btn.h };
  touch.show(88.2, { x: 260, y: 640 }).move(88.25, 88.5, center(saveBar)).tap(T.tapSetSave).hide(88.9);
  touch.swipe(T.navSwipe2, T.navSwipe2 + 0.4, { x: 70, y: AT + NAV_H / 2 }, { x: 330, y: AT + NAV_H / 2 });
  navTap('dashboard', T.tapNavDash, { x: 250, y: 300 });

  // ---------- Kamera ----------
  cam.to(3.2, 3.8, 1.4, AT + 430)
    .to(5.95, 6.45, 1)
    .to(6.9, 7.5, 1.45, 250)
    .to(T.dScroll1 + 0.1, T.dScroll1 + 0.8, 1.45, 330)
    .to(T.dScroll2 + 0.1, T.dScroll2 + 0.8, 1.4, 420)
    .to(11.3, 11.8, 1)
    .to(13.4, 13.9, 1.4, 330)
    .to(14.45, 14.9, 1)
    .to(15.3, 15.9, 1.6, 250)
    .to(T.peScroll1, T.peScroll1 + 0.6, 1.4, 400)
    .to(T.peScroll2, T.peScroll2 + 0.6, 1.45, 440)
    .to(T.peScroll3, T.peScroll3 + 0.6, 1.45, 420)
    .to(T.peScroll4, T.peScroll4 + 0.6, 1.45, 430)
    .to(T.peScroll5, T.peScroll5 + 0.6, 1.45, 330)
    .to(42.9, 43.4, 1.2, 640)
    .to(T.saved + 0.1, T.saved + 0.7, 1.45, card.y + 110)
    .to(46.6, 47.1, 1)
    .to(48.0, 48.5, 1.4, 380)
    .to(T.odScroll1, T.odScroll1 + 0.6, 1.3, 420)
    .to(51.0, 51.5, 1.2, 600)
    .to(T.odScroll2, T.odScroll2 + 0.6, 1.45, 420)
    .to(55.95, 56.35, 1.2, 620)
    .to(57.6, 58.0, 1)
    .to(T.stScroll + 0.1, T.stScroll + 0.7, 1.4, 380)
    .to(62.6, 63.1, 1.4, 350)
    .to(63.75, 64.15, 1.2, 600)
    .to(65.2, 65.6, 1)
    .to(T.prScroll + 0.2, T.prScroll + 0.8, 1.3, 450)
    .to(72.2, 72.6, 1)
    .to(73.8, 74.3, 1.45, 420)
    .to(79.6, 80.2, 1)
    .to(T.setScroll1 + 0.1, T.setScroll1 + 0.7, 1.3, 400)
    .to(T.setScroll2 + 0.1, T.setScroll2 + 0.7, 1.4, 520)
    .to(88.05, 88.4, 1.2, 620)
    .to(89.6, 90.2, 1);

  // ---------- Ovoz effektlari ----------
  const keys = (t0, t1, n, g = 0.35) => {
    for (let i = 0; i < n; i++) cue(t0 + ((t1 - t0) * i) / n, 'key', g);
  };
  for (const f of FILLS) if (f.str) keys(f.t0, f.t1, Math.min([...f.str].length, 40));
  for (const [a, b] of KB) cue(b, 'swish', 0.35);
  cue(T.shell, 'open'); cue(T.shell + 0.35, 'ding', 0.6);
  cue(T.d1, 'sheet'); cue(T.tapImg + 0.05, 'pop', 0.6); cue(T.upload, 'load', 0.6); cue(T.img, 'pop'); cue(T.img + 0.05, 'sparkle', 0.5);
  cue(T.tapStage + 0.05, 'pop', 0.6); cue(T.tapCat + 0.05, 'pop', 0.5); cue(T.tapUnit + 0.05, 'pop', 0.6); cue(T.tapPickup + 0.05, 'pop', 0.7);
  cue(T.tapKichik + 0.05, 'pop', 0.6); cue(T.tapKatta + 0.05, 'pop', 0.6);
  cue(T.tapSave + 0.1, 'ding', 0.8); cue(T.d1Close, 'swish', 0.6); cue(T.saved, 'success'); cue(T.saved + 0.05, 'sparkle', 0.8);
  cue(T.d2, 'sheet'); cue(T.tapConfirm + 0.1, 'ding', 0.8); cue(T.tapShip + 0.1, 'send'); cue(T.tapClose2 + 0.05, 'swish', 0.6);
  cue(T.d3, 'sheet'); cue(T.tapPlus + 0.05, 'pop', 0.6); cue(T.tapStockSave + 0.1, 'ding', 0.8); cue(T.tapClose3 + 0.05, 'swish', 0.6);
  cue(T.alert, 'pop', 0.6); cue(T.tapOk + 0.1, 'send'); cue(T.tapOk + 0.3, 'success', 0.7);
  cue(T.tapSetSave + 0.1, 'ding', 0.8); cue(T.tapSetSave + 0.15, 'success', 0.7);
  cue(T.tapNavDash + 0.3, 'success2', 0.8);

  // ---------- Chizish yordamchilari ----------
  // Rasm bo'lagi (pt): manba (sx, sy, w, h) → ekranga (dx, dy)
  const blit = (c, im, sx, sy, w, h, dx, dy) => {
    if (!im || w <= 0 || h <= 0) return;
    const sh = Math.min(h, im.height / DS - sy);
    if (sh <= 0) return;
    c.drawImage(im, sx * DS, sy * DS, w * DS, sh * DS, dx, dy, w, sh);
  };
  const press = (c, r, a = 1, rad = 14) => fillRR(c, r.x, r.y, r.w, r.h, rad, `rgba(74,36,68,${0.14 * a})`);
  const pressed = (t, t0, d = 0.18) => t >= t0 && t < t0 + d;
  // Fokusdagi maydon halqasi (admin paneldagi :focus)
  const ring = (c, r, a = 1) => {
    if (a <= 0) return;
    c.save();
    c.globalAlpha *= a;
    c.strokeStyle = 'rgba(248,160,208,0.3)';
    c.lineWidth = 4;
    rr(c, r.x - 2.5, r.y - 2.5, r.w + 5, r.h + 5, 14.5);
    c.stroke();
    c.strokeStyle = C.ribbon;
    c.lineWidth = 1.5;
    rr(c, r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5, 11.25);
    c.stroke();
    c.restore();
  };
  // E'tiborni tortish: pushti yonib-o'chuvchi chegara
  const glow = (c, r, a, rad = 18) => {
    if (a <= 0) return;
    c.save();
    shadow(c, 16 * a, `rgba(217,79,147,${0.6 * a})`);
    c.strokeStyle = `rgba(244,143,184,${a})`;
    c.lineWidth = 2.5;
    rr(c, r.x - 2, r.y - 2, r.w + 4, r.h + 4, rad);
    c.stroke();
    c.restore();
  };
  const pulse = (t, a, b) => vis(t, a, b, 0.2, 0.25) * (0.7 + 0.3 * Math.sin(t * 9));
  // Admin panel xabari (toast): tepada, to'q olxo'ri
  const toast = (c, msg, t, t0, d = 2.0) => {
    if (t < t0 || t > t0 + d + 0.25) return;
    const p = E.out3(pr(t, t0, t0 + 0.35)), q = 1 - pr(t, t0 + d, t0 + d + 0.25);
    c.save();
    c.globalAlpha = p * q;
    c.font = F(600, 14);
    const w = Math.min(SW - 32, c.measureText(msg).width + 36);
    const y = AT + 14 - 16 * (1 - p);
    shadow(c, 18, 'rgba(74,36,68,0.25)', 6);
    fillRR(c, SW / 2 - w / 2, y, w, 44, 22, C.plum);
    noShadow(c);
    text(c, msg, SW / 2, y + 27, F(600, 14), '#fff', 'center');
    c.restore();
  };
  // Yozilayotgan matn: maydon ichi keyingi holat rasmidan chapdan o'ngga (qatorma-qator) ochiladi + kursor
  const typing = (c, f, dst, src, t) => {
    const p = f.instant != null ? (t >= f.instant ? 1 : 0) : pr(t, f.t0, f.t1);
    const focused = f.focus != null && t >= f.focus + 0.05 && t < (f.blur ?? Infinity);
    if (p <= 0 && !focused) return;
    const { x, y, w, h } = dst;
    if (f.instant != null || !f.str) {
      if (p > 0) blit(c, IMG['a_' + f.src], src.x, src.y, w, h, x, y);
      if (focused) ring(c, dst);
      return;
    }
    c.font = F(500, 16);
    const area = !!f.area;
    const lines = area ? wrap(c, f.str, w - 32) : [f.str];
    const total = lines.reduce((s, l) => s + [...l].length, 0);
    let n = Math.floor(total * clamp(p));
    fillRR(c, x + 2, y + 2, w - 4 - (f.padR || 0), h - 4, 10, '#fff');
    let cx = x + 16, cy = area ? y + 12 : y + h / 2 - 11;
    lines.forEach((ln, i) => {
      const chars = [...ln];
      const k = Math.min(chars.length, n);
      n -= k;
      if (k <= 0) return;
      const lw = c.measureText(chars.slice(0, k).join('')).width;
      const full = k === chars.length && (i < lines.length - 1 || p >= 1);
      const ly = area ? y + 12 + i * 22.4 : y;
      const lh = area ? 22.4 : h;
      c.save();
      c.beginPath();
      c.rect(x + 2, ly, full ? w - 4 - (f.padR || 0) : 14 + lw + 1, lh);
      c.clip();
      blit(c, IMG['a_' + f.src], src.x, src.y + (ly - y), w, lh, x, ly);
      c.restore();
      cx = x + 16 + lw;
      cy = area ? ly : y + h / 2 - 11;
    });
    if (focused) {
      ring(c, dst);
      if (Math.floor(t * 2.6) % 2 === 0 || p < 1) fillRR(c, cx + 1, cy, 2, 22, 1, '#007AFF');
    }
  };
  const fillsAt = (c, t, where, toScreen) => {
    for (const f of FILLS) {
      if (f.where !== where || t >= f.until + 0.02) continue;
      typing(c, f, toScreen(f.r), f.r, t);
    }
  };
  // iOS menyu (select va fayl tanlash): oq, yumaloq, yumshoq soya
  const menu = (c, m, items, p, sel, pressI) => {
    if (p <= 0) return;
    const h = items.length * m.rowH;
    const k = lerp(0.85, 1, E.out3(clamp(p)));
    c.save();
    c.globalAlpha = clamp(p);
    c.translate(m.x, m.y);
    c.scale(k, k);
    shadow(c, 40, 'rgba(0,0,0,0.22)', 12);
    fillRR(c, 0, 0, m.w, h, 13, 'rgba(250,250,252,0.98)');
    noShadow(c);
    items.forEach((it, i) => {
      if (pressI === i) fillRR(c, 0, i * m.rowH, m.w, m.rowH, i === 0 ? 13 : 0, 'rgba(0,0,0,0.08)');
      if (i) {
        c.fillStyle = 'rgba(60,60,67,0.18)';
        c.fillRect(0, i * m.rowH, m.w, 0.6);
      }
      if (sel === i) text(c, '✓', 16, i * m.rowH + 28, S(600, 16), '#000');
      text(c, it, sel == null ? 16 : 38, i * m.rowH + 28, S(400, 16.5), '#000');
    });
    c.restore();
  };
  // Rasm yuklanayotganda aylanayotgan belgi
  const spinner = (c, cx, cy, t) => {
    c.save();
    c.strokeStyle = C.soft;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cy, 12, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = C.ribbon;
    c.beginPath();
    c.arc(cx, cy, 12, t * 8, t * 8 + Math.PI * 0.6);
    c.stroke();
    c.restore();
  };
  // iOS tasdiqlash oynasi
  const alertBox = (c, t) => {
    const p = vis(t, T.alert, T.tapOk + 0.05, 0.25, 0.2);
    if (p <= 0) return;
    c.fillStyle = `rgba(0,0,0,${0.3 * p})`;
    c.fillRect(0, 0, SW, SH);
    const { lines, h, y } = ALERT;
    const k = lerp(1.12, 1, E.out3(clamp(p)));
    c.save();
    c.globalAlpha = clamp(p);
    c.translate(SW / 2, y + h / 2);
    c.scale(k, k);
    c.translate(-SW / 2, -(y + h / 2));
    fillRR(c, ALERT.x, y, ALERT.w, h, 14, 'rgba(242,242,246,0.98)');
    lines.forEach((ln, i) => text(c, ln, SW / 2, y + 34 + i * 21, S(600, 16), '#000', 'center'));
    c.fillStyle = 'rgba(60,60,67,0.3)';
    c.fillRect(ALERT.x, y + h - 44, ALERT.w, 0.6);
    c.fillRect(SW / 2, y + h - 44, 0.6, 44);
    if (pressed(t, T.tapOk, 0.2)) fillRR(c, SW / 2, y + h - 44, ALERT.w / 2, 44, 0, 'rgba(0,0,0,0.08)');
    text(c, A.cancel, ALERT.x + ALERT.w * 0.25, y + h - 16, S(400, 17), C.ios, 'center');
    text(c, A.ok, ALERT.x + ALERT.w * 0.75, y + h - 16, S(600, 17), C.ios, 'center');
    c.restore();
  };

  // ---------- Ekran qismlari ----------
  const login = (c, t) => {
    const im = IMG.a_login0;
    c.drawImage(im, 0, 0, im.width, 1, 0, 0, SW, AT);
    c.drawImage(im, 0, AT, SW, im.height / DS);
    // "Kirish" tugmasi parol yozilgach faollashadi
    const on = pr(t, T.typePassEnd - 0.1, T.typePassEnd + 0.1);
    if (on > 0) {
      c.save();
      c.globalAlpha = on;
      const b = L1.btn;
      blit(c, IMG.a_login1, b.x - 10, b.y - 10, b.w + 20, b.h + 24, b.x - 10, AT + b.y - 10);
      c.restore();
    }
    fillsAt(c, t, 'login', (r) => ({ x: r.x, y: AT + r.y, w: r.w, h: r.h }));
    const b = { x: L1.btn.x, y: AT + L1.btn.y, w: L1.btn.w, h: L1.btn.h };
    if (pressed(t, T.tapLogin, 0.3)) press(c, b, 1, 26);
    if (t >= T.tapLogin + 0.1) {
      fillRR(c, b.x + 4, b.y + 4, b.w - 8, b.h - 8, 22, '#EE8DBE');
      text(c, A.login, SW / 2, b.y + b.h / 2 + 5, F(700, 15), '#fff', 'center');
    }
  };
  const pageNow = (t) => PAGES.filter((p) => t >= p.t).pop();
  const pageIm = (pg, t) => {
    let im = pg.im, t0 = pg.t;
    for (const [ts, k] of pg.states || []) if (t >= ts) [im, t0] = [k, ts];
    return { im, t0 };
  };
  const drawPage = (c, t) => {
    const pg = pageNow(t);
    const scroll = pg.scroll ? pg.scroll(t) : 0;
    const { im, t0 } = pageIm(pg, t);
    // bo'lim almashganda yengil "pageIn", holat almashganda — yumshoq o'tish
    const prev = PAGES[PAGES.indexOf(pg) - 1];
    c.save();
    c.beginPath();
    c.rect(0, CT, SW, VIEW_H);
    c.clip();
    if (t < pg.t + 0.3 && prev) {
      const q = E.out3(pr(t, pg.t, pg.t + 0.3));
      const pi = pageIm(prev, pg.t - 0.01).im;
      blit(c, IMG['a_' + pi], 0, prev.scroll ? prev.scroll(pg.t) : 0, SW, VIEW_H, 0, CT);
      c.globalAlpha = q;
      c.fillStyle = '#FFF0F7';
      c.fillRect(0, CT, SW, VIEW_H);
      c.translate(0, 8 * (1 - q));
    }
    const base = pg.states?.filter(([ts]) => ts <= t).length ? pageIm(pg, t0 - 0.01).im : null;
    if (base && t < t0 + 0.25) {
      blit(c, IMG['a_' + base], 0, scroll, SW, VIEW_H, 0, CT);
      c.globalAlpha *= E.io2(pr(t, t0, t0 + 0.25));
    }
    blit(c, IMG['a_' + im], 0, scroll, SW, VIEW_H, 0, CT);
    c.globalAlpha = 1;
    fillsAt(c, t, 'page', (r) => pageAt(r, scroll));
    // bosilgan tugmalar
    if (pressed(t, T.tapAdd)) press(c, pageAt(lay.prod0.add, 0), 1, 19);
    if (pressed(t, T.tapOrder, 0.22)) press(c, pageAt(lay.ord0.first, 0), 1, 0);
    if (pressed(t, T.tapIn)) press(c, inBtn, 1, 17);
    if (pressed(t, T.tapSend)) press(c, sendBtn, 1, 19);
    glow(c, pageAt(lay.prod0.add, 0), pulse(t, T.s3 + 1.6, T.tapAdd), 20);
    glow(c, card, pulse(t, T.saved + 0.4, T.s11 - 0.3), 18);
    glow(c, pageAt(lay.st0.row, STOCK_SCROLL), pulse(t, T.stScroll + 0.7, T.tapIn - 0.1), 12);
    c.restore();
    // sozlamalar: "Saqlash" tasmasi pastda qotib turadi
    if (pg.im === 'set0') {
      blit(c, IMG.a_savebar, 0, 0, SW, SH - AT - lay.savebar.y, 0, AT + lay.savebar.y);
      if (pressed(t, T.tapSetSave, 0.2)) press(c, saveBar, 1, 26);
    }
  };
  const drawNav = (c, t) => {
    const off = navOff(t);
    c.fillStyle = C.plum;
    c.fillRect(0, 0, SW, CT);
    const [t0, s] = navAt(t);
    const prev = navPrev(t);
    const q = pr(t, t0, t0 + 0.2);
    if (prev && q < 1) blit(c, IMG['a_nav_' + prev[1]], off, 0, SW, NAV_H, 0, AT);
    c.save();
    c.globalAlpha = prev ? q : 1;
    blit(c, IMG['a_nav_' + s], off, 0, SW, NAV_H, 0, AT);
    c.restore();
  };
  const drawDrawer = (c, t, D, scrollFn) => {
    if (t < D.open || t > D.close + 0.35) return;
    const pIn = E.out3(pr(t, D.open, D.open + 0.35)), pOut = E.in2(pr(t, D.close, D.close + 0.3));
    const p = pIn * (1 - pOut);
    c.fillStyle = `rgba(74,36,68,${0.4 * p})`;
    c.fillRect(0, AT, SW, SH - AT);
    const scroll = scrollFn(t);
    let cur = D.states[0], prev = null;
    for (const st of D.states) if (t >= st[0]) [prev, cur] = [cur, st];
    if (prev === cur) prev = null;
    const dur = cur[3] ?? 0.25;
    const q = prev ? E.io2(pr(t, cur[0], cur[0] + dur)) : 1;
    c.save();
    c.translate((1 - p) * SW, 0);
    shadow(c, 40, 'rgba(74,36,68,0.2)');
    c.fillStyle = '#FFF0F7';
    c.fillRect(0, AT, SW, SH - AT);
    noShadow(c);
    c.save();
    c.beginPath();
    c.rect(0, BODY, SW, SH - BODY);
    c.clip();
    if (prev && q < 1) blit(c, IMG['a_' + prev[1]], 0, scroll, SW, SH - BODY, 0, BODY);
    c.globalAlpha = q;
    blit(c, IMG['a_' + cur[1]], 0, scroll, SW, SH - BODY, 0, BODY);
    c.globalAlpha = 1;
    fillsAt(c, t, D, (r) => bodyAt(r, scroll));
    drawerExtras(c, t, D, scroll);
    c.restore();
    blit(c, IMG['a_' + D.head], 0, 0, SW, HEAD, 0, AT);
    if (t >= D.close - 0.2 && t < D.close + 0.1) fillRR(c, closeBtn.x - 21, closeBtn.y - 21, 42, 42, 21, 'rgba(74,36,68,0.12)');
    // pastki tugmalar: oxirgi berilgan
    const feet = D.states.filter((st) => st[2] && t >= st[0]);
    const fNow = feet[feet.length - 1], fPrev = feet[feet.length - 2];
    const fq = fPrev ? E.io2(pr(t, fNow[0], fNow[0] + 0.25)) : 1;
    const drawFoot = (k, a) => {
      const g = footG[k];
      c.globalAlpha = a;
      blit(c, IMG['a_' + k], 0, 0, SW, SH - AT - g.footY, 0, AT + g.footY);
      c.globalAlpha = 1;
    };
    if (fPrev && fq < 1) drawFoot(fPrev[2], 1 - fq);
    drawFoot(fNow[2], fq);
    footExtras(c, t, D);
    c.restore();
  };
  const drawerExtras = (c, t, D, scroll) => {
    if (D === PE) {
      // "+" bosilganda: menyu, yuklanish, rasm paydo bo'ladi
      if (pressed(t, T.tapImg, 0.2)) press(c, imgR, 1, 12);
      if (t >= T.upload && t < T.img) {
        fillRR(c, imgR.x + 2, imgR.y + 2, imgR.w - 4, imgR.h - 4, 10, '#fff');
        spinner(c, imgR.x + imgR.w / 2, imgR.y + imgR.h / 2, t);
      }
      glow(c, imgR, pulse(t, T.s4 + 0.6, T.tapImg), 14);
      const st = stage(scroll);
      glow(c, st, pulse(t, T.s5 + 0.9, T.tapStage - 0.05), 18);
      if (t >= T.tapStage && t < T.tapStage + 0.5) {
        const pt = stagePt(scroll), q = pr(t, T.tapStage, T.tapStage + 0.5);
        c.strokeStyle = `rgba(255,255,255,${1 - q})`;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(pt.x, pt.y, 14 + 30 * E.out3(q), 0, Math.PI * 2);
        c.stroke();
      }
      if (pressed(t, T.tapUnit)) press(c, unitChip, 1, 15);
      glow(c, bodyAt(lay.pe6a.pickup, scroll), pulse(t, T.s8 + 2.4, T.tapPickup - 0.05), 12);
      if (pressed(t, T.tapKichik)) press(c, bodyAt(lay.pe6.kichik, scroll), 1, 15);
      if (pressed(t, T.tapKatta)) press(c, bodyAt(lay.pe7.katta, scroll), 1, 15);
      glow(c, bodyAt(lay.pe8.sizes, scroll), pulse(t, T.tapKatta + 0.4, T.s10 - 0.2), 18);
    }
    if (D === OD) {
      glow(c, bodyAt(lay.od1.receipt, scroll), pulse(t, T.odScroll1 + 0.7, T.tapConfirm - 0.3), 18);
      // holat belgisi yangilanganda yonadi
      const sb = bodyAt(lay.od2.status, scroll);
      glow(c, sb, pulse(t, T.tapConfirm + 0.2, T.tapConfirm + 1.4) + pulse(t, T.tapShip + 0.2, T.tapShip + 1.4), 13);
    }
    if (D === SD) {
      if (pressed(t, T.tapPlus)) press(c, plus10, 1, 15);
      glow(c, bodyAt(lay.sd0.head, 0), pulse(t, T.tapStockSave + 0.3, T.tapClose3 - 0.3), 18);
    }
  };
  const footExtras = (c, t, D) => {
    if (D === PE) {
      glow(c, peSave, pulse(t, T.s10 + 0.5, T.tapSave), 20);
      if (pressed(t, T.tapSave, 0.22)) press(c, peSave, 1, 19);
    }
    if (D === OD) {
      glow(c, confirmBtn, pulse(t, T.tapConfirm - 1.2, T.tapConfirm), 20);
      if (pressed(t, T.tapConfirm, 0.22)) press(c, confirmBtn, 1, 19);
      glow(c, shipBtn, pulse(t, T.kb6 + 0.1, T.tapShip), 20);
      if (pressed(t, T.tapShip, 0.22)) press(c, shipBtn, 1, 19);
    }
    if (D === SD && pressed(t, T.tapStockSave, 0.22)) press(c, stockSave, 1, 26);
  };
  const keyboard = (c, t) => {
    for (const [a, b] of KB) {
      const k = E.out3(pr(t, a + 0.05, a + 0.35)) - E.in2(pr(t, b, b + 0.3));
      if (k > 0) UI.keyboard(c, 'ios', SH - UI.KB_H.ios * k);
    }
  };
  const shell = (c, t) => {
    c.fillStyle = '#FFF0F7';
    c.fillRect(0, CT, SW, SH - CT);
    drawPage(c, t);
    drawNav(c, t);
    for (const [D, fn] of DRAWERS) drawDrawer(c, t, D, fn);
    // fayl tanlash va kategoriya menyulari
    menu(c, MENU, A.fileMenu, vis(t, T.tapImg + 0.1, T.tapLib + 0.08, 0.2, 0.15), null, pressed(t, T.tapLib, 0.2) ? 0 : null);
    menu(c, SEL, CATS, vis(t, T.tapCat + 0.1, T.tapCatOpt + 0.08, 0.2, 0.15), t >= T.tapCatOpt ? 1 : 0, pressed(t, T.tapCatOpt, 0.2) ? 1 : null);
    keyboard(c, t);
    alertBox(c, t);
    toast(c, A.saved, t, T.tapSave + 0.1);
    toast(c, A.savedNotify, t, T.tapConfirm + 0.1);
    toast(c, A.savedNotify, t, T.tapShip + 0.1);
    toast(c, A.stockSaved, t, T.tapStockSave + 0.1);
    toast(c, A.broadcastStarted, t, T.tapOk + 0.15);
    toast(c, A.settingsSaved, t, T.tapSetSave + 0.1);
  };
  const screen = (c, t) => {
    if (t < T.shell + 0.35) {
      login(c, t);
      keyboard(c, t);
      UI.statusBar(c, 'ios');
    }
    if (t >= T.shell) {
      c.save();
      c.globalAlpha = E.out3(pr(t, T.shell, T.shell + 0.35));
      shell(c, t);
      UI.statusBar(c, 'ios', true);
      c.restore();
    }
    UI.homeBar(c, 'ios');
  };

  return {
    T,
    screen,
    steps: [T.s1, T.s2, T.s3, T.s4, T.s5, T.s6, T.s7, T.s8, T.s9, T.s10, T.s11, T.s12, T.s13, T.s14, T.s15, T.s16, T.s17],
    texts: A.steps,
    labels: A.steps.map((_, i) => (i < A.steps.length - 1 ? L.step(i + 1) : '✓ TAYYOR')),
    intro: A.intro,
    introSub: A.intro_sub,
    outro: A.outro,
    sparkAt: { t: T.saved + 0.05, pt: center(card, 0, -30) },
    confetti: T.tapNavDash + 0.3,
    music: false,
  };
}
