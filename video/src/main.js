// Video kadri: drawFrame(t) faqat vaqtga bog'liq (tasodifiy son va taymer yo'q) — oldindan ko'rish va yakuniy kadr bir xil
import { W, H, C, E, F, S, clamp, lerp, pr, vis, rng, rr, fillRR, text, IMG, loadImages, shadow, noShadow } from './core.js';
import { L } from './strings.js';
import * as UI from './ui.js';

const Q = new URLSearchParams(location.search);
const DEVICE = Q.get('device') === 'samsung' ? 'samsung' : 'iphone';
const OS = DEVICE === 'iphone' ? 'ios' : 'and';
const D = UI.DEV[OS];

// Instagram Reels xavfsiz hududi (1080×1920): tepada ~250 px (sarlavha paneli), pastda ~420 px
// (izoh, akkaunt nomi), o'ngda tugmalar ustuni. Hamma muhim narsa markazdagi 780×1250 ichida.
const SAFE = { x0: 150, x1: 930, y0: 250, y1: 1510 };
// Telefon (kanvas pikselida): ekran 450 px eni, markazda
const SCR_W = 450;
const K = SCR_W / D.SW;
const BEZEL = 12;
const SCR_H = D.SH * K;
const PHONE = { x: 540 - SCR_W / 2 - BEZEL, y: 490, w: SCR_W + 2 * BEZEL, h: SCR_H + 2 * BEZEL };
const SCR = { x: PHONE.x + BEZEL, y: PHONE.y + BEZEL, w: SCR_W, h: SCR_H };
const ANCHOR = { x: 540, y: PHONE.y + PHONE.h / 2 };
// Zum paytida telefon ko'rinadigan oyna (yuqori va pastki cheti yumshoq so'nadi)
const VIEW = { y0: 470, y1: SAFE.y1, fade: 40 };

// ---------- Vaqt jadvali yordamchilari ----------
const cues = [];
const cue = (t, s, g = 1) => cues.push({ t: +t.toFixed(3), s, g });

class Touch {
  ops = [];
  show(t, p) { this.ops.push({ k: 'show', t, p }); return this; }
  move(t0, t1, p) { this.ops.push({ k: 'move', t0, t1, p }); return this; }
  tap(t) { this.ops.push({ k: 'tap', t }); cue(t, 'tap'); return this; }
  hold(t0, t1) { this.ops.push({ k: 'hold', t0, t1 }); cue(t0, 'hold'); cue(t1, 'thud'); return this; }
  hide(t) { this.ops.push({ k: 'hide', t }); return this; }
  swipe(t0, t1, p0, p1) { cue(t0, 'swipe'); return this.show(t0 - 0.08, p0).move(t0, t1, p1).hide(t1 + 0.02); }
  at(t) {
    let pos = null, from = null, a = 0, press = 0, hold = -1, ripple = -1;
    let shownAt = -1, hiddenAt = Infinity;
    for (const o of this.ops) {
      if (o.k === 'show' && t >= o.t) { pos = o.p; shownAt = o.t; hiddenAt = Infinity; }
      if (o.k === 'move' && pos && t >= o.t0) {
        from = from || pos;
        pos = t >= o.t1 ? o.p : { x: lerp(pos.x, o.p.x, E.io3(pr(t, o.t0, o.t1))), y: lerp(pos.y, o.p.y, E.io3(pr(t, o.t0, o.t1))) };
      }
      if (o.k === 'tap' && t >= o.t) {
        if (t < o.t + 0.16) press = Math.sin(pr(t, o.t, o.t + 0.16) * Math.PI);
        if (t < o.t + 0.5) ripple = t - o.t;
      }
      if (o.k === 'hold' && t >= o.t0) {
        if (t <= o.t1 + 0.1) { press = 1; hold = pr(t, o.t0, o.t1); }
        if (t > o.t1 && t < o.t1 + 0.5) ripple = t - o.t1;
      }
      if (o.k === 'hide' && t >= o.t) hiddenAt = o.t;
    }
    if (!pos) return null;
    a = Math.min(E.out3(pr(t, shownAt, shownAt + 0.18)), hiddenAt === Infinity ? 1 : 1 - pr(t, hiddenAt, hiddenAt + 0.22));
    return a > 0 ? { ...pos, a, press, hold, ripple } : null;
  }
}

class Cam {
  keys = [{ t0: -1, t1: 0, s: 1, fy: ANCHOR.y }];
  // fy — ekran pt koordinatasi (null = markaz)
  to(t0, t1, s, fyPt = null) {
    let fy = ANCHOR.y;
    if (fyPt != null && s > 1.001) {
      fy = SCR.y + fyPt * K;
      const lo = PHONE.y + (ANCHOR.y - VIEW.y0) / s, hi = PHONE.y + PHONE.h - (VIEW.y1 - ANCHOR.y) / s;
      fy = lo > hi ? (lo + hi) / 2 : clamp(fy, lo, hi);
    }
    this.keys.push({ t0, t1, s, fy });
    return this;
  }
  at(t) {
    let s = 1, fy = ANCHOR.y;
    for (const k of this.keys) {
      if (t < k.t0) break;
      const e = E.io3(pr(t, k.t0, k.t1));
      s = lerp(s, k.s, e);
      fy = lerp(fy, k.fy, e);
    }
    return { s, fy };
  }
}

const touch = new Touch();
const cam = new Cam();

// ---------- Ssenariy ----------
let SC = null;

function buildIphone(tl) {
  const I = L.ios, tg = L.tg;
  const T = {
    phoneIn: 2.0, s1: 2.6, tapInstall: 4.2, botMsg: 4.75, zoomLink: 6.3,
    s2: 7.2, hold0: 8.0, hold1: 8.7, sheet: 8.75, tapCopy: 10.0, toast: 10.2, swipe: 11.6,
    s3: 12.3, tapSafari: 13.3, tapBar: 14.6, tapField: 15.6, tapPaste: 16.3, load: 16.5, page: 17.2,
    s4: 19.0, tapMore: 20.2, tapShare: 21.3,
    s5: 22.6, tapAddRow: 23.5, tapAdd: 25.4, homeBack: 25.6, fresh: 26.3,
    s6: 27.2, tapIcon: 28.2, shop: 29.4, phoneOut: 32.4, dur: 35.5,
  };
  const SW = D.SW, SH = D.SH;
  const HL = UI.homeLayout('ios');
  const ST = UI.safariTargets();
  const shareTop = 270, addTop = 64;
  const safariRect = HL.find('safari'), freshRect = HL.find('tsweet');
  const copyPt = { x: SW / 2, y: SH - D.BOT - 57 - 4 - 8 - (44 + 3 * 57) + 44 + 57 + 28 };

  touch.show(T.s1 + 0.6, { x: SW / 2 + 60, y: 520 }).move(3.45, 4.05, { x: tl.installBtn.x + tl.installBtn.w / 2, y: tl.installBtn.y + tl.installBtn.h / 2 }).tap(T.tapInstall).hide(4.6);
  touch.show(7.45, { x: tl.link.cx + 60, y: tl.link.cy + 90 }).move(7.5, 7.9, { x: tl.link.cx, y: tl.link.cy }).hold(T.hold0, T.hold1)
    .move(9.35, 9.85, copyPt).tap(T.tapCopy).hide(10.3);
  touch.swipe(T.swipe, T.swipe + 0.35, { x: SW / 2, y: SH - 6 }, { x: SW / 2, y: 560 });
  touch.show(12.7, { x: SW / 2 + 40, y: 600 }).move(12.75, 13.15, { x: safariRect.cx, y: safariRect.cy }).tap(T.tapSafari).hide(13.6);
  touch.show(14.0, { x: SW / 2 + 40, y: 650 }).move(14.05, 14.45, ST.bar).tap(T.tapBar).move(15.1, 15.45, ST.field).tap(T.tapField)
    .move(15.9, 16.15, ST.paste).tap(T.tapPaste).hide(16.6);
  touch.show(19.6, { x: 300, y: 690 }).move(19.65, 20.05, ST.more).tap(T.tapMore).move(20.7, 21.15, ST.menuShare).tap(T.tapShare)
    .move(22.8, 23.3, ST.addRow(shareTop)).tap(T.tapAddRow).move(24.8, 25.25, ST.addBtn(addTop)).tap(T.tapAdd).hide(25.7);
  touch.show(27.5, { x: SW / 2 + 40, y: 600 }).move(27.55, 28.0, { x: freshRect.cx, y: freshRect.cy }).tap(T.tapIcon).hide(28.5);

  cam.to(T.zoomLink, T.zoomLink + 0.8, 1.6, tl.link.cy)
    .to(T.sheet + 0.05, T.sheet + 0.6, 1.45, 640)
    .to(T.toast + 0.1, T.toast + 0.7, 1)
    .to(T.tapBar, T.tapBar + 0.6, 1.5, 650)
    .to(T.load, T.load + 0.6, 1)
    .to(T.page + 0.4, T.s4 - 0.2, 1.2, 360)
    .to(T.s4, T.s4 + 0.6, 1.6, 700)
    .to(T.tapShare + 0.2, T.tapShare + 0.8, 1.4, 600)
    .to(T.tapAddRow + 0.3, T.tapAddRow + 0.9, 1.55, 200)
    .to(T.tapAdd + 0.1, T.tapAdd + 0.6, 1)
    .to(T.fresh - 0.2, T.fresh + 0.4, 1.45, freshRect.cy)
    .to(T.tapIcon + 0.1, T.tapIcon + 0.6, 1)
    .to(T.shop + 0.4, T.phoneOut - 0.3, 1.15, 400)
    .to(T.phoneOut - 0.3, T.phoneOut + 0.1, 1);

  cue(T.botMsg, 'recv'); cue(T.sheet, 'sheet', 0.7); cue(T.toast, 'copy');
  cue(T.tapSafari + 0.1, 'open'); cue(T.tapBar + 0.05, 'key'); cue(T.tapField + 0.1, 'pop', 0.6);
  cue(T.load, 'load'); cue(T.page + 0.2, 'ding'); cue(T.tapMore + 0.05, 'pop', 0.7);
  cue(T.tapShare + 0.15, 'sheet'); cue(T.tapAddRow + 0.15, 'sheet'); cue(T.homeBack, 'swipe');
  cue(T.fresh, 'pop'); cue(T.fresh + 0.05, 'sparkle'); cue(T.fresh + 0.15, 'success');
  cue(T.tapIcon + 0.1, 'open'); cue(T.shop, 'ding', 0.8); cue(T.shop + 0.1, 'confetti'); cue(T.shop + 0.15, 'success2');

  const drawTg = (c, t) => {
    UI.tgChat(c, tl, tg, {
      msgs: [1, pr(t, T.botMsg, T.botMsg + 0.45)],
      btnGlow: vis(t, 3.1, 4.25, 0.3, 0.2) * (0.65 + 0.35 * Math.sin(t * 9)),
      btnPress: t >= T.tapInstall && t < T.tapInstall + 0.16,
      linkHL: vis(t, T.hold0 + 0.1, T.tapCopy + 0.2, 0.3, 0.3),
    });
    const mp = vis(t, T.sheet, T.tapCopy + 0.12, 0.3, 0.25);
    if (mp > 0) UI.tgLinkMenu(c, 'ios', tg, L.link, mp, t >= T.tapCopy && t < T.tapCopy + 0.25 ? 1 : null);
    UI.toast(c, 'ios', tg.copied, vis(t, T.toast, T.toast + 1.2, 0.25, 0.3));
  };
  const safariState = (t) => ({
    page: pr(t, T.page, T.page + 0.35),
    focus: pr(t, T.tapBar + 0.05, T.tapBar + 0.4) - pr(t, T.tapPaste + 0.1, T.tapPaste + 0.45),
    kb: pr(t, T.tapBar + 0.05, T.tapBar + 0.35) - pr(t, T.tapPaste + 0.1, T.tapPaste + 0.4),
    typed: t > T.tapPaste + 0.05,
    callout: vis(t, T.tapField + 0.1, T.tapPaste + 0.05, 0.18, 0.12),
    calloutPress: t >= T.tapPaste && t < T.tapPaste + 0.16,
    load: t < T.load ? -1 : pr(t, T.load, T.load + 0.8),
    menu: vis(t, T.tapMore + 0.05, T.tapShare + 0.05, 0.25, 0.15),
    menuPress: t >= T.tapShare && t < T.tapShare + 0.2 ? 0 : null,
    share: vis(t, T.tapShare + 0.15, T.tapAddRow + 0.15, 0.4, 0.25),
    shareTop,
    sharePress: t >= T.tapAddRow && t < T.tapAddRow + 0.22 ? 5 : null,
    add: vis(t, T.tapAddRow + 0.15, T.tapAdd + 0.1, 0.4, 0.35),
    addTop,
    addPress: t >= T.tapAdd && t < T.tapAdd + 0.18,
  });
  const homeSt = (t, extra = {}) => ({ enter: 1, fresh: t >= T.fresh ? pr(t, T.fresh, T.fresh + 0.5) : 0, glow: vis(t, T.fresh + 0.3, T.tapIcon, 0.4, 0.3) * (0.7 + 0.3 * Math.sin(t * 6)), ...extra });
  const drawApp = (c, t) => {
    UI.appSplash(c, 'ios');
    const p = pr(t, T.shop, T.shop + 0.35);
    if (p > 0) {
      c.save();
      c.globalAlpha = p;
      UI.shop(c, 'ios');
      c.restore();
    }
  };

  const screen = (c, t) => {
    if (t < T.swipe) return drawTg(c, t);
    if (t < T.tapSafari + 0.1) {
      UI.home(c, 'ios', I.apps, { enter: pr(t, T.swipe + 0.05, T.swipe + 0.5), press: t >= T.tapSafari && t < T.tapSafari + 0.2 ? 'safari' : null }, L.homeSearch);
      UI.closeApp(c, 'ios', pr(t, T.swipe, T.swipe + 0.5), (cc) => drawTg(cc, T.swipe));
      return;
    }
    if (t < T.homeBack) {
      if (t < T.tapSafari + 0.6) {
        UI.home(c, 'ios', I.apps, { enter: 1 }, L.homeSearch);
        UI.launch(c, 'ios', safariRect, pr(t, T.tapSafari + 0.1, T.tapSafari + 0.55), (cc) => UI.safari(cc, I, safariState(t), L.link));
      } else UI.safari(c, I, safariState(t), L.link);
      return;
    }
    if (t < T.tapIcon + 0.1) {
      UI.home(c, 'ios', I.apps, homeSt(t, { enter: pr(t, T.homeBack + 0.05, T.homeBack + 0.5), press: t >= T.tapIcon && t < T.tapIcon + 0.2 ? 'tsweet' : null }), L.homeSearch);
      UI.closeApp(c, 'ios', pr(t, T.homeBack, T.homeBack + 0.5), (cc) => UI.safari(cc, I, safariState(T.homeBack), L.link));
      return;
    }
    if (t < T.tapIcon + 0.6) {
      UI.home(c, 'ios', I.apps, homeSt(t), L.homeSearch);
      UI.launch(c, 'ios', freshRect, pr(t, T.tapIcon + 0.1, T.tapIcon + 0.55), (cc) => drawApp(cc, t));
      return;
    }
    drawApp(c, t);
  };
  const sparkAt = { t: T.fresh, pt: { x: freshRect.cx, y: freshRect.cy } };
  return { T, screen, steps: [T.s1, T.s2, T.s3, T.s4, T.s5, T.s6], sparkAt, confetti: T.shop + 0.1 };
}

function buildSamsung(tl, pageBtn) {
  const A = L.and, tg = L.tg;
  const T = {
    phoneIn: 2.0, s1: 2.6, tapInstall: 4.2, botMsg: 4.75, zoomLink: 6.3,
    s2: 7.2, hold0: 8.0, hold1: 8.7, sheet: 8.75, tapCopy: 10.0, toast: 10.2, swipe: 11.6,
    s3: 12.3, tapChrome: 13.3, tapOmni: 14.6, tapSuggest: 15.9, load: 16.1, page: 16.8,
    s4: 18.4, tapBtn: 19.7, sheet2: 19.8,
    s5: 20.9, tapInstall2: 21.8, installing: 22.0, added: 22.9, homeSwipe: 23.6, fresh: 24.2,
    s6: 25.0, tapIcon: 26.0, shop: 27.1, phoneOut: 30.0, dur: 33.0,
  };
  const SW = D.SW, SH = D.SH;
  const HL = UI.homeLayout('and');
  const CT = UI.chromeTargets(pageBtn);
  const installTop = SH - 250;
  const chromeRect = HL.find('chrome'), freshRect = HL.find('tsweet');
  const sh = 70 + 3 * 52 + D.BOT;
  const copyPt = { x: SW / 2, y: SH - sh + 62 + 52 + 26 };

  touch.show(T.s1 + 0.6, { x: SW / 2 + 60, y: 520 }).move(3.45, 4.05, { x: tl.installBtn.x + tl.installBtn.w / 2, y: tl.installBtn.y + tl.installBtn.h / 2 }).tap(T.tapInstall).hide(4.6);
  touch.show(7.45, { x: tl.link.cx + 60, y: tl.link.cy + 90 }).move(7.5, 7.9, { x: tl.link.cx, y: tl.link.cy }).hold(T.hold0, T.hold1)
    .move(9.35, 9.85, copyPt).tap(T.tapCopy).hide(10.3);
  touch.swipe(T.swipe, T.swipe + 0.35, { x: SW / 2, y: SH - 6 }, { x: SW / 2, y: 560 });
  touch.show(12.7, { x: SW / 2 + 40, y: 600 }).move(12.75, 13.15, { x: chromeRect.cx, y: chromeRect.cy }).tap(T.tapChrome).hide(13.6);
  touch.show(14.05, { x: 220, y: 300 }).move(14.1, 14.45, CT.omni).tap(T.tapOmni).move(15.35, 15.75, CT.suggest).tap(T.tapSuggest).hide(16.2);
  touch.show(19.0, { x: CT.pageBtn.x + 50, y: CT.pageBtn.y + 140 }).move(19.1, 19.55, CT.pageBtn).tap(T.tapBtn)
    .move(21.2, 21.65, CT.install(installTop)).tap(T.tapInstall2).hide(22.1);
  touch.swipe(T.homeSwipe, T.homeSwipe + 0.35, { x: SW / 2, y: SH - 6 }, { x: SW / 2, y: 560 });
  touch.show(25.4, { x: SW / 2 + 40, y: 600 }).move(25.45, 25.85, { x: freshRect.cx, y: freshRect.cy }).tap(T.tapIcon).hide(26.3);

  cam.to(T.zoomLink, T.zoomLink + 0.8, 1.6, tl.link.cy)
    .to(T.sheet + 0.05, T.sheet + 0.6, 1.45, 650)
    .to(T.toast + 0.1, T.toast + 0.7, 1)
    .to(T.tapOmni - 0.3, T.tapOmni + 0.3, 1.5, 250)
    .to(T.load, T.load + 0.6, 1)
    .to(T.s4, T.s4 + 0.6, 1.5, CT.pageBtn.y)
    .to(T.sheet2 + 0.1, T.sheet2 + 0.7, 1.45, 690)
    .to(T.installing + 0.2, T.installing + 0.8, 1)
    .to(T.fresh - 0.2, T.fresh + 0.4, 1.45, freshRect.cy)
    .to(T.tapIcon + 0.1, T.tapIcon + 0.6, 1)
    .to(T.shop + 0.4, T.phoneOut - 0.3, 1.15, 400)
    .to(T.phoneOut - 0.3, T.phoneOut + 0.1, 1);

  cue(T.botMsg, 'recv'); cue(T.sheet, 'sheet', 0.7); cue(T.toast, 'copy');
  cue(T.tapChrome + 0.1, 'open'); cue(T.tapOmni + 0.05, 'key');
  cue(T.load, 'load'); cue(T.page + 0.2, 'ding'); cue(T.sheet2, 'sheet');
  cue(T.installing, 'load', 0.7); cue(T.added, 'ding', 0.8);
  cue(T.fresh, 'pop'); cue(T.fresh + 0.05, 'sparkle'); cue(T.fresh + 0.15, 'success');
  cue(T.tapIcon + 0.1, 'open'); cue(T.shop, 'ding', 0.8); cue(T.shop + 0.1, 'confetti'); cue(T.shop + 0.15, 'success2');

  const drawTg = (c, t) => {
    UI.tgChat(c, tl, tg, {
      msgs: [1, pr(t, T.botMsg, T.botMsg + 0.45)],
      btnGlow: vis(t, 3.1, 4.25, 0.3, 0.2) * (0.65 + 0.35 * Math.sin(t * 9)),
      btnPress: t >= T.tapInstall && t < T.tapInstall + 0.16,
      linkHL: vis(t, T.hold0 + 0.1, T.tapCopy + 0.2, 0.3, 0.3),
    });
    const mp = vis(t, T.sheet, T.tapCopy + 0.12, 0.3, 0.25);
    if (mp > 0) UI.tgLinkMenu(c, 'and', tg, L.link, mp, t >= T.tapCopy && t < T.tapCopy + 0.25 ? 1 : null);
    UI.toast(c, 'and', tg.copied, vis(t, T.toast, T.toast + 1.2, 0.25, 0.3), tl.inputY - 62);
  };
  const chromeState = (t) => ({
    page: pr(t, T.page, T.page + 0.3),
    focus: pr(t, T.tapOmni + 0.05, T.tapOmni + 0.3) - pr(t, T.tapSuggest + 0.1, T.tapSuggest + 0.3),
    kb: pr(t, T.tapOmni + 0.05, T.tapOmni + 0.35) - pr(t, T.tapSuggest + 0.1, T.tapSuggest + 0.4),
    typed: t > T.tapSuggest + 0.05,
    suggestPress: t >= T.tapSuggest && t < T.tapSuggest + 0.2,
    load: t < T.load ? -1 : pr(t, T.load, T.load + 0.8),
    btnRect: pageBtn,
    install: vis(t, T.sheet2, T.tapInstall2 + 0.1, 0.4, 0.3),
    installTop,
    installPress: t >= T.tapInstall2 && t < T.tapInstall2 + 0.18,
    toast: vis(t, T.installing + 0.1, T.homeSwipe - 0.1, 0.2, 0.2),
    toastText: t < T.added ? A.installing : A.added,
  });
  const homeSt = (t, extra = {}) => ({ enter: 1, fresh: t >= T.fresh ? pr(t, T.fresh, T.fresh + 0.5) : 0, glow: vis(t, T.fresh + 0.3, T.tapIcon, 0.4, 0.3) * (0.7 + 0.3 * Math.sin(t * 6)), ...extra });
  const drawApp = (c, t) => {
    UI.androidSplash(c);
    const p = pr(t, T.shop, T.shop + 0.35);
    if (p > 0) {
      c.save();
      c.globalAlpha = p;
      UI.shop(c, 'and');
      c.restore();
    }
  };
  const screen = (c, t) => {
    if (t < T.swipe) return drawTg(c, t);
    if (t < T.tapChrome + 0.1) {
      UI.home(c, 'and', A.apps, { enter: pr(t, T.swipe + 0.05, T.swipe + 0.5), press: t >= T.tapChrome && t < T.tapChrome + 0.2 ? 'chrome' : null });
      UI.closeApp(c, 'and', pr(t, T.swipe, T.swipe + 0.5), (cc) => drawTg(cc, T.swipe));
      return;
    }
    if (t < T.homeSwipe) {
      if (t < T.tapChrome + 0.6) {
        UI.home(c, 'and', A.apps, { enter: 1 });
        UI.launch(c, 'and', chromeRect, pr(t, T.tapChrome + 0.1, T.tapChrome + 0.55), (cc) => UI.chrome(cc, A, chromeState(t), false, L.link));
      } else UI.chrome(c, A, chromeState(t), t >= T.tapBtn && t < T.tapBtn + 0.18, L.link);
      return;
    }
    if (t < T.tapIcon + 0.1) {
      UI.home(c, 'and', A.apps, homeSt(t, { enter: pr(t, T.homeSwipe + 0.05, T.homeSwipe + 0.5), press: t >= T.tapIcon && t < T.tapIcon + 0.2 ? 'tsweet' : null }));
      UI.closeApp(c, 'and', pr(t, T.homeSwipe, T.homeSwipe + 0.5), (cc) => UI.chrome(cc, A, chromeState(T.homeSwipe), false, L.link));
      return;
    }
    if (t < T.tapIcon + 0.6) {
      UI.home(c, 'and', A.apps, homeSt(t));
      UI.launch(c, 'and', freshRect, pr(t, T.tapIcon + 0.1, T.tapIcon + 0.55), (cc) => drawApp(cc, t));
      return;
    }
    drawApp(c, t);
  };
  const sparkAt = { t: T.fresh, pt: { x: freshRect.cx, y: freshRect.cy } };
  return { T, screen, steps: [T.s1, T.s2, T.s3, T.s4, T.s5, T.s6], sparkAt, confetti: T.shop + 0.1 };
}

// ---------- Fon, sarlavha, matnlar ----------
function background(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.bg1);
  g.addColorStop(1, C.bg2);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const blobs = [
    [180 + 60 * Math.sin(t * 0.35), 420 + 40 * Math.cos(t * 0.3), 420, 'rgba(248,160,208,0.35)'],
    [920 + 50 * Math.cos(t * 0.28), 1250 + 60 * Math.sin(t * 0.33), 520, 'rgba(244,143,184,0.28)'],
    [880 + 40 * Math.sin(t * 0.4), 160, 300, 'rgba(255,214,234,0.6)'],
  ];
  for (const [x, y, r, col] of blobs) {
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(255,240,247,0)');
    c.fillStyle = rg;
    c.fillRect(0, 0, W, H);
  }
}

// «...» ichidagi so'zlar aksent rangda; so'zma-so'z paydo bo'ladi
function wordsOf(str) {
  let depth = 0;
  return str.split(' ').map((w) => {
    const hl = depth > 0 || w.includes('«');
    depth += (w.match(/«/g) || []).length - (w.match(/»/g) || []).length;
    return { s: w, hl };
  });
}

function layoutWords(c, words, font, maxW) {
  c.font = font;
  const space = c.measureText(' ').width;
  const lines = [[]];
  let x = 0;
  for (const wd of words) {
    const w = c.measureText(wd.s).width;
    if (x + w > maxW && x > 0) {
      lines.push([]);
      x = 0;
    }
    lines[lines.length - 1].push({ ...wd, x, w });
    x += w + space;
  }
  return lines.map((Ln) => ({ items: Ln, w: Ln.length ? Ln[Ln.length - 1].x + Ln[Ln.length - 1].w : 0 }));
}

// Matn berilgan enga sig'masa — shrift kichrayadi
function fitFont(c, str, weight, size, maxW, min = 20) {
  let sz = size;
  c.font = F(weight, sz);
  while (sz > min && c.measureText(str).width > maxW) c.font = F(weight, --sz);
  return F(weight, sz);
}

function caption(c, t) {
  const steps = SC.steps;
  let i = -1;
  for (let k = 0; k < steps.length; k++) if (t >= steps[k]) i = k;
  if (i < 0) return;
  const t0 = steps[i];
  const next = steps[i + 1] ?? SC.T.phoneOut;
  const out = pr(t, next - 0.3, next);
  const [txt, hint] = L.steps[DEVICE][i];
  const final = i === steps.length - 1;
  c.save();
  c.globalAlpha = 1 - E.in2(out);
  c.translate(0, -24 * E.in2(out));
  // qadam belgisi
  const pin = E.back(pr(t, t0, t0 + 0.35));
  const label = final ? '✓ TAYYOR' : L.step(i + 1);
  c.font = F(800, 24);
  const pw = c.measureText(label).width + 40;
  c.save();
  c.translate(540, 290);
  c.scale(pin, pin);
  shadow(c, 14, 'rgba(217,79,147,0.45)', 5);
  const g = c.createLinearGradient(-pw / 2, 0, pw / 2, 0);
  g.addColorStop(0, '#F8A0D0');
  g.addColorStop(1, '#D94F93');
  fillRR(c, -pw / 2, -22, pw, 44, 22, g);
  noShadow(c);
  text(c, label, 0, 8.5, F(800, 24), '#fff', 'center');
  c.restore();
  // matn
  const font = F(800, 46);
  const lines = layoutWords(c, wordsOf(txt), font, SAFE.x1 - SAFE.x0 + 20);
  const lh = 56;
  const y0 = 358;
  let n = 0;
  lines.forEach((Ln, li) => {
    const lx = 540 - Ln.w / 2;
    for (const it of Ln.items) {
      const p = E.out3(pr(t, t0 + 0.12 + n * 0.045, t0 + 0.42 + n * 0.045));
      n++;
      if (p <= 0) continue;
      c.save();
      c.globalAlpha *= p;
      c.filter = p < 1 ? `blur(${(1 - p) * 9}px)` : 'none';
      text(c, it.s, lx + it.x, y0 + li * lh + (1 - p) * 22, font, it.hl ? C.accent : C.plum);
      c.restore();
    }
  });
  // izoh
  const hp = E.out3(pr(t, t0 + 0.5, t0 + 0.9));
  if (hp > 0) {
    c.globalAlpha *= hp;
    const hf = fitFont(c, hint, 600, 26, SAFE.x1 - SAFE.x0);
    text(c, hint, 540, y0 + (lines.length - 1) * lh + 44 + (1 - hp) * 12, hf, C.muted, 'center');
  }
  c.restore();
}

// Logo ramkasiz (shaffof fonli chizma + yozuv), orqasida yumshoq oq nur
function logoAt(c, cx, cy, size, alpha) {
  if (size <= 0 || alpha <= 0) return;
  c.save();
  c.globalAlpha = alpha;
  const rg = c.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.75);
  rg.addColorStop(0, 'rgba(255,255,255,0.85)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = rg;
  c.fillRect(cx - size, cy - size, size * 2, size * 2);
  c.drawImage(IMG.logoClean, cx - size / 2, cy - size / 2, size, size);
  c.restore();
}

const LOGO_Y = 680;
function logo(c, t) {
  const T = SC.T;
  if (t < 2.4) {
    const pop = E.back(pr(t, 0.05, 0.6));
    const out = E.in2(pr(t, 1.85, 2.3));
    logoAt(c, 540, LOGO_Y - 60 * out, 340 * pop * (1 - 0.15 * out), 1 - out);
  } else if (t > T.phoneOut + 0.3) {
    const q = E.back(pr(t, T.phoneOut + 0.35, T.phoneOut + 0.9));
    logoAt(c, 540, LOGO_Y, 340 * q, clamp(q * 1.5));
  }
}

function intro(c, t) {
  const out = E.in2(pr(t, 1.85, 2.3));
  if (out >= 1) return;
  c.save();
  c.globalAlpha = 1 - out;
  c.translate(0, -60 * out);
  const [l1, l2] = L.intro[DEVICE];
  const maxW = SAFE.x1 - SAFE.x0;
  const items = [
    [l1, fitFont(c, l1, 800, 84, maxW), C.accent, 1045],
    [l2, fitFont(c, l2, 800, 84, maxW), C.plum, 1138],
  ];
  items.forEach(([s, font, col, y], i) => {
    const p = E.out3(pr(t, 0.35 + i * 0.14, 0.8 + i * 0.14));
    if (p <= 0) return;
    c.save();
    c.globalAlpha *= p;
    c.filter = p < 1 ? `blur(${(1 - p) * 12}px)` : 'none';
    text(c, s, 540, y + (1 - p) * 40, font, col, 'center');
    c.restore();
  });
  const sp = E.back(pr(t, 0.95, 1.35));
  if (sp > 0) {
    c.font = F(700, 38);
    const w = c.measureText(L.intro_sub).width + 60;
    c.save();
    c.translate(540, 1238);
    c.scale(sp, sp);
    shadow(c, 16, 'rgba(217,79,147,0.25)', 6);
    fillRR(c, -w / 2, -34, w, 68, 34, '#fff');
    noShadow(c);
    text(c, L.intro_sub, 0, 13, F(700, 38), C.accent, 'center');
    c.restore();
  }
  floaters(c, t, 0.2);
  c.restore();
}

// Logo atrofida suzib yuruvchi shirinliklar (xavfsiz hudud ichida)
function floaters(c, t, t0) {
  const r = rng(3);
  ['🍰', '🧁', '🎂', '🥟', '🍩', '🍪'].forEach((e, i) => {
    const a = (i / 6) * Math.PI * 2 + t * 0.25;
    const rad = 300 + 20 * Math.sin(t * 1.3 + i);
    const p = E.back(pr(t, t0 + i * 0.06, t0 + 0.4 + i * 0.06));
    if (p <= 0) return;
    c.save();
    c.globalAlpha *= 0.9;
    c.font = `${Math.round(62 * p)}px "Noto Color Emoji"`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(e, 540 + Math.cos(a) * rad * 1.15, LOGO_Y + Math.sin(a) * rad * 0.78 + (r() - 0.5) * 12);
    c.restore();
  });
}

function outro(c, t) {
  const T = SC.T;
  const p0 = T.phoneOut + 0.5;
  if (t < p0) return;
  floaters(c, t, p0 + 0.3);
  const [l1, l2] = L.outro;
  const maxW = SAFE.x1 - SAFE.x0;
  [[l1, fitFont(c, l1, 800, 74, maxW), C.plum, 1050], [l2, fitFont(c, l2, 600, 38, maxW), C.muted, 1122]].forEach(([s, font, col, y], i) => {
    const p = E.out3(pr(t, p0 + 0.15 + i * 0.18, p0 + 0.6 + i * 0.18));
    if (p <= 0) return;
    c.save();
    c.globalAlpha = p;
    c.filter = p < 1 ? `blur(${(1 - p) * 10}px)` : 'none';
    text(c, s, 540, y + (1 - p) * 30, font, col, 'center');
    c.restore();
  });
}

// ---------- Telefon ----------
function phoneOffset(t) {
  const T = SC.T;
  const inp = E.out3(pr(t, T.phoneIn, T.phoneIn + 0.65));
  const outp = E.in3(pr(t, T.phoneOut, T.phoneOut + 0.55));
  return (1 - inp) * 1500 + outp * 1600;
}

function drawPhone(c, t, camS) {
  const ios = OS === 'ios';
  const f = SCR_W / 656;
  const R = (ios ? 98 : 70) * f;
  c.save();
  shadow(c, 44, 'rgba(74,36,68,0.28)', 20);
  fillRR(c, PHONE.x, PHONE.y, PHONE.w, PHONE.h, R, ios ? '#1C1C1E' : '#26272B');
  noShadow(c);
  // yon tugmalar
  c.fillStyle = ios ? '#2C2C2E' : '#323338';
  const side = (x, y, h) => {
    rr(c, x, PHONE.y + y * f, 5, h * f, 2.5);
    c.fill();
  };
  if (ios) {
    side(PHONE.x - 4, 250, 60);
    side(PHONE.x - 4, 340, 100);
    side(PHONE.x - 4, 460, 100);
    side(PHONE.x + PHONE.w - 1, 360, 150);
  } else {
    side(PHONE.x + PHONE.w - 1, 300, 160);
    side(PHONE.x + PHONE.w - 1, 500, 90);
  }
  c.strokeStyle = 'rgba(255,255,255,0.12)';
  c.lineWidth = 2;
  rr(c, PHONE.x + 2, PHONE.y + 2, PHONE.w - 4, PHONE.h - 4, R - 2);
  c.stroke();
  // ekran
  rr(c, SCR.x, SCR.y, SCR.w, SCR.h, (ios ? 82 : 58) * f);
  c.clip();
  c.translate(SCR.x, SCR.y);
  c.scale(K, K);
  SC.screen(c, t);
  UI.cutout(c, OS);
  c.restore();
}

// Barmoq belgisi (kanvas koordinatasida, zumga bog'liq emas)
function finger(c, t, toCanvas) {
  const f = touch.at(t);
  if (!f) return;
  const p = toCanvas(f.x * K + SCR.x, f.y * K + SCR.y);
  c.save();
  c.globalAlpha = f.a;
  if (f.ripple >= 0) {
    const q = pr(f.ripple, 0, 0.5);
    c.strokeStyle = `rgba(217,79,147,${0.55 * (1 - q)})`;
    c.lineWidth = 6 * (1 - q) + 1;
    c.beginPath();
    c.arc(p.x, p.y, 30 + 55 * E.out3(q), 0, Math.PI * 2);
    c.stroke();
  }
  const r = 30 - 6 * f.press;
  shadow(c, 18, 'rgba(74,36,68,0.35)', 6);
  c.fillStyle = `rgba(255,255,255,${0.62 + 0.2 * f.press})`;
  c.beginPath();
  c.arc(p.x, p.y, r, 0, Math.PI * 2);
  c.fill();
  noShadow(c);
  c.strokeStyle = `rgba(74,36,68,${0.55 + 0.3 * f.press})`;
  c.lineWidth = 4;
  c.stroke();
  c.fillStyle = `rgba(217,79,147,${0.25 + 0.5 * f.press})`;
  c.beginPath();
  c.arc(p.x, p.y, r * 0.42, 0, Math.PI * 2);
  c.fill();
  if (f.hold >= 0 && f.hold <= 1) {
    c.strokeStyle = C.accent;
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(p.x, p.y, 43, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f.hold);
    c.stroke();
  }
  c.restore();
}

function sparkles(c, t, toCanvas) {
  const s = SC.sparkAt;
  const age = t - s.t;
  if (age < 0 || age > 1.2) return;
  const p = toCanvas(s.pt.x * K + SCR.x, s.pt.y * K + SCR.y);
  const r = rng(11);
  c.save();
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, sp = 70 + r() * 100, size = 8 + r() * 12;
    const q = pr(age, r() * 0.15, 0.9 + r() * 0.3);
    if (q <= 0 || q >= 1) continue;
    const d = sp * E.out3(q);
    const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    const k = Math.sin(q * Math.PI) * size;
    c.fillStyle = i % 3 ? '#FFD1E8' : '#FFE27A';
    c.globalAlpha = 1 - q * 0.6;
    c.beginPath();
    c.moveTo(x, y - k);
    c.quadraticCurveTo(x, y, x + k, y);
    c.quadraticCurveTo(x, y, x, y + k);
    c.quadraticCurveTo(x, y, x - k, y);
    c.quadraticCurveTo(x, y, x, y - k);
    c.fill();
  }
  c.restore();
}

function confetti(c, t) {
  const age = t - SC.confetti;
  if (age < 0 || age > 3) return;
  const r = rng(5);
  const cols = ['#F8A0D0', '#D94F93', '#FFD166', '#7ED6C1', '#9B8CFF', '#ffffff'];
  c.save();
  for (let i = 0; i < 110; i++) {
    const side = i % 2 ? 1 : -1;
    const x0 = 540 + side * (120 + r() * 120);
    const y0 = 700;
    const vx = side * (150 + r() * 520) * (r() > 0.25 ? 1 : -0.4);
    const vy = -(900 + r() * 900);
    const x = x0 + vx * age;
    const y = y0 + vy * age + 1500 * age * age;
    const rot = r() * 6 + age * (4 + r() * 8);
    const w = 12 + r() * 12, h = 7 + r() * 8;
    c.globalAlpha = 1 - pr(age, 2.2, 3);
    c.fillStyle = cols[i % cols.length];
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(1, Math.cos(age * (6 + r() * 6)));
    c.fillRect(-w / 2, -h / 2, w, h);
    c.restore();
  }
  c.restore();
}

// ---------- Kadr ----------
let layer = null;
export function drawFrame(c, t) {
  c.save();
  background(c, t);
  intro(c, t);
  outro(c, t);
  caption(c, t);
  const off = phoneOffset(t);
  const cm = cam.at(t);
  const toCanvas = (x, y) => ({ x: ANCHOR.x + (x - ANCHOR.x) * cm.s, y: ANCHOR.y + (y - cm.fy) * cm.s + off });
  if (off < 1600) {
    // zum kuchayishi bilan oyna cheti so'nadi (s=1 da telefon to'liq, chegarasiz)
    const fz = clamp((cm.s - 1) / 0.15);
    const lc = fz > 0 ? layerCtx(c) : c;
    lc.save();
    lc.translate(0, off);
    lc.translate(ANCHOR.x, ANCHOR.y);
    lc.scale(cm.s, cm.s);
    lc.translate(-ANCHOR.x, -cm.fy);
    drawPhone(lc, t, cm.s);
    lc.restore();
    if (fz > 0) {
      const e = `rgba(0,0,0,${1 - fz})`;
      const g = lc.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, e);
      g.addColorStop(VIEW.y0 / H, e);
      g.addColorStop((VIEW.y0 + VIEW.fade) / H, '#000');
      g.addColorStop((VIEW.y1 - VIEW.fade) / H, '#000');
      g.addColorStop(VIEW.y1 / H, e);
      g.addColorStop(1, e);
      lc.globalCompositeOperation = 'destination-in';
      lc.fillStyle = g;
      lc.fillRect(0, 0, W, H);
      lc.globalCompositeOperation = 'source-over';
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(layer, 0, 0);
      c.restore();
    }
    sparkles(c, t, toCanvas);
    finger(c, t, toCanvas);
  }
  logo(c, t);
  confetti(c, t);
  c.restore();
}

// Asosiy kanvas bilan bir xil o'lcham va masshtabdagi yordamchi kanvas
function layerCtx(c) {
  const cv = c.canvas;
  if (!layer || layer.width !== cv.width || layer.height !== cv.height) {
    layer = document.createElement('canvas');
    layer.width = cv.width;
    layer.height = cv.height;
  }
  const lc = layer.getContext('2d');
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.clearRect(0, 0, layer.width, layer.height);
  lc.setTransform(c.getTransform());
  return lc;
}

export async function init() {
  await loadImages({
    logo: '/miniapp/public/images/logo.png',
    icon: '/miniapp/public/icons/icon-512.png',
    welcome: '/miniapp/public/og.jpg',
    logoClean: '/video/assets/logo-clean.png',
    pageIos: '/video/assets/shots/ilova-ios-uz.png',
    pageAnd: '/video/assets/shots/ilova-android-uz.png',
    shop: `/video/assets/shots/shop-${OS === 'ios' ? 'ios' : 'android'}-uz.png`,
  });
  await document.fonts.ready;
  const layout = await fetch('/video/assets/shots/layout.json').then((r) => r.json());
  const c = document.getElementById('c').getContext('2d');
  const tl = UI.tgLayout(c, OS, L.tg);
  const b = layout['ilova-android-uz'];
  const pageBtn = { x: b.x, y: b.y, w: b.width, h: b.height, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
  SC = DEVICE === 'iphone' ? buildIphone(tl) : buildSamsung(tl, pageBtn);
  // qadam almashganda yumshoq "whoosh"
  cue(0.05, 'pop'); cue(0.38, 'swish', 0.8); cue(0.95, 'tick', 0.8);
  cue(SC.T.phoneIn, 'whoosh');
  SC.steps.forEach((s) => cue(s, 'step'));
  cue(SC.T.phoneOut, 'whoosh');
  cue(SC.T.phoneOut + 0.6, 'outro');
  cues.sort((a, b) => a.t - b.t);
  return { dur: SC.T.dur, cues, device: DEVICE };
}
