'use client';
// Buyurtma berish va to'lov (bank o'tkazmasi + chek yuklash)
import { useEffect, useRef, useState } from 'react';
import { Sheet, Icon, useT } from '@/components/ui';
import { useApp } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { useCart } from '@/hooks/useCart';
import { useTelegram, haptic } from '@/hooks/useTelegram';
import { api, ApiError } from '@/lib/api';
import { METHOD_ICON } from '@/lib/i18n';
import type { DeliveryMethod, Order } from '@/lib/types';
import { won, cx, copyText, compressImage, todayPlus } from '@/lib/utils';

const FORM_KEY = 'ts-checkout';

export function CheckoutSheet() {
  const t = useT();
  const { user } = useTelegram();
  const overlay = useApp((s) => s.overlay);
  const close = useApp((s) => s.close);
  const open = useApp((s) => s.open);
  const me = useApp((s) => s.me);
  const data = useApp((s) => s.data);
  const set = useApp((s) => s.set);
  const showToast = useApp((s) => s.showToast);
  const clear = useCartStore((s) => s.clear);
  const { items, subtotal, fee, preorderDays } = useCart();
  const isOpen = overlay?.type === 'checkout';

  const [form, setForm] = useState({ name: '', phone: '', address: '', postal: '', date: '', comment: '' });
  const [method, setMethod] = useState<DeliveryMethod>('taekbae');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let saved: Partial<typeof form> = {};
    try {
      saved = JSON.parse(localStorage.getItem(FORM_KEY) || '{}');
    } catch {}
    setForm((f) => ({
      ...f,
      name: saved.name || f.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || me?.first_name || '',
      phone: saved.phone || f.phone || me?.phone || '',
      address: saved.address || f.address,
      postal: saved.postal || f.postal,
    }));
    setErr('');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const d = data?.delivery;
  const methods: { id: DeliveryMethod; title: string; desc: string }[] = [
    { id: 'taekbae', title: t.taekbae, desc: d?.taekbae_note_uz || t.taekbae_d },
    { id: 'bus', title: t.bus, desc: d?.bus_note_uz || t.bus_d },
    { id: 'pickup', title: t.pickup, desc: d?.pickup_note_uz || t.pickup_d },
  ];
  const deliveryFee = fee(method);
  const total = subtotal + deliveryFee;
  const up = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || (method === 'taekbae' && !form.address.trim())) {
      haptic.error();
      return setErr(t.required);
    }
    setBusy(true);
    setErr('');
    try {
      const order = await api.createOrder({
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty, variant: i.variant, color: i.color })),
        delivery_method: method,
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        postal_code: form.postal,
        desired_date: form.date || undefined,
        comment: form.comment,
      });
      try {
        localStorage.setItem(FORM_KEY, JSON.stringify({ name: form.name, phone: form.phone, address: form.address, postal: form.postal }));
      } catch {}
      haptic.success();
      clear();
      set({ ordersVersion: Date.now() });
      showToast(`🎉 ${t.order_created}`);
      open({ type: 'payment', order, fresh: true });
    } catch (e) {
      haptic.error();
      setErr(e instanceof ApiError ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={isOpen && items.length > 0}
      onClose={close}
      footer={
        <button className="btn btn-primary btn-block" disabled={busy} onClick={submit}>
          {busy ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : `${t.confirm_order} · ${won(total)}`}
        </button>
      }
    >
      <div className="sheet-body" style={{ paddingTop: 28 }}>
        <h2 className="p-title">{t.checkout}</h2>

        <div className="opt-title">{t.method}</div>
        {methods.map((m) => (
          <button key={m.id} className={cx('method', method === m.id && 'on')} onClick={() => { haptic.select(); setMethod(m.id); }}>
            <span className="ic">{METHOD_ICON[m.id]}</span>
            <span>
              <b>{m.title}</b>
              <small>{m.desc}</small>
            </span>
            <span className="fee">{fee(m.id) ? won(fee(m.id)) : t.free}</span>
          </button>
        ))}

        <div className="opt-title">{t.your_info}</div>
        <label className="label">{t.name} *</label>
        <input className="input" value={form.name} onChange={up('name')} autoComplete="name" />
        <label className="label">{t.phone} *</label>
        <input className="input" value={form.phone} onChange={up('phone')} inputMode="tel" placeholder="010-1234-5678" autoComplete="tel" />
        {method !== 'pickup' && (
          <>
            <label className="label">{t.address}{method === 'taekbae' && ' *'}</label>
            <textarea className="textarea" value={form.address} onChange={up('address')} placeholder="경기도 안산시 ..." rows={2} />
            {method === 'taekbae' && (
              <>
                <label className="label">{t.postal}</label>
                <input className="input" value={form.postal} onChange={up('postal')} inputMode="numeric" placeholder="15xxx" />
              </>
            )}
          </>
        )}
        {preorderDays > 0 && (
          <>
            <label className="label">{t.date}</label>
            <input className="input" type="date" min={todayPlus(preorderDays)} value={form.date} onChange={up('date')} />
            <div className="note"><span>⏰</span><span>{t.preorder(preorderDays)}</span></div>
          </>
        )}
        <label className="label">{t.comment}</label>
        <textarea className="textarea" value={form.comment} onChange={up('comment')} placeholder={t.comment_ph} />

        <div className="summary">
          <div className="line"><span className="muted">{t.subtotal}</span><b>{won(subtotal)}</b></div>
          <div className="line"><span className="muted">{t.delivery}</span><b>{deliveryFee ? won(deliveryFee) : t.free}</b></div>
          <div className="line total"><span>{t.total}</span><span className="price">{won(total)}</span></div>
        </div>
        {err && <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{err}</p>}
      </div>
    </Sheet>
  );
}

export function PaymentBlock({ order, onDone }: { order: Order; onDone?: (o: Order) => void }) {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const payment = useApp((s) => s.data?.payment);
  const showToast = useApp((s) => s.showToast);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const copy = async (s: string) => {
    if (await copyText(s)) {
      haptic.success();
      showToast(`✓ ${t.copied}`);
    }
  };

  const send = async () => {
    if (!file) return input.current?.click();
    setBusy(true);
    try {
      const updated = await api.uploadReceipt(order.id, await compressImage(file, 1800, 0.85));
      haptic.success();
      showToast(t.receipt_sent);
      onDone?.(updated);
    } catch (e) {
      haptic.error();
      showToast(e instanceof ApiError ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  };

  const note = lang === 'ru' ? payment?.note_ru || payment?.note_uz : payment?.note_uz;
  return (
    <>
      <div className="bank">
        <small>{t.amount}</small>
        <div className="acc">{won(order.total)} <button className="copy" onClick={() => copy(String(order.total))}>{t.copy}</button></div>
        {payment?.account_number ? (
          <>
            <small>{t.bank}</small>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{payment.bank_name}</div>
            <small>{t.account}</small>
            <div className="acc" style={{ fontSize: 19 }}>
              {payment.account_number}
              <button className="copy" onClick={() => copy(payment.account_number!.replace(/[^\d]/g, ''))}><Icon.copy /></button>
            </div>
            {payment.account_holder && (<><small>{t.holder}</small><div style={{ fontWeight: 700 }}>{payment.account_holder}</div></>)}
          </>
        ) : (
          <p style={{ margin: 0, opacity: 0.85 }}>{t.bank_missing}</p>
        )}
      </div>
      {note && <div className="note"><span>💡</span><span>{note}</span></div>}

      <div className="opt-title">{t.upload_receipt}</div>
      <label className="upload">
        {preview ? <img src={preview} alt="" /> : <><span style={{ fontSize: 36 }}>🧾</span><span className="muted">{t.upload_hint}</span></>}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }}
        />
      </label>
      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy} onClick={send}>
        {busy ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : file ? t.send_receipt : t.upload_receipt}
      </button>
    </>
  );
}

export function PaymentSheet() {
  const t = useT();
  const overlay = useApp((s) => s.overlay);
  const close = useApp((s) => s.close);
  const open = useApp((s) => s.open);
  const set = useApp((s) => s.set);
  const setTab = useApp((s) => s.setTab);
  const order = overlay?.type === 'payment' ? overlay.order : null;

  const done = (o: Order) => {
    set({ ordersVersion: Date.now() });
    setTab('orders');
    open({ type: 'order', id: o.id });
  };

  return (
    <Sheet open={!!order} onClose={() => { if (order) done(order); }}>
      {order && (
        <div className="sheet-body" style={{ paddingTop: 28 }}>
          {overlay?.type === 'payment' && overlay.fresh && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 56 }}>🎉</div>
              <h2 className="p-title">{t.order_created}</h2>
              <p className="muted" style={{ margin: '4px 0 0' }}>#{order.number}</p>
            </div>
          )}
          <h3 style={{ marginBottom: 12 }}>{t.payment}</h3>
          <PaymentBlock order={order} onDone={done} />
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => done(order)}>{t.later}</button>
        </div>
      )}
    </Sheet>
  );
}
