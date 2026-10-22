// Backend bilan aloqani tekshirish: admin panel "Server bilan aloqa yo'q" desa, telefonda /holat ni oching
export const dynamic = 'force-dynamic';

type Check = { status?: number; render?: string | null; body?: string; result: string; ms: number };

async function probe(url: string): Promise<Check> {
  const started = Date.now();
  try {
    // Render uyg'onishi ~1 daqiqagacha cho'zilishi mumkin
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(25_000) });
    const body = (await res.text()).slice(0, 200);
    const result = res.ok
      ? '✅ Ishlayapti'
      : res.status === 404
        ? "❌ Bu manzilda backend yo'q (404) — Render'dagi manzil bilan solishtiring"
        : `❌ Xato qaytardi (${res.status})`;
    return { status: res.status, render: res.headers.get('x-render-routing'), body, result, ms: Date.now() - started };
  } catch (e) {
    const err = e as Error;
    const result =
      err.name === 'TimeoutError'
        ? "⏳ 25 soniyada javob bermadi — server uyg'onmoqda, 1 daqiqadan so'ng qayta oching"
        : `❌ Ulanib bo'lmadi: ${err.message}`;
    return { result, ms: Date.now() - started };
  }
}

export async function GET(req: Request) {
  const raw = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
  const out = {
    BACKEND_URL: raw || "❌ Vercel'da kiritilmagan",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "(bo'sh — to'g'ri)",
    // To'g'ridan-to'g'ri Render'ga
    backend: raw ? await probe(`${raw}/api/health`) : { result: "❌ BACKEND_URL yo'q" },
    // Brauzer va admin panel ishlatadigan yo'l: Vercel /api/* → Render
    via_vercel: await probe(new URL('/api/health', req.url).toString()),
    eslatma: "BACKEND_URL o'zgartirilsa, Vercel'da Redeploy qilish kerak — /api yo'naltirish build paytida yoziladi",
  };
  return new Response(JSON.stringify(out, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
