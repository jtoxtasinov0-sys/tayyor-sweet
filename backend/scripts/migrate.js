// Faqat jadvallarni yaratish:  npm run migrate
const { migrate } = require('../src/database/migrate');
const db = require('../src/database/connection');

migrate()
  .then(() => console.log('✅ Baza tayyor'))
  .catch((e) => {
    console.error('❌', e.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
