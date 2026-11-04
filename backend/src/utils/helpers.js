const crypto = require('crypto');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const pick = (o, keys) => keys.reduce((a, k) => (o[k] !== undefined ? { ...a, [k]: o[k] } : a), {});
const need = (o, keys) => { const m = keys.filter((k) => !o[k] && o[k] !== 0); if (m.length) { const e = new Error('Missing: ' + m.join(', ')); e.status = 400; throw e; } };
const rand = (n) => crypto.randomBytes(n).toString('hex');
const today = () => new Date().toISOString().slice(0, 10);
module.exports = { wrap, pick, need, rand, today };
