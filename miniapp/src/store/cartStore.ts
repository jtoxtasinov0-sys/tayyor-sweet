// Zustand: savatdagi ma'lumotlarni saqlash (localStorage)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartLine {
  key: string;
  product_id: number;
  variant: string | null;
  color: string | null;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  bump: number; // savat belgisi animatsiyasi uchun
  add: (product_id: number, opts?: { variant?: string | null; color?: string | null; qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const lineKey = (id: number, variant?: string | null, color?: string | null) => `${id}|${variant || ''}|${color || ''}`;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      bump: 0,
      add: (product_id, { variant = null, color = null, qty = 1 } = {}) =>
        set((s) => {
          const key = lineKey(product_id, variant, color);
          const hit = s.lines.find((l) => l.key === key);
          const lines = hit
            ? s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l))
            : [...s.lines, { key, product_id, variant, color, qty }];
          return { lines, bump: s.bump + 1 };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, qty) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'ts-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    }
  )
);
