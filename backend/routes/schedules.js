const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db/mongo');

const router = express.Router();

// GET /api/schedules — Fetch all schedules
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const list = await db.collection('schedules').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules — Create a new schedule entry
router.post('/', async (req, res) => {
  try {
    const { title, subject, time, dateText, gradeClass, courseType, teacherName, teacherAvatar, status, materials, homework } = req.body;
    
    if (!title || !subject || !time || !dateText || !gradeClass || !courseType) {
      return res.status(400).json({ success: false, error: 'Missing required schedule fields' });
    }

    const db = getDB();
    const doc = {
      title,
      subject,
      time,
      dateText,
      gradeClass,
      courseType, // 'booster' or 'master'
      teacherName: teacherName || 'Ninja Mam (Priyanka)',
      teacherAvatar: teacherAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
      status: status || 'Scheduled', // 'Scheduled' or 'Finished'
      materials: materials || [],
      homework: homework || [],
      createdAt: new Date()
    };

    const result = await db.collection('schedules').insertOne(doc);
    const newDoc = await db.collection('schedules').findOne({ _id: result.insertedId });
    res.status(201).json({ success: true, data: newDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/schedules/:id — Update a schedule entry
router.put('/:id', async (req, res) => {
  try {
    const { title, subject, time, dateText, gradeClass, courseType, teacherName, teacherAvatar, status, materials, homework } = req.body;
    const db = getDB();

    const updateDoc = {};
    if (title !== undefined) updateDoc.title = title;
    if (subject !== undefined) updateDoc.subject = subject;
    if (time !== undefined) updateDoc.time = time;
    if (dateText !== undefined) updateDoc.dateText = dateText;
    if (gradeClass !== undefined) updateDoc.gradeClass = gradeClass;
    if (courseType !== undefined) updateDoc.courseType = courseType;
    if (teacherName !== undefined) updateDoc.teacherName = teacherName;
    if (teacherAvatar !== undefined) updateDoc.teacherAvatar = teacherAvatar;
    if (status !== undefined) updateDoc.status = status;
    if (materials !== undefined) updateDoc.materials = materials;
    if (homework !== undefined) updateDoc.homework = homework;

    const result = await db.collection('schedules').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/schedules/:id — Delete a schedule entry
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('schedules').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
