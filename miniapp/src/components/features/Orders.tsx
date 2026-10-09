'use client';
// Buyurtmalar tarixi, holat bosqichlari va 택배 kuzatuvi
import { useEffect, useState } from 'react';
import { Img, Sheet, Empty, Spinner, Icon, useT } from '@/components/ui';
import { DecorShape } from '@/components/layout';
import { useApp } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { openLink, haptic } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { STATUS, STATUS_FLOW, METHOD_ICON } from '@/lib/i18n';
import type { Order } from '@/lib/types';
import { won, fmtDate, copyText } from '@/lib/utils';
import { PaymentBlock } from './Checkout';

function useOrders() {
  const version = useApp((s) => s.ordersVersion);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    setError(false);
    api
      .orders()
      .then((o) => alive && setOrders(o))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [version]);
  return { orders, error };
}

export function StatusBadge({ status }: { status: Order['status'] }) {
  const lang = useApp((s) => s.lang);
  return <span className={`status st-${status}`}>{STATUS[lang][status]}</span>;
}

export function Orders() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const open = useApp((s) => s.open);
  const setTab = useApp((s) => s.setTab);
  const set = useApp((s) => s.set);
  const { orders, error } = useOrders();

  return (
    <div className="page">
      <div className="home-hero">
        <DecorShape />
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{t.orders}</h1>
      </div>
      <div style={{ height: 14 }} />
      {error && <Empty emoji="😕" title={t.error} action={<button className="btn btn-soft" onClick={() => set({ ordersVersion: Date.now() })}>{t.retry}</button>} />}
      {!error && !orders && <Spinner />}
      {orders && !orders.length && (
        <Empty emoji="📦" title={t.no_orders} text={t.no_orders_text} action={<button className="btn btn-primary" onClick={() => setTab('home')}>{t.go_shop}</button>} />
      )}
      {orders?.map((o, k) => (
        <button key={o.id} className="order-card" style={{ animationDelay: `${k * 40}ms` }} onClick={() => { haptic.tap(); open({ type: 'order', id: o.id }); }}>
          <div className="row">
            <b>#{o.number}</b>
            <span className="spacer" />
            <StatusBadge status={o.status} />
          </div>
          <div className="row muted" style={{ fontSize: 13, marginTop: 4 }}>
            <span>{fmtDate(o.created_at, lang)}</span>
            <span>· {METHOD_ICON[o.delivery_method]}</span>
            <span className="spacer" />
            <span className="price" style={{ fontSize: 16 }}>{won(o.total)}</span>
          </div>
          <div className="thumbs">
            {o.items.slice(0, 5).map((i, n) => <Img key={n} id={i.image_id} />)}
            {o.items.length > 5 && <span className="muted" style={{ marginLeft: 16, alignSelf: 'center' }}>+{o.items.length - 5}</span>}
          </div>
          {o.status === 'pending_payment' && <div className="note" style={{ background: '#fff3dc' }}>💳 {t.pay_now} →</div>}
        </button>
      ))}
    </div>
  );
}

export function OrderSheet() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const overlay = useApp((s) => s.overlay);
  const close = useApp((s) => s.close);
  const set = useApp((s) => s.set);
  const setTab = useApp((s) => s.setTab);
  const showToast = useApp((s) => s.showToast);
  const products = useApp((s) => s.data?.products || []);
  const add = useCartStore((s) => s.add);
  const id = overlay?.type === 'order' ? overlay.id : null;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    setOrder(null);
    if (id) api.order(id).then(setOrder).catch(() => close());
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const repeat = () => {
    if (!order) return;
    for (const i of order.items) if (products.some((p) => p.id === i.product_id)) add(i.product_id, { variant: i.variant, color: i.color, qty: i.qty });
    haptic.success();
    close();
    setTab('cart');
  };

  const flow = order?.status === 'cancelled' ? (['pending_payment', 'cancelled'] as const) : STATUS_FLOW;
  const reached = order ? flow.indexOf(order.status as never) : -1;
  const when = (s: string) => order?.history.find((h) => h.status === s)?.at;

  return (
    <Sheet open={!!id} onClose={close}>
      <div className="sheet-body" style={{ paddingTop: 28 }}>
        {!order ? (
          <Spinner />
        ) : (
          <>
            <div className="row">
              <h2 className="p-title">#{order.number}</h2>
            </div>
            <div className="row" style={{ marginTop: 6 }}>
              <StatusBadge status={order.status} />
              <span className="muted" style={{ fontSize: 13 }}>{fmtDate(order.created_at, lang)}</span>
            </div>

            {order.tracking_number && (
              <div className="track">
                <span style={{ fontSize: 26 }}>🚚</span>
                <div style={{ minWidth: 0 }}>
                  <small className="muted">{order.courier_name || t.tracking}</small>
                  <div style={{ fontWeight: 800, letterSpacing: '0.04em' }}>{order.tracking_number}</div>
                </div>
                <span className="spacer" />
                <button className="icon-btn" onClick={async () => { if (await copyText(order.tracking_number!)) showToast(`✓ ${t.copied}`); }}><Icon.copy /></button>
                {order.tracking_url && <button className="btn btn-dark btn-sm" onClick={() => openLink(order.tracking_url!)}>{t.track}</button>}
              </div>
            )}

            {order.admin_note && <div className="note"><span>💬</span><span>{order.admin_note}</span></div>}

            <div className="opt-title">{t.status}</div>
            <ul className="timeline">
              {flow.map((s, i) => (
                <li key={s} className={`${i <= reached ? 'done' : ''} ${i === reached ? 'current' : ''}`}>
                  <span className="dot">{i <= reached ? '✓' : ''}</span>
                  <b>{STATUS[lang][s]}</b>
                  {when(s) && <small>{fmtDate(when(s)!, lang)}</small>}
                </li>
              ))}
            </ul>

            {order.status === 'pending_payment' && (
              <>
                <div className="opt-title">{t.payment}</div>
                <PaymentBlock
                  order={order}
                  onDone={(o) => {
                    setOrder(o);
                    set({ ordersVersion: Date.now() });
                  }}
                />
              </>
            )}

            <div className="opt-title">{t.items}</div>
            {order.items.map((i, k) => (
              <div className="cart-item" key={k}>
                <Img id={i.image_id} />
                <div style={{ flex: 1 }}>
                  <h4>{i.name}</h4>
                  <small>{[i.variant, i.color, i.unit].filter(Boolean).join(' · ')}</small>
                  <div className="row" style={{ marginTop: 6 }}>
                    <span className="muted">{i.qty} × {won(i.price)}</span>
                    <span className="spacer" />
                    <b>{won(i.qty * i.price)}</b>
                  </div>
                </div>
              </div>
            ))}

            <div className="summary">
              <div className="line"><span className="muted">{METHOD_ICON[order.delivery_method]} {t[order.delivery_method]}</span><b>{order.delivery_fee ? won(order.delivery_fee) : t.free}</b></div>
              {order.address && <div className="line"><span className="muted">📍</span><span style={{ textAlign: 'right' }}>{order.address} {order.postal_code}</span></div>}
              {order.desired_date && <div className="line"><span className="muted">📅</span><span>{order.desired_date.slice(0, 10)}</span></div>}
              {order.comment && <div className="line"><span className="muted">💬</span><span style={{ textAlign: 'right' }}>{order.comment}</span></div>}
              <div className="line total"><span>{t.total}</span><span className="price">{won(order.total)}</span></div>
            </div>

            <button className="btn btn-soft btn-block" style={{ marginTop: 14 }} onClick={repeat}>🔁 {lang === 'ru' ? 'Повторить заказ' : 'Qayta buyurtma'}</button>
          </>
        )}
      </div>
    </Sheet>
  );
}
