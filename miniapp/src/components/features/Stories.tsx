'use client';
// Storylar qatori va to'liq ekran ko'rish
import { useEffect, useRef, useState } from 'react';
import { Img, useT } from '@/components/ui';
import { useApp } from '@/store/appStore';
import { useBackButton, haptic } from '@/hooks/useTelegram';
import { won, cx } from '@/lib/utils';

const DURATION = 5000;
const SEEN_KEY = 'ts-seen-stories';

function getSeen(): number[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
}

export function StoriesRow() {
  const stories = useApp((s) => s.data?.stories || []);
  const story = useApp((s) => s.story);
  const set = useApp((s) => s.set);
  const [seen, setSeen] = useState<number[]>([]);
  useEffect(() => setSeen(getSeen()), [story]);
  if (!stories.length) return null;
  return (
    <div className="stories hidden-scroll">
      {stories.map((s, i) => (
        <button key={s.id} className={cx('story', seen.includes(s.id) && 'seen')} onClick={() => { haptic.tap(); set({ story: i }); }}>
          <div className="story-ring">
            <Img id={s.cover_id} frame={s.image_id ? null : s.product_frame} />
          </div>
          <span>{s.title}</span>
        </button>
      ))}
    </div>
  );
}

export function StoryViewer() {
  const t = useT();
  const stories = useApp((s) => s.data?.stories || []);
  const products = useApp((s) => s.data?.products || []);
  const index = useApp((s) => s.story);
  const set = useApp((s) => s.set);
  const open = useApp((s) => s.open);
  const [progress, setProgress] = useState(0);
  const paused = useRef(false);
  const close = () => set({ story: null });
  useBackButton(index !== null, close);

  const s = index !== null ? stories[index] : null;

  useEffect(() => {
    if (!s) return;
    const seen = getSeen();
    if (!seen.includes(s.id)) {
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, s.id].slice(-100)));
      } catch {}
    }
    setProgress(0);
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const tick = (now: number) => {
      if (!paused.current) acc += now - last;
      last = now;
      const p = Math.min(1, acc / DURATION);
      setProgress(p);
      if (p >= 1) return go(1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (d: number) => {
    if (index === null) return;
    const n = index + d;
    if (n < 0) return setProgress(0);
    if (n >= stories.length) return close();
    set({ story: n });
  };

  if (!s) return null;
  const product = products.find((p) => p.id === s.product_id);
  return (
    <div
      className="story-viewer"
      onPointerDown={() => (paused.current = true)}
      onPointerUp={() => (paused.current = false)}
      onPointerLeave={() => (paused.current = false)}
    >
      <Img id={s.cover_id} frame={s.image_id ? null : s.product_frame} eager />
      <div className="story-shade" />
      <div className="story-bars">
        {stories.map((x, i) => (
          <i key={x.id}><b style={{ width: `${i < index! ? 100 : i === index ? progress * 100 : 0}%` }} /></i>
        ))}
      </div>
      <div className="story-top">
        <img src="/images/logo.png" alt="" />
        <b>Tayyor & Sweet</b>
        <button className="story-close" onClick={close} aria-label="close">×</button>
      </div>
      <div className="story-tap left" onClick={() => go(-1)} />
      <div className="story-tap right" onClick={() => go(1)} />
      <div className="story-bottom">
        <h3>{s.title}</h3>
        {s.text && <p>{s.text}</p>}
        {product && (
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              close();
              open({ type: 'product', id: product.id });
            }}
          >
            {t.order_now} · {won(product.price)}
          </button>
        )}
      </div>
    </div>
  );
}
