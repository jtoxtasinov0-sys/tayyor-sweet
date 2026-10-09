'use client';
import { useRef } from 'react';
import type { Product } from '@/lib/types';
import { Img, useT } from '@/components/ui';
import { useApp } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { useCart } from '@/hooks/useCart';
import { haptic } from '@/hooks/useTelegram';
import { won, pName, pUnit, cx } from '@/lib/utils';

// Rasm nusxasi savat belgisiga "uchib" boradi
export function flyToCart(from: HTMLElement | null) {
  const target = document.getElementById('cart-target');
  const img = from?.querySelector('img');
  if (!from || !target || !img) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, 120);
  const el = document.createElement('div');
  el.className = 'fly';
  el.style.cssText = `left:${a.left + a.width / 2 - size / 2}px;top:${a.top + a.height / 2 - size / 2}px;width:${size}px;height:${size}px`;
  el.innerHTML = `<img src="${img.currentSrc || img.src}" alt="">`;
  document.body.appendChild(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  requestAnimationFrame(() => {
    el.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
    el.style.opacity = '0.4';
  });
  setTimeout(() => el.remove(), 800);
}

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const open = useApp((s) => s.open);
  const showToast = useApp((s) => s.showToast);
  const add = useCartStore((s) => s.add);
  const { qtyOf } = useCart();
  const imgRef = useRef<HTMLDivElement>(null);
  const inCart = qtyOf(p.id);
  const needsChoice = p.variants.length > 0 || p.colors.length > 0;

  const onAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!p.in_stock) return;
    if (needsChoice) return open({ type: 'product', id: p.id });
    haptic.medium();
    flyToCart(imgRef.current);
    add(p.id);
    showToast(`✓ ${t.added}`);
  };

  return (
    <div className="pcard" style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }} onClick={() => open({ type: 'product', id: p.id })}>
      <div ref={imgRef}>
        <Img id={p.image_id} frame={p.frame} alt={pName(p, lang)} />
      </div>
      <div className="badges">
        {p.badge === 'hit' && <span className="badge badge-hit">🔥 HIT</span>}
        {p.badge === 'new' && <span className="badge badge-new">NEW</span>}
        {(p.badge === 'sale' || (p.old_price && p.old_price > p.price)) && <span className="badge badge-sale">SALE</span>}
      </div>
      {!p.in_stock && <div className="out-of-stock">{t.out_of_stock}</div>}
      <div className="pcard-body">
        <h3>{pName(p, lang)}</h3>
        <small>{pUnit(p, lang)}</small>
        <div className="pcard-foot">
          <span className="price">
            {p.variants.length > 1 ? `${won(Math.min(...p.variants.map((v) => v.price)))}~` : won(p.price)}
          </span>
          <button className={cx('add-btn', inCart > 0 && 'in')} onClick={onAdd} aria-label={t.add}>
            {inCart > 0 ? inCart : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}
