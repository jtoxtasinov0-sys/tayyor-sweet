'use client';
// window.Telegram.WebApp obyekti uchun hook
import { useEffect, useRef } from 'react';

interface TgButton {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string }; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor?(c: string): void;
  setBackgroundColor?(c: string): void;
  setBottomBarColor?(c: string): void;
  disableVerticalSwipes?(): void;
  enableClosingConfirmation?(): void;
  disableClosingConfirmation?(): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
  showAlert?(msg: string): void;
  isVersionAtLeast?(v: string): boolean;
  BackButton: TgButton;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg = (): TelegramWebApp | undefined => (typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined);

export const haptic = {
  tap: () => tg()?.HapticFeedback?.impactOccurred('light'),
  medium: () => tg()?.HapticFeedback?.impactOccurred('medium'),
  success: () => tg()?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg()?.HapticFeedback?.notificationOccurred('error'),
  select: () => tg()?.HapticFeedback?.selectionChanged(),
};

export function openLink(url: string) {
  const w = tg();
  if (!url) return;
  if (w && /^https:\/\/t\.me\//.test(url)) return w.openTelegramLink(url);
  if (w?.initData) return w.openLink(url);
  window.open(url, '_blank');
}

// Telegram "Orqaga" tugmasi: active bo'lsa ko'rsatadi va bosilganda onBack chaqiriladi
export function useBackButton(active: boolean, onBack: () => void) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    const w = tg();
    if (!w?.BackButton || !active) return;
    const handler = () => ref.current();
    w.BackButton.onClick(handler);
    w.BackButton.show();
    return () => {
      w.BackButton.offClick(handler);
      w.BackButton.hide();
    };
  }, [active]);
}

export function useTelegram() {
  const w = tg();
  return { tg: w, user: w?.initDataUnsafe?.user, inTelegram: !!w?.initData, haptic };
}
