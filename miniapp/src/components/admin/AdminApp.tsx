'use client';
// Admin panel: kirish (parol yoki Telegram admin), 7 ta bo'lim
import { useCallback, useEffect, useState } from 'react';
import { AdminContext, useLoad } from './common';
import { Dashboard } from './Dashboard';
import { OrdersAdmin } from './OrdersAdmin';
import { ProductsAdmin } from './ProductsAdmin';
import { CategoriesAdmin, PromoAdmin, CustomersAdmin, SettingsAdmin } from './Sections';
import { adminLogin, ApiError } from '@/lib/api';
import { tg } from '@/hooks/useTelegram';
import { cx } from '@/lib/utils';

const TOKEN_KEY = 'ts-admin-token';

const SECTIONS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'orders', icon: '📦', label: 'Buyurtmalar' },
  { id: 'products', icon: '🧁', label: 'Mahsulotlar' },
  { id: 'categories', icon: '🗂', label: 'Kategoriyalar' },
  { id: 'promo', icon: '📸', label: 'Story va bannerlar' },
  { id: 'customers', icon: '👥', label: 'Mijozlar va rassilka' },
  { id: 'settings', icon: '⚙️', label: 'Sozlamalar' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Telegram ichida admin bo'lsa — parolsiz kirish
  useEffect(() => {
    const initData = tg()?.initData;
    if (!initData) return;
    adminLogin({ initData }).then((r) => onToken(r.token)).catch(() => {});
  }, [onToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await adminLogin({ password });
      onToken(r.token);
    } catch (e) {
      const d = e instanceof ApiError ? e.data : undefined;
      if (d?.error === 'blocked') setErr(`⛔️ Juda ko'p xato urinish. ${d.minutes} daqiqadan keyin qayta urinib ko'ring.`);
      else if (d?.error === 'wrong_password') setErr(`❌ Parol noto'g'ri. Qolgan urinishlar: ${d.left}`);
      else setErr('Server bilan aloqa yo‘q');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="adm-card" onSubmit={submit}>
        <img src="/images/logo.png" alt="" />
        <h2 style={{ fontSize: 22 }}>Admin panel</h2>
        <p className="muted" style={{ marginTop: 6 }}>Tayyor &amp; Sweet</p>
        <input className="input" type="password" autoFocus placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}>{err}</p>}
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy || !password}>Kirish</button>
      </form>
    </div>
  );
}

function Shell() {
  const [section, setSection] = useState<SectionId>('dashboard');
  const [openOrder, setOpenOrder] = useState<number | null>(null);
  const { data: counts, reload } = useLoad<{ stats: { receipts: number; to_ship: number } }>('/dashboard');

  useEffect(() => {
    const id = setInterval(reload, 60_000);
    return () => clearInterval(id);
  }, [reload]);

  const go = (s: string, orderId?: number) => {
    setSection(s as SectionId);
    if (orderId) setOpenOrder(orderId);
    window.scrollTo({ top: 0 });
  };
  const current = SECTIONS.find((s) => s.id === section)!;
  const pending = (counts?.stats.receipts || 0) + (counts?.stats.to_ship || 0);

  return (
    <AdminContext.Consumer>
      {({ logout }) => (
        <div className="adm">
          <nav className="adm-side">
            <div className="adm-brand">
              <img src="/images/logo.png" alt="" />
              <div><b>Tayyor &amp; Sweet</b><small>ADMIN</small></div>
            </div>
            {SECTIONS.map((s) => (
              <button key={s.id} className={cx('adm-nav', section === s.id && 'on')} onClick={() => go(s.id)}>
                <span>{s.icon}</span>{s.label}
                {s.id === 'orders' && pending > 0 && <span className="cnt">{pending}</span>}
              </button>
            ))}
            <button className="adm-nav logout" style={{ marginTop: 'auto' }} onClick={() => (window.location.href = '/')}>🛍 Do&apos;konga</button>
            <button className="adm-nav logout" onClick={logout}>🚪 Chiqish</button>
          </nav>
          <main className="adm-main">
            <div className="adm-head"><h1>{current.icon} {current.label}</h1></div>
            {section === 'dashboard' && <Dashboard go={go} />}
            {section === 'orders' && <OrdersAdmin openId={openOrder} onOpened={() => setOpenOrder(null)} />}
            {section === 'products' && <ProductsAdmin />}
            {section === 'categories' && <CategoriesAdmin />}
            {section === 'promo' && <PromoAdmin />}
            {section === 'customers' && <CustomersAdmin />}
            {section === 'settings' && <SettingsAdmin />}
          </main>
        </div>
      )}
    </AdminContext.Consumer>
  );
}

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    tg()?.ready();
    tg()?.expand();
    try {
      setToken(localStorage.getItem(TOKEN_KEY));
    } catch {}
    setReady(true);
  }, []);

  const onToken = useCallback((t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {}
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(null);
  }, []);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  if (!ready) return null;
  return (
    <AdminContext.Provider value={{ token: token || '', logout, toast }}>
      {token ? <Shell /> : <Login onToken={onToken} />}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </AdminContext.Provider>
  );
}
