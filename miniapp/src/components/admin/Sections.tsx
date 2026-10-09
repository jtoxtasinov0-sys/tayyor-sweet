'use client';
// 4. Kategoriyalar · 5. Story va bannerlar · 6. Mijozlar va rassilka · 7. Sozlamalar
import { useEffect, useState } from 'react';
import { useAdminApi, useLoad, Field, Switch, ImageInput, imgSrc } from './common';
import { Img, Spinner } from '@/components/ui';
import { won, fmtDate } from '@/lib/utils';
import type { Banner, Category, Product, Story } from '@/lib/types';

/* ---------- 4. Kategoriyalar ---------- */
export function CategoriesAdmin() {
  const { send, toast } = useAdminApi();
  const { data, setData, reload } = useLoad<Category[]>('/categories');
  const [add, setAdd] = useState({ emoji: '🍰', name_uz: '', name_ru: '' });

  const patch = (id: number, d: Partial<Category>) => setData((list) => list?.map((c) => (c.id === id ? { ...c, ...d } : c)) || null);
  const save = async (c: Category) => {
    await send(`/categories/${c.id}`, 'PATCH', c);
    toast('✅ Saqlandi');
  };
  const remove = async (c: Category) => {
    if (!confirm(`"${c.name_uz}" o'chirilsinmi? Mahsulotlar kategoriyasiz qoladi.`)) return;
    await send(`/categories/${c.id}`, 'DELETE');
    reload();
  };
  const create = async () => {
    if (!add.name_uz.trim()) return;
    await send('/categories', 'POST', { ...add, sort: (data?.length || 0) + 1 });
    setAdd({ emoji: '🍰', name_uz: '', name_ru: '' });
    reload();
  };

  if (!data) return <Spinner />;
  return (
    <div className="adm-card tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Emoji</th><th>Nomi (uz)</th><th>Nomi (ru)</th><th>Tartib</th><th>Mahsulot</th><th>Faol</th><th /></tr></thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id}>
              <td style={{ width: 70 }}><input className="input" style={{ height: 40 }} value={c.emoji || ''} onChange={(e) => patch(c.id, { emoji: e.target.value })} /></td>
              <td><input className="input" style={{ height: 40 }} value={c.name_uz} onChange={(e) => patch(c.id, { name_uz: e.target.value })} /></td>
              <td><input className="input" style={{ height: 40 }} value={c.name_ru || ''} onChange={(e) => patch(c.id, { name_ru: e.target.value })} /></td>
              <td style={{ width: 80 }}><input className="input" style={{ height: 40 }} type="number" value={c.sort} onChange={(e) => patch(c.id, { sort: Number(e.target.value) })} /></td>
              <td className="muted">{c.products_count}</td>
              <td><Switch checked={c.active} onChange={(v) => patch(c.id, { active: v })} label="" /></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-dark btn-sm" onClick={() => save(c)}>💾</button>{' '}
                <button className="x-btn" onClick={() => remove(c)}>×</button>
              </td>
            </tr>
          ))}
          <tr>
            <td><input className="input" style={{ height: 40 }} value={add.emoji} onChange={(e) => setAdd({ ...add, emoji: e.target.value })} /></td>
            <td><input className="input" style={{ height: 40 }} placeholder="Yangi kategoriya" value={add.name_uz} onChange={(e) => setAdd({ ...add, name_uz: e.target.value })} /></td>
            <td><input className="input" style={{ height: 40 }} placeholder="Ruscha" value={add.name_ru} onChange={(e) => setAdd({ ...add, name_ru: e.target.value })} /></td>
            <td colSpan={4}><button className="btn btn-primary btn-sm" onClick={create}>+ Qo&apos;shish</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ---------- 5. Story va bannerlar ---------- */
type Promo = Partial<Story & Banner>;

function PromoList({ kind }: { kind: 'stories' | 'banners' }) {
  const { send, toast } = useAdminApi();
  const { data, setData, reload } = useLoad<Promo[]>(`/${kind}`);
  const { data: products } = useLoad<Product[]>('/products');
  const { data: cats } = useLoad<Category[]>('/categories');

  const patch = (id: number, d: Promo) => setData((l) => l?.map((x) => (x.id === id ? { ...x, ...d } : x)) || null);
  const save = async (x: Promo) => {
    await send(`/${kind}/${x.id}`, 'PATCH', x);
    toast('✅ Saqlandi');
    reload();
  };
  const remove = async (x: Promo) => {
    if (!confirm("O'chirilsinmi?")) return;
    await send(`/${kind}/${x.id}`, 'DELETE');
    reload();
  };
  const create = async () => {
    await send(`/${kind}`, 'POST', { title: kind === 'stories' ? 'Yangi story' : 'Yangi banner', active: false, sort: (data?.length || 0) + 1 });
    reload();
  };

  if (!data) return <Spinner />;
  return (
    <>
      <div className="row" style={{ margin: '6px 0 10px' }}>
        <h3 style={{ fontSize: 17 }}>{kind === 'stories' ? '📸 Storylar' : '🎠 Karusel bannerlari'}</h3>
        <span className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={create}>+ Qo&apos;shish</button>
      </div>
      {kind === 'stories' && <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Maslahat: Mahsulotlar bo&apos;limida mahsulotni ochib &quot;📸 Story qilish&quot; tugmasini bossangiz, bir bosishda story tayyor bo&apos;ladi.</p>}
      <div className="adm-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {data.map((x) => {
          const product = products?.find((p) => p.id === x.product_id);
          return (
            <div key={x.id} className="adm-card">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                {x.image_id ? (
                  <ImageInput value={x.image_id} onChange={(id) => patch(x.id!, { image_id: id })} />
                ) : (
                  <div style={{ position: 'relative' }}>
                    {x.cover_id ? <Img id={x.cover_id} frame={product?.frame} style={{ width: 72, height: 72, borderRadius: kind === 'stories' ? '50%' : 12 }} /> : null}
                    <div style={{ marginTop: x.cover_id ? 6 : 0 }}><ImageInput value={null} onChange={(id) => patch(x.id!, { image_id: id })} size={x.cover_id ? 32 : 72} /></div>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input className="input" style={{ height: 40 }} placeholder="Sarlavha" value={x.title || ''} onChange={(e) => patch(x.id!, { title: e.target.value })} />
                  {kind === 'stories' ? (
                    <textarea className="textarea" style={{ marginTop: 6, minHeight: 60 }} placeholder="Matn" value={x.text || ''} onChange={(e) => patch(x.id!, { text: e.target.value })} />
                  ) : (
                    <input className="input" style={{ height: 40, marginTop: 6 }} placeholder="Qo'shimcha matn" value={x.subtitle || ''} onChange={(e) => patch(x.id!, { subtitle: e.target.value })} />
                  )}
                </div>
              </div>
              <label className="label">Mahsulot (bosilganda ochiladi)</label>
              <select className="select" style={{ height: 42 }} value={x.product_id ?? ''} onChange={(e) => patch(x.id!, { product_id: e.target.value ? Number(e.target.value) : null })}>
                <option value="">—</option>
                {products?.map((p) => <option key={p.id} value={p.id}>{p.name_uz} · {won(p.price)}</option>)}
              </select>
              {kind === 'banners' && (
                <>
                  <label className="label">yoki kategoriya</label>
                  <select className="select" style={{ height: 42 }} value={x.category_id ?? ''} onChange={(e) => patch(x.id!, { category_id: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">—</option>
                    {cats?.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name_uz}</option>)}
                  </select>
                </>
              )}
              <div className="row" style={{ marginTop: 12 }}>
                <Switch checked={!!x.active} onChange={(v) => patch(x.id!, { active: v })} label="Faol" />
                <input className="input" type="number" title="Tartib" style={{ height: 36, width: 70 }} value={x.sort ?? 0} onChange={(e) => patch(x.id!, { sort: Number(e.target.value) })} />
                <span className="spacer" />
                <button className="x-btn" onClick={() => remove(x)}>×</button>
                <button className="btn btn-dark btn-sm" onClick={() => save(x)}>💾</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function PromoAdmin() {
  return (
    <>
      <PromoList kind="stories" />
      <div style={{ height: 28 }} />
      <PromoList kind="banners" />
    </>
  );
}

/* ---------- 6. Mijozlar va rassilka ---------- */
interface UserRow {
  id: string; first_name: string | null; username: string | null; phone: string | null; lang: string | null;
  is_admin: boolean; bot_blocked: boolean; orders_count: number; orders_sum: number; created_at: string; last_seen: string;
}
interface BroadcastRow { id: number; text: string; total: number; sent: number; failed: number; status: string; created_at: string }

export function CustomersAdmin() {
  const { send, toast } = useAdminApi();
  const [q, setQ] = useState('');
  const { data, reload } = useLoad<{ rows: UserRow[]; total: number }>(`/users?q=${encodeURIComponent(q)}`);
  const { data: history, reload: reloadHistory } = useLoad<BroadcastRow[]>('/broadcasts');
  const [msg, setMsg] = useState({ text: '', image_id: null as number | null, withButton: true, button: "🛍 Do'konni ochish" });
  const [busy, setBusy] = useState(false);

  // Rassilka davom etayotganda progressni yangilab turish
  useEffect(() => {
    if (!history?.some((b) => b.status === 'running')) return;
    const id = setInterval(reloadHistory, 3000);
    return () => clearInterval(id);
  }, [history, reloadHistory]);

  const sendBroadcast = async () => {
    if (!msg.text.trim()) return toast('⚠️ Matn kiriting');
    if (!confirm(`Rassilka barcha mijozlarga (${data?.total ?? 0}) yuborilsinmi?`)) return;
    setBusy(true);
    try {
      await send('/broadcast', 'POST', { text: msg.text, image_id: msg.image_id, button: msg.withButton ? msg.button : null });
      toast('📣 Rassilka boshlandi');
      setMsg({ ...msg, text: '', image_id: null });
      reloadHistory();
    } finally {
      setBusy(false);
    }
  };

  const toggleAdmin = async (u: UserRow) => {
    if (!confirm(`${u.first_name || u.id} ${u.is_admin ? 'adminlikdan olinsinmi' : 'admin qilinsinmi'}?`)) return;
    await send(`/users/${u.id}`, 'PATCH', { is_admin: !u.is_admin });
    reload();
  };

  return (
    <>
      <div className="adm-card">
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>📣 Rassilka</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>HTML: &lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;, &lt;a href=&quot;...&quot;&gt;havola&lt;/a&gt;. Rasm bilan bo&apos;lsa matn 1024 belgigacha.</p>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <ImageInput value={msg.image_id} onChange={(id) => setMsg({ ...msg, image_id: id })} size={96} />
          <textarea className="textarea" style={{ minHeight: 96 }} placeholder="Assalomu alaykum! Bugun yangi tortlar..." value={msg.text} onChange={(e) => setMsg({ ...msg, text: e.target.value })} />
        </div>
        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <Switch checked={msg.withButton} onChange={(v) => setMsg({ ...msg, withButton: v })} label="Tugma:" />
          {msg.withButton && <input className="input" style={{ height: 40, maxWidth: 260 }} value={msg.button} onChange={(e) => setMsg({ ...msg, button: e.target.value })} />}
          <span className="spacer" />
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={sendBroadcast}>🚀 Yuborish</button>
        </div>
        {!!history?.length && (
          <table className="tbl" style={{ marginTop: 14 }}>
            <tbody>
              {history.slice(0, 5).map((b) => (
                <tr key={b.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtDate(b.created_at, 'uz')}</td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.text}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>✅ {b.sent} · ❌ {b.failed} / {b.total}</td>
                  <td>{b.status === 'running' ? '⏳' : '✔︎'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="toolbar" style={{ marginTop: 18 }}>
        <input className="input" placeholder="🔎 Ism, username, telefon" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted">{data?.total ?? 0} ta mijoz</span>
      </div>
      <div className="adm-card tbl-wrap" style={{ padding: 6 }}>
        <table className="tbl">
          <thead><tr><th>Mijoz</th><th>Telefon</th><th>Til</th><th>Buyurtma</th><th>Xarid</th><th>Oxirgi faollik</th><th /></tr></thead>
          <tbody>
            {data?.rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.first_name || '—'}</b> {u.is_admin && <span className="badge badge-hit">ADMIN</span>} {u.bot_blocked && <span className="badge badge-sale">bloklagan</span>}
                  <div className="muted" style={{ fontSize: 12 }}>{u.username ? <a href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">@{u.username}</a> : u.id}</div>
                </td>
                <td>{u.phone || '—'}</td>
                <td>{u.lang || '—'}</td>
                <td>{u.orders_count}</td>
                <td>{won(u.orders_sum)}</td>
                <td className="muted">{fmtDate(u.last_seen, 'uz')}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => toggleAdmin(u)}>{u.is_admin ? 'Adminlikdan olish' : 'Admin qilish'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- 7. Sozlamalar ---------- */
type Settings = Record<'shop' | 'payment' | 'delivery' | 'app', Record<string, string | number | boolean>>;

export function SettingsAdmin() {
  const { send, toast } = useAdminApi();
  const { data, setData } = useLoad<Settings>('/settings');
  const [busy, setBusy] = useState(false);
  if (!data) return <Spinner />;

  const up = (group: keyof Settings, key: string, value: string | number | boolean) =>
    setData((s) => (s ? { ...s, [group]: { ...s[group], [key]: value } } : s));
  const text = (group: keyof Settings, key: string, label: string, opts: { area?: boolean; full?: boolean; ph?: string } = {}) => (
    <Field label={label} full={opts.full || opts.area}>
      {opts.area ? (
        <textarea className="textarea" value={String(data[group]?.[key] ?? '')} placeholder={opts.ph} onChange={(e) => up(group, key, e.target.value)} />
      ) : (
        <input className="input" value={String(data[group]?.[key] ?? '')} placeholder={opts.ph} onChange={(e) => up(group, key, e.target.value)} />
      )}
    </Field>
  );
  const num = (group: keyof Settings, key: string, label: string) => (
    <Field label={label}>
      <input className="input" type="number" step={500} value={Number(data[group]?.[key] ?? 0)} onChange={(e) => up(group, key, Number(e.target.value))} />
    </Field>
  );

  const save = async () => {
    setBusy(true);
    try {
      await send('/settings', 'PUT', data);
      toast('✅ Sozlamalar saqlandi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="box" style={{ marginTop: 0 }}>
        <h4>🏪 Do&apos;kon</h4>
        <div className="fgrid">
          {text('shop', 'name', "Do'kon nomi")}
          {text('shop', 'short_name', 'Qisqa nom (… MEMBER)')}
          {text('shop', 'title', 'Sarlavha', { full: true })}
          {text('shop', 'owner_link', 'Egasining Telegram havolasi', { ph: 'https://t.me/username' })}
          {text('shop', 'instagram', 'Instagram')}
          {text('shop', 'phone', 'Telefon')}
          {text('shop', 'working_hours', 'Ish vaqti')}
          {text('shop', 'address', 'Manzil', { full: true })}
          {text('shop', 'about_uz', "Do'kon haqida (uz)", { area: true })}
          {text('shop', 'about_ru', "Do'kon haqida (ru)", { area: true })}
        </div>
      </div>

      <div className="box">
        <h4>💳 To&apos;lov rekvizitlari</h4>
        <div className="fgrid">
          {text('payment', 'bank_name', 'Bank', { ph: '국민은행 / 카카오뱅크 ...' })}
          {text('payment', 'account_number', 'Hisob raqami', { ph: '123-456-789012' })}
          {text('payment', 'account_holder', 'Hisob egasi')}
          <div />
          {text('payment', 'note_uz', 'Izoh (uz)', { area: true })}
          {text('payment', 'note_ru', 'Izoh (ru)', { area: true })}
        </div>
      </div>

      <div className="box">
        <h4>🚚 Yetkazish</h4>
        <div className="fgrid">
          {num('delivery', 'taekbae_fee', '택배 narxi (₩)')}
          {num('delivery', 'free_from', '택배 bepul (₩ dan yuqori, 0 = yo‘q)')}
          {num('delivery', 'pickup_fee', 'Olib ketish narxi (₩)')}
          {num('delivery', 'min_order', 'Minimal buyurtma (₩)')}
          <div />
          {text('delivery', 'taekbae_note_uz', '택배 izohi', { full: true })}
          {text('delivery', 'pickup_note_uz', 'Olib ketish izohi', { full: true })}
        </div>
      </div>

      <div className="box">
        <h4>📱 Mini ilova</h4>
        <div className="fgrid">
          {text('app', 'announcement_uz', "E'lon (uz) — bosh sahifada", { area: true })}
          {text('app', 'announcement_ru', "E'lon (ru)", { area: true })}
        </div>
        <div style={{ marginTop: 12 }}>
          <Switch checked={data.app?.onboarding !== false} onChange={(v) => up('app', 'onboarding', v)} label="Yangi mijozlarga onboarding ko'rsatish" />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" disabled={busy} onClick={save}>💾 Saqlash</button>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>Logo: <code>miniapp/public/images/logo.png</code> · rasm: <img src={imgSrc(null)} alt="" style={{ width: 20, height: 20, borderRadius: 99, display: 'inline', verticalAlign: 'middle' }} /></p>
    </>
  );
}
