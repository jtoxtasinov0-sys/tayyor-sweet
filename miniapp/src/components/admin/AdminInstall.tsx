'use client';
// Admin panelni telefonga alohida «Tayyor Admin» ilovasi qilib o'rnatish (admin.webmanifest).
// Android (Chrome): tizimning «Установить приложение» oynasi. iPhone: bosh ekranga aynan shu sahifa qo'shiladi,
// shuning uchun /ilova ga emas — qadamlar shu yerning o'zida ko'rsatiladi. Telegram ichidan — tashqi brauzerda ochiladi.
// Telefonda do'kon ilovasi bo'lsa, Chrome shu domendagi admin ilovani o'rnatmaydi (do'kon butun saytni, /admin ni ham
// o'ziniki deb biladi). Alohida admin domeni qo'shilgan bo'lsa — o'sha yerga o'tkazamiz, aks holda nima qilishni aytamiz
import { useEffect, useState } from 'react';
import { useInstall, isStandalone } from '@/hooks/useInstall';
import { tg, openLink } from '@/hooks/useTelegram';

// Admin panelning alohida domeni (Vercel → Settings → Domains): ro'yxatdagi qaysi biri qo'shilgan bo'lsa, o'shanisi.
// Boshqa nom bo'lsa — Vercel'da NEXT_PUBLIC_ADMIN_ORIGIN
const ADMIN_ORIGINS = [
  process.env.NEXT_PUBLIC_ADMIN_ORIGIN,
  'https://tayyor-admin.vercel.app',
  'https://tayyor-sweet-admin.vercel.app',
  'https://tayyorsweet-admin.vercel.app',
].filter((o): o is string => !!o).map((o) => o.replace(/\/+$/, ''));

// Ishlab turgan admin domeni (aynan shu admin ekani admin.webmanifest'dan tekshiriladi, CORS ruxsati next.config'da);
// null — hech biri qo'shilmagan yoki shu domenning o'zidamiz
async function findAdminOrigin(): Promise<string | null> {
  if (ADMIN_ORIGINS.includes(window.location.origin)) return null;
  try {
    return await Promise.any(
      ADMIN_ORIGINS.map(async (origin) => {
        const m = await fetch(`${origin}/admin.webmanifest`, { cache: 'no-store' }).then((r) => r.json());
        if (m.short_name !== 'Tayyor Admin') throw new Error(origin);
        return origin;
      })
    );
  } catch {
    return null;
  }
}

interface Guide {
  title?: string;
  steps: string[];
  note?: string;
}

const GUIDES: Record<'ios' | 'shop' | 'other', Guide> = {
  ios: {
    steps: [
      "Safari'da pastdagi «⋯» → «Поделиться» ni bosing (eski iPhone'da □↑)",
      '«На экран «Домой»» ni tanlang',
      '«Добавить» ni bosing',
    ],
  },
  shop: {
    title: "Telefoningizda «Tayyor&Sweet» do'kon ilovasi bor — Chrome shu sababli admin ilovani alohida o'rnatmayapti. Bir marta:",
    steps: [
      "Do'kon ilovasini o'chiring: ikonkasini bosib turing → «Удалить»",
      "Shu sahifani yangilang, o'rnatish tugmasini qayta bosing → «Установить»",
      "Do'kon ilovasini keyin qayta o'rnatsangiz bo'ladi — ikkalasi alohida ishlaydi",
    ],
  },
  other: {
    steps: [
      "Chrome'da ⋮ menyuni oching",
      '«Установить и создать ярлык» (yoki «Установить приложение») ni bosing',
      '«Установить» ni bosing',
    ],
    note: "Menyuda o'rnatish o'rniga «Открыть … Tayyor&Sweet» chiqsa — telefonda do'kon ilovasi bor: uni o'chirib (ikonkasini bosib turing → «Удалить»), sahifani yangilang va qayta bosing. Do'kon ilovasini keyin qayta o'rnatsa bo'ladi.",
  },
};

// compact — har bo'lim sarlavhasi yonidagi kichik tugma (qadamlar sarlavha ostida ochiladi)
export function AdminInstall({ style, compact = false }: { style?: React.CSSProperties; compact?: boolean }) {
  const { standalone, installed, otherInstalled, waiting, prompt } = useInstall();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [ios, setIos] = useState(false);
  const [adminOrigin, setAdminOrigin] = useState<string | null>(null);
  // asosiy domendan shu yerga o'rnatish uchun o'tkazildi
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setMoved(new URLSearchParams(window.location.search).has('install'));
    if (!isStandalone()) findAdminOrigin().then(setAdminOrigin);
  }, []);

  if (standalone) return null;
  if (installed && compact) return <span className="adm-install-ok">✅ Ilova o&apos;rnatilgan</span>;
  if (installed)
    return (
      <div className="install-card" style={style}>
        <span className="ic">✅</span>
        <div><b>Admin ilova telefoningizda bor</b><small>Bosh ekran yoki ilovalar ro&apos;yxatidan «Tayyor Admin» ni oching</small></div>
      </div>
    );

  const install = async () => {
    setGuide(null);
    // do'kon ilovasi bor — bu domenda oyna baribir chiqmaydi, kutib o'tirmaymiz
    if (!(adminOrigin && otherInstalled) && (await prompt())) return;
    if (adminOrigin && !ios) {
      const url = `${adminOrigin}/admin?install=1`;
      return tg()?.initData ? openLink(url) : window.location.assign(url);
    }
    if (tg()?.initData) return openLink(`${window.location.origin}/admin`);
    setGuide(ios ? GUIDES.ios : otherInstalled ? GUIDES.shop : GUIDES.other);
  };

  const label = waiting ? '⏳ Kuting...' : null;
  const body = guide && (
    <>
      {guide.title && <p className="adm-install-title">{guide.title}</p>}
      <ol>
        {guide.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      {guide.note && <small>{guide.note}</small>}
    </>
  );

  if (compact)
    return (
      <>
        <button type="button" className="btn btn-primary btn-sm" onClick={install} disabled={waiting}>
          {label || <>📲 Ilovani o&apos;rnatish</>}
        </button>
        {body && <div className="install-card admin-install adm-install-steps">{body}</div>}
      </>
    );

  return (
    <div className="install-card admin-install" style={style}>
      <div className="row-top">
        <span className="ic">📲</span>
        <div>
          <b>Admin panelni telefonga o&apos;rnatish</b>
          <small>{moved ? "👉 Endi «O'rnatish» ni bosing" : "Bosh ekranda alohida «Tayyor Admin» ilovasi bo'ladi"}</small>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={install} disabled={waiting}>{label || <>O&apos;rnatish</>}</button>
      </div>
      {body}
    </div>
  );
}
