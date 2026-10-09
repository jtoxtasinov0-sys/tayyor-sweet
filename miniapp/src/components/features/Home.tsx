'use client';
// Bosh sahifa: sarlavha, bezak shakl, storylar, karusel, kategoriyalar, mahsulotlar
import { useEffect, useRef, useState } from 'react';
import { Img, Icon, useT } from '@/components/ui';
import { DecorShape } from '@/components/layout';
import { useApp } from '@/store/appStore';
import { useTelegram, haptic } from '@/hooks/useTelegram';
import { cName, pName, cx } from '@/lib/utils';
import { StoriesRow } from './Stories';
import { ProductCard } from './ProductCard';

function Carousel() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const banners = useApp((s) => s.data?.banners || []);
  const products = useApp((s) => s.data?.products || []);
  const open = useApp((s) => s.open);
  const set = useApp((s) => s.set);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Avtomatik aylantirish
  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      const el = track.current;
      if (!el) return;
      const next = (active + 1) % banners.length;
      el.scrollTo({ left: (el.children[next] as HTMLElement).offsetLeft - 16, behavior: 'smooth' });
    }, 4000);
    return () => clearInterval(id);
  }, [active, banners.length]);

  if (!banners.length) return null;
  return (
    <div className="carousel">
      <div
        className="carousel-track hidden-scroll"
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const w = (el.children[0] as HTMLElement)?.offsetWidth + 12;
          setActive(Math.round(el.scrollLeft / w));
        }}
      >
        {banners.map((b) => {
          const p = products.find((x) => x.id === b.product_id);
          return (
            <div
              key={b.id}
              className="slide"
              onClick={() => {
                haptic.tap();
                if (p) open({ type: 'product', id: p.id });
                else if (b.category_id) set({ tab: 'catalog', categoryId: b.category_id });
              }}
            >
              <Img id={b.cover_id} frame={b.image_id ? null : p?.frame} />
              <div className="slide-text">
                {b.title && <small>{b.title}</small>}
                <h3>{p ? pName(p, lang) : b.subtitle}</h3>
                {p && b.subtitle && <p>{b.subtitle}</p>}
                <span className="btn btn-primary">{t.order_now}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="dots">{banners.map((b, i) => <i key={b.id} className={i === active ? 'on' : ''} />)}</div>
    </div>
  );
}

export function CategoryChips() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const cats = useApp((s) => s.data?.categories || []);
  const categoryId = useApp((s) => s.categoryId);
  const set = useApp((s) => s.set);
  return (
    <div className="chips hidden-scroll">
      <button className={cx('chip', categoryId === null && 'active')} onClick={() => { haptic.select(); set({ categoryId: null }); }}>
        ✨ {t.all}
      </button>
      {cats.map((c) => (
        <button key={c.id} className={cx('chip', categoryId === c.id && 'active')} onClick={() => { haptic.select(); set({ categoryId: c.id }); }}>
          {c.emoji} {cName(c, lang)}
        </button>
      ))}
    </div>
  );
}

export function Home() {
  const t = useT();
  const { user } = useTelegram();
  const data = useApp((s) => s.data)!;
  const lang = useApp((s) => s.lang);
  const me = useApp((s) => s.me);
  const categoryId = useApp((s) => s.categoryId);
  const set = useApp((s) => s.set);
  const products = data.products.filter((p) => categoryId === null || p.category_id === categoryId);
  const name = user?.first_name || me?.first_name || '';
  const announcement = lang === 'ru' ? data.app?.announcement_ru || data.app?.announcement_uz : data.app?.announcement_uz;

  return (
    <div className="page">
      <div className="home-hero">
        <DecorShape />
        <div className="header">
          <Img src="/images/logo.png" className="header-logo" />
          <div>
            <small>{t.hello}{name ? `, ${name}` : ''} 👋</small>
            <h1>{data.shop.name}</h1>
          </div>
        </div>
        <button className="search" onClick={() => set({ tab: 'catalog' })}>
          <Icon.search />
          <span>{t.search}</span>
        </button>
        {announcement && <div className="announce">📣 {announcement}</div>}
      </div>

      <StoriesRow />
      <Carousel />

      <div className="section-title"><h2>{t.categories}</h2></div>
      <CategoryChips />

      <div className="section-title" style={{ marginTop: 16 }} />
      <div className="grid">
        {products.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
    </div>
  );
}

export function Catalog() {
  const t = useT();
  const data = useApp((s) => s.data)!;
  const lang = useApp((s) => s.lang);
  const query = useApp((s) => s.query);
  const categoryId = useApp((s) => s.categoryId);
  const set = useApp((s) => s.set);
  const [sort, setSort] = useState<'default' | 'cheap' | 'expensive'>('default');
  const q = query.trim().toLowerCase();
  let list = data.products.filter(
    (p) =>
      (categoryId === null || p.category_id === categoryId) &&
      (!q || [p.name_uz, p.name_ru, p.description_uz].some((s) => s?.toLowerCase().includes(q)))
  );
  if (sort !== 'default') list = [...list].sort((a, b) => (sort === 'cheap' ? a.price - b.price : b.price - a.price));

  return (
    <div className="page">
      <div className="home-hero">
        <DecorShape />
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{t.catalog}</h1>
        <label className="search">
          <Icon.search />
          <input autoFocus={false} value={query} placeholder={t.search} onChange={(e) => set({ query: e.target.value })} />
          {query && <button onClick={() => set({ query: '' })}><Icon.close /></button>}
        </label>
      </div>
      <div style={{ height: 12 }} />
      <CategoryChips />
      <div className="row" style={{ margin: '14px 0 12px' }}>
        <span className="muted">{list.length} ta</span>
        <span className="spacer" />
        <select className="chip" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ border: 0 }}>
          <option value="default">↕︎ {lang === 'ru' ? 'По умолчанию' : 'Tartib'}</option>
          <option value="cheap">{lang === 'ru' ? 'Сначала дешевле' : 'Arzonroq'}</option>
          <option value="expensive">{lang === 'ru' ? 'Сначала дороже' : 'Qimmatroq'}</option>
        </select>
      </div>
      <div className="grid">
        {list.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
      {!list.length && <div className="empty"><div className="emoji">🔍</div><p>{lang === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}</p></div>}
    </div>
  );
}
