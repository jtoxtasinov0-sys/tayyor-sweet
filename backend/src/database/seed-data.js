// tayyor_sweet_telegram_app.html faylidagi do'kon mahsulotlari (narxlar postlar izohidan olingan)
// file — rasmlar/ papkadagi fayl nomi

const categories = [
  { key: 'Tortlar', name_uz: 'Tortlar', name_ru: 'Торты', emoji: '🎂', sort: 1 },
  { key: 'Shirinliklar', name_uz: 'Shirinliklar', name_ru: 'Сладости', emoji: '🧁', sort: 2 },
  { key: 'Yarim tayyor', name_uz: 'Yarim tayyor', name_ru: 'Полуфабрикаты', emoji: '🥟', sort: 3 },
];

const cakeColors = [
  { name: 'Oq', hex: '#FFFFFF' },
  { name: 'Pushti', hex: '#F8A0D0' },
  { name: 'Shokoladli', hex: '#5B3A29' },
];

const products = [
  { file: '01_paxlava.jpg', name_uz: 'Paxlava', name_ru: 'Пахлава', cat: 'Shirinliklar', price: 9000, unit_uz: '2 dona', unit_ru: '2 шт' },
  { file: '02_sinnabon.jpg', name_uz: 'Sinnabon', name_ru: 'Синнабон', cat: 'Shirinliklar', price: 12000, unit_uz: '4 dona', unit_ru: '4 шт' },
  {
    file: '03_mevali_tort.jpg', name_uz: 'Mevali tort', name_ru: 'Фруктовый торт', cat: 'Tortlar', price: 45000,
    unit_uz: 'butun tort', unit_ru: 'целый торт', description_uz: '35 000 ₩ dan boshlanadi',
    description_ru: 'От 35 000 ₩', variants: [{ name: 'Mini', price: 35000 }, { name: 'Standart', price: 45000 }],
  },
  { file: '04_kiyevskiy_tort.jpg', name_uz: 'Kiyevskiy tort', name_ru: 'Киевский торт', cat: 'Tortlar', price: 60000, unit_uz: 'butun tort', unit_ru: 'целый торт' },
  { file: '05_brauni.jpg', name_uz: 'Brauni', name_ru: 'Брауни', cat: 'Shirinliklar', price: 8000, unit_uz: '1 porsiya', unit_ru: '1 порция' },
  {
    file: '06_rafaello_tort.jpg', name_uz: 'Rafaello torti', name_ru: 'Торт Рафаэлло', cat: 'Tortlar', price: 55000,
    unit_uz: 'butun tort', unit_ru: 'целый торт',
    description_uz: "35 000 / 50 000 o'lchamlari ham bor; usti va ichi buyurtmaga qarab",
    description_ru: 'Есть размеры 35 000 / 50 000; верх и начинка — по заказу',
    variants: [{ name: 'Kichik', price: 35000 }, { name: "O'rta", price: 50000 }, { name: 'Katta', price: 55000 }],
    colors: cakeColors,
  },
  { file: '07_san_sebastyan_bolak.jpg', name_uz: "San-Sebastyan (bo'lak)", name_ru: 'Сан-Себастьян (кусок)', cat: 'Shirinliklar', price: 7000, unit_uz: "1 bo'lak", unit_ru: '1 кусок' },
  { file: '08_kok_somsa.jpg', name_uz: "Ko'k somsa", name_ru: 'Сомса с зеленью', cat: 'Yarim tayyor', price: 30000, unit_uz: '10 dona', unit_ru: '10 шт' },
  { file: '09_trayfl.jpg', name_uz: 'Trayfl mevali', name_ru: 'Трайфл фруктовый', cat: 'Shirinliklar', price: 8000, unit_uz: '1 stakan', unit_ru: '1 стакан' },
  {
    file: '10_medovik.jpg', name_uz: 'Medovik', name_ru: 'Медовик', cat: 'Tortlar', price: 30000,
    unit_uz: 'butun tort', unit_ru: 'целый торт', description_uz: 'Kattasi 30 000 ₩ dan; kichigi 6 000 ₩',
    description_ru: 'Большой от 30 000 ₩; маленький 6 000 ₩',
    variants: [{ name: 'Kichik', price: 6000 }, { name: 'Katta', price: 30000 }],
  },
  {
    file: '11_snikers_tort.jpg', name_uz: 'Snikers torti', name_ru: 'Торт Сникерс', cat: 'Tortlar', price: 45000,
    unit_uz: 'butun tort', unit_ru: 'целый торт', description_uz: "Karamel, yeryong'oq, qulupnay; narxi kattaligiga qarab",
    description_ru: 'Карамель, арахис, клубника; цена зависит от размера',
  },
  { file: '12_spartak.jpg', name_uz: 'Spartak', name_ru: 'Спартак', cat: 'Shirinliklar', price: 12000, unit_uz: '390–400 g', unit_ru: '390–400 г' },
  { file: '13_shokoladli_medovik.jpg', name_uz: 'Shokoladli medovik', name_ru: 'Шоколадный медовик', cat: 'Tortlar', price: 50000, unit_uz: 'butun tort', unit_ru: 'целый торт' },
  {
    file: '14_afgoncha_napoleon.jpg', name_uz: "Afg'oncha napoleon", name_ru: 'Афганский наполеон', cat: 'Tortlar', price: 50000,
    unit_uz: '20 sm', unit_ru: '20 см', size_table: [{ size: 'Standart', diameter: '20 sm', weight: '', servings: '' }],
  },
  { file: '15_matilda.jpg', name_uz: 'Matilda', name_ru: 'Матильда', cat: 'Shirinliklar', price: 8000, unit_uz: "1 bo'lak", unit_ru: '1 кусок' },
  { file: '16_molochnaya_devochka.jpg', name_uz: 'Molochnaya devochka', name_ru: 'Молочная девочка', cat: 'Shirinliklar', price: 9000, unit_uz: "1 bo'lak", unit_ru: '1 кусок' },
  {
    file: '17_san_sebastyan_tort.jpg', name_uz: 'San-Sebastyan tort', name_ru: 'Торт Сан-Себастьян', cat: 'Tortlar', price: 50000,
    unit_uz: 'butun tort', unit_ru: 'целый торт', description_uz: 'Mini — 35 000 ₩', description_ru: 'Мини — 35 000 ₩',
    variants: [{ name: 'Mini', price: 35000 }, { name: 'Standart', price: 50000 }],
  },
  {
    file: '18_tvorojniy.jpg', name_uz: 'Tvorojniy', name_ru: 'Творожный', cat: 'Shirinliklar', price: 7000,
    unit_uz: "1 bo'lak", unit_ru: '1 кусок', description_uz: "Butuni 40 000 ₩", description_ru: 'Целый 40 000 ₩',
    variants: [{ name: "1 bo'lak", price: 7000 }, { name: 'Butun', price: 40000 }],
  },
  { file: '19_chuchvara.jpg', name_uz: 'Chuchvara', name_ru: 'Чучвара', cat: 'Yarim tayyor', price: 17000, unit_uz: '1 kg', unit_ru: '1 кг' },
  { file: '20_rogalik.jpg', name_uz: 'Rogalik', name_ru: 'Рогалик', cat: 'Shirinliklar', price: 38000, unit_uz: '1 kg', unit_ru: '1 кг' },
  { file: '21_yogli_patir.jpg', name_uz: "Yog'li patir", name_ru: 'Масляный патыр', cat: 'Yarim tayyor', price: 10000, unit_uz: '2 dona', unit_ru: '2 шт' },
  { file: '22_manti.jpg', name_uz: 'Manti', name_ru: 'Манты', cat: 'Yarim tayyor', price: 20000, unit_uz: '10 dona', unit_ru: '10 шт' },
  { file: '23_maxroviy_tort.jpg', name_uz: 'Maxroviy tort', name_ru: 'Махровый торт', cat: 'Tortlar', price: 45000, unit_uz: 'butun tort', unit_ru: 'целый торт' },
  { file: '24_chizkeyk_bolak.jpg', name_uz: "Chizkeyk (bo'lak)", name_ru: 'Чизкейк (кусок)', cat: 'Shirinliklar', price: 8000, unit_uz: "1 bo'lak", unit_ru: '1 кусок' },
];

module.exports = { categories, products };
