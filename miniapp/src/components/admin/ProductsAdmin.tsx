'use client';
// 3. Mahsulotlar: ro'yxat, tahrirlash, rasm ramkasi, tezkor o'lchamlar, ranglar, o'lcham jadvali, story
import { useRef, useState } from 'react';
import { useAdminApi, useLoad, Drawer, Field, Switch, ImageInput, imgSrc } from './common';
import { Img, Spinner } from '@/components/ui';
import { won, cx, copyText } from '@/lib/utils';
import type { Category, Frame, Product } from '@/lib/types';

// Tezkor o'lcham tugmalari
const SIZE_PRESETS: { name: string; k: number }[] = [
  { name: "1 bo'lak", k: 0.15 },
  { name: 'Mini', k: 0.7 },
  { name: 'Kichik (16 sm)', k: 0.7 },
  { name: "O'rta (20 sm)", k: 1 },
  { name: 'Katta (24 sm)', k: 1.3 },
  { name: '1 kg', k: 1 },
  { name: '0.5 kg', k: 0.5 },
  { name: '10 dona', k: 1 },
  { name: '20 dona', k: 2 },
];
const UNIT_PRESETS = ["1 bo'lak", '2 dona', '4 dona', '10 dona', '1 kg', 'butun tort', '1 porsiya', '1 stakan', '20 sm'];
const COLOR_PRESETS = [
  { name: 'Oq', hex: '#FFFFFF' },
  { name: 'Pushti', hex: '#F8A0D0' },
  { name: 'Shokoladli', hex: '#5B3A29' },
  { name: 'Qizil', hex: '#D6455D' },
  { name: 'Moviy', hex: '#8EC5FF' },
  { name: 'Oltin', hex: '#E6C068' },
];
const round500 = (n: number) => Math.max(500, Math.round(n / 500) * 500);

const EMPTY: Partial<Product> = {
  name_uz: '', name_ru: '', unit_uz: '', unit_ru: '', description_uz: '', description_ru: '',
  price: 0, old_price: null, category_id: null, image_id: null, gallery: [], frame: { x: 50, y: 50, zoom: 1 },
  variants: [], colors: [], size_table: [], badge: null, preorder_days: 0, in_stock: true, active: true, sort: 0,
};

export function ProductsAdmin() {
  const { send, call, toast } = useAdminApi();
  const { data: products, loading, reload } = useLoad<Product[]>('/products');
  const { data: cats } = useLoad<Category[]>('/categories');
  const [edit, setEdit] = useState<Partial<Product> | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('');
  const [priceList, setPriceList] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const list = (products || []).filter(
    (p) => (!q || p.name_uz.toLowerCase().includes(q.toLowerCase())) && (!cat || String(p.category_id) === cat)
  );

  const runImport = async () => {
    setImporting(true);
    try {
      const r = await send<{ created: unknown[]; skipped: unknown[] }>('/import-folder', 'POST');
      toast(`📁 ${r.created.length} ta yangi mahsulot, ${r.skipped.length} ta oldin bor edi`);
      reload();
    } finally {
      setImporting(false);
    }
  };

  const showPrices = async () => {
    const r = await call<{ text: string }>('/price-list');
    setPriceList(r.text.replace(/<[^>]+>/g, ''));
  };

  return (
    <>
      <div className="toolbar">
        <input className="input" placeholder="🔎 Qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {cats?.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name_uz}</option>)}
        </select>
        <span className="spacer" />
        <button className="btn btn-soft btn-sm" onClick={showPrices}>📋 Narxlar jadvali</button>
        <button className="btn btn-soft btn-sm" disabled={importing} onClick={runImport}>{importing ? '...' : '📁 Papkadan yuklash'}</button>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({ ...EMPTY })}>+ Yangi mahsulot</button>
      </div>

      {loading && !products ? (
        <Spinner />
      ) : (
        <div className="pgrid">
          {list.map((p) => (
            <button key={p.id} className={cx('pitem', !p.active && 'off')} onClick={() => setEdit(p)}>
              <Img id={p.image_id} frame={p.frame} />
              <div className="flags">
                {!p.active && <span className="badge badge-sale">Yashirin</span>}
                {!p.in_stock && <span className="badge badge-hit">Tugagan</span>}
                {p.badge && <span className="badge badge-new">{p.badge.toUpperCase()}</span>}
              </div>
              <div className="b">
                <b>{p.name_uz}</b>
                <span className="price">{won(p.price)}</span>
                <span className="muted" style={{ fontSize: 12 }}> · {p.category_name || '—'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {edit && (
        <ProductEditor
          initial={edit}
          cats={cats || []}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            reload();
          }}
        />
      )}

      {priceList !== null && (
        <Drawer
          title="📋 Narxlar jadvali"
          onClose={() => setPriceList(null)}
          footer={<button className="btn btn-primary btn-sm" onClick={async () => { await copyText(priceList); toast('✓ Nusxa olindi'); }}>Nusxa olish</button>}
        >
          <p className="muted" style={{ marginTop: 0 }}>Bot&apos;dagi /narxlar buyrug&apos;i ham shu jadvalni yuboradi.</p>
          <div className="pre">{priceList}</div>
        </Drawer>
      )}
    </>
  );
}

// Rasm ramkasini sozlash: fokus nuqtani bosib/sudrab tanlash + zoom
function FrameEditor({ imageId, frame, onChange }: { imageId: number; frame: Frame; onChange: (f: Frame) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const setFrom = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)));
    onChange({ ...frame, x, y });
  };
  return (
    <div className="box">
      <h4>🖼 Rasm ramkasi <span className="muted" style={{ fontWeight: 500 }}>— rasmning asosiy qismini bosing</span></h4>
      <div className="frame-editor">
        <div>
          <div
            className="frame-stage"
            ref={stage}
            onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); setFrom(e); }}
            onPointerMove={(e) => dragging.current && setFrom(e)}
            onPointerUp={() => (dragging.current = false)}
          >
            <img src={imgSrc(imageId)} alt="" />
            <span className="frame-dot" style={{ left: `${frame.x}%`, top: `${frame.y}%` }} />
          </div>
          <label className="label">Kattalashtirish: {frame.zoom.toFixed(2)}×</label>
          <input className="range" type="range" min={1} max={2.5} step={0.05} value={frame.zoom} onChange={(e) => onChange({ ...frame, zoom: Number(e.target.value) })} />
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onChange({ x: 50, y: 50, zoom: 1 })}>↺ Asl holat</button>
        </div>
        <div className="frame-previews">
          <Img id={imageId} frame={frame} />
          <span>Karta</span>
          <Img id={imageId} frame={frame} className="round" />
          <span>Story</span>
          <Img id={imageId} frame={frame} className="wide" />
          <span>Banner</span>
        </div>
      </div>
    </div>
  );
}

function ProductEditor({ initial, cats, onClose, onSaved }: { initial: Partial<Product>; cats: Category[]; onClose: () => void; onSaved: () => void }) {
  const { send, toast } = useAdminApi();
  const [p, setP] = useState<Partial<Product>>({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const up = <K extends keyof Product>(k: K, v: Product[K] | null) => setP((s) => ({ ...s, [k]: v }));
  const isNew = !initial.id;

  const save = async () => {
    if (!p.name_uz?.trim()) return toast('⚠️ Nomini kiriting');
    setBusy(true);
    try {
      if (isNew) await send('/products', 'POST', p);
      else await send(`/products/${initial.id}`, 'PATCH', p);
      toast('✅ Saqlandi');
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`"${p.name_uz}" o'chirilsinmi? Buni qaytarib bo'lmaydi.`)) return;
    await send(`/products/${initial.id}`, 'DELETE');
    toast("🗑 O'chirildi");
    onSaved();
  };

  const toStory = async () => {
    await send(`/products/${initial.id}/story`, 'POST');
    toast("📸 Story qo'shildi");
  };

  const variants = p.variants || [];
  const colors = p.colors || [];
  const table = p.size_table || [];

  return (
    <Drawer
      title={isNew ? 'Yangi mahsulot' : p.name_uz}
      onClose={onClose}
      footer={
        <>
          {!isNew && <button className="btn btn-ghost btn-sm" onClick={remove}>🗑</button>}
          {!isNew && <button className="btn btn-soft btn-sm" onClick={toStory}>📸 Story qilish</button>}
          <span className="spacer" />
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>💾 Saqlash</button>
        </>
      }
    >
      <div className="box" style={{ marginTop: 0 }}>
        <h4>📷 Rasmlar</h4>
        <div className="img-pick">
          <ImageInput value={p.image_id ?? null} onChange={(id) => up('image_id', id)} size={96} />
          {(p.gallery || []).map((g) => (
            <div key={g} className="frame">
              <img src={imgSrc(g)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button className="rm" onClick={() => up('gallery', (p.gallery || []).filter((x) => x !== g))}>×</button>
            </div>
          ))}
          <ImageInput value={null} onChange={(id) => id && up('gallery', [...(p.gallery || []), id])} />
        </div>
        <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>Birinchisi — asosiy rasm, qolganlari galereya.</p>
      </div>

      {p.image_id && <FrameEditor imageId={p.image_id} frame={p.frame || { x: 50, y: 50, zoom: 1 }} onChange={(f) => up('frame', f)} />}

      <div className="box">
        <h4>📝 Asosiy</h4>
        <div className="fgrid">
          <Field label="Nomi (o'zbekcha) *"><input className="input" value={p.name_uz || ''} onChange={(e) => up('name_uz', e.target.value)} /></Field>
          <Field label="Nomi (ruscha)"><input className="input" value={p.name_ru || ''} onChange={(e) => up('name_ru', e.target.value)} /></Field>
          <Field label="Kategoriya">
            <select className="select" value={p.category_id ?? ''} onChange={(e) => up('category_id', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name_uz}</option>)}
            </select>
          </Field>
          <Field label="Belgi">
            <select className="select" value={p.badge || ''} onChange={(e) => up('badge', (e.target.value || null) as Product['badge'])}>
              <option value="">—</option>
              <option value="hit">🔥 HIT</option>
              <option value="new">✨ NEW</option>
              <option value="sale">🏷 SALE</option>
            </select>
          </Field>
          <Field label="Narxi (₩) *"><input className="input" type="number" step={500} value={p.price ?? 0} onChange={(e) => up('price', Number(e.target.value))} /></Field>
          <Field label="Eski narx (chegirma uchun)"><input className="input" type="number" step={500} value={p.old_price ?? ''} onChange={(e) => up('old_price', e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="O'lchov / miqdor (uz)">
            <input className="input" value={p.unit_uz || ''} onChange={(e) => up('unit_uz', e.target.value)} />
            <div className="presets">{UNIT_PRESETS.map((u) => <button key={u} onClick={() => up('unit_uz', u)}>{u}</button>)}</div>
          </Field>
          <Field label="O'lchov / miqdor (ru)"><input className="input" value={p.unit_ru || ''} onChange={(e) => up('unit_ru', e.target.value)} /></Field>
          <Field label="Tavsif (uz)" full><textarea className="textarea" value={p.description_uz || ''} onChange={(e) => up('description_uz', e.target.value)} /></Field>
          <Field label="Tavsif (ru)" full><textarea className="textarea" value={p.description_ru || ''} onChange={(e) => up('description_ru', e.target.value)} /></Field>
          <Field label="Necha kun oldin buyurtma (0 = darhol)"><input className="input" type="number" min={0} value={p.preorder_days ?? 0} onChange={(e) => up('preorder_days', Number(e.target.value))} /></Field>
          <Field label="Tartib raqami"><input className="input" type="number" value={p.sort ?? 0} onChange={(e) => up('sort', Number(e.target.value))} /></Field>
        </div>
        <div className="row" style={{ marginTop: 14, gap: 20, flexWrap: 'wrap' }}>
          <Switch checked={!!p.active} onChange={(v) => up('active', v)} label="Ko'rinadi" />
          <Switch checked={!!p.in_stock} onChange={(v) => up('in_stock', v)} label="Mavjud" />
        </div>
      </div>

      <div className="box">
        <h4>📏 O&apos;lchamlar (narx variantlari)</h4>
        {variants.map((v, i) => (
          <div className="list-row" key={i} style={{ gridTemplateColumns: '1fr 130px 36px' }}>
            <input className="input" value={v.name} placeholder="Nomi" onChange={(e) => up('variants', variants.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
            <input className="input" type="number" step={500} value={v.price} onChange={(e) => up('variants', variants.map((x, k) => (k === i ? { ...x, price: Number(e.target.value) } : x)))} />
            <button className="x-btn" onClick={() => up('variants', variants.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
        <div className="presets">
          {SIZE_PRESETS.filter((s) => !variants.some((v) => v.name === s.name)).map((s) => (
            <button key={s.name} onClick={() => up('variants', [...variants, { name: s.name, price: round500((p.price || 0) * s.k) }])}>+ {s.name}</button>
          ))}
          <button onClick={() => up('variants', [...variants, { name: '', price: p.price || 0 }])}>+ Boshqa</button>
        </div>
      </div>

      <div className="box">
        <h4>🎨 Rang variantlari (bezak)</h4>
        {colors.map((c, i) => (
          <div className="list-row" key={i} style={{ gridTemplateColumns: '48px 1fr 36px' }}>
            <input type="color" value={c.hex} style={{ width: 44, height: 40, border: 0, background: 'none' }} onChange={(e) => up('colors', colors.map((x, k) => (k === i ? { ...x, hex: e.target.value } : x)))} />
            <input className="input" value={c.name} onChange={(e) => up('colors', colors.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
            <button className="x-btn" onClick={() => up('colors', colors.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
        <div className="presets">
          {COLOR_PRESETS.filter((c) => !colors.some((x) => x.name === c.name)).map((c) => (
            <button key={c.name} onClick={() => up('colors', [...colors, c])}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 9, background: c.hex, border: '1px solid #ccc', marginRight: 4 }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="box">
        <h4>📐 O&apos;lcham jadvali</h4>
        {table.length > 0 && (
          <div className="list-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 36px', fontSize: 12, color: 'var(--muted)' }}>
            <span>O&apos;lcham</span><span>Diametr</span><span>Og&apos;irlik</span><span>Kishi</span><span />
          </div>
        )}
        {table.map((r, i) => (
          <div className="list-row" key={i} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 36px' }}>
            {(['size', 'diameter', 'weight', 'servings'] as const).map((f) => (
              <input key={f} className="input" value={r[f] || ''} onChange={(e) => up('size_table', table.map((x, k) => (k === i ? { ...x, [f]: e.target.value } : x)))} />
            ))}
            <button className="x-btn" onClick={() => up('size_table', table.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
        <div className="presets">
          <button onClick={() => up('size_table', [...table, { size: '', diameter: '', weight: '', servings: '' }])}>+ Qator</button>
          {variants.length > 0 && (
            <button onClick={() => up('size_table', variants.map((v) => table.find((r) => r.size === v.name) || { size: v.name, diameter: '', weight: '', servings: '' }))}>
              ⇣ O&apos;lchamlardan to&apos;ldirish
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
