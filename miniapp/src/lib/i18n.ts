import type { Lang, OrderStatus, DeliveryMethod } from './types';

const uz = {
  home: 'Bosh sahifa', catalog: 'Katalog', cart: 'Savat', orders: 'Buyurtmalar', profile: 'Profil',
  hello: 'Salom', search: 'Tort, somsa, manti...', stories: 'Storylar', categories: 'Kategoriyalar',
  popular: 'Hammasi', all: 'Hammasi', see_all: "Barchasi", add: "Qo'shish", add_to_cart: "Savatga qo'shish",
  added: "Savatga qo'shildi", in_cart: 'Savatda', out_of_stock: 'Tugagan', order_now: 'Buyurtma berish',
  size: "O'lcham", color: 'Bezak rangi', size_table: "O'lcham jadvali", diameter: 'Diametr', weight: "Og'irlik",
  servings: 'Kishi', tap_zoom: '🔍 Kattalashtirish', zoom_tip: "Ikki marta bosing yoki barmoq bilan kattalashtiring",
  preorder: (d: number) => `Bu mahsulot ${d}–${d + 1} kun oldin buyurtma qilinadi`,
  description: 'Tavsif', qty: 'Soni', total: 'Jami', subtotal: 'Mahsulotlar', delivery: 'Yetkazish', free: 'Bepul',
  cart_empty: "Savat bo'sh", cart_empty_text: "Mazali narsalarni tanlang — biz tayyorlab beramiz 🍰", go_shop: "Xarid qilish",
  upsell: "Bunga ham qo'shing 💕", remove: "O'chirish", checkout: 'Rasmiylashtirish', clear: 'Tozalash',
  free_left: (s: string) => `Bepul 택배 uchun yana ${s}`, free_ok: '🎉 택배 bepul!',
  your_info: "Ma'lumotlaringiz", name: 'Ism', phone: 'Telefon', address: 'Manzil (koreyscha)', postal: 'Pochta indeksi (우편번호)',
  date: 'Qachonga kerak?', comment: 'Izoh', comment_ph: 'Masalan: tortga yozuv, qo\'ng\'iroq qilish vaqti...',
  method: 'Yetkazish usuli', taekbae: 'Pochta (택배)', bus: '버스터미널', pickup: 'Olib ketish',
  taekbae_d: "Koreya bo'ylab 1–2 kun", bus_d: 'Kremli tortlar uchun', pickup_d: "Do'kondan o'zingiz olasiz",
  confirm_order: 'Buyurtmani tasdiqlash', required: "Majburiy maydonlarni to'ldiring",
  payment: "To'lov", pay_to: "Quyidagi hisobga o'tkazing", bank: 'Bank', account: 'Hisob raqami', holder: 'Egasi',
  amount: "To'lov summasi", copy: 'Nusxa', copied: 'Nusxa olindi', upload_receipt: 'Chekni yuklash',
  upload_hint: "To'lov skrinshotini tanlang", send_receipt: 'Chekni yuborish', receipt_sent: '🧾 Chek yuborildi! Tez orada tasdiqlaymiz.',
  bank_missing: "Rekvizitlar hali kiritilmagan — egasiga yozing", later: "Keyinroq to'layman",
  order_created: 'Buyurtma qabul qilindi!', no_orders: "Hali buyurtmalar yo'q", no_orders_text: 'Birinchi buyurtmangizni bering 🍰',
  order: 'Buyurtma', items: 'Mahsulotlar', track: 'Kuzatish', tracking: 'Trek raqami', status: 'Holat',
  receipt: 'Chek', pay_now: "To'lash", member: 'MEMBER', member_since: "A'zo", orders_count: 'Buyurtmalar', spent: 'Xarid',
  language: 'Til', contact_owner: 'Egasiga yozish', about: "Do'kon haqida", address_shop: 'Manzil', hours: 'Ish vaqti',
  instagram: 'Instagram', admin_panel: 'Admin panel', back: 'Orqaga', retry: 'Qayta urinish', error: 'Xatolik yuz berdi',
  onb: [
    { e: '🎂', t: 'Uy tortlari', d: "Medovik, Rafaello, Napoleon — buyurtma asosida 2–3 kunda tayyorlaymiz" },
    { e: '🥟', t: 'Yarim tayyor', d: 'Chuchvara, manti, somsa — muzlatkichdan to qozongacha 15 daqiqa' },
    { e: '🚚', t: "Koreya bo'ylab 택배", d: "Buyurtma bering, to'lang, chekni yuboring — qolganini biz qilamiz" },
  ],
  next: 'Keyingi', start: 'Boshlash', skip: "O'tkazish",
};

type Dict = typeof uz;

const ru: Dict = {
  home: 'Главная', catalog: 'Каталог', cart: 'Корзина', orders: 'Заказы', profile: 'Профиль',
  hello: 'Привет', search: 'Торт, сомса, манты...', stories: 'Истории', categories: 'Категории',
  popular: 'Все', all: 'Все', see_all: 'Все', add: 'Добавить', add_to_cart: 'В корзину',
  added: 'Добавлено в корзину', in_cart: 'В корзине', out_of_stock: 'Нет в наличии', order_now: 'Заказать',
  size: 'Размер', color: 'Цвет декора', size_table: 'Таблица размеров', diameter: 'Диаметр', weight: 'Вес',
  servings: 'Персон', tap_zoom: '🔍 Увеличить', zoom_tip: 'Двойной тап или жест щипка для увеличения',
  preorder: (d: number) => `Этот товар заказывается за ${d}–${d + 1} дня`,
  description: 'Описание', qty: 'Кол-во', total: 'Итого', subtotal: 'Товары', delivery: 'Доставка', free: 'Бесплатно',
  cart_empty: 'Корзина пуста', cart_empty_text: 'Выберите вкусное — мы приготовим 🍰', go_shop: 'К покупкам',
  upsell: 'Добавьте к заказу 💕', remove: 'Удалить', checkout: 'Оформить', clear: 'Очистить',
  free_left: (s: string) => `До бесплатной 택배 ещё ${s}`, free_ok: '🎉 택배 бесплатно!',
  your_info: 'Ваши данные', name: 'Имя', phone: 'Телефон', address: 'Адрес (на корейском)', postal: 'Индекс (우편번호)',
  date: 'К какой дате?', comment: 'Комментарий', comment_ph: 'Например: надпись на торте, время звонка...',
  method: 'Способ доставки', taekbae: 'Почта (택배)', bus: '버스터미널', pickup: 'Самовывоз',
  taekbae_d: 'По всей Корее 1–2 дня', bus_d: 'Для кремовых тортов', pickup_d: 'Заберёте сами из магазина',
  confirm_order: 'Подтвердить заказ', required: 'Заполните обязательные поля',
  payment: 'Оплата', pay_to: 'Переведите на этот счёт', bank: 'Банк', account: 'Номер счёта', holder: 'Получатель',
  amount: 'Сумма к оплате', copy: 'Копировать', copied: 'Скопировано', upload_receipt: 'Загрузить чек',
  upload_hint: 'Выберите скриншот оплаты', send_receipt: 'Отправить чек', receipt_sent: '🧾 Чек отправлен! Скоро подтвердим.',
  bank_missing: 'Реквизиты ещё не указаны — напишите владельцу', later: 'Оплачу позже',
  order_created: 'Заказ принят!', no_orders: 'Заказов пока нет', no_orders_text: 'Сделайте первый заказ 🍰',
  order: 'Заказ', items: 'Товары', track: 'Отследить', tracking: 'Трек-номер', status: 'Статус',
  receipt: 'Чек', pay_now: 'Оплатить', member: 'MEMBER', member_since: 'С нами с', orders_count: 'Заказов', spent: 'Покупки',
  language: 'Язык', contact_owner: 'Написать владельцу', about: 'О магазине', address_shop: 'Адрес', hours: 'Часы работы',
  instagram: 'Instagram', admin_panel: 'Админ-панель', back: 'Назад', retry: 'Повторить', error: 'Произошла ошибка',
  onb: [
    { e: '🎂', t: 'Домашние торты', d: 'Медовик, Рафаэлло, Наполеон — готовим под заказ за 2–3 дня' },
    { e: '🥟', t: 'Полуфабрикаты', d: 'Чучвара, манты, сомса — из морозилки на стол за 15 минут' },
    { e: '🚚', t: '택배 по всей Корее', d: 'Закажите, оплатите, отправьте чек — остальное сделаем мы' },
  ],
  next: 'Далее', start: 'Начать', skip: 'Пропустить',
};

export const DICT: Record<Lang, Dict> = { uz, ru };

export const STATUS: Record<Lang, Record<OrderStatus, string>> = {
  uz: {
    pending_payment: "To'lov kutilmoqda", receipt_sent: 'Chek yuborildi', confirmed: 'Tasdiqlandi',
    shipped: "Jo'natildi", delivered: 'Yetkazildi', cancelled: 'Bekor qilindi',
  },
  ru: {
    pending_payment: 'Ожидает оплаты', receipt_sent: 'Чек отправлен', confirmed: 'Подтверждён',
    shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён',
  },
};

export const STATUS_FLOW: OrderStatus[] = ['pending_payment', 'receipt_sent', 'confirmed', 'shipped', 'delivered'];

export const METHOD_ICON: Record<DeliveryMethod, string> = { taekbae: '📦', bus: '🚌', pickup: '🏠' };
