require('dotenv').config();

// Fail fast if critical env vars are missing
['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌  Missing required env variable: ${key}`);
    process.exit(1);
  }
});

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const AppError  = require('./utils/AppError');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
// In development allow any localhost port (Vite auto-increments when port is busy)
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_ORIGIN
  : /^http:\/\/localhost:\d+$/;

app.use(cors({ origin: corsOrigin, credentials: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan('dev'));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please retry in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts — please retry in 15 minutes.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ success: true, message: 'API is running.' }));
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/user',        require('./routes/user'));
app.use('/api/store-owner', require('./routes/storeOwner'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.all('*', (req, _, next) =>
  next(new AppError(`${req.method} ${req.originalUrl} not found.`, 404))
);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!err.isOperational) console.error('💥 Unexpected error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.isOperational ? err.message : 'Something went wrong.',
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  Server → http://localhost:${PORT}`));
