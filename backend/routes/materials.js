const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db/mongo');

const router = express.Router();

// GET /api/materials — Fetch all materials
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const list = await db.collection('study_materials').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/materials — Create a new study material entry
router.post('/', async (req, res) => {
  try {
    const { fileName, fileSize, gradeClass, courseType, fileUrl } = req.body;
    
    if (!fileName || !fileSize || !gradeClass || !courseType) {
      return res.status(400).json({ success: false, error: 'Missing required study material fields' });
    }

    const db = getDB();
    const doc = {
      fileName,
      fileSize,
      gradeClass,
      courseType, // 'booster' or 'master'
      fileUrl: fileUrl || '',
      createdAt: new Date()
    };

    const result = await db.collection('study_materials').insertOne(doc);
    const newDoc = await db.collection('study_materials').findOne({ _id: result.insertedId });
    res.status(201).json({ success: true, data: newDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/materials/:id — Delete a study material entry
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('study_materials').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Study material not found' });
    }

    res.json({ success: true, message: 'Study material deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
