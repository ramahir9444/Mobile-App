// ─────────────────────────────────────────────────────────────────
//  Oda Class — Backend API Server
//  Stack: Express.js + MongoDB Atlas + Twilio Verify (OTP)
// ─────────────────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

const { connectDB }       = require('./db/mongo');
const { initCollections } = require('./db/initCollections');
const authRoutes          = require('./routes/auth');
const studentRoutes       = require('./routes/students');
const orderRoutes         = require('./routes/orders');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ──────────────────────────────────────────
app.use(helmet());                 // sets secure HTTP headers
app.use(cors({
  origin: '*',                     // restrict to your domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json({ limit: '10mb' }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
connectDB()
  .then(async () => {
    await initCollections();          // ensure indexes exist
    app.listen(PORT, () => {
      console.log(`\n🚀  Oda Class API  →  http://localhost:${PORT}`);
      console.log(`    Health:       GET  /health`);
      console.log(`    Send OTP:     POST /api/auth/send-otp`);
      console.log(`    Verify OTP:   POST /api/auth/verify-otp`);
      console.log(`    Student:      GET  /api/students/phone/:phone`);
      console.log(`    Update:       PUT  /api/students/:id\n`);
    });
  })
  .catch((err) => {
    console.error('❌  Failed to start server:', err.message);
    process.exit(1);
  });
