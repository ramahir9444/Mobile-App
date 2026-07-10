const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db/mongo');

const router = express.Router();

// GET /api/students (fetch all students for admin panel)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const students = await db.collection('students')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch all paid orders to compute enrollment status dynamically
    const paidOrders = await db.collection('orders')
      .find({ status: 'paid' })
      .toArray();

    // Map computed enrollmentType to students list
    const computedStudents = students.map(student => {
      const studentPaidOrders = paidOrders.filter(o => o.studentPhone === student.phone);
      
      const hasMaster = studentPaidOrders.some(o => 
        o.courseTitle.toLowerCase().includes('master') || 
        o.courseTitle.toLowerCase().includes('syllabus') || 
        Number(o.amount) >= 500
      );
      
      const hasBooster = studentPaidOrders.some(o => 
        o.courseTitle.toLowerCase().includes('booster') || 
        o.courseTitle.toLowerCase().includes('demo') || 
        o.courseTitle.toLowerCase().includes('6-day') || 
        o.courseTitle.toLowerCase().includes('6 day') || 
        Number(o.amount) < 500
      );

      const computedEnrollment = hasMaster ? 'master' : (hasBooster ? 'demo' : 'none');

      return {
        ...student,
        enrollmentType: computedEnrollment
      };
    });

    res.json({ success: true, count: computedStudents.length, data: computedStudents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

const buildIdQuery = (idStr) => {
  try {
    const { ObjectId } = require('mongodb');
    if (ObjectId.isValid(idStr)) {
      return {
        $or: [
          { _id: idStr },
          { _id: new ObjectId(idStr) }
        ]
      };
    }
  } catch (err) {
    // fallback
  }
  return { _id: idStr };
};

// PUT /api/students/:id  — update profile
router.put('/:id', async (req, res) => {
  try {
    const fields = ['name', 'selectedClass', 'profilePhoto', 'email', 'altPhone', 'board', 'state', 'address'];
    const updateDoc = {};

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updateDoc.updatedAt = new Date();

    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id/name
router.put('/:id/name', async (req, res) => {
  try {
    const { name } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id/email
router.put('/:id/email', async (req, res) => {
  try {
    const { email } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: { email, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id/alt-phone
router.put('/:id/alt-phone', async (req, res) => {
  try {
    const { altPhone } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: { altPhone, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id/board
router.put('/:id/board', async (req, res) => {
  try {
    const { board } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: { board, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id/state
router.put('/:id/state', async (req, res) => {
  try {
    const { state } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: { state, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id/address
router.put('/:id/address', async (req, res) => {
  try {
    const { address } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: { address, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id/class
router.put('/:id/class', async (req, res) => {
  try {
    const { selectedClass } = req.body;
    const db = getDB();
    const result = await db.collection('students').findOneAndUpdate(
      buildIdQuery(req.params.id),
      { $set: { selectedClass, updatedAt: new Date() } },
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
      buildIdQuery(studentId),
      { $set: { profilePhoto: avatarUrl, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, avatarUrl, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/students/:phone/homework — submit homework score
router.post('/:phone/homework', async (req, res) => {
  try {
    const { scheduleId, score, totalQuestions, answers } = req.body;
    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'Missing scheduleId' });
    }

    const db = getDB();
    // Remove any existing submission for this scheduleId
    await db.collection('students').updateOne(
      { phone: req.params.phone },
      { $pull: { homeworkSubmissions: { scheduleId } } }
    );

    // Push new homework submission
    const result = await db.collection('students').findOneAndUpdate(
      { phone: req.params.phone },
      { 
        $push: { 
          homeworkSubmissions: {
            scheduleId,
            score: Number(score),
            totalQuestions: Number(totalQuestions),
            answers: answers || [],
            submittedAt: new Date()
          }
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
