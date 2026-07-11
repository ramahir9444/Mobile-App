/**
 * routes/welcomeTests.js
 * 
 * CRUD for per-class Welcome Test question sets.
 * 
 * GET  /api/welcome-tests/:gradeClass   — fetch questions for a class
 * PUT  /api/welcome-tests/:gradeClass   — upsert (save/update) full question set
 * DELETE /api/welcome-tests/:gradeClass — delete the test for a class
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../db/mongo');

// GET questions for a class
router.get('/:gradeClass', async (req, res) => {
  try {
    const db = getDB();
    const gradeClass = decodeURIComponent(req.params.gradeClass);
    const doc = await db.collection('welcome_tests').findOne({ gradeClass });
    if (!doc) {
      return res.json({ success: true, data: null, questions: [] });
    }
    res.json({ success: true, data: doc, questions: doc.questions || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all classes that have a welcome test configured
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const docs = await db.collection('welcome_tests').find({}).toArray();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT — upsert the full question set for a class
router.put('/:gradeClass', async (req, res) => {
  try {
    const db = getDB();
    const gradeClass = decodeURIComponent(req.params.gradeClass);
    const { questions, durationMinutes } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'questions array is required and cannot be empty.' });
    }

    const testDuration = durationMinutes || 30;

    const result = await db.collection('welcome_tests').findOneAndUpdate(
      { gradeClass },
      {
        $set: {
          gradeClass,
          questions,
          durationMinutes: testDuration,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Auto-assign Welcome Test to schedules for this grade class
    const courseTypes = ['booster', 'master'];
    for (const cType of courseTypes) {
      await db.collection('schedules').updateOne(
        {
          title: 'Welcome Test',
          subject: 'Test',
          gradeClass: gradeClass,
          courseType: cType
        },
        {
          $set: {
            time: `${testDuration} minutes`,
            dateText: '29 Jun, Mon',
            teacherName: 'System',
            teacherAvatar: '',
            status: 'Finished',
            updatedAt: new Date()
          },
          $setOnInsert: {
            title: 'Welcome Test',
            subject: 'Test',
            gradeClass: gradeClass,
            courseType: cType,
            createdAt: new Date(),
            materials: [],
            homework: []
          }
        },
        { upsert: true }
      );
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE — remove the test for a class
router.delete('/:gradeClass', async (req, res) => {
  try {
    const db = getDB();
    const gradeClass = decodeURIComponent(req.params.gradeClass);
    await db.collection('welcome_tests').deleteOne({ gradeClass });
    res.json({ success: true, message: `Welcome test for ${gradeClass} deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
