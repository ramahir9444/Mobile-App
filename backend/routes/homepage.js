const express = require('express');
const { getDB } = require('../db/mongo');

const router = express.Router();

// GET /api/homepage-configs/:classId
router.get('/:classId', async (req, res) => {
  try {
    const db = getDB();
    const config = await db.collection('homepage_configs').findOne({ classId: req.params.classId });
    if (!config) {
      return res.status(404).json({ success: false, error: 'Homepage configuration not found for this class' });
    }
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/homepage-configs/:classId — update or upsert configuration
router.put('/:classId', async (req, res) => {
  try {
    const { bannerText, teachers, upcomingClass, boosterCourse, masterProgram } = req.body;
    const db = getDB();

    const updateDoc = {
      classId: req.params.classId,
      bannerText,
      teachers,
      upcomingClass,
      boosterCourse,
      masterProgram,
      updatedAt: new Date(),
    };

    const result = await db.collection('homepage_configs').findOneAndUpdate(
      { classId: req.params.classId },
      { $set: updateDoc },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
