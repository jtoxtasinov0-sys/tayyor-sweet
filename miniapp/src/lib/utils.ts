// Yordamchi funksiyalar
import type { Lang, Product, Category } from './types';

export const won = (n: number | null | undefined) =>
  `${Math.round(Number(n || 0)).toLocaleString('ru-RU').replace(/ /g, ' ')} ₩`;

export const pName = (p: Pick<Product, 'name_uz' | 'name_ru'>, lang: Lang) => (lang === 'ru' && p.name_ru) || p.name_uz;
export const pUnit = (p: Pick<Product, 'unit_uz' | 'unit_ru'>, lang: Lang) => (lang === 'ru' && p.unit_ru) || p.unit_uz || '';
export const pDesc = (p: Pick<Product, 'description_uz' | 'description_ru'>, lang: Lang) =>
  (lang === 'ru' && p.description_ru) || p.description_uz || '';
export const cName = (c: Pick<Category, 'name_uz' | 'name_ru'>, lang: Lang) => (lang === 'ru' && c.name_ru) || c.name_uz;

const MONTHS = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
};

// Brauzerlarda uz-UZ formati turlicha chiqadi — o'zimiz yig'amiz
export const fmtDate = (d: string | Date, lang: Lang, withTime = true) => {
  const x = new Date(d);
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${x.getDate()} ${MONTHS[lang][x.getMonth()]}`;
  return withTime ? `${date}, ${p(x.getHours())}:${p(x.getMinutes())}` : `${date} ${x.getFullYear()}`;
};

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

// Rasmni yuklashdan oldin kichraytirish (telefon rasmlari 5–10 MB bo'ladi)
export async function compressImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality));
}

export const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
