'use client';
// Admin panelni telefonga alohida «Tayyor Admin» ilovasi qilib o'rnatish (admin.webmanifest).
// Android (Chrome): tizimning «Установить приложение» oynasi. iPhone: bosh ekranga aynan shu sahifa qo'shiladi,
// shuning uchun /ilova ga emas — qadamlar shu yerning o'zida ko'rsatiladi. Telegram ichidan — tashqi brauzerda ochiladi.
// Telefonda do'kon ilovasi bo'lsa, Chrome admin ilovani o'rnatmaydi (do'kon butun saytni, /admin ni ham o'ziniki
// deb biladi) — o'rnatish oynasi shu sababli chiqmaydi, buni aytib, nima qilishni ko'rsatamiz
import { useEffect, useState } from 'react';
import { useInstall } from '@/hooks/useInstall';
import { tg, openLink } from '@/hooks/useTelegram';

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

  useEffect(() => {
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
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
    if (await prompt()) return;
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
        <div><b>Admin panelni telefonga o&apos;rnatish</b><small>Bosh ekranda alohida «Tayyor Admin» ilovasi bo&apos;ladi</small></div>
        <button type="button" className="btn btn-primary btn-sm" onClick={install} disabled={waiting}>{label || <>O&apos;rnatish</>}</button>
      </div>
      {body}
    </div>
  );
}
