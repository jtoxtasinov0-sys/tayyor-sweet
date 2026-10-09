'use client';
// Splash, onboarding, pastki navigatsiya, bezak shakl
import { useEffect, useState } from 'react';
import { useApp, type Tab } from '@/store/appStore';
import { useCart } from '@/hooks/useCart';
import { useCartStore } from '@/store/cartStore';
import { haptic } from '@/hooks/useTelegram';
import { Icon, useT } from '@/components/ui';
import { cx } from '@/lib/utils';

export function Splash({ done }: { done: boolean }) {
  const data = useApp((s) => s.data);
  const [hide, setHide] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t1 = setTimeout(() => setHide(true), 350);
    const t2 = setTimeout(() => setGone(true), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [done]);
  if (gone) return null;
  return (
    <div className={cx('splash', hide && 'out')}>
      <div className="splash-inner">
        <img className="splash-logo" src="/images/logo.png" alt="logo" />
        <h1>{data?.shop.name || 'Tayyor & Sweet'}</h1>
        <p>{data?.shop.title || 'Korea yarimtayyor maxsulotlar'}</p>
        <div className="splash-dots"><i /><i /><i /></div>
      </div>
    </div>
  );
}

const ONB_KEY = 'ts-onboarded';

export function Onboarding() {
  const t = useT();
  const enabled = useApp((s) => s.data?.app?.onboarding !== false);
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(ONB_KEY));
    } catch {}
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(ONB_KEY, '1');
    } catch {}
    haptic.success();
    setShow(false);
  };
  if (!show || !enabled) return null;
  const s = t.onb[i];
  const last = i === t.onb.length - 1;
  return (
    <div className="onb">
      <button className="onb-skip" onClick={finish}>{t.skip}</button>
      <div className="onb-slide" key={i}>
        <div className="onb-art">{s.e}</div>
        <h2>{s.t}</h2>
        <p>{s.d}</p>
      </div>
      <div className="onb-dots">{t.onb.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      <button
        className="btn btn-primary btn-block"
        onClick={() => {
          haptic.tap();
          if (last) finish();
          else setI(i + 1);
        }}
      >
        {last ? t.start : t.next}
      </button>
    </div>
  );
}

export function DecorShape() {
  return (
    <>
      <div className="decor decor-blob" />
      <div className="decor decor-ring" />
    </>
  );
}

export function BottomNavigation() {
  const t = useT();
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const { count } = useCart();
  const bump = useCartStore((s) => s.bump);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    if (!bump) return;
    setAnim(true);
    const id = setTimeout(() => setAnim(false), 450);
    return () => clearTimeout(id);
  }, [bump]);

  const items: { id: Tab; label: string; icon: () => React.JSX.Element }[] = [
    { id: 'home', label: t.home, icon: Icon.home },
    { id: 'catalog', label: t.catalog, icon: Icon.grid },
    { id: 'cart', label: t.cart, icon: Icon.bag },
    { id: 'orders', label: t.orders, icon: Icon.box },
    { id: 'profile', label: t.profile, icon: Icon.user },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(({ id, label, icon: I }) => (
        <button
          key={id}
          id={id === 'cart' ? 'cart-target' : undefined}
          className={cx('nav-item', tab === id && 'active', id === 'cart' && anim && 'bump')}
          onClick={() => {
            haptic.select();
            setTab(id);
          }}
        >
          <I />
          {label}
          {id === 'cart' && count > 0 && <span className="nav-badge">{count}</span>}
        </button>
      ))}
    </nav>
  );
}
