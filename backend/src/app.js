const express = require('express'); const cors = require('cors'); const helmet = require('helmet');
const rateLimit = require('express-rate-limit'); const sanitize = require('express-mongo-sanitize'); const morgan = require('morgan');
const app = express();
app.use(helmet(), cors({ origin: process.env.CLIENT_URL || true }), express.json({ limit: '1mb' }), sanitize(), morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/super', require('./routes/super'));
app.use('/api/barber', require('./routes/barber'));
app.use('/api/customer', require('./routes/customer'));
app.get('/api/health', (q, r) => r.json({ ok: true }));
app.use((err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate: record already exists' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
});
module.exports = app;
