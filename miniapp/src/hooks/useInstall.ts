'use client';
// Ilovani telefonga o'rnatish (PWA). Android (Chrome / Samsung Internet): sahifa yuklanishida keladigan
// "beforeinstallprompt" hodisasini layout'dagi skript ushlab qoladi — prompt() tizimning «Установить приложение»
// oynasini (Отмена / Установить) ochadi. iPhone'da bunday oyna yo'q — /ilova qo'llanmasiga yo'naltiriladi
import { useEffect, useState } from 'react';
import { openLink } from './useTelegram';

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __bip?: InstallPromptEvent | null;
  }
  interface Navigator {
    standalone?: boolean;
    // Android Chrome: manifest'dagi related_applications orqali ilova allaqachon o'rnatilganini bildiradi
    getInstalledRelatedApps?: () => Promise<{ platform: string; url?: string }[]>;
  }
}

export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// Chrome hodisani manifest va ikonkalarni tekshirib bo'lgach (sahifa ochilganidan ~1–3 soniyada) yuboradi.
// Shu orada bosilsa — qadamlarni ko'rsatishdan oldin biroz kutiladi (bosish 5 soniyagacha kuchda turadi)
function waitBip(): Promise<InstallPromptEvent | null> {
  const ms = Math.min(3000, 6000 - performance.now());
  // Safari / Firefox'da bu hodisa yo'q, Telegram ichida kelmaydi
  if (window.__bip || ms <= 0 || !('onbeforeinstallprompt' in window) || window.Telegram?.WebApp?.initData)
    return Promise.resolve(window.__bip || null);
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener('ts-bip', done);
      resolve(window.__bip || null);
    };
    const timer = setTimeout(done, ms);
    window.addEventListener('ts-bip', done);
  });
}

export function useInstall() {
  const [bip, setBip] = useState<InstallPromptEvent | null>(null);
  // shu sahifada o'rnatildi yoki telefonda allaqachon bor
  const [installed, setInstalled] = useState(false);
  // telefonda manifest'dagi boshqa ilova bor. Admin sahifasida — do'kon ilovasi: u butun saytni (/admin ham)
  // o'ziniki deb biladi, shuning uchun Chrome admin ilovani "allaqachon o'rnatilgan" hisoblab o'rnatish oynasini bermaydi
  const [otherInstalled, setOtherInstalled] = useState(false);
  // o'rnatilgan ilova ichida "o'rnatish" kerak emas (tekshirilguncha yashirin)
  const [standalone, setStandalone] = useState(true);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setBip(window.__bip || null);
    const onBip = () => setBip(window.__bip || null);
    const onInstalled = () => {
      setInstalled(true);
      setBip(null);
    };
    window.addEventListener('ts-bip', onBip);
    window.addEventListener('appinstalled', onInstalled);
    const own = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href;
    const path = (url?: string) => (url ? new URL(url, window.location.href).pathname : '');
    navigator
      .getInstalledRelatedApps?.()
      .then((apps) => {
        const mine = (a: { url?: string }) => !a.url || !own || path(a.url) === path(own);
        if (apps.some(mine)) setInstalled(true);
        if (apps.some((a) => !mine(a))) setOtherInstalled(true);
      })
      .catch(() => {});
    return () => {
      window.removeEventListener('ts-bip', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Tizimning o'rnatish oynasi; false — oyna yo'q (iPhone, Telegram ichi yoki ilova allaqachon bor)
  const prompt = async () => {
    let ev = bip || window.__bip || null;
    if (!ev) {
      setWaiting(true);
      ev = await waitBip();
      setWaiting(false);
    }
    if (!ev) return false;
    window.__bip = null;
    setBip(null);
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    } catch {
      return false;
    }
    return true;
  };

  // "O'rnatish" tugmasi: Android'da tizim oynasi, aks holda /ilova qo'llanmasi (Telegram ichidan — tashqi brauzerda)
  const install = async (lang: 'uz' | 'ru') => {
    if (await prompt()) return;
    const url = `${window.location.origin}/ilova?lang=${lang}`;
    if (window.Telegram?.WebApp?.initData) openLink(url);
    else window.location.href = url;
  };

  return { bip, installed, otherInstalled, standalone, waiting, prompt, install };
}
