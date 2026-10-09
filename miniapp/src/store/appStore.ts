// Ilova holati: ma'lumotlar, til, ekranlar, oynalar
import { create } from 'zustand';
import type { Bootstrap, Lang, Me, Order } from '@/lib/types';

export type Tab = 'home' | 'catalog' | 'cart' | 'orders' | 'profile';

export type Overlay =
  | { type: 'product'; id: number }
  | { type: 'checkout' }
  | { type: 'payment'; order: Order; fresh?: boolean }
  | { type: 'order'; id: number }
  | null;

interface AppState {
  data: Bootstrap | null;
  loadError: boolean;
  me: Me | null;
  lang: Lang;
  tab: Tab;
  categoryId: number | null;
  query: string;
  overlay: Overlay;
  story: number | null;
  toast: string | null;
  ordersVersion: number;
  set: (p: Partial<AppState>) => void;
  setTab: (t: Tab) => void;
  open: (o: Overlay) => void;
  close: () => void;
  showToast: (msg: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useApp = create<AppState>((set) => ({
  data: null,
  loadError: false,
  me: null,
  lang: 'uz',
  tab: 'home',
  categoryId: null,
  query: '',
  overlay: null,
  story: null,
  toast: null,
  ordersVersion: 0,
  set: (p) => set(p),
  setTab: (tab) => {
    set({ tab });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  },
  open: (overlay) => set({ overlay }),
  close: () => set({ overlay: null }),
  showToast: (toast) => {
    clearTimeout(toastTimer);
    set({ toast });
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },
}));
