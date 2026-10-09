// Bosh sahifa. Do'kon ma'lumotlari serverda olinadi va Vercel'da keshlanadi (ISR):
// backend (Render) uxlab qolgan bo'lsa ham ilova darhol ochiladi, ma'lumot fonda yangilanadi.
import { ShopApp } from '@/components/ShopApp';
import type { Bootstrap } from '@/lib/types';

// Sahifa ko'pi bilan har 60 soniyada fonda qayta yig'iladi
export const revalidate = 60;

const backend = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

async function getBootstrap(): Promise<Bootstrap | null> {
  try {
    // Render uyg'onishi ~1 daqiqagacha cho'zilishi mumkin
    const res = await fetch(`${backend}/api/bootstrap`, { signal: AbortSignal.timeout(50_000) });
    if (!res.ok) throw new Error(`bootstrap: ${res.status}`);
    return (await res.json()) as Bootstrap;
  } catch (e) {
    // Build va dev paytida backend bo'lmasa — ma'lumot brauzerda yuklanadi.
    // Fondagi yangilashda xato tashlanadi: Next.js oxirgi muvaffaqiyatli sahifani berishda davom etadi.
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build') return null;
    throw e;
  }
}

export default async function Page() {
  return <ShopApp initialData={await getBootstrap()} />;
}
