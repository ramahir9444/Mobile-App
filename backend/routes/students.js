const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db/mongo');

const router = express.Router();

// GET /api/students/phone/:phone
router.get('/phone/:phone', async (req, res) => {
  try {
    const db = getDB();
    const student = await db.collection('students').findOne({ phone: req.params.phone });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id  — update profile
router.put('/:id', async (req, res) => {
  try {
    const { name, selectedClass, profilePhoto, email, altPhone, board, state, address } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, selectedClass, profilePhoto, email, altPhone, board, state, address, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/students/:id/upload-avatar — receive base64 photo, save to file system, return real URL
router.post('/:id/upload-avatar', async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: 'base64 image data required' });
    }

    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const studentId = req.params.id;
    const filename = `${studentId}-avatar-${Date.now()}.png`; // cache busting filename
    const filePath = path.join(uploadsDir, filename);

    // Decode and save base64 buffer to disk
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filePath, buffer);

    const host = req.headers.host || 'localhost:3001';
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const avatarUrl = `${isHttps ? 'https' : 'http'}://${host}/uploads/${filename}`;

    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      { _id: new ObjectId(studentId) },
      { $set: { profilePhoto: avatarUrl, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, avatarUrl, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
