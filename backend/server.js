// ─────────────────────────────────────────────────────────────────
//  Oda Class — Backend API Server
//  Stack: Express.js + MongoDB Atlas + Twilio Verify (OTP)
// ─────────────────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const cors    = require('cors');

const { connectDB }       = require('./db/mongo');
const { initCollections } = require('./db/initCollections');
const authRoutes          = require('./routes/auth');
const studentRoutes       = require('./routes/students');
const orderRoutes         = require('./routes/orders');
const homepageRoutes      = require('./routes/homepage');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Body Parser Middleware ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Request Logger Middleware ────────────────────────────────────
app.use((req, res, next) => {
  const bodyStr = req.body ? JSON.stringify(req.body) : '';
  console.log(`[${req.method}] ${req.path} - Body:`, bodyStr.slice(0, 100) + (bodyStr.length > 100 ? '...' : ''));
  next();
});

// ── Security Middleware ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));                 // sets secure HTTP headers
app.use(cors({
  origin: '*',                     // restrict to your domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
}));

// ── Routes ───────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'Oda Class API',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth',     authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/homepage-configs', homepageRoutes);

// ── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Boot ─────────────────────────────────────────────────────────
const startExpressServer = () => {
  app.listen(PORT, () => {
    console.log(`\n🚀  Oda Class API  →  http://localhost:${PORT}`);
    console.log(`    Health:       GET  /health`);
    console.log(`    Send OTP:     POST /api/auth/send-otp`);
    console.log(`    Verify OTP:   POST /api/auth/verify-otp`);
    console.log(`    Student:      GET  /api/students/phone/:phone`);
    console.log(`    Update:       PUT  /api/students/:id\n`);
  });
};

connectDB()
  .then(async () => {
    try {
      await initCollections();          // ensure indexes exist
    } catch (indexErr) {
      console.error('⚠️  Failed to initialize indexes:', indexErr.message);
    }
    startExpressServer();
  })
  .catch((err) => {
    console.error('❌  Failed to connect to MongoDB Atlas:', err.message);
    console.log('⚠️  Starting Express server anyway in offline/bypass mode. Please verify your MongoDB Atlas IP Access List (whitelist).');
    startExpressServer();
  });
