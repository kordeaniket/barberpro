const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// Cached database connection for serverless deployments (Vercel)
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/barberpro';
  await mongoose.connect(uri);
  isConnected = true;
};

// Security, CORS & parsing middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins or custom origins in multi-tenant SaaS
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitize());
app.use(morgan('dev'));

// Ensure DB is connected before processing API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ message: 'Database connection failed: ' + err.message });
  }
});

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/super', require('./routes/super'));
app.use('/api/barber', require('./routes/barber'));
app.use('/api/customer', require('./routes/customer'));

// Automated 1-hour background WhatsApp reminder runner
const { process1HourReminders } = require('./services/reminders');
let reminderTimerStarted = false;
if (!reminderTimerStarted && process.env.NODE_ENV !== 'test') {
  reminderTimerStarted = true;
  setInterval(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await process1HourReminders();
      }
    } catch {
      // background interval
    }
  }, 2 * 60 * 1000);
}

app.get('/api/health', (q, r) => r.json({ ok: true, timestamp: new Date().toISOString() }));
app.get('/', (q, r) => r.json({ message: 'BarberPro API Server is running', ok: true }));

app.use((err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate: record already exists' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
});

module.exports = app;
