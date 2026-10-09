// Bot instansiyasini yaratish
const { Telegraf } = require('telegraf');
const config = require('../config/default');
const logger = require('../utils/logger');

if (!config.bot.token) logger.error('BOT_TOKEN topilmadi. backend/.env faylini to\'ldiring.');

const bot = new Telegraf(config.bot.token || 'missing-token', { handlerTimeout: 30_000 });

bot.catch((err, ctx) => {
  logger.error(`Bot xatosi (${ctx.updateType}):`, err.message);
});

module.exports = bot;
