'use client';
// Admin panel: kirish (parol yoki Telegram admin), 8 ta bo'lim
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminContext, useLoad } from './common';
import { Dashboard } from './Dashboard';
import { OrdersAdmin } from './OrdersAdmin';
import { ProductsAdmin } from './ProductsAdmin';
import { StockAdmin } from './StockAdmin';
import { CategoriesAdmin, PromoAdmin, CustomersAdmin, SettingsAdmin } from './Sections';
import { adminLogin, wakeServer, ApiError } from '@/lib/api';
import { tg } from '@/hooks/useTelegram';
import { cx } from '@/lib/utils';

const TOKEN_KEY = 'ts-admin-token';

const SECTIONS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'orders', icon: '📦', label: 'Buyurtmalar' },
  { id: 'products', icon: '🧁', label: 'Mahsulotlar' },
  { id: 'stock', icon: '🏬', label: 'Ombor' },
  { id: 'categories', icon: '🗂', label: 'Kategoriyalar' },
  { id: 'promo', icon: '📸', label: 'Story va bannerlar' },
  { id: 'customers', icon: '👥', label: 'Mijozlar va rassilka' },
  { id: 'settings', icon: '⚙️', label: 'Sozlamalar' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Server uyg'onayotganda: tarmoq xatosi yoki Vercel/Render'ning 502/503/504 javobi
const isWaking = (e: unknown) => !(e instanceof ApiError) || [502, 503, 504].includes(e.status);

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(true);
  const [err, setErr] = useState('');
  const [waking, setWaking] = useState(false);
  const [diag, setDiag] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sahifa ochilishi bilan serverni uyg'otamiz — parol terilguncha tayyor bo'ladi
  useEffect(() => {
    wakeServer();
  }, []);

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
    setDiag(false);
    try {
      // Server uxlab qolgan bo'lsa, uyg'onguncha (~1.5 daqiqa) o'zi qayta urinadi
      const until = Date.now() + 90_000;
      for (;;) {
        try {
          const r = await adminLogin({ password });
          return onToken(r.token);
        } catch (e) {
          if (!isWaking(e) || Date.now() > until) throw e;
          setWaking(true);
          await sleep(5000);
        }
      }
    } catch (e) {
      const d = e instanceof ApiError ? e.data : undefined;
      const code = e instanceof ApiError && e.status ? ` (${e.status})` : '';
      if (d?.error === 'blocked') setErr(`⛔️ Juda ko'p xato urinish. ${d.minutes} daqiqadan keyin qayta urinib ko'ring.`);
      else if (d?.error === 'wrong_password') setErr(`❌ Parol noto'g'ri. Qolgan urinishlar: ${d.left}`);
      else {
        setDiag(true);
        // 404 — so'rov backendga yetmayapti: Vercel'dagi BACKEND_URL noto'g'ri yoki Render servisi yo'q
        if (e instanceof ApiError && e.status === 404) setErr("Backend topilmadi (404) — Vercel'dagi BACKEND_URL manzili noto'g'ri bo'lishi mumkin.");
        else setErr(`Server bilan aloqa yo‘q${code}. Birozdan so'ng qayta urinib ko'ring.`);
      }
    } finally {
      setWaking(false);
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="adm-card" onSubmit={submit}>
        <img src="/images/logo.png" alt="" />
        <h2 style={{ fontSize: 22 }}>Admin panel</h2>
        <p className="muted" style={{ marginTop: 6 }}>Tayyor &amp; Sweet</p>
        <div className="pass">
          <input
            className="input"
            type={show ? 'text' : 'password'}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="current-password"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Parolni yashirish' : "Parolni ko'rsatish"}>
            {show ? '🙈' : '👁'}
          </button>
        </div>
        {waking && <p className="muted" style={{ fontSize: 14, fontWeight: 600 }}>⏳ Server uyg&apos;onmoqda, biroz kuting...</p>}
        {err && !waking && <p style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}>{err}</p>}
        {diag && !waking && <a href="/holat" target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'underline' }}>🔎 Aloqani tekshirish</a>}
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy || !password}>
          {busy ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}

function Shell() {
  const [section, setSection] = useState<SectionId>('dashboard');
  const [openOrder, setOpenOrder] = useState<number | null>(null);
  const nav = useRef<HTMLElement>(null);
  const { data: counts, reload } = useLoad<{
    stats: { receipts: number; to_ship: number };
    stock?: { low: number; empty: number };
  }>('/dashboard');

  useEffect(() => {
    const id = setInterval(reload, 60_000);
    return () => clearInterval(id);
  }, [reload]);

  // Telefonda menyu yonga suriladi — tanlangan bo'lim doim ko'rinib tursin
  useEffect(() => {
    nav.current?.querySelector('.adm-nav.on')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [section]);

  const go = (s: string, orderId?: number) => {
    setSection(s as SectionId);
    if (orderId) setOpenOrder(orderId);
    window.scrollTo({ top: 0 });
  };
  const current = SECTIONS.find((s) => s.id === section)!;
  const pending = (counts?.stats.receipts || 0) + (counts?.stats.to_ship || 0);
  const stockAlerts = (counts?.stock?.low || 0) + (counts?.stock?.empty || 0);

  return (
    <AdminContext.Consumer>
      {({ logout }) => (
        <div className="adm">
          <nav className="adm-side" ref={nav}>
            <div className="adm-brand">
              <img src="/images/logo.png" alt="" />
              <div><b>Tayyor &amp; Sweet</b><small>ADMIN</small></div>
            </div>
            {SECTIONS.map((s) => (
              <button key={s.id} className={cx('adm-nav', section === s.id && 'on')} onClick={() => go(s.id)}>
                <span>{s.icon}</span>{s.label}
                {s.id === 'orders' && pending > 0 && <span className="cnt">{pending}</span>}
                {s.id === 'stock' && stockAlerts > 0 && <span className="cnt">{stockAlerts}</span>}
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
            {section === 'stock' && <StockAdmin onChange={reload} />}
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
