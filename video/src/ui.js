// Telefon ekranidagi ko'rinishlar (pt birligida chiziladi). iOS: 390×845, Android: 384×832
import { C, E, S, rr, fillRR, text, ellipsize, layoutRich, drawRich, md, lerp, clamp, rng, IMG, roundImg, circleImg, shadow, noShadow, G } from './core.js';
import { appIcon, glyph } from './icons.js';

export const DEV = {
  ios: { SW: 390, SH: 845, SB: 54, BOT: 34 },
  and: { SW: 384, SH: 832, SB: 32, BOT: 20 },
};

// ---------- Holat paneli ----------
// crumb — boshqa ilovadan ochilganda vaqt ostidagi "◀ Telegram" (iOS)
export function statusBar(c, os, dark = false, bg = null, crumb = null) {
  const { SW, SB } = DEV[os];
  const col = dark ? '#fff' : '#000';
  if (bg) {
    c.fillStyle = bg;
    c.fillRect(0, 0, SW, SB);
  }
  c.save();
  if (os === 'ios') {
    text(c, '12:41', 54, crumb ? 31 : 37, S(600, 17), col, 'center');
    if (crumb) text(c, `◀ ${crumb}`, 54, 47, S(600, 12), col, 'center');
    for (let i = 0; i < 4; i++) fillRR(c, 290 + i * 5, 33 - (4 + i * 2.6), 3.3, 4 + i * 2.6, 1, col);
    c.strokeStyle = col;
    c.lineWidth = 2.1;
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(321, 35, 2.6 + i * 3.6, -Math.PI * 0.75, -Math.PI * 0.25);
      c.stroke();
    }
    c.globalAlpha = 0.4;
    c.lineWidth = 1.1;
    rr(c, 334, 24.5, 25, 12, 3.6);
    c.stroke();
    fillRR(c, 360.5, 28.5, 1.8, 4, 1, col);
    c.globalAlpha = 1;
    fillRR(c, 336, 26.5, 18, 8, 2, col);
  } else {
    text(c, '12:41', 22, 22, S(500, 14), col);
    // wifi
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(SW - 86, 17);
    c.arc(SW - 86, 23, 9, -Math.PI * 0.78, -Math.PI * 0.22);
    c.closePath();
    c.fill();
    // signal
    c.beginPath();
    c.moveTo(SW - 72, 24);
    c.lineTo(SW - 60, 24);
    c.lineTo(SW - 60, 12);
    c.closePath();
    c.fill();
    text(c, '85%', SW - 22, 22, S(500, 12.5), col, 'right');
    c.lineWidth = 1.2;
    c.strokeStyle = col;
    rr(c, SW - 19, 13, 9, 13, 2);
    c.stroke();
    fillRR(c, SW - 17.5, 16, 6, 8.5, 1, col);
  }
  c.restore();
}

export function cutout(c, os) {
  const { SW } = DEV[os];
  c.fillStyle = '#000';
  if (os === 'ios') {
    rr(c, SW / 2 - 62, 11, 124, 36, 18);
    c.fill();
  } else {
    c.beginPath();
    c.arc(SW / 2, 16, 6.5, 0, Math.PI * 2);
    c.fill();
  }
}

export function homeBar(c, os, dark = false) {
  const { SW, SH } = DEV[os];
  if (os === 'ios') fillRR(c, SW / 2 - 67, SH - 9, 134, 5, 2.5, dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)');
  else fillRR(c, SW / 2 - 40, SH - 11, 80, 4, 2, dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.55)');
}

// ---------- Telegram ----------
function chatBg(c, x, y, w, h) {
  const g = c.createLinearGradient(x, y, x + w * 0.4, y + h);
  g.addColorStop(0, '#D7E9C5');
  g.addColorStop(0.5, '#C2DDB8');
  g.addColorStop(1, '#A9D0B9');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // naqsh (doodle)
  const r = rng(7);
  c.save();
  c.strokeStyle = 'rgba(60,110,60,0.13)';
  c.lineWidth = 1.4;
  for (let i = 0; i < 70; i++) {
    const px = x + r() * w, py = y + r() * h, s = 5 + r() * 7, k = Math.floor(r() * 3);
    c.beginPath();
    if (k === 0) c.arc(px, py, s, 0, Math.PI * 2);
    else if (k === 1) rr(c, px - s, py - s, s * 2, s * 2, 3);
    else {
      c.moveTo(px - s, py);
      c.lineTo(px, py - s);
      c.lineTo(px + s, py);
      c.lineTo(px, py + s);
      c.closePath();
    }
    c.stroke();
  }
  c.restore();
}

// Chat joylashuvi (vaqtdan mustaqil): xabarlar (1 — rasmli xush kelibsiz, 2 — mijozning «Ilovani o'rnatish»
// xabari (pastki klaviaturadan), 3 — video albom + izohida link), ularning ostidagi tugmalar va bosiladigan joylar
const BTN_H = 40, BTN_GAP = 4, ALBUM_H = 216, CTX_ROW = 47, KB_PANEL = 60;
export function tgLayout(c, os, L) {
  const { SW, SH, SB, BOT } = DEV[os];
  const ios = os === 'ios';
  const navB = ios ? SB + 44 : SB + 56;
  const inputY = SH - BOT - 52;
  const chatB = inputY - 8;
  const size = ios ? 16.5 : 16;
  const lh = ios ? 21.5 : 21;
  const maxW = 278;
  // media: 'photo' — xush kelibsiz rasmi, 'album' — ikkita video (iPhone, Samsung; albom biroz kengroq — link bir qatorga sig'adi)
  // out — mijoz yuborgan xabar (o'ngda, yashil, vaqt yonida ✓✓)
  const bubble = (src, rows, media = null, out = false) => {
    const mw = media === 'album' ? maxW + 14 : maxW;
    const lay = layoutRich(c, md(src), mw, size, S);
    c.font = S(400, 12);
    const lastW = lay.lines[lay.lines.length - 1].reduce((m, s) => Math.max(m, s.x + s.w), 0);
    const w = media ? mw + 24 : Math.max(lay.w, Math.min(mw, lastW + (out ? 58 : 40))) + 24;
    const mediaH = media === 'photo' ? Math.round((w * IMG.welcome.height) / IMG.welcome.width) : media === 'album' ? ALBUM_H : 0;
    const extra = lastW + 40 > mw ? 16 : 0;
    const h = mediaH + lay.lines.length * lh + 15 + extra;
    const btnH = rows.length * (BTN_H + BTN_GAP);
    return { lay, w: Math.min(w, mw + 24), h, media, mediaH, rows, btnH, out };
  };
  const msgs = [bubble(L.m1, L.m1btns, 'photo'), bubble(L.mUser, [], null, true), bubble(L.m4, [], 'album')];
  const lay = { os, SW, SH, navB, inputY, chatB, size, lh, msgs, durs: L.durs, kbLabel: L.kbBtn };
  // yozish qatoridagi ⊞ (bot klaviaturasini ochadi) va ochilgan klaviaturadagi tugma
  lay.kbToggle = { x: ios ? SW - 62 : SW - 100, y: inputY + 26 };
  lay.kbH = KB_PANEL;
  lay.kbBtn = { x: 6, y: inputY + 52 - KB_PANEL + 8, w: SW - 12, h: 44 };
  lay.kbBtn.cx = SW / 2;
  lay.kbBtn.cy = lay.kbBtn.y + 22;
  // hamma xabar — albom va link o'rni
  const pos = stackPositions(lay, [1, 1, 1]);
  const m4 = msgs[2];
  lay.album = { y: pos[2], h: ALBUM_H, cy: pos[2] + ALBUM_H / 2 };
  const linkLine = m4.lay.lines.findIndex((Ln) => Ln.some((s) => s.r.link));
  const segs = m4.lay.lines[linkLine].filter((s) => s.r.link);
  const lx = 8 + 12 + segs[0].x;
  lay.link = { x: lx, y: pos[2] + m4.mediaH + 8 + linkLine * lh, w: segs.reduce((m, s) => Math.max(m, s.x + s.w), 0) - segs[0].x, h: lh, cx: 0, cy: 0 };
  lay.link.cx = lay.link.x + Math.min(lay.link.w, 200) / 2;
  lay.link.cy = lay.link.y + lh / 2 + 2;
  // iOS: link bosib turilganda — tepada link (pufakcha), ostida menyu; pastga sig'masa yuqoriga suriladi
  c.font = S(500, 15.5);
  const pillW = c.measureText(L.linkText).width + 28;
  const menuH = L.ctx.length * CTX_ROW;
  const pillY = Math.min(lay.link.y - 6, SH - BOT - 14 - menuH - 10 - 34);
  lay.ctx = { x: lay.link.x - 12, pillY, pillW, menuY: pillY + 34 + 10, menuW: 304 };
  lay.ctx.row = (i) => ({ x: lay.ctx.x + 100, y: lay.ctx.menuY + i * CTX_ROW + CTX_ROW / 2 });
  return lay;
}

// Xabarlarning yuqori y koordinatalari (pastdan yig'iladi). p — har xabar ko'rinish darajasi,
// lift — pastki klaviatura ochilganda chat shuncha yuqoriga suriladi
function stackPositions(lay, p, lift = 0) {
  const ys = [];
  let y = lay.chatB - lift;
  for (let i = lay.msgs.length - 1; i >= 0; i--) {
    const m = lay.msgs[i];
    const k = E.out3(clamp(p[i]));
    y -= (m.h + m.btnH) * k;
    ys[i] = y;
    y -= 8 * k;
  }
  return ys;
}

// Bosiladigan joyni ajratib ko'rsatish: pushti nur va oq chegara (g — 0..1)
function glowRR(c, x, y, w, h, r, g) {
  if (g <= 0) return;
  c.save();
  shadow(c, 18 * g, `rgba(217,79,147,${0.9 * g})`);
  fillRR(c, x, y, w, h, r, `rgba(217,79,147,${0.5 * g})`);
  c.restore();
  c.save();
  c.strokeStyle = `rgba(255,255,255,${g})`;
  c.lineWidth = 2.5;
  rr(c, x, y, w, h, r);
  c.stroke();
  c.restore();
}

// hl — linkni belgilash
function drawBubble(c, lay, m, y, p, hl) {
  const ios = lay.os === 'ios';
  const x = m.out ? lay.SW - 8 - m.w : 8;
  c.save();
  // paydo bo'lish: pastki chap (mijozniki — o'ng) burchakdan kattalashadi
  const k = E.back(clamp(p));
  const ox = m.out ? x + m.w : x, oy = y + m.h;
  c.translate(ox, oy);
  c.scale(lerp(0.6, 1, k), lerp(0.6, 1, k));
  c.translate(-ox, -oy);
  c.globalAlpha = clamp(p * 2.5);
  shadow(c, 1.5, 'rgba(0,0,0,0.12)', 1);
  c.fillStyle = m.out ? (ios ? '#E1FEC6' : '#EFFEDD') : '#fff';
  c.beginPath();
  const r = ios ? 17 : 13, rs = 5;
  c.roundRect(x, y, m.w, m.h, m.out ? [r, r, rs, r] : [r, r, r, rs]);
  c.fill();
  noShadow(c);
  if (m.mediaH) {
    c.save();
    c.beginPath();
    c.roundRect(x + 2, y + 2, m.w - 4, m.mediaH - 2, [r - 2, r - 2, 3, 3]);
    c.clip();
    if (m.media === 'photo') c.drawImage(IMG.welcome, x + 2, y + 2, m.w - 4, m.mediaH - 2);
    else {
      const tw = (m.w - 4 - 2) / 2;
      videoTile(c, IMG.coverIphone, x + 2, y + 2, tw, m.mediaH - 2, lay.durs[0]);
      videoTile(c, IMG.coverSamsung, x + 2 + tw + 2, y + 2, tw, m.mediaH - 2, lay.durs[1]);
    }
    c.restore();
  }
  drawRich(c, m.lay, x + 12, y + m.mediaH + 8 + lay.size, lay.lh, '#000', ios ? '#007AFF' : '#2481CC', hl > 0 ? `rgba(0,122,255,${0.18 * hl})` : null);
  if (m.out) {
    const tc = ios ? '#3FA23A' : '#5FB65C';
    text(c, '12:41', x + m.w - 28, y + m.h - 7, S(400, 11.5), tc, 'right');
    G.check(c, x + m.w - 19, y + m.h - 11, 11, tc, 0.16);
    G.check(c, x + m.w - 14, y + m.h - 11, 11, tc, 0.16);
  } else text(c, '12:41', x + m.w - 10, y + m.h - 7, S(400, 11.5), '#9AA0A6', 'right');
  // xabar ostidagi tugmalar
  m.rows.forEach((row, ri) => {
    const by = y + m.h + BTN_GAP + ri * (BTN_H + BTN_GAP);
    const bw = (m.w - (row.length - 1) * BTN_GAP) / row.length;
    row.forEach((b, i) => {
      const bx = x + i * (bw + BTN_GAP);
      fillRR(c, bx, by, bw, BTN_H, ios ? 10 : 8, 'rgba(70,110,75,0.42)');
      c.font = S(600, 14.5);
      text(c, ellipsize(c, b, bw - 14), bx + bw / 2, by + 25, S(600, 14.5), '#fff', 'center');
      // Telegram belgilari: veb-ilova (kvadrat) va tashqi link (↗)
      if (b.startsWith('🛍')) {
        c.strokeStyle = 'rgba(255,255,255,0.9)';
        c.lineWidth = 1.3;
        rr(c, bx + bw - 15, by + 5, 9, 8, 2);
        c.stroke();
      } else if (b.includes('Instagram')) G.arrowUpRight(c, bx + bw - 11, by + 10, 10, 'rgba(255,255,255,0.9)');
    });
  });
  c.restore();
}

// Albomdagi video: muqova (markazdan qirqilgan), chapda tepada "▶ davomiyligi" (muqovadagi sarlavha ochiq qoladi)
function videoTile(c, im, x, y, w, h, dur) {
  const k = Math.max(w / im.width, h / im.height);
  c.drawImage(im, x + (w - im.width * k) / 2, y + (h - im.height * k) / 2, im.width * k, im.height * k);
  c.font = S(500, 11.5);
  const dw = c.measureText(dur).width + 26;
  fillRR(c, x + 6, y + 6, dw, 19, 9.5, 'rgba(0,0,0,0.45)');
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(x + 13, y + 11);
  c.lineTo(x + 20, y + 15.5);
  c.lineTo(x + 13, y + 20);
  c.closePath();
  c.fill();
  text(c, dur, x + 24, y + 19.5, S(500, 11.5), '#fff');
}

// st: { msgs:[p,p,p], linkHL, kb (0..1 — pastki klaviatura ochilishi), toggleGlow, togglePress, kbGlow, kbPress }
export function tgChat(c, lay, L, st) {
  const { SW, SH, navB, os } = lay;
  const ios = os === 'ios';
  chatBg(c, 0, 0, SW, SH);
  // pastki klaviatura ochilganda yozish qatori va chat yuqoriga suriladi
  const lift = lay.kbH * E.out3(clamp(st.kb || 0));
  const inputY = lay.inputY - lift;
  const ys = stackPositions(lay, st.msgs, lift);
  c.save();
  c.beginPath();
  c.rect(0, navB, SW, inputY - navB);
  c.clip();
  const dateY = ys[0] - 34;
  c.font = S(500, 13);
  const dw = c.measureText(L.today).width + 20;
  fillRR(c, SW / 2 - dw / 2, dateY, dw, 22, 11, 'rgba(60,100,60,0.35)');
  text(c, L.today, SW / 2, dateY + 15.5, S(500, 13), '#fff', 'center');
  lay.msgs.forEach((m, i) => {
    if (st.msgs[i] <= 0) return;
    drawBubble(c, lay, m, ys[i], st.msgs[i], i === 2 ? st.linkHL || 0 : 0);
  });
  c.restore();

  // yuqori panel
  if (ios) {
    c.fillStyle = 'rgba(247,247,247,0.96)';
    c.fillRect(0, 0, SW, navB);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(0, navB - 0.5, SW, 0.5);
    G.chevron(c, 16, DEV.ios.SB + 22, 22, C.ios);
    text(c, L.back, 28, DEV.ios.SB + 28, S(400, 17), C.ios);
    text(c, 'Tayyor & Sweet', SW / 2, DEV.ios.SB + 19, S(600, 16.5), '#000', 'center');
    text(c, L.bot, SW / 2, DEV.ios.SB + 36, S(400, 13), '#8E8E93', 'center');
    circleImg(c, IMG.logo, SW - 30, DEV.ios.SB + 22, 18);
    statusBar(c, 'ios');
  } else {
    c.fillStyle = '#527DA3';
    c.fillRect(0, 0, SW, navB);
    c.fillStyle = 'rgba(0,0,0,0.08)';
    c.fillRect(0, 0, SW, DEV.and.SB);
    G.arrowLeft(c, 26, DEV.and.SB + 28, 22, '#fff');
    circleImg(c, IMG.logo, 76, DEV.and.SB + 28, 21);
    text(c, 'Tayyor & Sweet', 108, DEV.and.SB + 24, S(600, 17.5), '#fff');
    text(c, L.bot, 108, DEV.and.SB + 44, S(400, 14), 'rgba(255,255,255,0.75)');
    G.vdots(c, SW - 20, DEV.and.SB + 28, 22, '#fff');
    statusBar(c, 'and', true);
  }

  // yozish qatori: chapda bot menyusi tugmasi (veb-ilova), keyin maydon; ichida ⊞ — bot klaviaturasi
  c.fillStyle = ios ? '#F7F7F7' : '#fff';
  c.fillRect(0, inputY, SW, SH - inputY);
  if (lift > 0) {
    // bot klaviaturasi: bitta tugma
    c.fillStyle = ios ? '#D5D8DE' : '#EEF0F2';
    c.fillRect(0, inputY + 52, SW, SH - inputY - 52);
    const b = lay.kbBtn, by = b.y + (lay.kbH - lift);
    glowRR(c, b.x, by, b.w, b.h, ios ? 9 : 6, st.kbGlow || 0);
    c.save();
    shadow(c, 0, 'rgba(0,0,0,0.3)', 1);
    fillRR(c, b.x, by, b.w, b.h, ios ? 9 : 6, st.kbPress ? (ios ? '#B9BDC5' : '#DADDE0') : '#fff');
    c.restore();
    text(c, lay.kbLabel, SW / 2, by + 28, S(500, 16.5), '#000', 'center');
  }
  c.fillStyle = 'rgba(0,0,0,0.12)';
  c.fillRect(0, inputY, SW, 0.5);
  c.font = S(600, 14.5);
  const mw = c.measureText(L.menu).width + 24;
  fillRR(c, 8, inputY + 9, mw, 34, 17, ios ? '#3A8DF5' : '#4E8FD0');
  text(c, L.menu, 8 + mw / 2, inputY + 31, S(600, 14.5), '#fff', 'center');
  const fx = 8 + mw + 8;
  if (ios) {
    fillRR(c, fx, inputY + 9, SW - fx - 44, 34, 17, '#fff');
    c.strokeStyle = 'rgba(0,0,0,0.12)';
    c.lineWidth = 0.8;
    rr(c, fx, inputY + 9, SW - fx - 44, 34, 17);
    c.stroke();
    text(c, L.input, fx + 14, inputY + 31, S(400, 16.5), '#A3A3A8');
    G.mic(c, SW - 22, inputY + 26, 26, '#8E8E93');
  } else {
    text(c, L.input, fx + 6, inputY + 32, S(400, 17), '#A0A4A8');
    G.clip(c, SW - 62, inputY + 26, 26, '#8A9096');
    G.mic(c, SW - 24, inputY + 26, 26, '#8A9096');
  }
  const tx = lay.kbToggle.x, ty = inputY + 26;
  glowRR(c, tx - 17, ty - 17, 34, 34, 10, st.toggleGlow || 0);
  if (st.togglePress) fillRR(c, tx - 17, ty - 17, 34, 34, 10, 'rgba(0,0,0,0.12)');
  (lift > lay.kbH / 2 ? G.keyboard : G.botKb)(c, tx, ty, 24, ios ? '#8E8E93' : '#8A9096');
  homeBar(c, os);
}

// Android: link bosib turilganda chiqadigan menyu. press: bosilgan qator (1 — «Копировать»)
export function tgLinkMenu(c, L, link, p, press) {
  const { SW, SH, BOT } = DEV.and;
  c.fillStyle = `rgba(0,0,0,${0.4 * p})`;
  c.fillRect(0, 0, SW, SH);
  const e = E.out3(p);
  const rows = [L.open, L.copy, L.share];
  const sh = 70 + rows.length * 52 + BOT;
  const y0 = SH - sh + (1 - e) * sh;
  c.save();
  c.fillStyle = '#fff';
  c.beginPath();
  c.roundRect(0, y0, SW, sh + 20, [16, 16, 0, 0]);
  c.fill();
  c.font = S(400, 14);
  text(c, ellipsize(c, link, SW - 48), 24, y0 + 40, S(400, 14), '#8A8A8A');
  const icons = [G.globe, G.copy, G.share];
  rows.forEach((r, i) => {
    const y = y0 + 62 + i * 52;
    if (press === i) {
      c.fillStyle = '#ECECEC';
      c.fillRect(0, y, SW, 52);
    }
    icons[i](c, 34, y + 26, 22, '#7A7F85');
    text(c, r, 72, y + 32, S(400, 16.5), '#222');
  });
  c.restore();
  return { copy: { x: SW / 2, y: SH - sh + 62 + 52 + 26 } };
}

// iOS Telegram: link bosib turilganda chiqadigan kontekst menyu (fon xiralashtirilgan holda chiziladi).
// press — bosilgan qator raqami
export function tgLinkContext(c, lay, L, p, press) {
  const { SW, SH } = lay;
  const { x, pillY, pillW, menuY, menuW } = lay.ctx;
  const e = E.out3(clamp(p));
  c.save();
  c.globalAlpha = clamp(p * 2);
  c.fillStyle = `rgba(235,245,225,${0.35 * e})`;
  c.fillRect(0, 0, SW, SH);
  // link pufakchasi: xabardagi o'rnidan ko'tariladi
  const py = lerp(lay.link.y - 6, pillY, e);
  shadow(c, 16 * e, 'rgba(0,0,0,0.12)', 4);
  fillRR(c, x, py, pillW, 34, 12, 'rgba(236,250,224,0.98)');
  noShadow(c);
  text(c, L.linkText, x + 14, py + 22.5, S(500, 15.5), '#1C4FA8');
  // menyu: pufakcha ostidan kattalashib chiqadi
  const k = lerp(0.4, 1, E.back(clamp(p)));
  const h = L.ctx.length * CTX_ROW;
  c.translate(x, menuY);
  c.scale(k, k);
  c.translate(-x, -menuY);
  shadow(c, 34, 'rgba(0,0,0,0.18)', 10);
  fillRR(c, x, menuY, menuW, h, 26, 'rgba(244,246,238,0.97)');
  noShadow(c);
  const icons = [G.compass, G.globe, G.copy, G.glasses];
  L.ctx.forEach((label, i) => {
    const ry = menuY + i * CTX_ROW;
    if (press === i) {
      c.save();
      rr(c, x, menuY, menuW, h, 26);
      c.clip();
      c.fillStyle = 'rgba(0,0,0,0.1)';
      c.fillRect(x, ry, menuW, CTX_ROW);
      c.restore();
    }
    icons[i](c, x + 34, ry + CTX_ROW / 2, 24, '#000');
    c.font = S(500, 17);
    text(c, ellipsize(c, label, menuW - 76), x + 60, ry + CTX_ROW / 2 + 6, S(500, 17), '#000');
  });
  c.restore();
}

// Link brauzerda ochilganda ilovalar almashadi: yangisi o'ngdan suriladi, eskisi chapga ketib xiralashadi
export function slideApp(c, os, p, drawFrom, drawTo) {
  const { SW, SH } = DEV[os];
  const e = E.io3(clamp(p));
  c.save();
  c.translate(-SW * 0.3 * e, 0);
  drawFrom(c);
  c.fillStyle = `rgba(0,0,0,${0.2 * e})`;
  c.fillRect(0, 0, SW, SH);
  c.restore();
  c.save();
  c.translate(SW * (1 - e), 0);
  shadow(c, 24, 'rgba(0,0,0,0.25)');
  c.fillStyle = '#fff';
  c.fillRect(0, 0, SW, SH);
  noShadow(c);
  drawTo(c);
  c.restore();
}

// Qisqa xabar (toast). ios — tepada, android — pastda
export function toast(c, os, msg, p, y = null) {
  if (p <= 0) return;
  const { SW } = DEV[os];
  const e = E.out3(clamp(p));
  c.save();
  c.globalAlpha = clamp(p * 1.5);
  if (os === 'ios') {
    const ty = lerp(30, 58, e);
    fillRR(c, 10, ty, SW - 20, 50, 14, 'rgba(38,38,40,0.92)');
    G.copy(c, 38, ty + 25, 22, '#fff');
    text(c, msg, 62, ty + 31, S(500, 15.5), '#fff');
  } else {
    const ty = (y ?? 690) + (1 - e) * 20;
    fillRR(c, 10, ty, SW - 20, 50, 10, '#2E3236');
    G.copy(c, 36, ty + 25, 22, '#fff');
    text(c, msg, 60, ty + 31, S(400, 15), '#fff');
  }
  c.restore();
}

// ---------- Bosh ekran ----------
const IOS_GRID = ['calendar', 'photos', 'camera', 'mail', 'clock', 'weather', 'maps', 'notes', 'store', 'settings', 'telegram', 'contacts'];
const IOS_DOCK = ['phone', 'safari', 'messages', 'music'];
const AND_GRID = ['calendar', 'clock', 'gallery', 'settings', 'contacts', 'weather', 'notes', 'telegram'];
const AND_DOCK = ['phone', 'messages', 'chrome', 'camera'];

export function homeLayout(os) {
  const { SW, SH, BOT } = DEV[os];
  const ios = os === 'ios';
  const s = ios ? 62 : 58;
  const m = ios ? 27 : 24;
  const gap = (SW - 2 * m - 4 * s) / 3;
  const top = ios ? 76 : 100;
  const pitch = ios ? 100 : 104;
  const cell = (i) => ({ x: m + (i % 4) * (s + gap), y: top + Math.floor(i / 4) * pitch, s });
  const grid = (ios ? IOS_GRID : AND_GRID).map((k, i) => ({ k, ...cell(i) }));
  const nextI = grid.length;
  const fresh = { k: 'tsweet', ...cell(nextI) };
  const dockY = ios ? SH - BOT - 76 : SH - BOT - 92;
  const dock = (ios ? IOS_DOCK : AND_DOCK).map((k, i) => ({ k, x: m + i * (s + gap), y: dockY + (ios ? 7 : 0), s }));
  const all = [...grid, ...dock, fresh];
  const find = (k) => {
    const a = all.find((q) => q.k === k);
    return { x: a.x, y: a.y, w: s, h: s, r: s * (ios ? 0.225 : 0.3), cx: a.x + s / 2, cy: a.y + s / 2 };
  };
  return { s, grid, dock, fresh, dockY, find };
}

function wallpaper(c, os) {
  const { SW, SH } = DEV[os];
  const g = c.createLinearGradient(0, 0, SW * 0.3, SH);
  if (os === 'ios') {
    g.addColorStop(0, '#4E3F86');
    g.addColorStop(0.5, '#B0609F');
    g.addColorStop(1, '#F0A38E');
  } else {
    g.addColorStop(0, '#1E3A6E');
    g.addColorStop(0.55, '#5B4FA8');
    g.addColorStop(1, '#D97FB0');
  }
  c.fillStyle = g;
  c.fillRect(0, 0, SW, SH);
  const blobs = os === 'ios' ? [[60, 220, 160, 'rgba(255,170,210,0.35)'], [330, 560, 200, 'rgba(120,90,220,0.35)']] : [[320, 260, 170, 'rgba(110,200,255,0.25)'], [60, 620, 200, 'rgba(255,140,190,0.3)']];
  for (const [x, y, r, col] of blobs) {
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg;
    c.fillRect(0, 0, SW, SH);
  }
}

// st: { enter (0..1, ekranga kirish), fresh (0..1 yangi belgi), glow (0..1), press:'safari'|'tsweet'|null }
export function home(c, os, apps, st, searchLabel = 'Search') {
  const { SW, SH } = DEV[os];
  const ios = os === 'ios';
  const H = homeLayout(os);
  wallpaper(c, os);
  const en = E.out3(clamp(st.enter ?? 1));
  c.save();
  c.globalAlpha = en;
  const z = lerp(1.12, 1, en);
  c.translate(SW / 2, SH / 2);
  c.scale(z, z);
  c.translate(-SW / 2, -SH / 2);
  const label = (k, x, y) => {
    c.save();
    shadow(c, 3, 'rgba(0,0,0,0.35)', 0.5);
    c.font = S(ios ? 500 : 400, ios ? 11.5 : 12);
    const name = k === 'tsweet' ? 'Tayyor&Sweet' : apps[k];
    text(c, ellipsize(c, name, H.s + 18), x + H.s / 2, y + H.s + (ios ? 15 : 17), S(ios ? 500 : 400, ios ? 11.5 : 12), '#fff', 'center');
    c.restore();
  };
  const icon = (a, withLabel = true) => {
    c.save();
    if (st.press === a.k) {
      c.translate(a.x + H.s / 2, a.y + H.s / 2);
      c.scale(0.9, 0.9);
      c.translate(-a.x - H.s / 2, -a.y - H.s / 2);
    }
    shadow(c, 6, 'rgba(0,0,0,0.18)', 2);
    appIcon(c, a.k, a.x, a.y, H.s, ios);
    noShadow(c);
    if (st.press === a.k) fillRR(c, a.x, a.y, H.s, H.s, H.s * 0.25, 'rgba(0,0,0,0.25)');
    c.restore();
    if (withLabel) label(a.k, a.x, a.y);
  };
  H.grid.forEach((a) => icon(a));
  // dock
  if (ios) {
    c.save();
    fillRR(c, 10, H.dockY - 6, SW - 20, H.s + 26, 34, 'rgba(255,255,255,0.26)');
    c.restore();
    c.font = S(500, 12);
    fillRR(c, SW / 2 - 40, H.dockY - 46, 80, 28, 14, 'rgba(255,255,255,0.24)');
    G.search(c, SW / 2 - 18, H.dockY - 32, 12, '#fff');
    text(c, searchLabel, SW / 2 + 6, H.dockY - 27, S(500, 12.5), '#fff', 'center');
  } else {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,0.45)';
      c.beginPath();
      c.arc(SW / 2 - 12 + i * 12, H.dockY - 18, 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  H.dock.forEach((a) => icon(a, !ios));
  // yangi belgi
  const f = st.fresh ?? 0;
  if (f > 0) {
    const a = H.fresh;
    const k = E.back(clamp(f));
    if (st.glow > 0) {
      c.save();
      c.globalAlpha = st.glow;
      const cx = a.x + H.s / 2, cy = a.y + H.s / 2;
      const rg = c.createRadialGradient(cx, cy, H.s * 0.3, cx, cy, H.s * 1.15);
      rg.addColorStop(0, 'rgba(255,220,240,0.9)');
      rg.addColorStop(1, 'rgba(255,220,240,0)');
      c.fillStyle = rg;
      c.fillRect(cx - H.s * 1.2, cy - H.s * 1.2, H.s * 2.4, H.s * 2.4);
      c.restore();
    }
    c.save();
    c.translate(a.x + H.s / 2, a.y + H.s / 2);
    c.scale(k, k);
    c.translate(-a.x - H.s / 2, -a.y - H.s / 2);
    icon(a);
    c.restore();
  }
  c.restore();
  statusBar(c, os, true);
  homeBar(c, os, true);
  return H;
}

// Ilova ochilishi: belgi to'rtburchagidan butun ekranga
export function launch(c, os, rect, p, drawApp) {
  const { SW, SH } = DEV[os];
  const e = E.out3(clamp(p));
  const x = lerp(rect.x, 0, e), y = lerp(rect.y, 0, e), w = lerp(rect.w, SW, e), h = lerp(rect.h, SH, e);
  c.save();
  c.globalAlpha = clamp(p * 4);
  rr(c, x, y, w, h, lerp(rect.r, 44, e));
  c.clip();
  c.translate(x, y);
  c.scale(w / SW, h / SH);
  drawApp(c);
  c.restore();
}

// Ilovadan bosh ekranga (yuqoriga surish): ilova kichrayib yo'qoladi
export function closeApp(c, os, p, drawApp) {
  const { SW, SH } = DEV[os];
  const e = E.io3(clamp(p));
  if (e >= 1) return;
  const s = lerp(1, 0.42, e);
  c.save();
  c.globalAlpha = 1 - E.in2(clamp(p));
  c.translate(SW / 2, lerp(SH / 2, SH * 0.62, e));
  c.scale(s, s);
  c.translate(-SW / 2, -SH / 2);
  rr(c, 0, 0, SW, SH, lerp(0, 50, e) / s);
  c.clip();
  drawApp(c);
  c.restore();
}

// ---------- Klaviatura ----------
export function keyboard(c, os, y) {
  const { SW, SH, BOT } = DEV[os];
  const ios = os === 'ios';
  c.fillStyle = ios ? '#D1D3D9' : '#F1F2F4';
  c.fillRect(0, y, SW, SH - y + 40);
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const g = ios ? 6 : 5;
  const kw = (SW - g * 11) / 10;
  const kh = ios ? 43 : 44;
  rows.forEach((row, i) => {
    const ky = y + 10 + i * (kh + (ios ? 11 : 9));
    const off = (SW - row.length * kw - (row.length - 1) * g) / 2;
    [...row].forEach((ch, j) => {
      const kx = off + j * (kw + g);
      c.save();
      shadow(c, 0, 'rgba(0,0,0,0.3)', 1);
      fillRR(c, kx, ky, kw, kh, ios ? 5 : 7, '#fff');
      c.restore();
      text(c, ch, kx + kw / 2, ky + kh / 2 + 7, S(400, ios ? 22 : 20), '#111', 'center');
    });
    if (i === 2) {
      fillRR(c, g, ky, kw * 1.35, kh, ios ? 5 : 7, ios ? '#ABB0BA' : '#E1E3E7');
      fillRR(c, SW - g - kw * 1.35, ky, kw * 1.35, kh, ios ? 5 : 7, ios ? '#ABB0BA' : '#E1E3E7');
    }
  });
  const by = y + 10 + 3 * (kh + (ios ? 11 : 9));
  fillRR(c, g, by, kw * 2.4, kh, ios ? 5 : 7, ios ? '#ABB0BA' : '#E1E3E7');
  text(c, '123', g + kw * 1.2, by + kh / 2 + 6, S(400, 16), '#111', 'center');
  fillRR(c, g * 2 + kw * 2.4, by, SW - g * 4 - kw * 4.8, kh, ios ? 5 : 7, '#fff');
  text(c, ios ? 'space' : '', SW / 2, by + kh / 2 + 6, S(400, 16), '#111', 'center');
  fillRR(c, SW - g - kw * 2.4, by, kw * 2.4, kh, ios ? 5 : 7, ios ? C.ios : '#3D7BF7');
  text(c, ios ? 'go' : '→', SW - g - kw * 1.2, by + kh / 2 + 6, S(500, 16), '#fff', 'center');
  return by + kh + 8 + BOT;
}
export const KB_H = { ios: 10 + 4 * 43 + 3 * 11 + 10 + 34 + 8, and: 10 + 4 * 44 + 3 * 9 + 8 + 20 + 8 };

// ---------- Safari (iOS) ----------
const SAFARI_BAR_Y = DEV.ios.SH - DEV.ios.BOT - 26;

export function safariTargets() {
  const { SW, SH } = DEV.ios;
  return {
    bar: { x: SW / 2, y: SAFARI_BAR_Y },
    more: { x: SW - 32, y: SAFARI_BAR_Y },
    field: { x: SW / 2, y: SH - KB_H.ios - 30 },
    paste: { x: SW / 2 - 40, y: SH - KB_H.ios - 30 - 52 },
    menuShare: { x: SW - 8 - 125, y: SAFARI_BAR_Y - 32 - 5 * 46 + 23 },
    addRow: (top) => ({ x: SW / 2, y: top + 200 + 5 * 52 + 26 }),
    addBtn: (top) => ({ x: SW - 36, y: top + 26 }),
  };
}

function glassBtn(c, x, y, r) {
  c.save();
  shadow(c, 14, 'rgba(0,0,0,0.14)', 3);
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// st: { page(0..1), focus(0..1), kb(0..1), typed, callout(0..1), calloutPress, load(-1|0..1), menu(0..1), menuPress, share(0..1), sharePress, add(0..1), addPress,
//       start (false — linkdan ochilgan: "Избранное" bosh sahifasi yo'q), crumb ("◀ Telegram") }
export function safari(c, I, st, link) {
  const { SW, SH, SB, BOT } = DEV.ios;
  const T = safariTargets();
  const pageA = clamp(st.page ?? 0);
  // bosh sahifa (linkdan ochilganda — yuklanguncha oq)
  c.fillStyle = st.start === false ? '#fff' : '#F2F2F7';
  c.fillRect(0, 0, SW, SH);
  if (pageA < 1 && st.start !== false) {
    c.save();
    c.globalAlpha = 1 - pageA;
    text(c, I.favorites, 20, SB + 64, S(700, 22), '#000');
    const fav = [['G', '#4285F4', 'Google'], ['N', '#03C75A', 'Naver'], ['Y', '#FF0000', 'YouTube'], ['W', '#555', 'Wikipedia']];
    fav.forEach(([ch, col, name], i) => {
      const x = 20 + i * 92, y = SB + 84;
      fillRR(c, x, y, 70, 70, 16, '#fff');
      text(c, ch, x + 35, y + 46, S(700, 30), col, 'center');
      text(c, name, x + 35, y + 90, S(400, 12), '#333', 'center');
    });
    c.restore();
  }
  if (pageA > 0) {
    c.save();
    c.globalAlpha = pageA;
    c.fillStyle = '#FFF0F7';
    c.fillRect(0, 0, SW, SH);
    c.drawImage(IMG.pageIos, 0, SB, SW, (SW * IMG.pageIos.height) / IMG.pageIos.width);
    c.restore();
  }
  statusBar(c, 'ios', false, pageA > 0.5 ? '#FFF0F7' : '#F2F2F7', st.crumb);

  const focus = E.io3(clamp(st.focus ?? 0));
  const kbE = E.out3(clamp(st.kb ?? 0));
  const domain = 'tayyor-sweet.vercel.app';
  // pastki panel (fokus bo'lmaganda)
  if (focus < 1) {
    c.save();
    c.globalAlpha = 1 - focus;
    glassBtn(c, 32, SAFARI_BAR_Y, 24);
    G.chevron(c, 31, SAFARI_BAR_Y, 20, '#000');
    glassBtn(c, SW - 32, SAFARI_BAR_Y, 24);
    G.dots(c, SW - 32, SAFARI_BAR_Y, 26, '#000');
    c.save();
    shadow(c, 14, 'rgba(0,0,0,0.14)', 3);
    fillRR(c, 64, SAFARI_BAR_Y - 24, SW - 128, 48, 24, 'rgba(255,255,255,0.94)');
    c.restore();
    if (pageA > 0.5 || st.load >= 0) {
      text(c, domain, SW / 2, SAFARI_BAR_Y + 5.5, S(500, 15), '#000', 'center');
    } else {
      G.search(c, 84, SAFARI_BAR_Y, 15, '#8E8E93');
      c.font = S(400, 15);
      text(c, ellipsize(c, I.search, SW - 190), 98, SAFARI_BAR_Y + 5.5, S(400, 15), '#8E8E93');
    }
    if (st.load >= 0 && st.load < 1) {
      c.save();
      rr(c, 64, SAFARI_BAR_Y - 24, SW - 128, 48, 24);
      c.clip();
      c.fillStyle = C.ios;
      c.fillRect(64, SAFARI_BAR_Y + 21, (SW - 128) * E.out2(st.load), 3);
      c.restore();
    }
    c.restore();
  }
  // klaviatura va yuqoridagi manzil maydoni
  if (kbE > 0) keyboard(c, 'ios', SH - KB_H.ios * kbE);
  if (focus > 0) {
    const fy = lerp(SAFARI_BAR_Y, T.field.y, focus);
    const fx = lerp(64, 12, focus), fw = lerp(SW - 128, SW - 24, focus);
    c.save();
    shadow(c, 10, 'rgba(0,0,0,0.12)', 2);
    fillRR(c, fx, fy - 24, fw, 48, 24, '#fff');
    c.restore();
    if (st.typed) {
      c.font = S(400, 16);
      text(c, ellipsize(c, link.replace('https://', ''), fw - 40), fx + 20, fy + 6, S(400, 16), '#000');
    } else {
      fillRR(c, fx + 20, fy - 11, 2, 22, 1, C.ios);
    }
  }
  // "Paste and Go" pufakchasi
  const cp = clamp(st.callout ?? 0);
  if (cp > 0) {
    c.save();
    c.globalAlpha = cp;
    const cy = T.paste.y;
    c.font = S(500, 15);
    const w = c.measureText(I.paste).width + 32;
    const x = T.paste.x - w / 2;
    c.translate(T.paste.x, cy + 20);
    const k = lerp(0.85, 1, E.back(cp));
    c.scale(k, k);
    c.translate(-T.paste.x, -cy - 20);
    fillRR(c, x, cy - 20, w, 40, 10, st.calloutPress ? '#5a5a5e' : '#2C2C2E');
    c.fillStyle = st.calloutPress ? '#5a5a5e' : '#2C2C2E';
    c.beginPath();
    c.moveTo(T.paste.x - 8, cy + 20);
    c.lineTo(T.paste.x + 8, cy + 20);
    c.lineTo(T.paste.x, cy + 28);
    c.fill();
    text(c, I.paste, T.paste.x, cy + 5.5, S(500, 15), '#fff', 'center');
    c.restore();
  }
  // "⋯" menyusi
  const mp = clamp(st.menu ?? 0);
  if (mp > 0) {
    const icons = [G.share, G.star, G.book, G.search, G.plus];
    const w = 250, rows = I.menu.length, h = rows * 46;
    const x = SW - 8 - w, y = SAFARI_BAR_Y - 32 - h;
    c.save();
    c.globalAlpha = clamp(mp * 2);
    const k = lerp(0.6, 1, E.out3(mp));
    c.translate(SW - 32, SAFARI_BAR_Y);
    c.scale(k, k);
    c.translate(-(SW - 32), -SAFARI_BAR_Y);
    shadow(c, 30, 'rgba(0,0,0,0.22)', 8);
    fillRR(c, x, y, w, h, 22, 'rgba(250,250,252,0.98)');
    noShadow(c);
    I.menu.forEach((label, i) => {
      const ry = y + i * 46;
      if (st.menuPress === i) {
        c.save();
        rr(c, x, y, w, h, 22);
        c.clip();
        c.fillStyle = 'rgba(0,0,0,0.09)';
        c.fillRect(x, ry, w, 46);
        c.restore();
      }
      if (i) {
        c.fillStyle = 'rgba(60,60,67,0.16)';
        c.fillRect(x + 16, ry, w - 16, 0.6);
      }
      c.font = S(400, 16.5);
      text(c, ellipsize(c, label, w - 70), x + 18, ry + 29, S(400, 16.5), '#000');
      icons[i](c, x + w - 26, ry + 23, 20, '#000');
    });
    c.restore();
  }
  // Ulashish oynasi
  const sp = clamp(st.share ?? 0);
  if (sp > 0) {
    c.fillStyle = `rgba(0,0,0,${0.25 * sp})`;
    c.fillRect(0, 0, SW, SH);
    const top = lerp(SH, st.shareTop, E.out3(sp));
    shareSheet(c, I, top, st.sharePress);
  }
  // "Add to Home Screen" oynasi
  const ap = clamp(st.add ?? 0);
  if (ap > 0) {
    c.fillStyle = `rgba(0,0,0,${0.3 * ap})`;
    c.fillRect(0, 0, SW, SH);
    const top = lerp(SH, st.addTop, E.out3(ap));
    addSheet(c, I, top, st.addPress, link);
  }
  homeBar(c, 'ios');
}

function shareSheet(c, I, top, press) {
  const { SW, SH } = DEV.ios;
  c.save();
  c.fillStyle = '#F2F2F7';
  c.beginPath();
  c.roundRect(0, top, SW, SH - top + 20, [14, 14, 0, 0]);
  c.fill();
  roundImg(c, IMG.icon, 16, top + 16, 46, 46, 11);
  text(c, I.sheetTitle, 74, top + 35, S(600, 15), '#000');
  text(c, 'tayyor-sweet.vercel.app', 74, top + 54, S(400, 13), '#8E8E93');
  fillRR(c, SW - 46, top + 20, 30, 30, 15, '#E3E3E8');
  G.close(c, SW - 31, top + 35, 18, '#7C7C80');
  c.fillStyle = 'rgba(60,60,67,0.18)';
  c.fillRect(0, top + 76, SW, 0.6);
  const kinds = ['airdrop', 'messages', 'mail', 'telegram', 'notes'];
  kinds.forEach((k, i) => {
    const x = 18 + i * 74, y = top + 92;
    if (k === 'airdrop') {
      const g = c.createLinearGradient(x, y, x, y + 60);
      g.addColorStop(0, '#36C3FF');
      g.addColorStop(1, '#1A7CFF');
      c.fillStyle = g;
      rr(c, x, y, 60, 60, 13.5);
      c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 2.4;
      for (const r of [8, 15, 22]) {
        c.beginPath();
        c.arc(x + 30, y + 34, r, Math.PI * 1.15, Math.PI * 1.85);
        c.stroke();
      }
    } else appIcon(c, k, x, y, 60, true);
    c.font = S(400, 11.5);
    text(c, ellipsize(c, I.targets[i], 70), x + 30, y + 78, S(400, 11.5), '#000', 'center');
  });
  const gy = top + 200;
  const icons = [G.copy, G.glasses, G.book, G.star, G.search, G.plusSquare, G.share];
  const n = I.actions.length;
  fillRR(c, 16, gy, SW - 32, n * 52, 12, '#fff');
  I.actions.forEach((a, i) => {
    const y = gy + i * 52;
    if (press === i) {
      c.save();
      rr(c, 16, gy, SW - 32, n * 52, 12);
      c.clip();
      c.fillStyle = '#E3E3E8';
      c.fillRect(16, y, SW - 32, 52);
      c.restore();
    }
    if (i) {
      c.fillStyle = 'rgba(60,60,67,0.16)';
      c.fillRect(32, y, SW - 48, 0.6);
    }
    text(c, a, 32, y + 32, S(400, 17), '#000');
    icons[i](c, SW - 44, y + 26, 22, '#000');
  });
  c.restore();
}

function addSheet(c, I, top, press, link) {
  const { SW, SH } = DEV.ios;
  c.save();
  c.fillStyle = '#F2F2F7';
  c.beginPath();
  c.roundRect(0, top, SW, SH - top + 20, [12, 12, 0, 0]);
  c.fill();
  text(c, I.cancel, 16, top + 32, S(400, 17), C.ios);
  c.font = S(600, 17);
  text(c, ellipsize(c, I.addTitle, 190), SW / 2, top + 32, S(600, 17), '#000', 'center');
  if (press) fillRR(c, SW - 78, top + 10, 70, 32, 16, 'rgba(0,122,255,0.15)');
  text(c, I.add, SW - 16, top + 32, S(600, 17), C.ios, 'right');
  const gy = top + 64;
  fillRR(c, 16, gy, SW - 32, 112, 12, '#fff');
  c.save();
  shadow(c, 3, 'rgba(0,0,0,0.15)', 1);
  roundImg(c, IMG.icon, 30, gy + 16, 64, 64, 14);
  c.restore();
  text(c, 'Tayyor&Sweet', 110, gy + 38, S(400, 17), '#000');
  fillRR(c, SW - 56, gy + 22, 20, 20, 10, '#C7C7CC');
  G.close(c, SW - 46, gy + 32, 12, '#fff');
  c.fillStyle = 'rgba(60,60,67,0.2)';
  c.fillRect(110, gy + 56, SW - 142, 0.6);
  c.font = S(400, 13);
  text(c, ellipsize(c, link, SW - 150), 110, gy + 80, S(400, 13), '#8E8E93');
  const g2 = gy + 128;
  fillRR(c, 16, g2, SW - 32, 50, 12, '#fff');
  c.font = S(400, 17);
  text(c, ellipsize(c, I.webapp, SW - 140), 32, g2 + 31, S(400, 17), '#000');
  fillRR(c, SW - 32 - 51, g2 + 10, 51, 31, 15.5, C.green);
  c.save();
  shadow(c, 3, 'rgba(0,0,0,0.25)', 1);
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(SW - 32 - 15.5, g2 + 25.5, 13.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // izoh (bir necha qator)
  const lay = layoutRich(c, [{ t: I.foot }], SW - 64, 13, S);
  drawRich(c, lay, 32, g2 + 76, 18, '#8E8E93');
  c.restore();
}

// ---------- Chrome (Android) ----------
export function chromeTargets(pageBtn) {
  const { SW } = DEV.and;
  return {
    omni: { x: 170, y: 60 },
    suggest: { x: SW / 2, y: 88 + 34 },
    pageBtn: { x: pageBtn.cx, y: 88 + pageBtn.cy },
    install: (top) => ({ x: SW - 74, y: top + 194 }),
  };
}

// st: { page, focus, kb, typed, load, install(0..1), installTop, installPress, toast(0..1), toastText }
export function chrome(c, A, st, pageBtnPress, link) {
  const { SW, SH, SB } = DEV.and;
  const pageA = clamp(st.page ?? 0);
  c.fillStyle = '#fff';
  c.fillRect(0, 0, SW, SH);
  const focus = clamp(st.focus ?? 0);
  // yangi oyna sahifasi
  if (pageA < 1) {
    c.save();
    c.globalAlpha = 1 - pageA;
    fillRR(c, 24, 230, SW - 48, 52, 26, '#EEF1F6');
    G.search(c, 52, 256, 18, '#5F6368');
    c.font = S(400, 16);
    text(c, ellipsize(c, A.search, SW - 140), 76, 262, S(400, 16), '#5F6368');
    const tiles = [['G', '#4285F4'], ['N', '#03C75A'], ['Y', '#FF0000'], ['W', '#555'], ['K', '#F7C600'], ['C', '#E5375F'], ['M', '#1A73E8'], ['+', '#5F6368']];
    tiles.forEach(([ch, col], i) => {
      const x = 48 + (i % 4) * 80, y = 330 + Math.floor(i / 4) * 96;
      c.fillStyle = '#F1F3F4';
      c.beginPath();
      c.arc(x + 16, y + 24, 26, 0, Math.PI * 2);
      c.fill();
      text(c, ch, x + 16, y + 32, S(700, 20), col, 'center');
    });
    c.restore();
  }
  if (pageA > 0) {
    c.save();
    c.globalAlpha = pageA;
    c.fillStyle = '#FFF0F7';
    c.fillRect(0, 88, SW, SH);
    c.drawImage(IMG.pageAnd, 0, 88, SW, (SW * IMG.pageAnd.height) / IMG.pageAnd.width);
    if (pageBtnPress) {
      const b = st.btnRect;
      fillRR(c, b.x, 88 + b.y, b.w, b.h, b.h / 2, 'rgba(74,36,68,0.18)');
    }
    c.restore();
  }
  // asboblar paneli
  c.fillStyle = '#fff';
  c.fillRect(0, 0, SW, 88);
  statusBar(c, 'and');
  if (focus > 0.5) {
    G.arrowLeft(c, 22, 60, 20, '#444');
    fillRR(c, 44, 40, SW - 56, 40, 20, '#EEF1F6');
    if (st.typed) {
      c.font = S(400, 15.5);
      text(c, ellipsize(c, link.replace('https://', ''), SW - 90), 60, 66, S(400, 15.5), '#202124');
    } else fillRR(c, 60, 50, 2, 21, 1, '#1A73E8');
  } else {
    G.home(c, 20, 60, 22, '#444');
    fillRR(c, 44, 40, 260, 40, 20, '#EEF1F6');
    if (pageA > 0.5 || st.load >= 0) {
      G.lock(c, 62, 60, 13, '#5F6368');
      c.font = S(400, 15.5);
      text(c, ellipsize(c, 'tayyor-sweet.vercel.app', 215), 76, 66, S(400, 15.5), '#202124');
    } else {
      c.font = S(400, 15.5);
      text(c, ellipsize(c, A.search, 225), 60, 66, S(400, 15.5), '#5F6368');
    }
    c.strokeStyle = '#444';
    c.lineWidth = 1.8;
    rr(c, 316, 51, 18, 18, 4);
    c.stroke();
    text(c, '1', 325, 65, S(600, 11), '#444', 'center');
    G.vdots(c, SW - 22, 60, 22, '#444');
  }
  if (st.load >= 0 && st.load < 1) {
    c.fillStyle = '#1A73E8';
    c.fillRect(0, 86, SW * E.out2(st.load), 3);
  }
  // takliflar ro'yxati
  if (focus > 0) {
    c.save();
    c.globalAlpha = E.out3(focus);
    c.fillStyle = '#fff';
    c.fillRect(0, 88, SW, SH - 88);
    if (st.suggestPress) {
      c.fillStyle = '#EDEFF2';
      c.fillRect(0, 88, SW, 68);
    }
    c.fillStyle = '#E8F0FE';
    c.beginPath();
    c.arc(34, 122, 18, 0, Math.PI * 2);
    c.fill();
    G.link(c, 34, 122, 20, '#1A73E8');
    text(c, A.copied, 66, 116, S(500, 15.5), '#202124');
    c.font = S(400, 13.5);
    text(c, ellipsize(c, link, SW - 90), 66, 137, S(400, 13.5), '#1A73E8');
    ['tayyor sweet', 'tayyor sweet tort'].forEach((q, i) => {
      const y = 156 + i * 56;
      G.search(c, 34, y + 28, 17, '#5F6368');
      text(c, q, 66, y + 33, S(400, 15.5), '#202124');
    });
    c.restore();
  }
  const kbE = E.out3(clamp(st.kb ?? 0));
  if (kbE > 0) keyboard(c, 'and', SH - KB_H.and * kbE);
  // o'rnatish oynasi
  const ip = clamp(st.install ?? 0);
  if (ip > 0) {
    c.fillStyle = `rgba(0,0,0,${0.32 * ip})`;
    c.fillRect(0, 0, SW, SH);
    const top = lerp(SH, st.installTop, E.out3(ip));
    c.save();
    c.fillStyle = '#fff';
    c.beginPath();
    c.roundRect(0, top, SW, SH - top + 30, [28, 28, 0, 0]);
    c.fill();
    fillRR(c, SW / 2 - 16, top + 10, 32, 4, 2, '#C9CCD1');
    text(c, A.installTitle, 24, top + 58, S(500, 22), '#1F1F1F');
    c.save();
    shadow(c, 3, 'rgba(0,0,0,0.18)', 1);
    roundImg(c, IMG.icon, 24, top + 82, 52, 52, 26);
    c.restore();
    text(c, 'Tayyor & Sweet', 90, top + 104, S(600, 17), '#1F1F1F');
    text(c, 'tayyor-sweet.vercel.app', 90, top + 126, S(400, 14), '#5F6368');
    c.font = S(500, 15.5);
    const iw = Math.max(100, c.measureText(A.install).width + 40);
    const cw = c.measureText(A.cancel).width;
    text(c, A.cancel, SW - 24 - iw - 22 - cw / 2, top + 200, S(500, 15.5), '#0B57D0', 'center');
    fillRR(c, SW - 24 - iw, top + 174, iw, 42, 21, st.installPress ? '#2A6DE0' : '#0B57D0');
    text(c, A.install, SW - 24 - iw / 2, top + 200, S(500, 15.5), '#fff', 'center');
    c.restore();
  }
  const tp = clamp(st.toast ?? 0);
  if (tp > 0) {
    c.save();
    c.globalAlpha = tp;
    c.font = S(400, 14.5);
    const w = c.measureText(st.toastText).width + 40;
    fillRR(c, SW / 2 - w / 2, SH - 110 + (1 - E.out3(tp)) * 16, w, 44, 22, '#323232');
    text(c, st.toastText, SW / 2, SH - 83 + (1 - E.out3(tp)) * 16, S(400, 14.5), '#fff', 'center');
    c.restore();
  }
  homeBar(c, 'and');
}

// ---------- Ilova ochilgandagi ekranlar ----------
export function appSplash(c, os) {
  const { SW, SH } = DEV[os];
  const g = c.createLinearGradient(0, 0, SW, SH);
  g.addColorStop(0, '#F8A0D0');
  g.addColorStop(0.55, '#F48FB8');
  g.addColorStop(1, '#E276AD');
  c.fillStyle = g;
  c.fillRect(0, 0, SW, SH);
  c.save();
  shadow(c, 30, 'rgba(74,36,68,0.3)', 12);
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(SW / 2, SH * 0.42, 70, 0, Math.PI * 2);
  c.fill();
  c.restore();
  circleImg(c, IMG.logo, SW / 2, SH * 0.42, 66);
  text(c, 'Tayyor & Sweet', SW / 2, SH * 0.42 + 120, F_(800, 28), '#fff', 'center');
}

export function androidSplash(c) {
  const { SW, SH } = DEV.and;
  c.fillStyle = '#FFF0F7';
  c.fillRect(0, 0, SW, SH);
  roundImg(c, IMG.icon, SW / 2 - 56, SH / 2 - 70, 112, 112, 56);
}

export function shop(c, os) {
  const { SW, SB } = DEV[os];
  c.fillStyle = '#FFF0F7';
  c.fillRect(0, 0, SW, DEV[os].SH);
  c.drawImage(IMG.shop, 0, SB, SW, (SW * IMG.shop.height) / IMG.shop.width);
  statusBar(c, os, false, '#FFF0F7');
  homeBar(c, os);
}

const F_ = (w, s) => `${w} ${s}px Onest, "Noto Color Emoji", sans-serif`;
