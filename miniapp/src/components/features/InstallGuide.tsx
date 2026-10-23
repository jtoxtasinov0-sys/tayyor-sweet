'use client';
// /ilova — ilovani telefonga o'rnatish: telefon turini aniqlaydi, tugma yoki qadamlar + video qo'llanma
import { useEffect, useState } from 'react';
import type { Lang } from '@/lib/types';

type Platform = 'ios' | 'android' | 'other';
type Device = 'iphone' | 'samsung';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __bip?: InstallPromptEvent | null;
  }
}

const TXT = {
  uz: {
    title: 'Tayyor & Sweet ilovasi',
    lead: "Do'kon telefoningiz bosh ekranida — bir bosishda ochiladi, Telegram'siz ham buyurtma berasiz.",
    install: '📲 Ilovani o‘rnatish',
    done_title: '🎉 Tayyor!',
    done_text: 'Ilova bosh ekranga qo‘shildi.',
    open_shop: "🛍 Do'konni ochish",
    inapp_title: '⚠️ Bu oynada o‘rnatib bo‘lmaydi',
    inapp_ios: "Linkni nusxalang va Safari'da oching.",
    inapp_android: "Sahifani Chrome'da oching — u yerda «O‘rnatish» tugmasi chiqadi.",
    open_chrome: "Chrome'da ochish",
    copy: '🔗 Linkni nusxalash',
    copied: '✅ Nusxa olindi',
    ios_title: 'iPhone: 3 qadam',
    ios_steps: [
      ['Pastdagi «⋯» tugmasini, keyin «Ulashish» ni bosing', 'Eski iPhone: pastdagi □↑ tugmasi'],
      ['«Bosh ekranga qo‘shish» ni tanlang', '«Add to Home Screen» · «На экран «Домой»» · «홈 화면에 추가»'],
      ['O‘ng yuqoridagi «Qo‘shish» ni bosing', '«Add» · «Добавить» · «추가»'],
    ],
    android_title: 'Samsung / Android',
    android_steps: [
      ['Brauzer menyusini oching', 'Chrome: ⋮ (yuqorida) · Samsung Internet: ≡ (pastda)'],
      ['«Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish»', 'Chrome: «Установить и создать ярлык» · «Install app» · «앱 설치»'],
      ['«O‘rnatish» ni bosing', '«Install» · «Установить» · «설치»'],
    ],
    other_title: 'Telefoningizda oching',
    other_text: 'Bu linkni telefoningizda Safari (iPhone) yoki Chrome (Samsung) orqali oching:',
    video: '🎬 Video qo‘llanma',
    back: "← Do'konga qaytish",
  },
  ru: {
    title: 'Приложение Tayyor & Sweet',
    lead: 'Магазин на главном экране телефона — открывается в одно касание, заказывать можно и без Telegram.',
    install: '📲 Установить приложение',
    done_title: '🎉 Готово!',
    done_text: 'Приложение добавлено на главный экран.',
    open_shop: '🛍 Открыть магазин',
    inapp_title: '⚠️ В этом окне установить нельзя',
    inapp_ios: 'Скопируйте ссылку и откройте её в Safari.',
    inapp_android: 'Откройте страницу в Chrome — там появится кнопка «Установить».',
    open_chrome: 'Открыть в Chrome',
    copy: '🔗 Скопировать ссылку',
    copied: '✅ Скопировано',
    ios_title: 'iPhone: 3 шага',
    ios_steps: [
      ['Нажмите «⋯» внизу, затем «Поделиться»', 'Старые iPhone: кнопка □↑ внизу'],
      ['Выберите «На экран «Домой»»', '«Add to Home Screen» · «Bosh ekranga qo‘shish» · «홈 화면에 추가»'],
      ['Нажмите «Добавить» справа вверху', '«Add» · «Qo‘shish» · «추가»'],
    ],
    android_title: 'Samsung / Android',
    android_steps: [
      ['Откройте меню браузера', 'Chrome: ⋮ (вверху) · Samsung Internet: ≡ (внизу)'],
      ['«Установить и создать ярлык» (Chrome) или «Добавить на главный экран»', '«Install app» · «Ilovani o‘rnatish» · «앱 설치»'],
      ['Нажмите «Установить»', '«Install» · «O‘rnatish» · «설치»'],
    ],
    other_title: 'Откройте на телефоне',
    other_text: 'Откройте эту ссылку на телефоне в Safari (iPhone) или Chrome (Samsung):',
    video: '🎬 Видеоинструкция',
    back: '← Вернуться в магазин',
  },
};

// Instagram, KakaoTalk, Telegram va boshqa ilovalar ichidagi brauzerlar o'rnatishni qo'llamaydi
const IN_APP = /Telegram|Instagram|FBAN|FBAV|KAKAOTALK|NAVER\(inapp|Line\/|; wv\)/i;

function detect() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const platform: Platform = ios ? 'ios' : /Android/i.test(ua) ? 'android' : 'other';
  // iOS: Safari, Chrome, Edge, Firefox "Safari/..." yozuviga ega; ilova ichidagi oynada u bo'lmaydi
  const inApp = IN_APP.test(ua) || (ios && !/Safari\//.test(ua));
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return { platform, inApp, standalone };
}

function pickLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q === 'ru' || q === 'uz') return q;
  try {
    const saved = localStorage.getItem('ts-lang');
    if (saved === 'ru' || saved === 'uz') return saved;
  } catch {}
  return navigator.language?.startsWith('ru') ? 'ru' : 'uz';
}

// Video (faqat o'zbekcha) va muqovasi: public/video/ilova-<iphone|samsung>-uz.mp4 / .jpg (video/build.sh yig'adi)
const guideVideo = (device: Device) => `/video/ilova-${device}-uz`;

export function InstallGuide() {
  const [lang, setLang] = useState<Lang>('uz');
  const [env, setEnv] = useState<ReturnType<typeof detect> | null>(null);
  const [bip, setBip] = useState<InstallPromptEvent | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState<Device>('iphone');

  useEffect(() => {
    const e = detect();
    // iPhone o'rnatilgan ilovani shu sahifadan ochishi mumkin — to'g'ri do'konga o'tkazamiz
    if (e.standalone) return window.location.replace('/');
    setEnv(e);
    setLang(pickLang());
    setDevice(e.platform === 'android' ? 'samsung' : 'iphone');
    // Hodisa sahifa yuklanishida ushlab qolinadi (layout'dagi skript) — keyin ham kelishi mumkin
    setBip(window.__bip || null);
    const onBip = () => setBip(window.__bip || null);
    const onInstalled = () => {
      setDone(true);
      setBip(null);
    };
    window.addEventListener('ts-bip', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('ts-bip', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const t = TXT[lang];
  const link = typeof window !== 'undefined' ? `${window.location.origin}/ilova${lang === 'ru' ? '?lang=ru' : ''}` : '';

  const install = async () => {
    if (!bip) return;
    await bip.prompt();
    const { outcome } = await bip.userChoice;
    window.__bip = null;
    setBip(null);
    if (outcome === 'accepted') setDone(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt('', link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const chromeIntent = `intent://${link.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
  const copyBtn = (
    <button className="btn btn-soft btn-block" onClick={copy}>
      {copied ? t.copied : t.copy}
    </button>
  );

  let main: React.ReactNode = null;
  if (done) {
    main = (
      <div className="inst-card">
        <h2>{t.done_title}</h2>
        <p>{t.done_text}</p>
        <a className="btn btn-primary btn-block" href="/">{t.open_shop}</a>
      </div>
    );
  } else if (bip) {
    // Chrome / Samsung Internet: tizimning o'rnatish oynasi
    main = (
      <div className="inst-card">
        <button className="btn btn-primary btn-block inst-big" onClick={install}>{t.install}</button>
      </div>
    );
  } else if (env?.inApp) {
    main = (
      <div className="inst-card warn">
        <h2>{t.inapp_title}</h2>
        <p>{env.platform === 'ios' ? t.inapp_ios : t.inapp_android}</p>
        {env.platform === 'android' && (
          <a className="btn btn-primary btn-block" href={chromeIntent}>{t.open_chrome}</a>
        )}
        {copyBtn}
      </div>
    );
  } else if (env?.platform === 'ios') {
    main = <Steps title={t.ios_title} steps={t.ios_steps} />;
  } else if (env?.platform === 'android') {
    main = <Steps title={t.android_title} steps={t.android_steps} />;
  } else if (env) {
    main = (
      <div className="inst-card">
        <h2>{t.other_title}</h2>
        <p>{t.other_text}</p>
        <code className="inst-link">{link}</code>
        {copyBtn}
      </div>
    );
  }

  return (
    <div className="inst">
      <header className="inst-head">
        <img src="/icons/icon-192.png" alt="" width={96} height={96} />
        <h1>{t.title}</h1>
        <p>{t.lead}</p>
      </header>

      {main}

      <section className="inst-video">
        <h3>{t.video}</h3>
        <div className="inst-tabs">
          {(['iphone', 'samsung'] as const).map((d) => (
            <button key={d} className={`chip ${device === d ? 'active' : ''}`} onClick={() => setDevice(d)}>
              {d === 'iphone' ? '🍏 iPhone' : '🤖 Samsung'}
            </button>
          ))}
        </div>
        <video
          key={device}
          className="inst-player"
          src={`${guideVideo(device)}.mp4`}
          poster={`${guideVideo(device)}.jpg`}
          controls
          playsInline
          preload="metadata"
        />
      </section>

      <a className="inst-back" href="/">{t.back}</a>
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: string[][] }) {
  return (
    <div className="inst-card">
      <h2>{title}</h2>
      <ol className="inst-steps">
        {steps.map(([main, hint], i) => (
          <li key={i}>
            <b>{i + 1}</b>
            <div>
              <span>{main}</span>
              <small>{hint}</small>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
