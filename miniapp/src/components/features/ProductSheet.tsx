'use client';
// Mahsulot oynasi: galereya + kattalashtirish, o'lcham va rang variantlari, o'lcham jadvali
import { useEffect, useRef, useState } from 'react';
import { Img, Qty, Sheet, Icon, useT } from '@/components/ui';
import { useApp } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { haptic, useBackButton } from '@/hooks/useTelegram';
import { imageUrl } from '@/lib/api';
import { won, pName, pUnit, pDesc, cx } from '@/lib/utils';
import { flyToCart } from './ProductCard';

export function ImageZoom({ src, onClose }: { src: string; onClose: () => void }) {
  const t = useT();
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const lastTap = useRef(0);
  useBackButton(true, onClose);

  const dist = (e: React.TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) pinch.current = { d: dist(e), s: scale };
    else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 280) toggle();
      lastTap.current = now;
      drag.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: pos.x, py: pos.y };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      setScale(Math.min(4, Math.max(1, (pinch.current.s * dist(e)) / pinch.current.d)));
    } else if (e.touches.length === 1 && drag.current && scale > 1) {
      setPos({ x: drag.current.px + e.touches[0].clientX - drag.current.x, y: drag.current.py + e.touches[0].clientY - drag.current.y });
    }
  };
  const onTouchEnd = () => {
    pinch.current = null;
    drag.current = null;
    if (scale <= 1.02) setPos({ x: 0, y: 0 });
  };
  const toggle = () => {
    setScale((s) => (s > 1 ? 1 : 2.5));
    setPos({ x: 0, y: 0 });
  };

  return (
    <div className="zoom" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onDoubleClick={toggle}>
      <button className="icon-btn" onClick={onClose}><Icon.close /></button>
      <img src={src} alt="" style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }} />
      <div className="zoom-tip">{t.zoom_tip}</div>
    </div>
  );
}

export function ProductSheet() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const overlay = useApp((s) => s.overlay);
  const close = useApp((s) => s.close);
  const data = useApp((s) => s.data);
  const showToast = useApp((s) => s.showToast);
  const add = useCartStore((s) => s.add);
  const id = overlay?.type === 'product' ? overlay.id : null;
  const p = data?.products.find((x) => x.id === id) || null;

  const [variant, setVariant] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!p) return;
    // Standart o'lcham — asosiy narxga teng bo'lgani
    setVariant(p.variants.find((v) => v.price === p.price)?.name || p.variants[0]?.name || null);
    setColor(p.colors[0]?.name || null);
    setQty(1);
    setImg(0);
    setShowTable(false);
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const images = p ? [p.image_id, ...(p.gallery || [])].filter(Boolean) as number[] : [];
  const price = p ? p.variants.find((v) => v.name === variant)?.price ?? p.price : 0;

  const onAdd = () => {
    if (!p) return;
    haptic.success();
    flyToCart(galleryRef.current);
    add(p.id, { variant, color, qty });
    showToast(`✓ ${t.added}`);
    setTimeout(close, 250);
  };

  return (
    <Sheet
      open={!!p}
      paused={zoom}
      onClose={close}
      footer={
        p && !zoom && (
          <div className="row">
            <Qty value={qty} onChange={(v) => setQty(Math.max(1, Math.min(99, v)))} />
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!p.in_stock} onClick={onAdd}>
              {p.in_stock ? `${t.add_to_cart} · ${won(price * qty)}` : t.out_of_stock}
            </button>
          </div>
        )
      }
    >
      {p && (
        <>
          <div className="gallery" ref={galleryRef} onClick={() => setZoom(true)}>
            <Img id={images[img]} frame={img === 0 ? p.frame : null} alt={pName(p, lang)} eager />
            <span className="zoom-hint">{t.tap_zoom}</span>
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((im, k) => (
                <button key={im} className={k === img ? 'on' : ''} onClick={() => setImg(k)}>
                  <Img id={im} />
                </button>
              ))}
            </div>
          )}
          <div className="sheet-body">
            <h2 className="p-title">{pName(p, lang)}</h2>
            {pUnit(p, lang) && <div className="p-unit">{pUnit(p, lang)}</div>}
            <div className="p-price price">
              {won(price)}
              {p.old_price && p.old_price > p.price && <span className="old-price">{won(p.old_price)}</span>}
            </div>
            {pDesc(p, lang) && <p className="p-desc">{pDesc(p, lang)}</p>}

            {p.variants.length > 0 && (
              <>
                <div className="opt-title">
                  {t.size}
                  {p.size_table.length > 0 && <button onClick={() => setShowTable((s) => !s)}>📏 {t.size_table}</button>}
                </div>
                <div className="opts">
                  {p.variants.map((v) => (
                    <button key={v.name} className={cx('opt', v.name === variant && 'on')} onClick={() => { haptic.select(); setVariant(v.name); }}>
                      <b>{v.name}</b>
                      <small>{won(v.price)}</small>
                    </button>
                  ))}
                </div>
              </>
            )}

            {p.size_table.length > 0 && (showTable || p.variants.length === 0) && (
              <>
                {p.variants.length === 0 && <div className="opt-title">📏 {t.size_table}</div>}
                <table className="size-table" style={{ marginTop: 10 }}>
                  <thead>
                    <tr><th>{t.size}</th><th>{t.diameter}</th><th>{t.weight}</th><th>{t.servings}</th></tr>
                  </thead>
                  <tbody>
                    {p.size_table.map((r, k) => (
                      <tr key={k}><td><b>{r.size}</b></td><td>{r.diameter || '—'}</td><td>{r.weight || '—'}</td><td>{r.servings || '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {p.colors.length > 0 && (
              <>
                <div className="opt-title">{t.color}: <span className="muted" style={{ fontWeight: 500 }}>{color}</span></div>
                <div className="opts">
                  {p.colors.map((c) => (
                    <button
                      key={c.name}
                      title={c.name}
                      className={cx('swatch', c.name === color && 'on')}
                      style={{ background: c.hex }}
                      onClick={() => { haptic.select(); setColor(c.name); }}
                    />
                  ))}
                </div>
              </>
            )}

            {p.preorder_days > 0 && (
              <div className="note">
                <span>⏰</span>
                <span>{t.preorder(p.preorder_days)}</span>
              </div>
            )}
          </div>
        </>
      )}
      {zoom && p && <ImageZoom src={imageUrl(images[img])} onClose={() => setZoom(false)} />}
    </Sheet>
  );
}
