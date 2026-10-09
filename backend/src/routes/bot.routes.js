// Hamma handlerlarni bitta joyga yig'ish
const bot = require('../core/bot');
const { botUser } = require('../middlewares/auth.middleware');
const start = require('../controllers/startController');
const adminBot = require('../controllers/adminBotController');

function registerBotRoutes() {
  bot.use(botUser);

  bot.start(start.start);
  bot.command('narxlar', start.prices);
  bot.command('buyurtmalar', start.myOrders);
  bot.command('til', start.askLang);
  bot.command('admin', adminBot.admin);
  bot.command('panel', adminBot.panel);
  bot.command('id', adminBot.myId);

  bot.action(/^lang:(uz|ru)$/, start.chooseLang);
  bot.action(/^ord:(\d+):(confirmed|cancelled|shipped|delivered)$/, adminBot.orderAction);

  bot.on('contact', start.contact);
  bot.hears(start.menuMatchers.prices, start.prices);
  bot.hears(start.menuMatchers.orders, start.myOrders);
  bot.hears(start.menuMatchers.contact, start.contactInfo);
  bot.hears(start.menuMatchers.lang, start.askLang);
  bot.on('photo', start.photo);
  bot.on('message', start.start);

  return bot;
}

const COMMANDS = {
  uz: [
    { command: 'start', description: "Bosh menyu" },
    { command: 'narxlar', description: 'Narxlar jadvali' },
    { command: 'buyurtmalar', description: 'Mening buyurtmalarim' },
    { command: 'til', description: "Tilni o'zgartirish" },
    { command: 'id', description: 'Mening Telegram ID raqamim' },
  ],
  ru: [
    { command: 'start', description: 'Главное меню' },
    { command: 'narxlar', description: 'Прайс-лист' },
    { command: 'buyurtmalar', description: 'Мои заказы' },
    { command: 'til', description: 'Сменить язык' },
    { command: 'id', description: 'Мой Telegram ID' },
  ],
};

module.exports = { registerBotRoutes, COMMANDS };
