const crypto = require('crypto');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const pick = (o, keys) => keys.reduce((a, k) => (o[k] !== undefined ? { ...a, [k]: o[k] } : a), {});
const need = (o, keys) => { const m = keys.filter((k) => !o[k] && o[k] !== 0); if (m.length) { const e = new Error('Missing: ' + m.join(', ')); e.status = 400; throw e; } };
const rand = (n) => crypto.randomBytes(n).toString('hex');
const today = () => new Date().toISOString().slice(0, 10);
const formatTime12 = (min) => {
  if (min === undefined || min === null) return '';
  const m = Number(min);
  const h24 = Math.floor(m / 60);
  const mins = m % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mins).padStart(2, '0')} ${ampm}`;
};
module.exports = { wrap, pick, need, rand, today, formatTime12 };
