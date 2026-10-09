'use client';
// Kichik qismlar: rasm (ramka bilan), bottom sheet, son tanlash, toast, ikonlar
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { imageUrl } from '@/lib/api';
import type { Frame } from '@/lib/types';
import { useBackButton } from '@/hooks/useTelegram';
import { useApp } from '@/store/appStore';
import { DICT } from '@/lib/i18n';
import { cx } from '@/lib/utils';

export const useT = () => DICT[useApp((s) => s.lang)];

// Admin sozlagan kesim: fokus nuqta (x,y %) va zoom
export function Img({
  id, frame, alt = '', className, style, eager, src,
}: { id?: number | null; frame?: Frame | null; alt?: string; className?: string; style?: CSSProperties; eager?: boolean; src?: string }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const url = src || imageUrl(id);
  // Keshdagi rasm onLoad'dan oldin yuklangan bo'lishi mumkin
  useEffect(() => {
    setLoaded(!!ref.current?.complete);
  }, [url]);
  const f = frame || { x: 50, y: 50, zoom: 1 };
  return (
    <div className={cx('frame', className)} style={style}>
      <img
        ref={ref}
        src={url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={loaded ? '' : 'loading'}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{
          objectPosition: `${f.x}% ${f.y}%`,
          transform: f.zoom && f.zoom !== 1 ? `scale(${f.zoom})` : undefined,
          transformOrigin: `${f.x}% ${f.y}%`,
        }}
        draggable={false}
      />
    </div>
  );
}

export function Sheet({ open, onClose, children, footer, paused }: { open: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode; paused?: boolean }) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 260);
      document.body.style.overflow = '';
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useBackButton(open && !paused, onClose);
  if (!visible) return null;
  return (
    <>
      <div className={cx('sheet-backdrop', closing && 'closing')} onClick={onClose} />
      <div className={cx('sheet', closing && 'closing')} role="dialog">
        <div className="sheet-handle" />
        <button className="icon-btn sheet-close" onClick={onClose} aria-label="close">
          <Icon.close />
        </button>
        {children}
      </div>
      {footer && !closing && <div className="sheet-footer">{footer}</div>}
    </>
  );
}

export function Qty({ value, onChange, small }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <div className={cx('qty', small && 'sm')}>
      <button onClick={() => onChange(value - 1)} aria-label="minus">−</button>
      <span>{value}</span>
      <button onClick={() => onChange(value + 1)} aria-label="plus">+</button>
    </div>
  );
}

export function Toast() {
  const toast = useApp((s) => s.toast);
  return toast ? <div className="toast">{toast}</div> : null;
}

export const Spinner = () => (
  <div className="center">
    <div className="spinner" />
  </div>
);

export function Empty({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="emoji">{emoji}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

const svg = (d: ReactNode, fill = false) =>
  function SvgIcon() {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {d}
      </svg>
    );
  };

export const Icon = {
  home: svg(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h5v-6h4v6h5V9.5" /></>),
  grid: svg(<><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>),
  bag: svg(<><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>),
  box: svg(<><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></>),
  user: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  close: svg(<path d="M6 6l12 12M18 6 6 18" />),
  chevron: svg(<path d="m9 6 6 6-6 6" />),
  copy: svg(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
};
