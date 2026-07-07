const express = require('express');
const { getDB } = require('../db/mongo');

const router = express.Router();

// POST /api/homepage-configs/upload — upload helper for homepage configurations
router.post('/upload', async (req, res) => {
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

    const filename = `homepage-image-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Return the uploads path
    const fileUrl = `/uploads/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
