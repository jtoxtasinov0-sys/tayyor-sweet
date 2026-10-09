// Xatoliklarni yozib borish
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

module.exports = {
  info: (...a) => console.log(`[${stamp()}] INFO `, ...a),
  warn: (...a) => console.warn(`[${stamp()}] WARN `, ...a),
  error: (...a) => console.error(`[${stamp()}] ERROR`, ...a),
};
