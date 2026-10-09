// Asosiy ishga tushirish fayli: API + Telegram bot
const express = require('express');
const cors = require('cors');
const config = require('./config/default');
const logger = require('./utils/logger');
const { migrate } = require('./database/migrate');
const { registerBotRoutes, COMMANDS } = require('./routes/bot.routes');
const api = require('./routes/api.routes');

const app = express();
app.set('trust proxy', true);

app.use(
  cors({
    origin: (origin, cb) => {
      // Ro'yxat bo'sh bo'lsa — hammaga ruxsat (initData baribir tekshiriladi)
      if (!origin || !config.corsOrigins.length || config.corsOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ name: config.shop.name, ok: true }));
app.use('/api', api);

const bot = registerBotRoutes();
const webhookPath = `/telegram/${config.bot.webhookSecret || 'hook'}`;
if (!config.bot.usePolling) app.use(bot.webhookCallback(webhookPath));

app.use((err, req, res, next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) logger.error(req.method, req.path, err);
  res.status(status).json({ error: status >= 500 ? 'server_error' : err.message });
});

async function setupBot() {
  if (!config.bot.token) return;
  const me = await bot.telegram.getMe();
  bot.botInfo = me;
  config.bot.username = config.bot.username || me.username;
  await bot.telegram.setMyCommands(COMMANDS.uz);
  await bot.telegram.setMyCommands(COMMANDS.ru, { language_code: 'ru' });
  if (config.miniappUrl.startsWith('https://')) {
    await bot.telegram.setChatMenuButton({
      menuButton: { type: 'web_app', text: "🛍 Do'kon", web_app: { url: config.miniappUrl } },
    });
  }

  if (config.bot.usePolling) {
    await bot.telegram.deleteWebhook({ drop_pending_updates: false });
    bot.launch({ dropPendingUpdates: false }).catch((e) => logger.error('Polling xatosi:', e.message));
    logger.info(`🤖 @${me.username} polling rejimida ishlayapti`);
  } else {
    const url = config.bot.publicUrl + webhookPath;
    await bot.telegram.setWebhook(url, { allowed_updates: ['message', 'callback_query'] });
    logger.info(`🤖 @${me.username} webhook: ${config.bot.publicUrl}/telegram/***`);
  }
}

async function main() {
  await migrate();
  logger.info('✅ Baza tayyor');
  app.listen(config.port, () => logger.info(`🚀 API: http://localhost:${config.port}`));
  await setupBot().catch((e) => logger.error('Botni sozlab bo‘lmadi:', e.message));
}

main().catch((e) => {
  logger.error('Ishga tushmadi:', e);
  process.exit(1);
});

const stop = (sig) => {
  try {
    bot.stop(sig);
  } catch {}
  process.exit(0);
};
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
