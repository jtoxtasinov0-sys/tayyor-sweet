'use client';
// Admin panel uchun umumiy qismlar: token, so'rovlar, drawer, maydonlar, rasm yuklash
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { adminRequest, ApiError, API_URL } from '@/lib/api';
import { compressImage } from '@/lib/utils';
import { Icon } from '@/components/ui';

interface AdminCtx {
  token: string;
  logout: () => void;
  toast: (m: string) => void;
}

export const AdminContext = createContext<AdminCtx>({ token: '', logout: () => {}, toast: () => {} });

export function useAdminApi() {
  const { token, logout, toast } = useContext(AdminContext);
  const call = useCallback(
    async <T,>(path: string, opts: RequestInit = {}): Promise<T> => {
      try {
        return await adminRequest<T>(path, token, opts);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) logout();
        toast(`⚠️ ${e instanceof Error ? e.message : 'Xatolik'}`);
        throw e;
      }
    },
    [token, logout, toast]
  );
  const send = useCallback(
    <T,>(path: string, method: string, body?: unknown) =>
      call<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }),
    [call]
  );
  const upload = useCallback(
    async (file: File): Promise<number> => {
      const fd = new FormData();
      fd.append('image', await compressImage(file), 'image.jpg');
      const { id } = await call<{ id: number }>('/upload', { method: 'POST', body: fd });
      return id;
    },
    [call]
  );
  return { call, send, upload, toast };
}

// Ma'lumotni yuklash + qayta yuklash
export function useLoad<T>(path: string | null, deps: unknown[] = []) {
  const { call } = useAdminApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    if (!path) return;
    setLoading(true);
    call<T>(path)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [path, call]);
  useEffect(reload, [reload, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, setData, loading, reload };
}

export const imgSrc = (id?: number | null) => (id ? `${API_URL}/api/images/${id}` : '/images/logo.png');

export function Drawer({ title, onClose, children, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}><Icon.close /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'full' : undefined}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function ImageInput({ value, onChange, size = 72 }: { value: number | null; onChange: (id: number | null) => void; size?: number }) {
  const { upload } = useAdminApi();
  const [busy, setBusy] = useState(false);
  return (
    <div className="img-pick">
      {value ? (
        <div className="frame" style={{ width: size, height: size }}>
          <img src={imgSrc(value)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button className="rm" onClick={() => onChange(null)}>×</button>
        </div>
      ) : (
        <label style={{ width: size, height: size }}>
          {busy ? <span className="spinner" /> : '+'}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                onChange(await upload(f));
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
      )}
    </div>
  );
}

export const STATUS_UZ: Record<string, string> = {
  pending_payment: "⏳ To'lov kutilmoqda",
  receipt_sent: '🧾 Chek yuborildi',
  confirmed: '✅ Tasdiqlandi',
  shipped: "🚚 Jo'natildi",
  delivered: '🎉 Yetkazildi',
  cancelled: '❌ Bekor qilindi',
};

export const METHOD_UZ: Record<string, string> = { taekbae: '📦 택배', bus: '🚌 버스터미널', pickup: '🏠 Olib ketish' };
