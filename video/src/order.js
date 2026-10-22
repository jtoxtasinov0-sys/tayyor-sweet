// "Qanday buyurtma beriladi" videosi (iPhone): Telegram → mini ilova → mahsulot → savat → rasmiylashtirish → to'lov → holat.
// Mini ilova ekranlari — haqiqiy sahifa qatlamlari (shots-order.mjs), video ularni siljitadi, ochadi-yopadi va ustidan
// barmoq, klaviatura, yozilayotgan matn, bildirishnomalarni chizadi. Hammasi ekran pt birligida (390×845).
import { C, E, S, F, clamp, lerp, pr, vis, rr, fillRR, text, IMG, roundImg, shadow, noShadow, G, layoutRich, drawRich } from './core.js';
import { L } from './strings.js';
import * as UI from './ui.js';
import { appIcon } from './icons.js';

const O = L.order;
const { SW, SH, SB } = UI.DEV.ios;
const AT = SB + 44; // mini ilova oynasining yuqorisi (Telegram paneli ostida)
const KB_TOP = SH - UI.KB_H.ios;

// Yon tomondagi mahsulot rasmlari (kanvas px): x, y, radius, rasm, xiralik (chuqurlik hissi)
const CIRCLES = [
  [155, 705, 92, 'c1', 0],
  [928, 690, 90, 'c2', 0],
  [138, 1365, 100, 'c3', 3],
  [945, 1335, 98, 'c4', 2.5],
  [172, 1772, 78, 'c5', 4.5],
  [905, 1748, 80, 'c6', 5],
];
export const ORDER_IMAGES = {
  c1: '/miniapp/public/rasmlar/23_maxroviy_tort.jpg',
  c2: '/miniapp/public/rasmlar/22_manti.jpg',
  c3: '/miniapp/public/rasmlar/03_mevali_tort.jpg',
  c4: '/miniapp/public/rasmlar/14_afgoncha_napoleon.jpg',
  c5: '/miniapp/public/rasmlar/01_paxlava.jpg',
  c6: '/miniapp/public/rasmlar/09_trayfl.jpg',
  prod: '/miniapp/public/rasmlar/03_mevali_tort.jpg',
  ...Object.fromEntries(
    ['home', 'nav0', 'nav1', 'navc', 'navo', 'ps0', 'ps1', 'pf0', 'pf1', 'cart', 'cta', 'cs0', 'cs1', 'cs2', 'cf', 'cfb', 'pay0', 'pay1', 'ord1', 'ord2', 'orders']
      .map((k) => ['o_' + k, `/video/assets/shots/order/${k}.png`])
  ),
};

// cubic-bezier(0.22, 1, 0.36, 1) ga yaqin — mini ilovadagi oyna ochilishi
const easeApp = E.out5;

// Oyna (bottom sheet) holati: 1 — yashirin (pastda), 0 — ochiq. Ochilish 0.42 s, yopilish 0.28 s
function slide(t, open, close = Infinity) {
  if (t < open) return 1;
  if (t >= close) return E.in2(pr(t, close, close + 0.28));
  return 1 - easeApp(pr(t, open, open + 0.42));
}

export function buildOrder({ touch, cam, cue }, tl, lay) {
  const DS = lay.dsf;
  const T = {
    phoneIn: 2.0, s1: 2.6, msg: 2.6, tapShop: 4.3, open: 4.45, alt: 5.9,
    s2: 7.5, scroll: 8.0, tapCard: 9.5, ps: 9.65,
    s3: 10.7, psScroll: 11.0, tapVar: 12.1, tapAdd: 13.2,
    s4: 14.6, tapCart: 15.4, tapCta: 16.9, cs: 17.05,
    s5: 17.9, tapMethod: 18.6, csScroll: 19.2, tapPhone: 20.0, typePhone: 20.3, tapAddr: 21.6, typeAddr: 21.9, kbDown: 23.2,
    csScroll2: 23.4, tapConfirm: 24.4, pay: 24.95,
    s6: 25.6, payScroll: 26.6, tapUpload: 27.5, file: 27.9, payScroll2: 28.5, tapSend: 29.3, ord: 29.75,
    s7: 30.4, notif: 31.3, confirmed: 31.9, phoneOut: 34.6, dur: 37.6,
  };
  T.typePhoneEnd = T.typePhone + O.phone.length * 0.065;
  T.typeAddrEnd = T.typeAddr + [...O.address].length * 0.06;
  T.flyEnd = T.tapAdd + 0.75;

  // ---------- Joylashuv (ekran pt) ----------
  const ps = lay.ps, cs = lay.cs, pay = lay.pay, ord = lay.ord;
  const sheetTop = (g) => AT + g.top;
  const HOME_SCROLL = 640;
  const PS_SCROLL = ps.h - ps.viewH;
  const CS_TYPE = 260, CS_END = cs.h - cs.viewH;
  const PAY_S1 = pay.h - pay.viewH, PAY_S2 = pay.h1 - pay.viewH;
  const center = (r, dy = 0) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 + dy });
  const inSheet = (g, r, scroll) => center(r, sheetTop(g) - scroll);
  const card = center(lay.home.card, AT - HOME_SCROLL);
  const cartBtn = center(lay.nav0.cart, AT);
  const variant = inSheet(ps, ps.variant, PS_SCROLL);
  const addBtn = center(lay.pf.btn, AT);
  const ctaBtn = center(lay.cta.btn, AT);
  const method = inSheet(cs, cs.method, 0);
  const [, fPhone, fAddr] = cs.fields;
  const phonePt = inSheet(cs, fPhone, CS_TYPE), addrPt = inSheet(cs, fAddr, CS_TYPE);
  const confirmBtn = center(lay.cf.btn, AT);
  const uploadPt = inSheet(pay, pay.upload, PAY_S1);
  const sendPt = inSheet(pay, pay.btn1, PAY_S2);
  const shopBtn = center(tl.shopBtn);

  // ---------- Barmoq ----------
  touch.show(3.5, { x: SW / 2 + 60, y: shopBtn.y + 130 }).move(3.6, 4.05, shopBtn).tap(T.tapShop).hide(4.6);
  touch.swipe(T.scroll, T.scroll + 0.45, { x: 260, y: 660 }, { x: 260, y: 330 });
  touch.show(9.0, { x: 190, y: 600 }).move(9.05, 9.35, card).tap(T.tapCard).hide(9.8);
  touch.swipe(T.psScroll, T.psScroll + 0.4, { x: 300, y: 600 }, { x: 300, y: 450 });
  touch.show(11.65, { x: 160, y: 720 }).move(11.7, 12.0, variant).tap(T.tapVar).move(12.55, 12.95, addBtn).tap(T.tapAdd).hide(13.45);
  touch.show(14.95, { x: 300, y: 610 }).move(15.0, 15.25, cartBtn).tap(T.tapCart).hide(15.7);
  touch.show(16.35, { x: 270, y: 560 }).move(16.4, 16.75, ctaBtn).tap(T.tapCta).hide(17.2);
  touch.show(18.2, { x: 270, y: 430 }).move(18.25, 18.5, method).tap(T.tapMethod).hide(18.85);
  touch.swipe(T.csScroll, T.csScroll + 0.45, { x: 300, y: 640 }, { x: 300, y: 390 });
  touch.show(19.75, { x: 280, y: 520 }).move(19.8, 19.95, { x: 140, y: phonePt.y }).tap(T.tapPhone).move(21.25, 21.5, { x: 140, y: addrPt.y }).tap(T.tapAddr).hide(21.85);
  touch.swipe(T.csScroll2, T.csScroll2 + 0.45, { x: 300, y: 600 }, { x: 300, y: 380 });
  touch.show(24.0, { x: 290, y: 640 }).move(24.05, 24.3, confirmBtn).tap(T.tapConfirm).hide(24.7);
  touch.swipe(T.payScroll, T.payScroll + 0.45, { x: 300, y: 640 }, { x: 300, y: 400 });
  touch.show(27.15, { x: 270, y: 660 }).move(27.2, 27.45, uploadPt).tap(T.tapUpload).hide(27.8);
  touch.swipe(T.payScroll2, T.payScroll2 + 0.35, { x: 300, y: 620 }, { x: 300, y: 470 });
  touch.show(28.95, { x: 280, y: 720 }).move(29.0, 29.2, sendPt).tap(T.tapSend).hide(29.6);

  // ---------- Kamera ----------
  cam.to(3.0, 3.7, 1.4, shopBtn.y)
    .to(T.open + 0.05, T.open + 0.65, 1)
    .to(11.2, 11.8, 1.45, 690)
    .to(T.tapAdd - 0.05, T.tapAdd + 0.45, 1)
    .to(15.8, 16.4, 1.25, 450)
    .to(T.cs - 0.05, T.cs + 0.45, 1)
    .to(19.5, 20.1, 1.45, 440)
    .to(23.4, 24.0, 1.3, 690)
    .to(T.pay - 0.05, T.pay + 0.45, 1)
    .to(25.7, 26.3, 1.35, 380)
    .to(26.7, 27.3, 1.35, 560)
    .to(T.tapSend + 0.1, T.tapSend + 0.6, 1)
    .to(30.5, 31.1, 1.35, 330)
    .to(T.phoneOut - 0.6, T.phoneOut - 0.1, 1);

  // ---------- Ovozlar ----------
  cue(T.msg, 'recv');
  cue(T.open, 'open'); cue(T.open + 0.55, 'ding', 0.7); cue(T.alt, 'pop');
  cue(T.ps, 'sheet'); cue(T.tapVar + 0.03, 'pop', 0.6);
  cue(T.tapAdd + 0.05, 'swish', 0.9); cue(T.flyEnd - 0.1, 'ding', 0.8); cue(T.flyEnd - 0.05, 'sparkle', 0.7);
  cue(T.tapCart + 0.05, 'swish', 0.6); cue(T.cs, 'sheet');
  for (let i = 0; i < O.phone.length; i++) cue(T.typePhone + i * 0.065, 'key', 0.45);
  for (let i = 0; i < [...O.address].length; i++) cue(T.typeAddr + i * 0.06, 'key', 0.45);
  cue(T.tapPhone + 0.05, 'pop', 0.4); cue(T.kbDown, 'swish', 0.5);
  cue(T.tapConfirm + 0.1, 'load', 0.6); cue(T.pay, 'sheet'); cue(T.pay + 0.1, 'success');
  cue(T.file, 'pop'); cue(T.tapSend + 0.1, 'send'); cue(T.ord, 'sheet', 0.7);
  cue(T.notif, 'recv'); cue(T.confirmed, 'ding'); cue(T.confirmed + 0.1, 'confetti'); cue(T.confirmed + 0.15, 'success2');

  // ---------- Holatlar ----------
  const homeScroll = (t) => HOME_SCROLL * E.out3(pr(t, T.scroll, T.scroll + 1.0));
  const psScroll = (t) => PS_SCROLL * E.out3(pr(t, T.psScroll, T.psScroll + 0.6));
  const csScroll = (t) => CS_TYPE * E.out3(pr(t, T.csScroll, T.csScroll + 0.65)) + (CS_END - CS_TYPE) * E.out3(pr(t, T.csScroll2, T.csScroll2 + 0.65));
  const payScroll = (t) => PAY_S1 * E.out3(pr(t, T.payScroll, T.payScroll + 0.65)) + (PAY_S2 - PAY_S1) * E.out3(pr(t, T.payScroll2, T.payScroll2 + 0.55));
  const pressed = (t, t0, d = 0.18) => t >= t0 && t < t0 + d;

  // ---------- Chizish yordamchilari ----------
  // Sahifa (ekran bo'yi), scroll — pt
  const page = (c, im, scroll = 0) => {
    const sy = clamp(scroll * DS, 0, im.height - (SH - AT) * DS);
    const h = Math.min((SH - AT) * DS, im.height - sy);
    c.drawImage(im, 0, sy, im.width, h, 0, AT, SW, h / DS);
  };
  const strip = (c, im, y) => c.drawImage(im, 0, AT + y, SW, im.height / DS);
  // Oyna: yuqori burchaklari yumaloq, ichi scroll bo'ladi; tutqich (handle) yuqorida qotib turadi
  const sheet = (c, g, ims, scroll, off) => {
    const y = sheetTop(g) + off * (g.viewH + 20);
    c.save();
    c.beginPath();
    c.roundRect(0, y, SW, SH - y + 40, [28, 28, 0, 0]);
    c.clip();
    for (const [im, a] of ims) {
      if (a <= 0) continue;
      c.globalAlpha = a;
      const sy = Math.max(0, scroll * DS);
      const h = Math.min(im.height - sy, (SH - y) * DS);
      if (h > 0) c.drawImage(im, 0, sy, im.width, h, 0, y, SW, h / DS);
    }
    c.globalAlpha = 1;
    fillRR(c, SW / 2 - 21, y + 8, 42, 5, 2.5, 'rgba(255,255,255,0.85)');
    c.restore();
    return y;
  };
  const backdrop = (c, a) => {
    if (a <= 0) return;
    c.fillStyle = `rgba(74,36,68,${0.45 * a})`;
    c.fillRect(0, AT, SW, SH - AT);
  };
  const press = (c, r, a = 1, rad = 16) => fillRR(c, r.x, r.y, r.w, r.h, rad, `rgba(74,36,68,${0.14 * a})`);
  const at = (r, dy) => ({ x: r.x, y: r.y + dy, w: r.w, h: r.h });
  // Mini ilova xabari (toast): tepada, to'q pushti
  const toast = (c, msg, t, t0, d = 2.2) => {
    if (t < t0 || t > t0 + d + 0.2) return;
    const p = E.out3(pr(t, t0, t0 + 0.35)), q = 1 - pr(t, t0 + d, t0 + d + 0.2);
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
  // Pastki menyu; savat tugmasi "sakraydi" (pop: 1 → 1.25 → 1)
  const nav = (c, im, bumpT, t) => {
    strip(c, im, lay.nav0.y);
    const q = bumpT == null ? -1 : pr(t, bumpT, bumpT + 0.45);
    if (q <= 0 || q >= 1) return;
    const k = q < 0.4 ? lerp(1, 1.25, E.out2(q / 0.4)) : lerp(1.25, 1, E.io2((q - 0.4) / 0.6));
    const b = lay.nav0.cart, cx = b.x + b.w / 2, cy = AT + b.y + b.h / 2;
    const sx = (cx - 44) * DS, sy = (b.y + b.h / 2 - 44 - lay.nav0.y) * DS;
    c.save();
    c.translate(cx, cy);
    c.scale(k, k);
    c.beginPath();
    c.arc(0, 0, 44, 0, Math.PI * 2);
    c.clip();
    c.drawImage(im, sx, sy, 88 * DS, 88 * DS, -44, -44, 88, 88);
    c.restore();
  };
  // Yozilayotgan matn: keyingi (to'ldirilgan) rasmdan maydon ichi chapdan o'ngga ochiladi + kursor
  const typing = (c, field, sy, scroll, im, str, p, caret, t) => {
    const x = field.x, y = sy + field.y - scroll, w = field.w, h = field.h;
    const chars = [...str];
    const n = Math.floor(chars.length * clamp(p));
    c.font = F(400, 16);
    const tw = c.measureText(chars.slice(0, n).join('')).width;
    if (p > 0) {
      fillRR(c, x + 2, y + 2, w - 4, h - 4, 10, '#fff');
      c.save();
      c.beginPath();
      c.rect(x + 2, y + 2, Math.min(w - 4, 14 + tw + (n === chars.length ? 40 : 1)), h - 4);
      c.clip();
      c.drawImage(im, x * DS, (field.y) * DS, w * DS, h * DS, x, y, w, h);
      c.restore();
    }
    // fokus halqasi
    c.save();
    c.strokeStyle = 'rgba(248,160,208,0.28)';
    c.lineWidth = 4;
    rr(c, x - 2.5, y - 2.5, w + 5, h + 5, 14.5);
    c.stroke();
    c.strokeStyle = C.ribbon;
    c.lineWidth = 1.5;
    rr(c, x + 0.75, y + 0.75, w - 1.5, h - 1.5, 11.25);
    c.stroke();
    c.restore();
    if (caret && Math.floor(t * 2.6) % 2 === 0) {
      const ty = field.h > 60 ? y + 13 : y + h / 2 - 11;
      fillRR(c, x + 16 + tw + 1, ty, 2, 22, 1, '#007AFF');
    }
  };
  // Mahsulot rasmi savat tugmasiga uchadi (mini ilovadagi .fly: 0.75 s, avval biroz orqaga)
  const fly = (c, t, from, to) => {
    const q = pr(t, T.tapAdd + 0.02, T.flyEnd);
    if (q <= 0 || q >= 1) return;
    const e = q * q * (2.3 * q - 1.3);
    const x = lerp(from.x, to.x, e), y = lerp(from.y, to.y, e);
    const s = lerp(120, 18, E.in2(q));
    c.save();
    c.globalAlpha = lerp(1, 0.4, E.in2(q));
    shadow(c, 18, 'rgba(244,143,184,0.55)', 8);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(x, y, s / 2 + 3, 0, Math.PI * 2);
    c.fill();
    noShadow(c);
    const im = IMG.prod, m = Math.min(im.width, im.height);
    c.beginPath();
    c.arc(x, y, s / 2, 0, Math.PI * 2);
    c.clip();
    c.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, x - s / 2, y - s / 2, s, s);
    c.restore();
  };
  // iPhone bildirishnomasi (Telegram'dan)
  const notification = (c, t) => {
    const p = vis(t, T.notif, T.phoneOut - 0.9, 0.45, 0.35);
    if (p <= 0) return;
    const body = layoutRich(c, [{ t: O.notif[0] + '\n' }, { t: O.notif[1], b: 1 }], SW - 18 - 71 - 14, 14.5, S);
    const h = 52 + body.lines.length * 19;
    const y = lerp(-h - 20, SB + 4, E.back(clamp(p)));
    c.save();
    c.globalAlpha = clamp(p * 1.6);
    shadow(c, 24, 'rgba(0,0,0,0.22)', 8);
    fillRR(c, 9, y, SW - 18, h, 24, '#F7F7F9');
    noShadow(c);
    appIcon(c, 'telegram', 21, y + 14, 38, true);
    text(c, O.notifTitle, 71, y + 30, S(600, 15), '#000');
    text(c, O.now, SW - 25, y + 30, S(400, 13), '#8E8E93', 'right');
    drawRich(c, body, 71, y + 51, 19, '#000');
    c.restore();
  };
  // Telegram mini ilova paneli: "Закрыть", nom, "⋯" (sarlavha rangi — ilovaniki, #FFF0F7)
  const tgHeader = (c) => {
    c.fillStyle = '#FFF0F7';
    c.fillRect(0, 0, SW, AT);
    text(c, O.tgClose, 16, SB + 28, S(400, 17), C.ios);
    text(c, 'Tayyor & Sweet', SW / 2, SB + 19, S(600, 16.5), '#000', 'center');
    text(c, L.tg.bot, SW / 2, SB + 36, S(400, 13), '#8E8E93', 'center');
    c.save();
    c.strokeStyle = C.ios;
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(SW - 30, SB + 22, 13, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    G.dots(c, SW - 30, SB + 22, 19, C.ios);
  };

  // ---------- Mini ilova ichi ----------
  const app = (c, t) => {
    c.fillStyle = '#FFF0F7';
    c.fillRect(0, AT, SW, SH - AT);
    // 1) sahifa: bosh sahifa → savat → buyurtmalar (almashganda yengil "pageIn")
    const toCart = T.tapCart + 0.05, toOrders = T.tapSend + 0.15;
    const pageIn = (t0) => {
      const q = E.out3(pr(t, t0, t0 + 0.35));
      c.globalAlpha = q;
      c.translate(0, 8 * (1 - q));
    };
    if (t < toCart + 0.35) {
      page(c, IMG.o_home, homeScroll(t));
      if (pressed(t, T.tapCard, 0.2)) press(c, at(lay.home.card, AT - HOME_SCROLL), 1, 18);
    }
    if (t >= toCart && t < toOrders + 0.35) {
      c.save();
      if (t < toCart + 0.35) pageIn(toCart);
      page(c, IMG.o_cart);
      strip(c, IMG.o_cta, lay.cta.y);
      if (pressed(t, T.tapCta)) press(c, at(lay.cta.btn, AT), 1, 26);
      c.restore();
    }
    if (t >= toOrders) {
      c.save();
      pageIn(toOrders);
      page(c, IMG.o_orders);
      c.restore();
    }
    // 2) pastki menyu
    const navIm = t < T.flyEnd - 0.1 ? IMG.o_nav0 : t < toCart ? IMG.o_nav1 : t < toOrders ? IMG.o_navc : IMG.o_navo;
    nav(c, navIm, t < toCart ? T.flyEnd - 0.1 : null, t);
    if (pressed(t, T.tapCart)) {
      c.fillStyle = 'rgba(74,36,68,0.12)';
      c.beginPath();
      c.arc(cartBtn.x, cartBtn.y, 30, 0, Math.PI * 2);
      c.fill();
    }
    // 3) oynalar
    const closeP = T.tapAdd + 0.25, closeC = T.pay, closePay = T.tapSend + 0.15;
    const sP = slide(t, T.ps, closeP), sC = slide(t, T.cs, closeC), sPay = slide(t, T.pay, closePay), sO = slide(t, T.ord);
    const bd = Math.max(
      vis(t, T.ps, closeP, 0.25, 0.28), vis(t, T.cs, closeC + 0.3, 0.25, 0.28), vis(t, T.pay - 0.3, closePay, 0.25, 0.28), t >= T.ord ? pr(t, T.ord, T.ord + 0.25) : 0
    );
    backdrop(c, bd);
    if (sP < 1) {
      const v = E.io2(pr(t, T.tapVar + 0.05, T.tapVar + 0.2));
      sheet(c, ps, [[IMG.o_ps0, 1], [IMG.o_ps1, v]], psScroll(t), sP);
      if (t < closeP) {
        c.save();
        c.translate(0, sP * 120);
        strip(c, v < 1 ? IMG.o_pf0 : IMG.o_pf1, lay.pf.y);
        if (v > 0 && v < 1) {
          c.globalAlpha = v;
          strip(c, IMG.o_pf1, lay.pf.y);
        }
        c.restore();
        if (pressed(t, T.tapVar)) press(c, at(ps.variant, sheetTop(ps) - PS_SCROLL), 1, 14);
        if (pressed(t, T.tapAdd, 0.25)) press(c, at(lay.pf.btn, AT), 1, 26);
      }
    }
    if (sC < 1) {
      const scroll = csScroll(t);
      const im = t < T.typePhoneEnd ? IMG.o_cs0 : t < T.typeAddrEnd ? IMG.o_cs1 : IMG.o_cs2;
      const y = sheet(c, cs, [[im, 1]], scroll, sC);
      if (pressed(t, T.tapMethod, 0.2)) press(c, at(cs.method, y - scroll), 1, 18);
      const ph = pr(t, T.typePhone, T.typePhoneEnd), ad = pr(t, T.typeAddr, T.typeAddrEnd);
      if (t >= T.tapPhone + 0.05 && t < T.tapAddr + 0.05) typing(c, fPhone, y, scroll, IMG.o_cs1, O.phone, ph, true, t);
      if (t >= T.tapAddr + 0.05 && t < T.kbDown) typing(c, fAddr, y, scroll, IMG.o_cs2, O.address, ad, true, t);
      // klaviatura
      const kb = E.out3(pr(t, T.tapPhone + 0.05, T.tapPhone + 0.35)) - E.in2(pr(t, T.kbDown, T.kbDown + 0.3));
      if (kb > 0) UI.keyboard(c, 'ios', SH - UI.KB_H.ios * kb);
      if (t < closeC && kb <= 0) {
        c.save();
        c.translate(0, sC * 120);
        strip(c, t >= T.tapConfirm + 0.05 ? IMG.o_cfb : IMG.o_cf, lay.cf.y);
        c.restore();
        if (pressed(t, T.tapConfirm)) press(c, at(lay.cf.btn, AT), 1, 26);
      }
    }
    if (sPay < 1) {
      const scroll = payScroll(t);
      const v = E.io2(pr(t, T.file, T.file + 0.25));
      const y = sheet(c, pay, [[IMG.o_pay0, 1 - v], [IMG.o_pay1, v]], scroll, sPay);
      if (pressed(t, T.tapUpload, 0.22)) press(c, at(pay.upload, y - scroll), 1, 18);
      if (pressed(t, T.tapSend, 0.22)) press(c, at(pay.btn1, y - scroll), 1, 26);
    }
    if (sO < 1) {
      const v = E.io2(pr(t, T.confirmed, T.confirmed + 0.35));
      sheet(c, ord, [[IMG.o_ord1, 1 - v], [IMG.o_ord2, v]], 0, sO);
    }
    // 4) uchayotgan rasm va xabarlar
    fly(c, t, { x: SW / 2, y: sheetTop(ps) + (390 - PS_SCROLL) / 2 }, cartBtn);
    toast(c, O.added, t, T.tapAdd + 0.02);
    toast(c, O.created, t, T.pay);
    toast(c, O.sent, t, T.tapSend + 0.1);
  };

  // ---------- Ekran ----------
  const chat = (c, t) =>
    UI.tgChat(c, tl, L.tg, {
      msgs: [pr(t, T.msg, T.msg + 0.45), 0],
      btnRow: 0,
      btnGlow: vis(t, 3.2, T.tapShop + 0.05, 0.3, 0.2) * (0.65 + 0.35 * Math.sin(t * 9)),
      btnPress: pressed(t, T.tapShop, 0.16),
    });
  const screen = (c, t) => {
    if (t < T.open) return chat(c, t);
    const e = easeApp(pr(t, T.open, T.open + 0.5));
    if (e < 1) {
      chat(c, T.open);
      c.fillStyle = `rgba(0,0,0,${0.3 * e})`;
      c.fillRect(0, 0, SW, SH);
    }
    c.save();
    c.translate(0, (1 - e) * SH);
    rr(c, 0, 0, SW, SH, e < 1 ? 12 : 0);
    c.clip();
    app(c, t);
    tgHeader(c);
    c.restore();
    UI.statusBar(c, 'ios');
    notification(c, t);
    UI.homeBar(c, 'ios');
  };

  // ---------- Telefon atrofi ----------
  // Yon tomondagi mahsulot rasmlari (telefon bilan kiradi va chiqadi)
  const behind = (c, t) => {
    CIRCLES.forEach(([x, y, r, k, blur], i) => {
      const pin = E.back(pr(t, T.phoneIn + 0.25 + i * 0.07, T.phoneIn + 0.75 + i * 0.07));
      const pout = E.in2(pr(t, T.phoneOut - 0.1 + i * 0.04, T.phoneOut + 0.35 + i * 0.04));
      const s = pin * (1 - pout);
      if (s <= 0) return;
      const fy = y + 10 * Math.sin(t * 0.8 + i * 1.7);
      c.save();
      c.globalAlpha = clamp(s * 1.5) * (1 - pout);
      if (blur) c.filter = `blur(${blur}px)`;
      shadow(c, 26, 'rgba(74,36,68,0.22)', 10);
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(x, fy, (r + 7) * s, 0, Math.PI * 2);
      c.fill();
      noShadow(c);
      const im = IMG[k], m = Math.min(im.width, im.height);
      c.beginPath();
      c.arc(x, fy, r * s, 0, Math.PI * 2);
      c.clip();
      c.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, x - r * s, fy - r * s, 2 * r * s, 2 * r * s);
      c.restore();
    });
  };
  // 1-qadam: "yoki telefondagi ilovani oching" — telefon yonida ilova belgisi
  const front = (c, t) => {
    const p = vis(t, T.alt, T.s2 - 0.35, 0.5, 0.3);
    if (p <= 0) return;
    const k = t < T.s2 - 0.35 ? E.back(pr(t, T.alt, T.alt + 0.5)) : 1 - E.in2(pr(t, T.s2 - 0.35, T.s2 - 0.05));
    const x = 842, y = 880 + 8 * Math.sin(t * 2.2), s = 132;
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    c.rotate(0.08 * Math.sin(t * 1.6));
    shadow(c, 30, 'rgba(217,79,147,0.4)', 12);
    fillRR(c, -s / 2 - 6, -s / 2 - 6, s + 12, s + 12, (s + 12) * 0.25, '#fff');
    noShadow(c);
    roundImg(c, IMG.icon, -s / 2, -s / 2, s, s, s * 0.225);
    c.font = F(800, 30);
    const w = c.measureText(O.app).width + 40;
    shadow(c, 14, 'rgba(74,36,68,0.2)', 5);
    fillRR(c, -w / 2, s / 2 + 22, w, 54, 27, '#fff');
    noShadow(c);
    text(c, O.app, 0, s / 2 + 59, F(800, 30), C.plum, 'center');
    c.restore();
  };

  return {
    T,
    screen,
    behind,
    front,
    steps: [T.s1, T.s2, T.s3, T.s4, T.s5, T.s6, T.s7],
    texts: O.steps,
    hintAt: { 0: T.alt },
    intro: O.intro,
    introSub: O.intro_sub,
    sparkAt: null,
    confetti: T.confirmed + 0.1,
  };
}
