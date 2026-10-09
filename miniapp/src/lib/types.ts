export type Lang = 'uz' | 'ru';

export interface Frame { x: number; y: number; zoom: number }
export interface Variant { name: string; price: number }
export interface Color { name: string; hex: string }
export interface SizeRow { size: string; diameter?: string; weight?: string; servings?: string }

export interface Category {
  id: number;
  name_uz: string;
  name_ru: string | null;
  emoji: string | null;
  sort: number;
  active: boolean;
  products_count?: number;
}

export interface Product {
  id: number;
  category_id: number | null;
  category_name?: string | null;
  name_uz: string;
  name_ru: string | null;
  description_uz: string | null;
  description_ru: string | null;
  unit_uz: string | null;
  unit_ru: string | null;
  price: number;
  old_price: number | null;
  image_id: number | null;
  gallery: number[];
  frame: Frame;
  variants: Variant[];
  colors: Color[];
  size_table: SizeRow[];
  badge: 'hit' | 'new' | 'sale' | null;
  preorder_days: number;
  in_stock: boolean;
  active: boolean;
  sort: number;
  source?: string | null;
}

export interface Story {
  id: number;
  title: string | null;
  text: string | null;
  image_id: number | null;
  cover_id: number | null;
  product_id: number | null;
  product_frame?: Frame | null;
  active: boolean;
  sort: number;
}

export interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  image_id: number | null;
  cover_id: number | null;
  product_id: number | null;
  category_id: number | null;
  active: boolean;
  sort: number;
}

export interface ShopSettings {
  name: string;
  title?: string;
  short_name: string;
  instagram?: string;
  address?: string;
  phone?: string;
  owner_link?: string;
  working_hours?: string;
  about_uz?: string;
  about_ru?: string;
  bot_username?: string;
}

export interface PaymentSettings {
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  note_uz?: string;
  note_ru?: string;
}

export interface DeliverySettings {
  taekbae_fee: number;
  bus_fee: number;
  pickup_fee: number;
  free_from: number;
  min_order: number;
  taekbae_note_uz?: string;
  bus_note_uz?: string;
  pickup_note_uz?: string;
}

export interface AppSettings {
  announcement_uz?: string;
  announcement_ru?: string;
  onboarding?: boolean;
}

export interface Bootstrap {
  shop: ShopSettings;
  payment: PaymentSettings;
  delivery: DeliverySettings;
  app: AppSettings;
  categories: Category[];
  products: Product[];
  stories: Story[];
  banners: Banner[];
}

export type OrderStatus = 'pending_payment' | 'receipt_sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryMethod = 'taekbae' | 'bus' | 'pickup';

export interface OrderItem {
  product_id: number;
  name: string;
  variant: string | null;
  color: string | null;
  unit: string | null;
  price: number;
  qty: number;
  image_id: number | null;
}

export interface Order {
  id: number;
  number: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  customer_name: string;
  phone: string;
  address: string | null;
  postal_code: string | null;
  desired_date: string | null;
  comment: string | null;
  receipt_image_id: number | null;
  courier: string | null;
  courier_name?: string | null;
  tracking_number: string | null;
  tracking_url?: string | null;
  admin_note: string | null;
  history: { status: OrderStatus; at: string }[];
  created_at: string;
  updated_at: string;
  username?: string | null;
  lang?: string | null;
}

export interface Me {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  lang: Lang | null;
  is_admin: boolean;
  created_at: string;
}
