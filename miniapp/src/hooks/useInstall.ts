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

export function useInstall() {
  const [bip, setBip] = useState<InstallPromptEvent | null>(null);
  // shu sahifada o'rnatildi yoki telefonda allaqachon bor
  const [installed, setInstalled] = useState(false);
  // o'rnatilgan ilova ichida "o'rnatish" kerak emas (tekshirilguncha yashirin)
  const [standalone, setStandalone] = useState(true);

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
    navigator
      .getInstalledRelatedApps?.()
      .then((apps) => {
        if (apps.length) setInstalled(true);
      })
      .catch(() => {});
    return () => {
      window.removeEventListener('ts-bip', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Tizimning o'rnatish oynasi; false — oyna yo'q (iPhone, Telegram ichi yoki ilova allaqachon bor)
  const prompt = async () => {
    if (!bip) return false;
    await bip.prompt();
    const { outcome } = await bip.userChoice;
    window.__bip = null;
    setBip(null);
    if (outcome === 'accepted') setInstalled(true);
    return true;
  };

  // "O'rnatish" tugmasi: Android'da tizim oynasi, aks holda /ilova qo'llanmasi (Telegram ichidan — tashqi brauzerda)
  const install = async (lang: 'uz' | 'ru') => {
    if (await prompt()) return;
    const url = `${window.location.origin}/ilova?lang=${lang}`;
    if (window.Telegram?.WebApp?.initData) openLink(url);
    else window.location.href = url;
  };

  return { bip, installed, standalone, prompt, install };
}
