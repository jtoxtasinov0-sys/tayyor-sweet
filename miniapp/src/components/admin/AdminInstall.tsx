'use client';
// Admin panelni telefonga alohida «Tayyor Admin» ilovasi qilib o'rnatish (admin.webmanifest).
// Android (Chrome): tizimning «Установить приложение» oynasi. iPhone: bosh ekranga aynan shu sahifa qo'shiladi,
// shuning uchun /ilova ga emas — qadamlar shu yerning o'zida ko'rsatiladi. Telegram ichidan — tashqi brauzerda ochiladi
import { useEffect, useState } from 'react';
import { useInstall } from '@/hooks/useInstall';
import { tg, openLink } from '@/hooks/useTelegram';

const STEPS = {
  ios: [
    "Safari'da pastdagi «⋯» → «Поделиться» ni bosing (eski iPhone'da □↑)",
    '«На экран «Домой»» ni tanlang',
    '«Добавить» ni bosing',
  ],
  other: [
    "Chrome'da ⋮ menyuni oching",
    '«Установить и создать ярлык» (yoki «Установить приложение») ni bosing',
    '«Установить» ni bosing',
  ],
};

// compact — har bo'lim sarlavhasi yonidagi kichik tugma (qadamlar sarlavha ostida ochiladi)
export function AdminInstall({ style, compact = false }: { style?: React.CSSProperties; compact?: boolean }) {
  const { standalone, installed, prompt } = useInstall();
  const [steps, setSteps] = useState<string[] | null>(null);
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
    if (await prompt()) return;
    if (tg()?.initData) return openLink(`${window.location.origin}/admin`);
    setSteps(ios ? STEPS.ios : STEPS.other);
  };

  const list = steps && (
    <ol>
      {steps.map((s) => <li key={s}>{s}</li>)}
    </ol>
  );

  if (compact)
    return (
      <>
        <button type="button" className="btn btn-primary btn-sm" onClick={install}>📲 Ilovani o&apos;rnatish</button>
        {list && <div className="install-card admin-install adm-install-steps">{list}</div>}
      </>
    );

  return (
    <div className="install-card admin-install" style={style}>
      <div className="row-top">
        <span className="ic">📲</span>
        <div><b>Admin panelni telefonga o&apos;rnatish</b><small>Bosh ekranda alohida «Tayyor Admin» ilovasi bo&apos;ladi</small></div>
        <button type="button" className="btn btn-primary btn-sm" onClick={install}>O&apos;rnatish</button>
      </div>
      {list}
    </div>
  );
}
