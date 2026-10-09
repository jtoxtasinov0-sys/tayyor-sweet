'use client';
// Mini App yuklanganini tekshiruvchi provayder: Telegram sozlamalari + boshlang'ich ma'lumotlar
import { useEffect, type ReactNode } from 'react';
import { tg } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { useApp } from '@/store/appStore';
import type { Bootstrap, Lang } from '@/lib/types';

const LANG_KEY = 'ts-lang';

export function TelegramProvider({ children, initialData }: { children: ReactNode; initialData?: Bootstrap | null }) {
  const set = useApp((s) => s.set);

  useEffect(() => {
    // Serverda tayyorlangan ma'lumot — ilova backend javobini kutmasdan ochiladi
    if (initialData && !useApp.getState().data) set({ data: initialData });

    const w = tg();
    if (w) {
      w.ready();
      w.expand();
      w.setHeaderColor?.('#FFF0F7');
      w.setBackgroundColor?.('#FFF0F7');
      w.setBottomBarColor?.('#FFFFFF');
      w.disableVerticalSwipes?.();
    }

    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {}
    const tgLang = w?.initDataUnsafe?.user?.language_code;
    set({ lang: (saved as Lang) || (tgLang === 'ru' ? 'ru' : 'uz') });

    // Fonda yangilash (backend uxlab qolgan bo'lsa — uni uyg'otadi ham)
    loadBootstrap();

    api
      .me()
      .then((me) => {
        set({ me });
        if (me.lang && !saved) set({ lang: me.lang });
      })
      .catch(() => {});

    // Botdan "?order=ID" bilan ochilganda — buyurtmani ko'rsatish
    const params = new URLSearchParams(window.location.search);
    const orderId = Number(params.get('order') || w?.initDataUnsafe?.start_param?.replace(/^order_/, '') || 0);
    if (orderId) set({ tab: 'orders', overlay: { type: 'order', id: orderId } });
  }, [set]);

  return <>{children}</>;
}

export function loadBootstrap(attempt = 0) {
  const set = useApp.getState().set;
  set({ loadError: false });
  api
    .bootstrap()
    .then((data) => set({ data }))
    .catch(() => {
      // Ma'lumot allaqachon bor — xato ekrani kerak emas
      if (useApp.getState().data) return;
      // Backend uyg'onayotgan bo'lishi mumkin — yana urinib ko'ramiz
      if (attempt < 3) setTimeout(() => loadBootstrap(attempt + 1), 2000 * (attempt + 1));
      else set({ loadError: true });
    });
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {}
  useApp.getState().set({ lang });
  api.updateMe({ lang }).catch(() => {});
}
