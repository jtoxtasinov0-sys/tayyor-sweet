'use client';
// 1. Dashboard: statistika, 14 kunlik grafik, top mahsulotlar, oxirgi buyurtmalar
import { useLoad, STATUS_UZ } from './common';
import { Spinner } from '@/components/ui';
import { won, fmtDate } from '@/lib/utils';
import type { Order } from '@/lib/types';

interface Dash {
  stats: Record<string, number>;
  daily: { day: string; orders: number; revenue: number }[];
  top: { name: string; qty: number; sum: number }[];
  latest: Order[];
}

export function Dashboard({ go }: { go: (section: string, orderId?: number) => void }) {
  const { data, loading } = useLoad<Dash>('/dashboard');
  if (loading && !data) return <Spinner />;
  if (!data) return null;
  const s = data.stats;
  const max = Math.max(1, ...data.daily.map((d) => d.orders));
  const cards = [
    { k: 'Bugungi buyurtmalar', v: s.orders_today, ic: '📦', hl: true },
    { k: "To'lov kutilmoqda", v: s.pending, ic: '⏳' },
    { k: 'Chekni tekshirish', v: s.receipts, ic: '🧾' },
    { k: "Jo'natish kerak", v: s.to_ship, ic: '🚚' },
    { k: 'Shu oy tushum', v: won(s.revenue_month), ic: '💰' },
    { k: 'Jami tushum', v: won(s.revenue), ic: '📈' },
    { k: 'Mijozlar', v: `${s.users_total} (+${s.users_week})`, ic: '👥' },
    { k: 'Jami buyurtmalar', v: s.orders_total, ic: '🧁' },
  ];
  return (
    <>
      <div className="adm-grid adm-stats">
        {cards.map((c) => (
          <div key={c.k} className={`stat ${c.hl ? 'hl' : ''}`}>
            <span className="ic">{c.ic}</span>
            <small>{c.k}</small>
            <b>{c.v}</b>
          </div>
        ))}
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: 14 }}>
        <div className="adm-card">
          <h3 style={{ fontSize: 16 }}>So&apos;nggi 14 kun — buyurtmalar</h3>
          <div className="bars">
            {data.daily.map((d) => (
              <div className="bar" key={d.day} title={`${d.orders} ta · ${won(d.revenue)}`}>
                {d.orders > 0 && <em>{d.orders}</em>}
                <i style={{ height: `${(d.orders / max) * 100}%` }} />
                <span>{d.day.slice(3)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="adm-card">
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>🔥 Top mahsulotlar</h3>
          {!data.top.length && <p className="muted">Hali sotuv yo&apos;q</p>}
          <table className="tbl">
            <tbody>
              {data.top.map((t, i) => (
                <tr key={t.name}>
                  <td style={{ width: 24 }}><b>{i + 1}</b></td>
                  <td>{t.name}</td>
                  <td className="muted">{t.qty} ta</td>
                  <td style={{ textAlign: 'right' }}><b>{won(t.sum)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <h3 style={{ fontSize: 16 }}>Oxirgi buyurtmalar</h3>
          <span className="spacer" />
          <button className="btn btn-soft btn-sm" onClick={() => go('orders')}>Barchasi →</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              {data.latest.map((o) => (
                <tr key={o.id} className="click" onClick={() => go('orders', o.id)}>
                  <td><b>#{o.number}</b><div className="muted" style={{ fontSize: 12 }}>{fmtDate(o.created_at, 'uz')}</div></td>
                  <td>{o.customer_name}</td>
                  <td><span className={`status st-${o.status}`}>{STATUS_UZ[o.status]}</span></td>
                  <td style={{ textAlign: 'right' }}><b>{won(o.total)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
