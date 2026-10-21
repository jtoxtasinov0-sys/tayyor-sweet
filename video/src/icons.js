// Bosh ekran ilova belgilari (oddiy, brendsiz shakllar; Safari/Chrome/Telegram — taniladigan ko'rinishda)
import { rr, IMG, G } from './core.js';

function grad(c, x, y, s, a, b) {
  const g = c.createLinearGradient(x, y, x, y + s);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

function base(c, x, y, s, fill, ios) {
  rr(c, x, y, s, s, s * (ios ? 0.225 : 0.3));
  c.fillStyle = fill;
  c.fill();
}

const glyph = {
  phone(c, cx, cy, s) {
    c.save();
    c.translate(cx, cy);
    c.rotate(-Math.PI / 4);
    c.fillStyle = '#fff';
    rr(c, -s * 0.07, -s * 0.24, s * 0.14, s * 0.48, s * 0.05);
    c.fill();
    rr(c, -s * 0.15, -s * 0.28, s * 0.2, s * 0.12, s * 0.05);
    c.fill();
    rr(c, -s * 0.15, s * 0.16, s * 0.2, s * 0.12, s * 0.05);
    c.fill();
    c.restore();
  },
  bubble(c, cx, cy, s, col = '#fff') {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(cx, cy - s * 0.02, s * 0.3, s * 0.24, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(cx - s * 0.2, cy + s * 0.1);
    c.lineTo(cx - s * 0.26, cy + s * 0.27);
    c.lineTo(cx - s * 0.06, cy + s * 0.18);
    c.fill();
  },
  safari(c, cx, cy, s) {
    const r = s * 0.38;
    const g = c.createLinearGradient(cx, cy - r, cx, cy + r);
    g.addColorStop(0, '#1BD6FF');
    g.addColorStop(1, '#1A6DFF');
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = s * 0.012;
    for (let i = 0; i < 36; i++) {
      const a = (i * Math.PI) / 18;
      const r1 = r * (i % 3 ? 0.86 : 0.78);
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      c.lineTo(cx + Math.cos(a) * r * 0.94, cy + Math.sin(a) * r * 0.94);
      c.stroke();
    }
    c.save();
    c.translate(cx, cy);
    c.rotate(Math.PI / 4);
    c.fillStyle = '#FF3B30';
    c.beginPath();
    c.moveTo(0, -r * 0.72);
    c.lineTo(r * 0.11, 0);
    c.lineTo(-r * 0.11, 0);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(0, r * 0.72);
    c.lineTo(r * 0.11, 0);
    c.lineTo(-r * 0.11, 0);
    c.fill();
    c.restore();
  },
  chrome(c, cx, cy, s) {
    const r = s * 0.36;
    const cols = ['#DB4437', '#F4B400', '#0F9D58'];
    for (let i = 0; i < 3; i++) {
      c.fillStyle = cols[i];
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, r, -Math.PI / 2 - Math.PI / 6 + (i * 2 * Math.PI) / 3, -Math.PI / 2 - Math.PI / 6 + ((i + 1) * 2 * Math.PI) / 3);
      c.fill();
    }
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#4285F4';
    c.beginPath();
    c.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
    c.fill();
  },
  telegram(c, cx, cy, s) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(cx - s * 0.27, cy - s * 0.01);
    c.lineTo(cx + s * 0.25, cy - s * 0.22);
    c.lineTo(cx + s * 0.16, cy + s * 0.24);
    c.lineTo(cx - s * 0.02, cy + s * 0.1);
    c.lineTo(cx - s * 0.1, cy + s * 0.2);
    c.lineTo(cx - s * 0.11, cy + s * 0.07);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(30,110,170,0.35)';
    c.beginPath();
    c.moveTo(cx - s * 0.11, cy + s * 0.07);
    c.lineTo(cx + s * 0.17, cy - s * 0.13);
    c.lineTo(cx - s * 0.02, cy + s * 0.1);
    c.lineTo(cx - s * 0.1, cy + s * 0.2);
    c.fill();
  },
  camera(c, cx, cy, s) {
    c.fillStyle = '#2b2b2e';
    rr(c, cx - s * 0.3, cy - s * 0.2, s * 0.6, s * 0.42, s * 0.08);
    c.fill();
    c.fillStyle = '#2b2b2e';
    rr(c, cx - s * 0.1, cy - s * 0.27, s * 0.2, s * 0.1, s * 0.03);
    c.fill();
    c.fillStyle = '#c9ccd2';
    c.beginPath();
    c.arc(cx, cy + s * 0.01, s * 0.13, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#2b2b2e';
    c.beginPath();
    c.arc(cx, cy + s * 0.01, s * 0.08, 0, Math.PI * 2);
    c.fill();
  },
  photos(c, cx, cy, s) {
    const cols = ['#FDB900', '#F86E1F', '#E9365F', '#B04BC8', '#5163E5', '#2FA6EB', '#4CC765', '#B4D435'];
    for (let i = 0; i < 8; i++) {
      c.save();
      c.translate(cx, cy);
      c.rotate((i * Math.PI) / 4);
      c.globalAlpha = 0.85;
      c.fillStyle = cols[i];
      c.beginPath();
      c.ellipse(0, -s * 0.15, s * 0.09, s * 0.16, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  },
  gear(c, cx, cy, s, col = '#5b5d63') {
    c.fillStyle = col;
    c.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      const r = i % 2 ? s * 0.27 : s * 0.33;
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    c.fillStyle = '#d7d9de';
    c.beginPath();
    c.arc(cx, cy, s * 0.15, 0, Math.PI * 2);
    c.fill();
  },
  clock(c, cx, cy, s) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx, cy, s * 0.36, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#111';
    c.lineWidth = s * 0.045;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx, cy - s * 0.24);
    c.moveTo(cx, cy);
    c.lineTo(cx + s * 0.16, cy + s * 0.06);
    c.stroke();
    c.strokeStyle = '#FF9500';
    c.lineWidth = s * 0.02;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx - s * 0.12, cy + s * 0.22);
    c.stroke();
  },
  calendar(c, cx, cy, s, day = 'SE') {
    c.fillStyle = '#FF3B30';
    c.font = `600 ${s * 0.15}px Inter`;
    c.textAlign = 'center';
    c.fillText(day, cx, cy - s * 0.17);
    c.fillStyle = '#111';
    c.font = `300 ${s * 0.44}px Inter`;
    c.fillText('21', cx, cy + s * 0.27);
  },
  weather(c, cx, cy, s) {
    c.fillStyle = '#FFD60A';
    c.beginPath();
    c.arc(cx - s * 0.08, cy - s * 0.08, s * 0.17, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx + s * 0.04, cy + s * 0.1, s * 0.13, 0, Math.PI * 2);
    c.arc(cx + s * 0.18, cy + s * 0.12, s * 0.11, 0, Math.PI * 2);
    c.arc(cx - s * 0.1, cy + s * 0.14, s * 0.09, 0, Math.PI * 2);
    c.fill();
    c.fillRect(cx - s * 0.1, cy + s * 0.12, s * 0.28, s * 0.11);
  },
  notes(c, cx, cy, s, x, y) {
    c.fillStyle = '#FFD52E';
    c.fillRect(x, y, s, s * 0.3);
    c.strokeStyle = '#d9d9de';
    c.lineWidth = s * 0.018;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(x + s * 0.12, y + s * (0.45 + i * 0.13));
      c.lineTo(x + s * 0.88, y + s * (0.45 + i * 0.13));
      c.stroke();
    }
  },
  mail(c, cx, cy, s) {
    c.fillStyle = '#fff';
    rr(c, cx - s * 0.3, cy - s * 0.2, s * 0.6, s * 0.4, s * 0.05);
    c.fill();
    c.strokeStyle = '#2F80ED';
    c.lineWidth = s * 0.035;
    c.beginPath();
    c.moveTo(cx - s * 0.28, cy - s * 0.17);
    c.lineTo(cx, cy + s * 0.04);
    c.lineTo(cx + s * 0.28, cy - s * 0.17);
    c.stroke();
  },
  note(c, cx, cy, s) {
    c.fillStyle = '#fff';
    c.font = `700 ${s * 0.52}px "DejaVu Sans"`;
    c.textAlign = 'center';
    c.fillText('♫', cx, cy + s * 0.18);
  },
  store(c, cx, cy, s) {
    c.strokeStyle = '#fff';
    c.lineWidth = s * 0.06;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - s * 0.18, cy + s * 0.2);
    c.lineTo(cx + s * 0.06, cy - s * 0.22);
    c.moveTo(cx + s * 0.18, cy + s * 0.2);
    c.lineTo(cx - s * 0.06, cy - s * 0.22);
    c.moveTo(cx - s * 0.25, cy + s * 0.07);
    c.lineTo(cx + s * 0.25, cy + s * 0.07);
    c.stroke();
  },
  person(c, cx, cy, s) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx, cy - s * 0.1, s * 0.12, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(cx, cy + s * 0.2, s * 0.22, s * 0.13, 0, Math.PI, 0);
    c.fill();
  },
  maps(c, cx, cy, s, x, y) {
    c.fillStyle = '#8FD18B';
    c.fillRect(x, y, s * 0.5, s * 0.5);
    c.fillStyle = '#F5E6B9';
    c.fillRect(x + s * 0.5, y + s * 0.5, s * 0.5, s * 0.5);
    c.strokeStyle = '#fff';
    c.lineWidth = s * 0.07;
    c.beginPath();
    c.moveTo(x, y + s * 0.62);
    c.lineTo(x + s, y + s * 0.38);
    c.stroke();
    c.strokeStyle = '#2F80ED';
    c.lineWidth = s * 0.045;
    c.beginPath();
    c.moveTo(x + s * 0.25, y + s * 0.85);
    c.quadraticCurveTo(x + s * 0.4, y + s * 0.3, x + s * 0.75, y + s * 0.2);
    c.stroke();
  },
};

// kind: belgining turi; s — o'lchami (pt). ios=false bo'lsa One UI shakli
export function appIcon(c, kind, x, y, s, ios = true) {
  const cx = x + s / 2, cy = y + s / 2;
  c.save();
  switch (kind) {
    case 'phone': base(c, x, y, s, grad(c, x, y, s, '#5FF777', '#14BE33'), ios); glyph.phone(c, cx, cy, s); break;
    case 'messages': base(c, x, y, s, ios ? grad(c, x, y, s, '#6CF07E', '#0BC22D') : grad(c, x, y, s, '#5FA8FF', '#2970F0'), ios); glyph.bubble(c, cx, cy, s); break;
    case 'safari': base(c, x, y, s, '#fff', ios); glyph.safari(c, cx, cy, s); break;
    case 'chrome': base(c, x, y, s, '#fff', ios); glyph.chrome(c, cx, cy, s); break;
    case 'telegram': base(c, x, y, s, grad(c, x, y, s, '#3DB7F2', '#1E96D6'), ios); glyph.telegram(c, cx, cy, s); break;
    case 'camera': base(c, x, y, s, grad(c, x, y, s, '#E9EAEE', '#B9BCC4'), ios); glyph.camera(c, cx, cy, s); break;
    case 'photos': base(c, x, y, s, '#fff', ios); glyph.photos(c, cx, cy, s); break;
    case 'gallery': base(c, x, y, s, grad(c, x, y, s, '#FF7AA2', '#E5375F'), ios); glyph.photos(c, cx, cy, s * 0.9); break;
    case 'settings': base(c, x, y, s, grad(c, x, y, s, '#B5B8BF', '#83868F'), ios); glyph.gear(c, cx, cy, s, '#3a3c42'); break;
    case 'clock': base(c, x, y, s, '#111', ios); glyph.clock(c, cx, cy, s); break;
    case 'calendar': base(c, x, y, s, '#fff', ios); glyph.calendar(c, cx, cy, s, ios ? 'TUE' : 'TUE'); break;
    case 'weather': base(c, x, y, s, grad(c, x, y, s, '#4AA8F2', '#1B6FD6'), ios); glyph.weather(c, cx, cy, s); break;
    case 'notes': {
      base(c, x, y, s, '#fff', ios);
      c.save();
      rr(c, x, y, s, s, s * (ios ? 0.225 : 0.3));
      c.clip();
      glyph.notes(c, cx, cy, s, x, y);
      c.restore();
      break;
    }
    case 'maps': {
      base(c, x, y, s, '#fff', ios);
      c.save();
      rr(c, x, y, s, s, s * (ios ? 0.225 : 0.3));
      c.clip();
      glyph.maps(c, cx, cy, s, x, y);
      c.restore();
      break;
    }
    case 'mail': base(c, x, y, s, grad(c, x, y, s, '#4FB1FF', '#1C6EF2'), ios); glyph.mail(c, cx, cy, s); break;
    case 'music': base(c, x, y, s, grad(c, x, y, s, '#FF6B7E', '#F5254A'), ios); glyph.note(c, cx, cy, s); break;
    case 'store': base(c, x, y, s, grad(c, x, y, s, '#3FBCFF', '#1673F2'), ios); glyph.store(c, cx, cy, s); break;
    case 'contacts': base(c, x, y, s, grad(c, x, y, s, '#FFA94D', '#F57A1F'), ios); glyph.person(c, cx, cy, s); break;
    case 'tsweet': {
      // Bizning ilova belgisi (logo)
      c.save();
      rr(c, x, y, s, s, s * (ios ? 0.225 : 0.3));
      c.clip();
      c.drawImage(IMG.icon, x, y, s, s);
      c.restore();
      break;
    }
    default: base(c, x, y, s, '#ccc', ios);
  }
  c.restore();
}

export { glyph, G };
