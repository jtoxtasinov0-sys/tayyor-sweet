// Umumiy yordamchilar: vaqt/easing, shriftlar, matn joylashuvi, rasm yuklash, belgilar
export const W = 1080;
export const H = 1920;

export const C = {
  bg1: '#FFF6FA',
  bg2: '#FFE1F0',
  pink: '#F8A0D0',
  ribbon: '#F48FB8',
  plum: '#4A2444',
  accent: '#D94F93',
  soft: '#FFE3F1',
  muted: 'rgba(74,36,68,0.62)',
  ios: '#007AFF',
  green: '#34C759',
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
// a..b oralig'ida 0→1
export const pr = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  lin: (t) => t,
  out2: (t) => 1 - (1 - t) ** 2,
  out3: (t) => 1 - (1 - t) ** 3,
  out5: (t) => 1 - (1 - t) ** 5,
  in2: (t) => t * t,
  in3: (t) => t * t * t,
  io2: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  io3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
};
// kirish (a..a+d) va chiqish (b..b+d) bilan ko'rinish 0..1
export const vis = (t, a, b, din = 0.25, dout = 0.25) =>
  t < a || t > b + dout ? 0 : Math.min(E.out3(pr(t, a, a + din)), 1 - E.in2(pr(t, b, b + dout)));

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FALLBACK = '"Noto Sans KR Sub", "Noto Color Emoji", sans-serif';
// Brend matni (Onest) va telefon tizim matni (Inter)
export const F = (w, s) => `${w} ${s}px Onest, ${FALLBACK}`;
export const S = (w, s) => `${w} ${s}px Inter, ${FALLBACK}`;

export function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

export function fillRR(c, x, y, w, h, r, fill) {
  rr(c, x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
}

export function text(c, str, x, y, font, color, align = 'left', base = 'alphabetic') {
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = base;
  c.fillText(str, x, y);
}

export function ellipsize(c, str, maxW) {
  if (c.measureText(str).width <= maxW) return str;
  let s = str;
  while (s.length > 1 && c.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

// Boy matn: [{t, b (qalin), link, color}] → qatorlar (so'z bo'yicha, uzun link — harf bo'yicha)
export function layoutRich(c, runs, maxW, size, fontFn = S) {
  const lines = [[]];
  let x = 0;
  const fontOf = (r) => fontFn(r.b ? 600 : 400, size);
  const push = (seg) => {
    lines[lines.length - 1].push(seg);
    x += seg.w;
  };
  for (const r of runs) {
    c.font = fontOf(r);
    for (const p of r.t.split(/(\n| )/)) {
      if (!p) continue;
      if (p === '\n') {
        lines.push([]);
        x = 0;
        continue;
      }
      const w = c.measureText(p).width;
      if (p === ' ') {
        if (x > 0) push({ x, t: ' ', r, w });
        continue;
      }
      if (x + w > maxW && x > 0) {
        const L = lines[lines.length - 1];
        if (L.length && L[L.length - 1].t === ' ') {
          x -= L[L.length - 1].w;
          L.pop();
        }
        lines.push([]);
        x = 0;
      }
      if (w > maxW) {
        let s = '';
        for (const ch of p) {
          if (x + c.measureText(s + ch).width > maxW && s) {
            push({ x, t: s, r, w: c.measureText(s).width });
            lines.push([]);
            x = 0;
            s = ch;
          } else s += ch;
        }
        if (s) push({ x, t: s, r, w: c.measureText(s).width });
        continue;
      }
      push({ x, t: p, r, w });
    }
  }
  let w = 0;
  for (const L of lines) if (L.length) w = Math.max(w, L[L.length - 1].x + L[L.length - 1].w);
  return { lines, w, size, fontFn };
}

export function drawRich(c, lay, x, y, lh, color = '#000', linkColor = C.ios, hl = null) {
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  lay.lines.forEach((L, i) => {
    for (const s of L) {
      c.font = lay.fontFn(s.r.b ? 600 : 400, lay.size);
      if (s.r.link && hl) {
        c.fillStyle = hl;
        c.fillRect(x + s.x - 1, y + i * lh - lay.size * 0.95, s.w + 2, lay.size * 1.3);
      }
      c.fillStyle = s.r.color || (s.r.link ? linkColor : color);
      c.fillText(s.t, x + s.x, y + i * lh);
    }
  });
}

// "**qalin**" va "[link]" belgilari bilan yozilgan matnni bo'laklarga ajratish
export function md(str) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ t: str.slice(last, m.index) });
    out.push(m[1] ? { t: m[1], b: 1 } : { t: m[2], link: 1 });
    last = re.lastIndex;
  }
  if (last < str.length) out.push({ t: str.slice(last) });
  return out;
}

export const IMG = {};
export function loadImages(map) {
  return Promise.all(
    Object.entries(map).map(
      ([k, src]) =>
        new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => {
            IMG[k] = im;
            res();
          };
          im.onerror = () => rej(new Error('rasm topilmadi: ' + src));
          im.src = src;
        })
    )
  );
}

// Rasmni doira ichida chizish
export function circleImg(c, im, cx, cy, r) {
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  c.drawImage(im, cx - r, cy - r, r * 2, r * 2);
  c.restore();
}

export function roundImg(c, im, x, y, w, h, r) {
  c.save();
  rr(c, x, y, w, h, r);
  c.clip();
  c.drawImage(im, x, y, w, h);
  c.restore();
}

export function shadow(c, blur, color, oy = 0) {
  c.shadowBlur = blur;
  c.shadowColor = color;
  c.shadowOffsetX = 0;
  c.shadowOffsetY = oy;
}
export function noShadow(c) {
  c.shadowBlur = 0;
  c.shadowColor = 'transparent';
  c.shadowOffsetY = 0;
}

// ---------- Kichik vektor belgilar (pt birligida) ----------
export const G = {
  share(c, x, y, s, col) {
    // kvadrat + yuqoriga strelka
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.09;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.18, y - s * 0.12);
    c.lineTo(x - s * 0.32, y - s * 0.12);
    c.lineTo(x - s * 0.32, y + s * 0.42);
    c.lineTo(x + s * 0.32, y + s * 0.42);
    c.lineTo(x + s * 0.32, y - s * 0.12);
    c.lineTo(x + s * 0.18, y - s * 0.12);
    c.moveTo(x, y + s * 0.18);
    c.lineTo(x, y - s * 0.48);
    c.moveTo(x - s * 0.17, y - s * 0.31);
    c.lineTo(x, y - s * 0.48);
    c.lineTo(x + s * 0.17, y - s * 0.31);
    c.stroke();
    c.restore();
  },
  plusSquare(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.09;
    c.lineCap = 'round';
    rr(c, x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8, s * 0.2);
    c.stroke();
    c.beginPath();
    c.moveTo(x, y - s * 0.2);
    c.lineTo(x, y + s * 0.2);
    c.moveTo(x - s * 0.2, y);
    c.lineTo(x + s * 0.2, y);
    c.stroke();
    c.restore();
  },
  copy(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.09;
    rr(c, x - s * 0.18, y - s * 0.3, s * 0.48, s * 0.56, s * 0.1);
    c.stroke();
    rr(c, x - s * 0.36, y - s * 0.12, s * 0.48, s * 0.56, s * 0.1);
    c.fillStyle = 'rgba(0,0,0,0)';
    c.stroke();
    c.restore();
  },
  dots(c, x, y, s, col) {
    c.fillStyle = col;
    for (const dx of [-0.3, 0, 0.3]) {
      c.beginPath();
      c.arc(x + dx * s, y, s * 0.075, 0, Math.PI * 2);
      c.fill();
    }
  },
  vdots(c, x, y, s, col) {
    c.fillStyle = col;
    for (const dy of [-0.28, 0, 0.28]) {
      c.beginPath();
      c.arc(x, y + dy * s, s * 0.075, 0, Math.PI * 2);
      c.fill();
    }
  },
  chevron(c, x, y, s, col, dir = -1) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.12;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - dir * s * 0.18, y - s * 0.36);
    c.lineTo(x + dir * s * 0.18, y);
    c.lineTo(x - dir * s * 0.18, y + s * 0.36);
    c.stroke();
    c.restore();
  },
  arrowLeft(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.1;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x + s * 0.38, y);
    c.lineTo(x - s * 0.38, y);
    c.moveTo(x - s * 0.08, y - s * 0.3);
    c.lineTo(x - s * 0.38, y);
    c.lineTo(x - s * 0.08, y + s * 0.3);
    c.stroke();
    c.restore();
  },
  search(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.11;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(x - s * 0.08, y - s * 0.08, s * 0.28, 0, Math.PI * 2);
    c.moveTo(x + s * 0.13, y + s * 0.13);
    c.lineTo(x + s * 0.36, y + s * 0.36);
    c.stroke();
    c.restore();
  },
  lock(c, x, y, s, col) {
    c.save();
    c.fillStyle = col;
    c.strokeStyle = col;
    c.lineWidth = s * 0.1;
    rr(c, x - s * 0.3, y - s * 0.05, s * 0.6, s * 0.45, s * 0.08);
    c.fill();
    c.beginPath();
    c.arc(x, y - s * 0.08, s * 0.2, Math.PI, 0);
    c.stroke();
    c.restore();
  },
  link(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.1;
    c.translate(x, y);
    c.rotate(-Math.PI / 4);
    rr(c, -s * 0.45, -s * 0.15, s * 0.5, s * 0.3, s * 0.15);
    c.stroke();
    rr(c, -s * 0.05, -s * 0.15, s * 0.5, s * 0.3, s * 0.15);
    c.stroke();
    c.restore();
  },
  check(c, x, y, s, col, lw = 0.13) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * lw;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.3, y);
    c.lineTo(x - s * 0.08, y + s * 0.22);
    c.lineTo(x + s * 0.32, y - s * 0.24);
    c.stroke();
    c.restore();
  },
  star(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? s * 0.18 : s * 0.42;
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
    c.stroke();
    c.restore();
  },
  book(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x, y - s * 0.25);
    c.quadraticCurveTo(x - s * 0.2, y - s * 0.38, x - s * 0.42, y - s * 0.3);
    c.lineTo(x - s * 0.42, y + s * 0.3);
    c.quadraticCurveTo(x - s * 0.2, y + s * 0.22, x, y + s * 0.35);
    c.quadraticCurveTo(x + s * 0.2, y + s * 0.22, x + s * 0.42, y + s * 0.3);
    c.lineTo(x + s * 0.42, y - s * 0.3);
    c.quadraticCurveTo(x + s * 0.2, y - s * 0.38, x, y - s * 0.25);
    c.lineTo(x, y + s * 0.35);
    c.stroke();
    c.restore();
  },
  glasses(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.beginPath();
    c.arc(x - s * 0.22, y + s * 0.05, s * 0.16, 0, Math.PI * 2);
    c.moveTo(x + s * 0.38, y + s * 0.05);
    c.arc(x + s * 0.22, y + s * 0.05, s * 0.16, 0, Math.PI * 2);
    c.moveTo(x - s * 0.06, y);
    c.quadraticCurveTo(x, y - s * 0.06, x + s * 0.06, y);
    c.stroke();
    c.restore();
  },
  plus(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.09;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y - s * 0.3);
    c.lineTo(x, y + s * 0.3);
    c.moveTo(x - s * 0.3, y);
    c.lineTo(x + s * 0.3, y);
    c.stroke();
    c.restore();
  },
  home(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.09;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.36, y - s * 0.02);
    c.lineTo(x, y - s * 0.36);
    c.lineTo(x + s * 0.36, y - s * 0.02);
    c.moveTo(x - s * 0.26, y - s * 0.1);
    c.lineTo(x - s * 0.26, y + s * 0.34);
    c.lineTo(x + s * 0.26, y + s * 0.34);
    c.lineTo(x + s * 0.26, y - s * 0.1);
    c.stroke();
    c.restore();
  },
  mic(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.09;
    c.lineCap = 'round';
    rr(c, x - s * 0.13, y - s * 0.4, s * 0.26, s * 0.5, s * 0.13);
    c.stroke();
    c.beginPath();
    c.arc(x, y - s * 0.05, s * 0.26, 0.1 * Math.PI, 0.9 * Math.PI);
    c.moveTo(x, y + s * 0.22);
    c.lineTo(x, y + s * 0.38);
    c.stroke();
    c.restore();
  },
  clip(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.lineCap = 'round';
    c.translate(x, y);
    c.rotate(Math.PI / 5);
    c.beginPath();
    c.moveTo(s * 0.12, -s * 0.15);
    c.lineTo(s * 0.12, s * 0.25);
    c.arc(0, s * 0.25, s * 0.12, 0, Math.PI);
    c.lineTo(-s * 0.12, -s * 0.28);
    c.arc(s * 0.04, -s * 0.28, s * 0.16, Math.PI, 0);
    c.lineTo(s * 0.2, s * 0.2);
    c.stroke();
    c.restore();
  },
  smile(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.beginPath();
    c.arc(x, y, s * 0.38, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(x, y + s * 0.02, s * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.arc(x - s * 0.13, y - s * 0.1, s * 0.045, 0, Math.PI * 2);
    c.arc(x + s * 0.13, y - s * 0.1, s * 0.045, 0, Math.PI * 2);
    c.fill();
    c.restore();
  },
  close(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.1;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.25, y - s * 0.25);
    c.lineTo(x + s * 0.25, y + s * 0.25);
    c.moveTo(x + s * 0.25, y - s * 0.25);
    c.lineTo(x - s * 0.25, y + s * 0.25);
    c.stroke();
    c.restore();
  },
  // Telegram yozish qatoridagi bot klaviaturasi belgisi (⊞)
  botKb(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.075;
    rr(c, x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8, s * 0.2);
    c.stroke();
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      rr(c, x + dx * s * 0.135 - s * 0.1, y + dy * s * 0.135 - s * 0.1, s * 0.2, s * 0.2, s * 0.06);
      c.stroke();
    }
    c.restore();
  },
  // oddiy (harfli) klaviatura belgisi — bot klaviaturasi ochiq turganda ⊞ o'rnida
  keyboard(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.fillStyle = col;
    c.lineWidth = s * 0.075;
    rr(c, x - s * 0.45, y - s * 0.3, s * 0.9, s * 0.6, s * 0.12);
    c.stroke();
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(x - s * 0.24 + i * s * 0.16, y - s * 0.12 + r * s * 0.13, s * 0.035, 0, Math.PI * 2);
        c.fill();
      }
    c.fillRect(x - s * 0.18, y + s * 0.13, s * 0.36, s * 0.06);
    c.restore();
  },
  // Android "brauzerda ochish": kvadrat va undan chiquvchi strelka
  openIn(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.02, y - s * 0.32);
    c.lineTo(x - s * 0.32, y - s * 0.32);
    c.lineTo(x - s * 0.32, y + s * 0.32);
    c.lineTo(x + s * 0.32, y + s * 0.32);
    c.lineTo(x + s * 0.32, y + s * 0.02);
    c.moveTo(x - s * 0.05, y + s * 0.05);
    c.lineTo(x + s * 0.34, y - s * 0.34);
    c.moveTo(x + s * 0.1, y - s * 0.34);
    c.lineTo(x + s * 0.34, y - s * 0.34);
    c.lineTo(x + s * 0.34, y - s * 0.1);
    c.stroke();
    c.restore();
  },
  bookmark(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.24, y + s * 0.36);
    c.lineTo(x - s * 0.24, y - s * 0.3);
    c.quadraticCurveTo(x - s * 0.24, y - s * 0.36, x - s * 0.18, y - s * 0.36);
    c.lineTo(x + s * 0.18, y - s * 0.36);
    c.quadraticCurveTo(x + s * 0.24, y - s * 0.36, x + s * 0.24, y - s * 0.3);
    c.lineTo(x + s * 0.24, y + s * 0.36);
    c.lineTo(x, y + s * 0.18);
    c.closePath();
    c.stroke();
    c.restore();
  },
  compass(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.fillStyle = col;
    c.lineWidth = s * 0.08;
    c.beginPath();
    c.arc(x, y, s * 0.38, 0, Math.PI * 2);
    c.stroke();
    // strelka (diagonal romb)
    c.translate(x, y);
    c.rotate(Math.PI / 4);
    c.beginPath();
    c.moveTo(0, -s * 0.24);
    c.lineTo(s * 0.08, 0);
    c.lineTo(0, s * 0.24);
    c.lineTo(-s * 0.08, 0);
    c.closePath();
    c.stroke();
    c.beginPath();
    c.arc(0, 0, s * 0.03, 0, Math.PI * 2);
    c.fill();
    c.restore();
  },
  globe(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.08;
    c.beginPath();
    c.arc(x, y, s * 0.38, 0, Math.PI * 2);
    c.moveTo(x - s * 0.38, y);
    c.lineTo(x + s * 0.38, y);
    c.stroke();
    c.beginPath();
    c.ellipse(x, y, s * 0.16, s * 0.38, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  },
  arrowUpRight(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.14;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.3, y + s * 0.3);
    c.lineTo(x + s * 0.3, y - s * 0.3);
    c.moveTo(x - s * 0.15, y - s * 0.3);
    c.lineTo(x + s * 0.3, y - s * 0.3);
    c.lineTo(x + s * 0.3, y + s * 0.15);
    c.stroke();
    c.restore();
  },
  reload(c, x, y, s, col) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = s * 0.09;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(x, y, s * 0.3, -0.3 * Math.PI, 1.4 * Math.PI);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x + s * 0.12, y - s * 0.42);
    c.lineTo(x + s * 0.34, y - s * 0.3);
    c.lineTo(x + s * 0.12, y - s * 0.12);
    c.fill();
    c.restore();
  },
};
