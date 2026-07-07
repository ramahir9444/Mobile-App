const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { sendOtp, verifyOtp } = require('../services/twilioService');
const { getDB } = require('../db/mongo');

const router = express.Router();

// Rate limiter: max 5 OTP requests per phone (or IP) per 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const phone = req.body?.phone;
    return phone ? `phone:${phone}` : `ip:${ipKeyGenerator(req)}`;
  },
  message: { success: false, error: 'Too many OTP requests. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── POST /api/auth/send-otp ────────────────────────────────────
// Body: { phone: "9974483435" }
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit phone number required' });
    }

    const result = await sendOtp(phone);
    return res.json(result);
  } catch (err) {
    console.error('[send-otp] Error:', err.message);
    if (err.message && (err.message.includes('unverified') || err.message.includes('Trial accounts'))) {
      return res.status(400).json({
        success: false,
        error: 'Twilio Trial limit: This phone number is not whitelisted. Please add it to your Twilio console (Verified Caller IDs) or verify it.'
      });
    }
    return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
  }
});

// ── POST /api/auth/verify-otp ────────────────────────────────
// Body: { phone: "9974483435", code: "123456" }
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'phone and code are required' });
    }

    // ── Step 1: Verify OTP via Twilio (or dev store) ──────────────
    const otpResult = await verifyOtp(phone, code);
    if (!otpResult.success) {
      return res.status(401).json(otpResult);
    }

    // ── Step 2: Upsert student (unique by phone) ──────────────────
    //   $setOnInsert  → runs ONLY when a NEW document is created
    //   $set          → runs always (updates lastLoginAt on every login)
    const db = getDB();
    const now = new Date();

    const result = await db.collection('students').findOneAndUpdate(
      { phone },                               // filter: find by phone
      {
        $setOnInsert: {
          phone,
          name:          'Student',            // student updates this later
          selectedClass: 'Class 6',
          profilePhoto:  null,
          email:         null,
          altPhone:      null,
          board:         null,
          state:         null,
          address:       null,
          enrollmentType: 'none',
          // Stats initialised at zero for new students
          totalClassesAttended: 0,
          totalQuizzesAttempted: 0,
          totalCorrectAnswers:   0,
          totalWrongAnswers:     0,
          createdAt: now,
        },
        $set: { lastLoginAt: now },            // always update login time
      },
      { upsert: true, returnDocument: 'after' }
    );

    const student = result;
    const isNewStudent = student.createdAt.getTime() === now.getTime();

    return res.json({
      success:    true,
      isNew:      isNewStudent,      // frontend can show welcome screen
      student: {
        _id:           student._id,
        name:          student.name,
        phone:         student.phone,
        selectedClass: student.selectedClass,
        profilePhoto:  student.profilePhoto  || null,
        email:         student.email         || null,
        enrollmentType: student.enrollmentType || 'none',
        totalClassesAttended:  student.totalClassesAttended,
        totalQuizzesAttempted: student.totalQuizzesAttempted,
      },
    });
  } catch (err) {
    console.error('[verify-otp] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Verification failed. Please try again.' });
  }
});

module.exports = router;
