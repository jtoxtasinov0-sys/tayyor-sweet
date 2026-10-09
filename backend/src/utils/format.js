// Yordamchi funksiyalar: pul, sana, buyurtma raqami, holatlar
const config = require('../config/default');

const won = (n) => `${Number(n || 0).toLocaleString('ru-RU').replace(/ /g, ' ')} ₩`;

function orderNumber(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const d = `${String(date.getFullYear()).slice(2)}${p(date.getMonth() + 1)}${p(date.getDate())}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${config.shop.orderPrefix}-${d}-${rnd}`;
}

const STATUSES = ['pending_payment', 'receipt_sent', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_TEXT = {
  uz: {
    pending_payment: "⏳ To'lov kutilmoqda",
    receipt_sent: '🧾 Chek yuborildi',
    confirmed: '✅ Tasdiqlandi',
    shipped: "🚚 Jo'natildi",
    delivered: '🎉 Yetkazildi',
    cancelled: '❌ Bekor qilindi',
  },
  ru: {
    pending_payment: '⏳ Ожидает оплаты',
    receipt_sent: '🧾 Чек отправлен',
    confirmed: '✅ Подтверждён',
    shipped: '🚚 Отправлен',
    delivered: '🎉 Доставлен',
    cancelled: '❌ Отменён',
  },
};

const DELIVERY_TEXT = {
  uz: { taekbae: '📦 Pochta (택배)', bus: '🚌 버스터미널', pickup: "🏠 Olib ketish" },
  ru: { taekbae: '📦 Почта (택배)', bus: '🚌 버스터미널', pickup: '🏠 Самовывоз' },
};

const COURIERS = {
  cj: { name: 'CJ대한통운', url: 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' },
  epost: { name: '우체국택배', url: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' },
  hanjin: { name: '한진택배', url: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=' },
  lotte: { name: '롯데택배', url: 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=' },
  logen: { name: '로젠택배', url: 'https://www.ilogen.com/web/personal/trace/' },
};

const trackingUrl = (courier, num) =>
  COURIERS[courier] && num ? COURIERS[courier].url + encodeURIComponent(num) : null;

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

module.exports = { won, orderNumber, STATUSES, STATUS_TEXT, DELIVERY_TEXT, COURIERS, trackingUrl, esc };
