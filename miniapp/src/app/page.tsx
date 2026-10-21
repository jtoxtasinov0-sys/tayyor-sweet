// Bosh sahifa. Do'kon ma'lumotlari serverda olinadi va Vercel'da keshlanadi (ISR):
// backend (Render) uxlab qolgan bo'lsa ham ilova darhol ochiladi, ma'lumot fonda yangilanadi.
import { ShopApp } from '@/components/ShopApp';
import type { Bootstrap } from '@/lib/types';
import fallback from '@/lib/fallback-bootstrap.json';

// Sahifa ko'pi bilan har 60 soniyada fonda qayta yig'iladi
export const revalidate = 60;

const backend = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

async function getBootstrap(): Promise<Bootstrap> {
  try {
    // Render uyg'onishi ~1 daqiqagacha cho'zilishi mumkin
    const res = await fetch(`${backend}/api/bootstrap`, { signal: AbortSignal.timeout(50_000) });
    if (!res.ok) throw new Error(`bootstrap: ${res.status}`);
    return (await res.json()) as Bootstrap;
  } catch (e) {
    // Fondagi yangilashda xato tashlanadi: Next.js oxirgi muvaffaqiyatli sahifani berishda davom etadi
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') throw e;
    // Build/dev paytida backend javob bermasa — do'kon zaxira nusxadan ochiladi
    // (mahsulotlar, narxlar, rasmlar public/rasmlar dan). Backend uyg'ongach brauzer yangisini oladi
    return fallback as unknown as Bootstrap;
  }
}

export default async function Page() {
  return <ShopApp initialData={await getBootstrap()} />;
}
