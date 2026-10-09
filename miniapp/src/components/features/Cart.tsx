'use client';
// Savat: mahsulotlar, qo'shimcha taklif (upsell), bepul yetkazishgacha qolgan summa
import { Img, Qty, Empty, useT } from '@/components/ui';
import { DecorShape } from '@/components/layout';
import { useApp } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { useCart } from '@/hooks/useCart';
import { haptic } from '@/hooks/useTelegram';
import { won, pName, pUnit } from '@/lib/utils';

function Upsell() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const products = useApp((s) => s.data?.products || []);
  const showToast = useApp((s) => s.showToast);
  const add = useCartStore((s) => s.add);
  const { items } = useCart();
  const inCart = new Set(items.map((i) => i.product_id));
  const cats = new Set(items.map((i) => i.product.category_id));
  // Savatdagilardan boshqa kategoriyadagi arzonroq mahsulotlar — "choyga qo'shimcha"
  const list = products
    .filter((p) => p.in_stock && !inCart.has(p.id) && p.variants.length === 0 && p.colors.length === 0)
    .sort((a, b) => Number(cats.has(a.category_id)) - Number(cats.has(b.category_id)) || a.price - b.price)
    .slice(0, 8);
  if (!list.length) return null;
  return (
    <>
      <div className="section-title"><h2 style={{ fontSize: 17 }}>{t.upsell}</h2></div>
      <div className="upsell hidden-scroll">
        {list.map((p) => (
          <div key={p.id} className="mini">
            <Img id={p.image_id} frame={p.frame} />
            <div className="b">
              <h5>{pName(p, lang)}</h5>
              <div className="row">
                <span className="price">{won(p.price)}</span>
                <button
                  className="add-btn"
                  onClick={() => {
                    haptic.medium();
                    add(p.id);
                    showToast(`✓ ${t.added}`);
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function Cart() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const delivery = useApp((s) => s.data?.delivery);
  const setTab = useApp((s) => s.setTab);
  const open = useApp((s) => s.open);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const { items, subtotal, count } = useCart();

  if (!items.length) {
    return (
      <div className="page">
        <Empty emoji="🧁" title={t.cart_empty} text={t.cart_empty_text} action={<button className="btn btn-primary" onClick={() => setTab('home')}>{t.go_shop}</button>} />
      </div>
    );
  }

  const freeFrom = Number(delivery?.free_from || 0);
  const left = Math.max(0, freeFrom - subtotal);

  return (
    <div className="page">
      <div className="home-hero">
        <DecorShape />
        <div className="row">
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>{t.cart}</h1>
          <span className="muted">· {count}</span>
          <span className="spacer" />
          <button className="muted" onClick={() => { haptic.tap(); clear(); }}>{t.clear}</button>
        </div>
      </div>
      <div style={{ height: 14 }} />
      {items.map((i, k) => (
        <div className="cart-item" key={i.key} style={{ animationDelay: `${k * 40}ms` }}>
          <div onClick={() => open({ type: 'product', id: i.product_id })}>
            <Img id={i.product.image_id} frame={i.product.frame} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <h4>{pName(i.product, lang)}</h4>
            <small>{[i.variant, i.color, !i.variant && pUnit(i.product, lang)].filter(Boolean).join(' · ')}</small>
            <div className="row" style={{ marginTop: 'auto', paddingTop: 6 }}>
              <span className="price">{won(i.price * i.qty)}</span>
              <span className="spacer" />
              <Qty small value={i.qty} onChange={(v) => { haptic.select(); setQty(i.key, v); }} />
            </div>
          </div>
        </div>
      ))}

      <Upsell />

      <div className="summary">
        <div className="line"><span className="muted">{t.subtotal}</span><b>{won(subtotal)}</b></div>
        {freeFrom > 0 && (
          <div className="progress-free">
            {left > 0 ? t.free_left(won(left)) : t.free_ok}
            <div className="bar"><i style={{ width: `${Math.min(100, (subtotal / freeFrom) * 100)}%` }} /></div>
          </div>
        )}
      </div>

      <div style={{ height: 70 }} />
      <div className="sticky-cta">
        <button className="btn btn-primary btn-block" onClick={() => { haptic.medium(); open({ type: 'checkout' }); }}>
          {t.checkout} · {won(subtotal)}
        </button>
      </div>
    </div>
  );
}
