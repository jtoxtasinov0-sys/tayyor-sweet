'use client';
// Savat logikasini boshqarish: mahsulotlar bilan birlashtirish, summa, yetkazish
import { useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useApp } from '@/store/appStore';
import type { DeliveryMethod, Product } from '@/lib/types';

export interface CartView {
  key: string;
  product_id: number;
  product: Product;
  variant: string | null;
  color: string | null;
  qty: number;
  price: number;
}

export const priceOf = (p: Product, variant?: string | null) =>
  p.variants?.find((v) => v.name === variant)?.price ?? p.price;

export function useCart() {
  const lines = useCartStore((s) => s.lines);
  const data = useApp((s) => s.data);

  return useMemo(() => {
    const byId = new Map((data?.products || []).map((p) => [p.id, p]));
    const items: CartView[] = [];
    for (const l of lines) {
      const product = byId.get(l.product_id);
      if (!product) continue;
      items.push({ ...l, product, price: priceOf(product, l.variant) });
    }
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const d = data?.delivery;
    const fee = (m: DeliveryMethod) => {
      if (!d) return 0;
      const base = Number(d[`${m}_fee` as const] || 0);
      return m === 'taekbae' && d.free_from && subtotal >= d.free_from ? 0 : base;
    };
    const preorderDays = Math.max(0, ...items.map((i) => i.product.preorder_days || 0));
    return { items, count, subtotal, fee, preorderDays, qtyOf: (id: number) => lines.filter((l) => l.product_id === id).reduce((s, l) => s + l.qty, 0) };
  }, [lines, data]);
}
