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

module.exports = router;
