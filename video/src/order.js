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
    ['home', 'nav0', 'nav1', 'navc', 'navo', 'ps0', 'ps1', 'ps2', 'pf0', 'pf1', 'cart', 'cta', 'cs0', 'cs1', 'cs2', 'cf', 'cfb', 'pay0', 'pay1', 'ord1', 'ord2', 'ord3', 'orders']
      .map((k) => ['o_' + k, `/video/assets/shots/order/${k}.png`])
  ),
};

// Ovozli matn asl yozuvdan shuncha marta tez qo'yiladi (audio.py: atempo, ohang o'zgarmaydi).
// Ssenariy asl yozuv vaqtida yozilgan — butun sahna ham shuncha tezlashadi
const VOICE_TEMPO = 1.15;

// cubic-bezier(0.22, 1, 0.36, 1) ga yaqin — mini ilovadagi oyna ochilishi
const easeApp = E.out5;

// Oyna (bottom sheet) holati: 1 — yashirin (pastda), 0 — ochiq. Ochilish 0.42 s, yopilish 0.28 s
function slide(t, open, close = Infinity) {
  if (t < open) return 1;
  if (t >= close) return E.in2(pr(t, close, close + 0.28));
  return 1 - easeApp(pr(t, open, open + 0.42));
}

export function buildOrder(env, tl, lay) {
  const DS = lay.dsf;
  // Quyidagi barcha vaqtlar — asl ovoz vaqti; barmoq, kamera va ovoz effektlariga haqiqiy vaqtda uzatiladi
  const real = (x) => x / VOICE_TEMPO;
  const touch = {
    show: (t, p) => (env.touch.show(real(t), p), touch),
    move: (a, b, p) => (env.touch.move(real(a), real(b), p), touch),
    tap: (t) => (env.touch.tap(real(t)), touch),
    hide: (t) => (env.touch.hide(real(t)), touch),
    swipe: (a, b, p0, p1) => (env.touch.swipe(real(a), real(b), p0, p1), touch),
  };
  const cam = { to: (a, b, s, fy) => (env.cam.to(real(a), real(b), s, fy), cam) };
  const cue = (t, s, g) => env.cue(real(t), s, g);
  // Vaqtlar ovozli matnga bog'langan (assets/voice/buyurtma-uz.flac): har qadam o'z jumlasi boshlanganda chiqadi,
  // bosishlar esa jumladagi kalit so'z ("pochta", "sanani" ...) aytilganda
  const T = {
    introOut: 3.9, phoneIn: 4.1, msg: 4.75,
    s1: 5.75, tapShop: 7.3, open: 7.45, alt: 8.2,
    s2: 10.74, scroll: 10.95, tapCard: 12.15, ps: 12.3,
    s3: 12.57, psScroll: 12.8, tapVar: 13.6, tapColor: 14.25, tapAdd: 15.55,
    s4: 17.05, tapCart: 17.35, tapCta: 18.55, cs: 18.7,
    s5: 19.47, tapMethod: 21.3, pickup: 21.7,
    csScroll: 22.6, s6: 23.22, name: 23.25, tapPhone: 23.75, typePhone: 23.95, tapAddr: 24.85, typeAddr: 25.0, kbDown: 26.05,
    s7: 25.69, tapDate: 26.45, tapDay: 27.25,
    s8: 28.1, csScroll2: 28.15, tapConfirm: 29.2, pay: 29.8,
    s9: 30.21, payScroll: 31.8, tapUpload: 32.75, file: 33.15, payScroll2: 33.5, tapSend: 34.25,
    s10: 34.63, ord: 34.7, confirmed: 37.15, shipped: 38.3,
    s11: 39.31, notif: 39.55, phoneOut: 41.9, dur: 46.2,
  };
  T.typePhoneEnd = T.typePhone + O.phone.length * 0.055;
  T.typeAddrEnd = T.typeAddr + [...O.address].length * 0.045;
  T.flyEnd = T.tapAdd + 0.75;
  T.dateClose = T.tapDay + 0.2;

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
  const variant = inSheet(ps, ps.variant, PS_SCROLL), color = inSheet(ps, ps.color, PS_SCROLL);
  const addBtn = center(lay.pf.btn, AT);
  const ctaBtn = center(lay.cta.btn, AT);
  const [mPost, mPickup] = cs.methods;
  const method = inSheet(cs, mPost, 0);
  const [fName, fPhone, fAddr, fDate] = cs.fields;
  const phonePt = inSheet(cs, fPhone, CS_TYPE), addrPt = inSheet(cs, fAddr, CS_TYPE), datePt = inSheet(cs, fDate, CS_TYPE);
  const confirmBtn = center(lay.cf.btn, AT);
  const uploadPt = inSheet(pay, pay.upload, PAY_S1);
  const sendPt = inSheet(pay, pay.btn1, PAY_S2);
  const shopBtn = center(tl.shopBtn);
  // iOS sana tanlagichi: sana maydoni ustida. 2026-yil 1-oktabr — payshanba (dushanbadan boshlanadigan jadvalda 4-ustun)
  const CAL = { x: 24, w: SW - 48, h: 312, first: 3, days: 31, min: 24, today: 22, pick: 25 };
  CAL.y = datePt.y - fDate.h / 2 - 10 - CAL.h;
  CAL.cw = (CAL.w - 16) / 7;
  const dayAt = (d) => {
    const i = CAL.first + d - 1;
    return { x: CAL.x + 8 + CAL.cw * ((i % 7) + 0.5), y: CAL.y + 80 + 22 + Math.floor(i / 7) * 44 };
  };

  // ---------- Barmoq ----------
  touch.show(6.3, { x: SW / 2 + 60, y: shopBtn.y + 130 }).move(6.4, 6.95, shopBtn).tap(T.tapShop).hide(7.6);
  touch.swipe(T.scroll, T.scroll + 0.45, { x: 260, y: 660 }, { x: 260, y: 330 });
  touch.show(11.6, { x: 190, y: 600 }).move(11.65, 11.95, card).tap(T.tapCard).hide(12.45);
  touch.swipe(T.psScroll, T.psScroll + 0.4, { x: 300, y: 620 }, { x: 300, y: 420 });
  touch.show(13.25, { x: 170, y: 720 }).move(13.3, 13.5, variant).tap(T.tapVar).move(13.9, 14.15, color).tap(T.tapColor)
    .move(14.9, 15.3, addBtn).tap(T.tapAdd).hide(15.8);
  touch.show(16.75, { x: 300, y: 610 }).move(16.8, 17.15, cartBtn).tap(T.tapCart).hide(17.6);
  touch.show(18.05, { x: 270, y: 560 }).move(18.1, 18.4, ctaBtn).tap(T.tapCta).hide(18.85);
  touch.show(20.85, { x: 270, y: 520 }).move(20.9, 21.15, method).tap(T.tapMethod).hide(21.6);
  touch.swipe(T.csScroll, T.csScroll + 0.4, { x: 300, y: 640 }, { x: 300, y: 400 });
  touch.show(23.45, { x: 280, y: 520 }).move(23.5, 23.65, { x: 140, y: phonePt.y }).tap(T.tapPhone).move(24.6, 24.78, { x: 140, y: addrPt.y }).tap(T.tapAddr)
    .move(26.1, 26.35, { x: 150, y: datePt.y }).tap(T.tapDate).move(26.85, 27.1, dayAt(CAL.pick)).tap(T.tapDay).hide(27.55);
  touch.swipe(T.csScroll2, T.csScroll2 + 0.4, { x: 300, y: 600 }, { x: 300, y: 380 });
  touch.show(28.75, { x: 290, y: 640 }).move(28.8, 29.05, confirmBtn).tap(T.tapConfirm).hide(29.5);
  touch.swipe(T.payScroll, T.payScroll + 0.4, { x: 300, y: 640 }, { x: 300, y: 400 });
  touch.show(32.4, { x: 270, y: 660 }).move(32.45, 32.65, uploadPt).tap(T.tapUpload).hide(33.05);
  touch.swipe(T.payScroll2, T.payScroll2 + 0.3, { x: 300, y: 620 }, { x: 300, y: 470 });
  touch.show(33.85, { x: 280, y: 720 }).move(33.9, 34.1, sendPt).tap(T.tapSend).hide(34.55);

  // ---------- Kamera ----------
  cam.to(5.9, 6.6, 1.4, shopBtn.y)
    .to(T.open + 0.05, T.open + 0.65, 1)
    .to(12.9, 13.5, 1.45, 650)
    .to(T.tapAdd - 0.05, T.tapAdd + 0.45, 1)
    .to(19.5, 20.1, 1.4, 340)
    .to(22.6, 23.2, 1.45, 440)
    .to(28.1, 28.7, 1.3, 690)
    .to(T.pay - 0.05, T.pay + 0.45, 1)
    .to(30.3, 30.9, 1.35, 380)
    .to(31.8, 32.4, 1.35, 560)
    .to(T.tapSend + 0.1, T.tapSend + 0.6, 1)
    .to(35.0, 35.6, 1.35, 330)
    .to(T.phoneOut - 0.6, T.phoneOut - 0.1, 1);

  // ---------- Ovozlar (ovozli matn ostida — yengil) ----------
  cue(T.msg, 'recv');
  cue(T.open, 'open'); cue(T.open + 0.55, 'ding', 0.7); cue(T.alt, 'pop');
  cue(T.ps, 'sheet'); cue(T.tapVar + 0.03, 'pop', 0.6); cue(T.tapColor + 0.03, 'pop', 0.6);
  cue(T.tapAdd + 0.05, 'swish', 0.9); cue(T.flyEnd - 0.1, 'ding', 0.8); cue(T.flyEnd - 0.05, 'sparkle', 0.7);
  cue(T.tapCart + 0.05, 'swish', 0.6); cue(T.cs, 'sheet');
  for (let i = 0; i < O.phone.length; i++) cue(T.typePhone + i * 0.055, 'key', 0.4);
  for (let i = 0; i < [...O.address].length; i++) cue(T.typeAddr + i * 0.045, 'key', 0.4);
  cue(T.tapPhone + 0.05, 'pop', 0.4); cue(T.kbDown, 'swish', 0.5);
  cue(T.tapDate + 0.05, 'pop', 0.6); cue(T.tapDay + 0.03, 'pop', 0.6);
  cue(T.tapConfirm + 0.1, 'load', 0.6); cue(T.pay, 'sheet'); cue(T.pay + 0.1, 'success');
  cue(T.file, 'pop'); cue(T.tapSend + 0.1, 'send'); cue(T.ord, 'sheet', 0.7);
  cue(T.confirmed, 'ding'); cue(T.confirmed + 0.1, 'confetti'); cue(T.confirmed + 0.15, 'success2');
  cue(T.shipped, 'ding', 0.8); cue(T.notif, 'recv');

  // ---------- Holatlar ----------
  const homeScroll = (t) => HOME_SCROLL * E.out3(pr(t, T.scroll, T.scroll + 1.0));
  const psScroll = (t) => PS_SCROLL * E.out3(pr(t, T.psScroll, T.psScroll + 0.6));
  const csScroll = (t) => CS_TYPE * E.out3(pr(t, T.csScroll, T.csScroll + 0.6)) + (CS_END - CS_TYPE) * E.out3(pr(t, T.csScroll2, T.csScroll2 + 0.6));
  const payScroll = (t) => PAY_S1 * E.out3(pr(t, T.payScroll, T.payScroll + 0.6)) + (PAY_S2 - PAY_S1) * E.out3(pr(t, T.payScroll2, T.payScroll2 + 0.5));
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
  // Fokusdagi maydon halqasi (mini ilovadagi :focus)
  const ring = (c, x, y, w, h) => {
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
  };
  // E'tiborni tortish: pushti yonib-o'chuvchi chegara
  const glow = (c, r, a, rad = 18) => {
    if (a <= 0) return;
    c.save();
    shadow(c, 16 * a, `rgba(217,79,147,${0.6 * a})`);
    c.strokeStyle = `rgba(244,143,184,${a})`;
    c.lineWidth = 2.5;
    rr(c, r.x - 1, r.y - 1, r.w + 2, r.h + 2, rad);
    c.stroke();
    c.restore();
  };
  const pulse = (t, a, b) => vis(t, a, b, 0.2, 0.25) * (0.7 + 0.3 * Math.sin(t * 9));
  // iOS sana tanlagichi (ixcham kalendar): oy, hafta kunlari, kunlar; erta kunlar kulrang (min — bugun + 2 kun)
  const datePicker = (c, t) => {
    const p = vis(t, T.tapDate + 0.05, T.dateClose, 0.25, 0.2);
    if (p <= 0) return;
    const { x, y, w, h } = CAL;
    const k = lerp(0.9, 1, E.out3(clamp(p)));
    c.save();
    c.globalAlpha = clamp(p);
    c.translate(SW / 2, y + h);
    c.scale(k, k);
    c.translate(-SW / 2, -(y + h));
    shadow(c, 40, 'rgba(0,0,0,0.25)', 12);
    fillRR(c, x, y, w, h, 14, '#fff');
    noShadow(c);
    text(c, O.month, x + 16, y + 34, S(600, 17), '#000');
    c.font = S(600, 17);
    G.chevron(c, x + 16 + c.measureText(O.month).width + 10, y + 28, 13, C.ios, 1);
    G.chevron(c, x + w - 62, y + 28, 18, C.ios, -1);
    G.chevron(c, x + w - 24, y + 28, 18, C.ios, 1);
    O.weekdays.forEach((d, i) => text(c, d, x + 8 + CAL.cw * (i + 0.5), y + 66, S(600, 12.5), 'rgba(60,60,67,0.3)', 'center'));
    for (let d = 1; d <= CAL.days; d++) {
      const pt = dayAt(d);
      const sel = t >= T.tapDay && d === CAL.pick;
      if (sel) {
        c.fillStyle = 'rgba(0,122,255,0.14)';
        c.beginPath();
        c.arc(pt.x, pt.y, 20 * E.back(pr(t, T.tapDay, T.tapDay + 0.25)), 0, Math.PI * 2);
        c.fill();
      }
      text(c, String(d), pt.x, pt.y + 7, S(sel ? 600 : 400, 20), sel ? C.ios : d < CAL.min ? 'rgba(60,60,67,0.3)' : '#000', 'center');
    }
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
    ring(c, x, y, w, h);
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
      const v = E.io2(pr(t, T.tapVar + 0.05, T.tapVar + 0.2)), vc = E.io2(pr(t, T.tapColor + 0.05, T.tapColor + 0.2));
      sheet(c, ps, [[IMG.o_ps0, 1], [IMG.o_ps1, v], [IMG.o_ps2, vc]], psScroll(t), sP);
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
        if (pressed(t, T.tapColor)) press(c, at(ps.color, sheetTop(ps) - PS_SCROLL), 1, 20);
        if (pressed(t, T.tapAdd, 0.25)) press(c, at(lay.pf.btn, AT), 1, 26);
      }
    }
    if (sC < 1) {
      const scroll = csScroll(t);
      const im = t < T.typePhoneEnd ? IMG.o_cs0 : t < T.typeAddrEnd ? IMG.o_cs1 : IMG.o_cs2;
      const y = sheet(c, cs, [[im, 1]], scroll, sC);
      if (pressed(t, T.tapMethod, 0.2)) press(c, at(mPost, y - scroll), 1, 18);
      glow(c, at(mPickup, y - scroll), pulse(t, T.pickup, T.pickup + 0.9));
      glow(c, at(fName, y - scroll), pulse(t, T.name, T.tapPhone), 12);
      const dy = y + fDate.y - scroll;
      if (t >= T.dateClose) text(c, O.date, fDate.x + 16, dy + fDate.h / 2 + 6, F(400, 16), C.plum);
      if (t >= T.tapDate + 0.05 && t < T.dateClose + 0.2) ring(c, fDate.x, dy, fDate.w, fDate.h);
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
      datePicker(c, t);
    }
    if (sPay < 1) {
      const scroll = payScroll(t);
      const v = E.io2(pr(t, T.file, T.file + 0.25));
      const y = sheet(c, pay, [[IMG.o_pay0, 1], [IMG.o_pay1, v]], scroll, sPay);
      if (pressed(t, T.tapUpload, 0.22)) press(c, at(pay.upload, y - scroll), 1, 18);
      if (pressed(t, T.tapSend, 0.22)) press(c, at(pay.btn1, y - scroll), 1, 26);
    }
    if (sO < 1) {
      const v1 = E.io2(pr(t, T.confirmed, T.confirmed + 0.35)), v2 = E.io2(pr(t, T.shipped, T.shipped + 0.35));
      sheet(c, ord, [[IMG.o_ord1, 1], [IMG.o_ord2, v1], [IMG.o_ord3, v2]], 0, sO);
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
      btnGlow: vis(t, T.s1 + 0.3, T.tapShop + 0.05, 0.3, 0.2) * (0.65 + 0.35 * Math.sin(t * 9)),
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

  const RT = Object.fromEntries(Object.entries(T).map(([k, x]) => [k, real(x)]));
  const atVoice = (f) => (c, t) => f(c, t * VOICE_TEMPO);
  return {
    T: RT,
    screen: atVoice(screen),
    behind: atVoice(behind),
    front: atVoice(front),
    steps: [RT.s1, RT.s2, RT.s3, RT.s4, RT.s5, RT.s6, RT.s7, RT.s8, RT.s9, RT.s10, RT.s11],
    texts: O.steps,
    // 9 ta qadam, keyin ikki yakuniy sahna
    labels: O.steps.map((_, i) => (i < 9 ? L.step(i + 1) : '✓ TAYYOR')),
    // izoh ovozda aytilganda chiqadi
    hintAt: Object.fromEntries(Object.entries({ 0: T.alt, 2: 14.6, 4: 21.19, 8: 33.4, 9: 36.2 }).map(([i, x]) => [i, real(x)])),
    intro: O.intro,
    introSub: O.intro_sub,
    sparkAt: null,
    confetti: real(T.confirmed + 0.1),
    voice: 'assets/voice/buyurtma-uz.flac', // video/ papkasiga nisbatan
    voiceTempo: VOICE_TEMPO,
  };
}
