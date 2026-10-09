// Backend (Bot) ga so'rov yuborish
import type { Bootstrap, Me, Order, DeliveryMethod } from './types';

// Bo'sh bo'lsa — o'sha domen (/api/* next.config.mjs orqali backendga proksi qilinadi)
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export const imageUrl = (id?: number | null) => (id ? `${API_URL}/api/images/${id}` : '/images/logo.png');

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: Record<string, unknown>) {
    super(message);
  }
}

function initData(): string {
  if (typeof window === 'undefined') return '';
  return window.Telegram?.WebApp?.initData || '';
}

// Saytdan (Telegramsiz) kirganda: brauzerda saqlanadigan tasodifiy "mehmon" kaliti.
// Buyurtmalar shu kalitga bog'lanadi — shu brauzerda "Buyurtmalarim" ko'rinadi.
const GUEST_KEY = 'ts-guest';
let guest = '';

function guestToken(): string {
  if (guest) return guest;
  try {
    guest = localStorage.getItem(GUEST_KEY) || '';
  } catch {}
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(guest)) {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    guest = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    try {
      localStorage.setItem(GUEST_KEY, guest);
    } catch {}
  }
  return guest;
}

async function request<T>(path: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  else if (initData()) headers['X-Telegram-Init-Data'] = initData();
  else if (typeof window !== 'undefined') headers['X-Guest-Token'] = guestToken();
  const res = await fetch(API_URL + path, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error || res.statusText, data);
  return data as T;
}

const json = (body: unknown) => JSON.stringify(body);

export interface CheckoutPayload {
  items: { product_id: number; qty: number; variant?: string | null; color?: string | null }[];
  delivery_method: DeliveryMethod;
  customer_name: string;
  phone: string;
  address?: string;
  postal_code?: string;
  desired_date?: string;
  comment?: string;
}

export const api = {
  bootstrap: () => request<Bootstrap>('/api/bootstrap'),
  me: () => request<Me>('/api/me'),
  updateMe: (d: Partial<Pick<Me, 'lang' | 'phone'>>) => request<Me>('/api/me', { method: 'PATCH', body: json(d) }),
  createOrder: (d: CheckoutPayload) => request<Order>('/api/orders', { method: 'POST', body: json(d) }),
  orders: () => request<Order[]>('/api/orders'),
  order: (id: number) => request<Order>(`/api/orders/${id}`),
  uploadReceipt: (id: number, file: Blob) => {
    const fd = new FormData();
    fd.append('receipt', file, 'receipt.jpg');
    return request<Order>(`/api/orders/${id}/receipt`, { method: 'POST', body: fd });
  },
};

// Admin panel uchun umumiy so'rov
export const adminRequest = <T>(path: string, token: string, opts: RequestInit = {}) =>
  request<T>(`/api/admin${path}`, { ...opts, token });

export const adminLogin = (body: { password?: string; initData?: string }) =>
  request<{ token: string }>('/api/admin/login', { method: 'POST', body: json(body), token: 'none' });
