'use client';
// 3b. Ombor: qoldiqlar, kirim/chiqim, sanoq, "kam qoldi" chegarasi, harakatlar tarixi
import { useState } from 'react';
import { useAdminApi, useLoad, Drawer } from './common';
import { Img, Spinner } from '@/components/ui';
import { cx, fmtDate } from '@/lib/utils';
import type { Frame } from '@/lib/types';

interface StockItem {
  id: number;
  name_uz: string;
  unit_uz: string | null;
  image_id: number | null;
  frame: Frame;
  stock: number | null;
  stock_min: number;
  in_stock: boolean;
  active: boolean;
  category_name: string | null;
  last_move_at: string | null;
}

type Reason = 'in' | 'out' | 'adjust' | 'order' | 'cancel';

interface Move {
  id: number;
  product_id: number;
  product_name: string;
  delta: number;
  balance: number;
  reason: Reason;
  order_number: string | null;
  note: string | null;
  created_at: string;
}

interface StockData {
  products: StockItem[];
  stats: { tracked: number; empty: number; low: number; units: number; in_today: number; out_today: number };
  moves: Move[];
}

type Level = 'none' | 'empty' | 'low' | 'ok';
type MoveType = 'in' | 'out' | 'set';

const level = (p: Pick<StockItem, 'stock' | 'stock_min'>): Level =>
  p.stock === null ? 'none' : p.stock <= 0 ? 'empty' : p.stock <= p.stock_min ? 'low' : 'ok';

const LEVEL: Record<Level, string> = {
  ok: '✅ Yetarli',
  low: '⚠️ Kam qoldi',
  empty: '⛔️ Tugagan',
  none: 'Hisob yuritilmaydi',
};

const REASON: Record<Reason, string> = {
  in: '⬆️ Kirim',
  out: '⬇️ Chiqim',
  adjust: '🧮 Sanoq',
  order: '🛒 Buyurtma',
  cancel: '↩️ Bekor qilindi',
};

const TYPES: { id: MoveType; label: string; hint: string }[] = [
  { id: 'in', label: '⬆️ Kirim', hint: "Omborga kelgan miqdor qoldiqqa qo'shiladi" },
  { id: 'out', label: '⬇️ Chiqim', hint: 'Buzilgan, sinovga yoki boshqa sabab bilan chiqqan miqdor ayiriladi' },
  { id: 'set', label: '🧮 Sanoq', hint: 'Sanab chiqqan aniq qoldiqni yozing — farqi tarixga yoziladi' },
];

const FILTERS: { id: Level | ''; label: string }[] = [
  { id: '', label: 'Hammasi' },
  { id: 'low', label: '⚠️ Kam qolgan' },
  { id: 'empty', label: '⛔️ Tugagan' },
  { id: 'ok', label: '✅ Yetarli' },
  { id: 'none', label: 'Hisobsiz' },
];

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

function Delta({ n }: { n: number }) {
  return <span className={cx('delta', n > 0 && 'plus', n < 0 && 'minus')}>{signed(n)}</span>;
}

export function StockAdmin({ onChange }: { onChange?: () => void }) {
  const { data, loading, reload } = useLoad<StockData>('/stock');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Level | ''>('');
  const [open, setOpen] = useState<{ id: number; type: MoveType } | null>(null);

  if (loading && !data) return <Spinner />;
  if (!data) return null;
  const s = data.stats;
  const list = data.products.filter(
    (p) => (!q || p.name_uz.toLowerCase().includes(q.toLowerCase())) && (!filter || level(p) === filter)
  );
  const current = open ? data.products.find((p) => p.id === open.id) : null;
  const saved = () => {
    reload();
    onChange?.();
  };

  const cards: { k: string; v: string | number; ic: string; f?: Level; hl?: boolean }[] = [
    { k: 'Hisobdagi mahsulotlar', v: s.tracked, ic: '🏬', hl: true },
    { k: 'Kam qolgan', v: s.low, ic: '⚠️', f: 'low' },
    { k: 'Tugagan', v: s.empty, ic: '⛔️', f: 'empty' },
    { k: 'Jami qoldiq', v: `${s.units} dona`, ic: '📦' },
    { k: 'Bugun kirim', v: signed(s.in_today), ic: '⬆️' },
    { k: 'Bugun chiqim', v: signed(-s.out_today), ic: '⬇️' },
  ];

  return (
    <>
      <div className="adm-grid adm-stats">
        {cards.map((c) => (
          <div
            key={c.k}
            className={cx('stat', c.hl && 'hl', c.f && 'click', c.f && filter === c.f && 'on')}
            onClick={c.f ? () => setFilter(filter === c.f ? '' : c.f!) : undefined}
          >
            <span className="ic">{c.ic}</span>
            <small>{c.k}</small>
            <b>{c.v}</b>
          </div>
        ))}
      </div>

      {s.tracked === 0 && (
        <div className="adm-card stock-tip">
          <b>💡 Ombor hisobini qanday boshlash kerak?</b>
          <p className="muted">
            Mahsulot qatoridagi <b>⬆️ Kirim</b> tugmasini bosing va hozir bor miqdorni yozing — shu mahsulot uchun hisob
            boshlanadi. Har bir buyurtmada qoldiq o&apos;zi kamayadi, buyurtma bekor qilinsa qaytadi, qoldiq tugasa mahsulot
            mini ilovada &quot;Tugagan&quot; bo&apos;ladi. Hisob yuritilmagan mahsulotlar (masalan, buyurtmaga tayyorlanadigan
            tortlar) avvalgidek sotilaveradi.
          </p>
        </div>
      )}

      <div className="toolbar" style={{ marginTop: 16 }}>
        <input className="input" placeholder="🔎 Mahsulot qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="tabs" style={{ margin: 0 }}>
          {FILTERS.map((f) => (
            <button key={f.id} className={cx('chip', filter === f.id && 'active')} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-card tbl-wrap">
        <table className="tbl stock-tbl">
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Qoldiq</th>
              <th className="hide-sm">Holat</th>
              <th className="hide-sm">Min</th>
              <th className="hide-sm">Oxirgi harakat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const lv = level(p);
              return (
                <tr key={p.id} className={cx('click', !p.active && 'off')} onClick={() => setOpen({ id: p.id, type: 'in' })}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <Img id={p.image_id} frame={p.frame} className="thumb" />
                      <div style={{ minWidth: 0 }}>
                        <b>{p.name_uz}</b>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {p.category_name || '—'}
                          {p.unit_uz ? ` · ${p.unit_uz}` : ''}
                          {!p.active ? ' · yashirin' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.stock === null ? <span className="muted">—</span> : <span className={cx('stock-num', `n-${lv}`)}>{p.stock}</span>}
                  </td>
                  <td className="hide-sm"><span className={`lvl lvl-${lv}`}>{LEVEL[lv]}</span></td>
                  <td className="hide-sm muted">{p.stock === null ? '—' : p.stock_min}</td>
                  <td className="hide-sm muted" style={{ fontSize: 13 }}>{p.last_move_at ? fmtDate(p.last_move_at, 'uz') : '—'}</td>
                  <td>
                    <div className="stock-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-soft" title="Kirim" onClick={() => setOpen({ id: p.id, type: 'in' })}>⬆️<span className="hide-sm"> Kirim</span></button>
                      <button className="btn btn-soft" disabled={p.stock === null} title="Chiqim" onClick={() => setOpen({ id: p.id, type: 'out' })}>⬇️<span className="hide-sm"> Chiqim</span></button>
                      <button className="btn btn-soft hide-sm" title="Sanoq" onClick={() => setOpen({ id: p.id, type: 'set' })}>🧮</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>Mahsulot topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="adm-card" style={{ marginTop: 14 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>🕘 So&apos;nggi harakatlar</h3>
        {!data.moves.length && <p className="muted">Hali kirim-chiqim yo&apos;q</p>}
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              {data.moves.map((m) => (
                <tr key={m.id} className="click" onClick={() => setOpen({ id: m.product_id, type: 'in' })}>
                  <td className="muted" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{fmtDate(m.created_at, 'uz')}</td>
                  <td><b>{m.product_name}</b></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {REASON[m.reason] || m.reason}
                    {m.order_number && <span className="muted"> #{m.order_number}</span>}
                  </td>
                  <td className="hide-sm muted">{m.note}</td>
                  <td style={{ textAlign: 'right' }}><Delta n={m.delta} /></td>
                  <td className="muted" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>= {m.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {current && open && (
        <StockDrawer key={current.id} item={current} initialType={open.type} onClose={() => setOpen(null)} onSaved={saved} />
      )}
    </>
  );
}

function StockDrawer({
  item, initialType, onClose, onSaved,
}: { item: StockItem; initialType: MoveType; onClose: () => void; onSaved: () => void }) {
  const { send, toast } = useAdminApi();
  const { data: moves, reload: reloadMoves } = useLoad<Move[]>(`/stock/${item.id}/moves`);
  const [type, setType] = useState<MoveType>(initialType);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [min, setMin] = useState(String(item.stock_min));
  const [busy, setBusy] = useState(false);

  const n = Math.max(0, Math.trunc(Number(qty) || 0));
  const now = item.stock ?? 0;
  const next = type === 'in' ? now + n : type === 'out' ? now - n : n;
  const invalid = qty === '' || (type !== 'set' && n === 0) || (type === 'out' && n > now);
  const lv = level(item);
  const hint = TYPES.find((x) => x.id === type)!.hint;

  const submit = async () => {
    if (invalid) return;
    setBusy(true);
    try {
      await send(`/stock/${item.id}/move`, 'POST', { type, qty: n, note });
      toast(type === 'set' ? `🧮 Qoldiq: ${n}` : `✅ ${signed(type === 'in' ? n : -n)} · qoldiq ${next}`);
      setQty('');
      setNote('');
      reloadMoves();
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  const saveMin = async () => {
    await send(`/stock/${item.id}`, 'PATCH', { stock_min: Number(min) || 0 });
    toast('✅ Chegara saqlandi');
    onSaved();
  };

  const untrack = async () => {
    if (!confirm(`"${item.name_uz}" uchun ombor hisobi to'xtatilsinmi? Qoldiq o'chadi, mahsulot "mavjud" bo'ladi.`)) return;
    await send(`/stock/${item.id}`, 'PATCH', { tracked: false });
    toast('Hisob to‘xtatildi');
    onSaved();
  };

  return (
    <Drawer
      title={`🏬 ${item.name_uz}`}
      onClose={onClose}
      footer={
        <button className="btn btn-primary btn-block" disabled={busy || invalid} onClick={submit}>
          {busy ? '...' : `💾 Saqlash${qty !== '' && !invalid ? ` · yangi qoldiq ${next}` : ''}`}
        </button>
      }
    >
      <div className="stock-head">
        <Img id={item.image_id} frame={item.frame} />
        <div>
          <small className="muted">Hozirgi qoldiq</small>
          <div className="stock-big">
            {item.stock ?? '—'}
            {item.stock !== null && item.unit_uz && <small className="muted"> × {item.unit_uz}</small>}
          </div>
          <span className={`lvl lvl-${lv}`} style={{ marginTop: 6 }}>{LEVEL[lv]}</span>
        </div>
      </div>

      <div className="seg" style={{ marginTop: 18 }}>
        {TYPES.map((x) => (
          <button key={x.id} className={type === x.id ? 'on' : ''} disabled={x.id === 'out' && item.stock === null} onClick={() => setType(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '10px 2px 0' }}>
        {item.stock === null && type !== 'out' ? 'Bu mahsulot uchun hisob shu yozuvdan boshlanadi. ' : ''}
        {hint}
      </p>

      <label className="label">{type === 'set' ? 'Aniq qoldiq' : 'Miqdor'}</label>
      <input
        className="input qty-input"
        type="number"
        inputMode="numeric"
        min={0}
        autoFocus
        placeholder="0"
        value={qty}
        onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {type !== 'set' && (
        <div className="presets">
          {[1, 5, 10, 20, 50].map((k) => (
            <button key={k} onClick={() => setQty(String(n + k))}>+{k}</button>
          ))}
        </div>
      )}
      {type === 'out' && n > now && <p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Omborda faqat {now} ta bor</p>}

      <label className="label">Izoh (ixtiyoriy)</label>
      <input
        className="input"
        placeholder={type === 'in' ? 'Yetkazib beruvchi, partiya…' : type === 'out' ? 'Sabab: buzilgan, sinov…' : 'Sanoq sanasi, kim sanadi…'}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {item.stock !== null && (
        <div className="box">
          <h4>⚙️ Sozlash</h4>
          <label className="label" style={{ marginTop: 0 }}>&quot;Kam qoldi&quot; chegarasi — qoldiq shundan oshmasa ogohlantiriladi</label>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <input className="input" style={{ height: 42, maxWidth: 120 }} type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} />
            <button className="btn btn-dark btn-sm" onClick={saveMin}>Saqlash</button>
            <span className="spacer" />
            <button className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={untrack}>Hisobni to&apos;xtatish</button>
          </div>
        </div>
      )}

      <div className="box">
        <h4>🕘 Tarix</h4>
        {!moves ? (
          <div className="spinner" style={{ margin: '10px auto' }} />
        ) : !moves.length ? (
          <p className="muted" style={{ margin: 0 }}>Hali harakat yo&apos;q</p>
        ) : (
          <ul className="moves">
            {moves.map((m) => (
              <li key={m.id}>
                <span>
                  <b>{REASON[m.reason] || m.reason}</b>
                  {m.order_number && <span className="muted"> #{m.order_number}</span>}
                </span>
                <Delta n={m.delta} />
                <small className="muted">
                  {fmtDate(m.created_at, 'uz')}
                  {m.note ? ` · ${m.note}` : ''}
                </small>
                <small className="muted" style={{ textAlign: 'right' }}>qoldiq {m.balance}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
