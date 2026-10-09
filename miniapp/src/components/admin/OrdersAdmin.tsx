'use client';
// 2. Buyurtmalar: filtr, qidiruv, chekni ko'rish, holatni o'zgartirish, trek raqam
import { useEffect, useState } from 'react';
import { useAdminApi, useLoad, Drawer, Field, Switch, imgSrc, STATUS_UZ, METHOD_UZ } from './common';
import { Spinner } from '@/components/ui';
import { won, fmtDate, cx } from '@/lib/utils';
import type { Order } from '@/lib/types';

interface OrdersRes {
  rows: Order[];
  total: number;
  couriers: Record<string, { name: string }>;
  statuses: string[];
}

const FILTERS = ['', 'pending_payment', 'receipt_sent', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function OrdersAdmin({ openId, onOpened }: { openId?: number | null; onOpened?: () => void }) {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const path = `/orders?status=${status}&q=${encodeURIComponent(q)}&page=${page}`;
  const { data, loading, reload } = useLoad<OrdersRes>(path);

  useEffect(() => {
    if (openId) {
      setSelected(openId);
      onOpened?.();
    }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f} className={cx('chip', status === f && 'active')} onClick={() => { setStatus(f); setPage(1); }}>
            {f ? STATUS_UZ[f] : '📋 Hammasi'}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <input className="input" placeholder="🔎 Raqam, ism yoki telefon" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button className="btn btn-soft btn-sm" onClick={reload}>↻ Yangilash</button>
        <span className="muted">{data?.total ?? 0} ta</span>
      </div>
      <div className="adm-card tbl-wrap" style={{ padding: 6 }}>
        {loading && !data ? (
          <Spinner />
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Raqam</th><th>Mijoz</th><th>Mahsulotlar</th><th>Yetkazish</th><th>Holat</th><th style={{ textAlign: 'right' }}>Summa</th></tr>
            </thead>
            <tbody>
              {data?.rows.map((o) => (
                <tr key={o.id} className="click" onClick={() => setSelected(o.id)}>
                  <td><b>#{o.number}</b><div className="muted" style={{ fontSize: 12 }}>{fmtDate(o.created_at, 'uz')}</div></td>
                  <td>{o.customer_name}<div className="muted" style={{ fontSize: 12 }}>{o.phone}</div></td>
                  <td style={{ maxWidth: 240 }}>{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                  <td>{METHOD_UZ[o.delivery_method]}</td>
                  <td><span className={`status st-${o.status}`}>{STATUS_UZ[o.status]}</span>{o.receipt_image_id ? ' 🧾' : ''}</td>
                  <td style={{ textAlign: 'right' }}><b>{won(o.total)}</b></td>
                </tr>
              ))}
              {!data?.rows.length && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 30 }}>Buyurtmalar yo&apos;q</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {data && data.total > 30 && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn btn-soft btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
          <span>{page} / {Math.ceil(data.total / 30)}</span>
          <button className="btn btn-soft btn-sm" disabled={page * 30 >= data.total} onClick={() => setPage(page + 1)}>→</button>
        </div>
      )}
      {selected && <OrderDrawer id={selected} couriers={data?.couriers || {}} onClose={() => setSelected(null)} onSaved={reload} />}
    </>
  );
}

function OrderDrawer({ id, couriers, onClose, onSaved }: { id: number; couriers: Record<string, { name: string }>; onClose: () => void; onSaved: () => void }) {
  const { call, send, toast } = useAdminApi();
  const [o, setO] = useState<Order | null>(null);
  const [courier, setCourier] = useState('cj');
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [bigReceipt, setBigReceipt] = useState(false);

  useEffect(() => {
    call<Order>(`/orders/${id}`).then((x) => {
      setO(x);
      setCourier(x.courier || 'cj');
      setTracking(x.tracking_number || '');
      setNote(x.admin_note || '');
    }).catch(onClose);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (status?: string) => {
    if (!o) return;
    if (status === 'shipped' && o.delivery_method === 'taekbae' && !tracking.trim() && !confirm("Trek raqamisiz jo'natilsinmi?")) return;
    setBusy(true);
    try {
      const x = await send<Order>(`/orders/${o.id}`, 'PATCH', {
        status: status || o.status,
        courier: tracking.trim() ? courier : undefined,
        tracking_number: tracking.trim() || undefined,
        admin_note: note,
        notify,
      });
      setO({ ...o, ...x });
      toast('✅ Saqlandi' + (notify ? ' · mijozga xabar yuborildi' : ''));
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  const next: Record<string, { s: string; label: string }[]> = {
    pending_payment: [{ s: 'confirmed', label: "✅ To'lov tasdiqlandi" }, { s: 'cancelled', label: '❌ Bekor qilish' }],
    receipt_sent: [{ s: 'confirmed', label: '✅ Chekni tasdiqlash' }, { s: 'pending_payment', label: '↩︎ Chek noto‘g‘ri' }, { s: 'cancelled', label: '❌ Bekor' }],
    confirmed: [{ s: 'shipped', label: "🚚 Jo'natildi" }, { s: 'cancelled', label: '❌ Bekor' }],
    shipped: [{ s: 'delivered', label: '🎉 Yetkazildi' }],
    delivered: [],
    cancelled: [{ s: 'pending_payment', label: '↩︎ Qayta ochish' }],
  };

  return (
    <Drawer
      title={o ? `#${o.number}` : '...'}
      onClose={onClose}
      footer={
        o && (
          <>
            {next[o.status].map((n, i) => (
              <button key={n.s} className={cx('btn btn-sm', i === 0 ? 'btn-primary' : 'btn-ghost')} disabled={busy} onClick={() => save(n.s)}>{n.label}</button>
            ))}
            <span className="spacer" />
            <button className="btn btn-dark btn-sm" disabled={busy} onClick={() => save()}>💾 Saqlash</button>
          </>
        )
      }
    >
      {!o ? (
        <Spinner />
      ) : (
        <>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <span className={`status st-${o.status}`}>{STATUS_UZ[o.status]}</span>
            <span className="muted">{fmtDate(o.created_at, 'uz')}</span>
            <span className="spacer" />
            <b className="price" style={{ fontSize: 20 }}>{won(o.total)}</b>
          </div>

          <div className="box">
            <h4>👤 Mijoz</h4>
            <div>{o.customer_name} · <a href={`tel:${o.phone}`}>{o.phone}</a></div>
            {o.username && <div><a href={`https://t.me/${o.username}`} target="_blank" rel="noreferrer">@{o.username}</a></div>}
            <div style={{ marginTop: 6 }}>{METHOD_UZ[o.delivery_method]} {o.delivery_fee ? `· ${won(o.delivery_fee)}` : ''}</div>
            {o.address && <div>📍 {o.address} {o.postal_code && `(${o.postal_code})`}</div>}
            {o.desired_date && <div>📅 {o.desired_date.slice(0, 10)}</div>}
            {o.comment && <div>💬 {o.comment}</div>}
          </div>

          <div className="box">
            <h4>🧁 Mahsulotlar</h4>
            <table className="tbl">
              <tbody>
                {o.items.map((i, k) => (
                  <tr key={k}>
                    <td style={{ width: 52 }}><img className="thumb" src={imgSrc(i.image_id)} alt="" style={{ objectFit: 'cover' }} /></td>
                    <td>{i.name}<div className="muted" style={{ fontSize: 12 }}>{[i.variant, i.color, i.unit].filter(Boolean).join(' · ')}</div></td>
                    <td>×{i.qty}</td>
                    <td style={{ textAlign: 'right' }}>{won(i.price * i.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="box">
            <h4>🧾 To&apos;lov cheki</h4>
            {o.receipt_image_id ? (
              <img className="receipt-img" src={imgSrc(o.receipt_image_id)} alt="chek" onClick={() => setBigReceipt(true)} />
            ) : (
              <p className="muted" style={{ margin: 0 }}>Chek hali yuborilmagan</p>
            )}
          </div>

          <div className="box">
            <h4>🚚 택배 trek raqami</h4>
            <div className="fgrid">
              <Field label="Kuryer">
                <select className="select" value={courier} onChange={(e) => setCourier(e.target.value)}>
                  {Object.entries(couriers).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Trek raqam (운송장번호)">
                <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="1234-5678-9012" />
              </Field>
              <Field label="Mijozga izoh" full>
                <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: tort ertaga soat 10 da jo'natiladi" />
              </Field>
            </div>
            <div style={{ marginTop: 12 }}><Switch checked={notify} onChange={setNotify} label="Mijozga Telegram orqali xabar yuborish" /></div>
          </div>

          <div className="box">
            <h4>🕓 Tarix</h4>
            {o.history.map((h, k) => <div key={k} className="muted" style={{ fontSize: 13 }}>{fmtDate(h.at, 'uz')} — {STATUS_UZ[h.status]}</div>)}
          </div>

          {bigReceipt && (
            <div className="zoom" onClick={() => setBigReceipt(false)}>
              <img src={imgSrc(o.receipt_image_id)} alt="" />
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
