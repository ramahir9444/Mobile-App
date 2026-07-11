const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db/mongo');

const router = express.Router();

function isClassTimePassed(dateText, timeText) {
  try {
    if (!dateText || !timeText) return false;
    const currentYear = new Date().getFullYear();
    
    // dateText: e.g. "10 jul, tue" or "6 Jul, Mon"
    const datePart = dateText.split(',')[0].trim();
    const [dayStr, monthStr] = datePart.split(' ');
    
    // timeText: e.g. "8:10 pm - 9:10 pm"
    const timeParts = timeText.split('-'); 
    if (timeParts.length < 2) return false;
    const endTimeStr = timeParts[1].trim();
    
    const timeAndAmpm = endTimeStr.split(/\s+/);
    if (timeAndAmpm.length < 2) return false;
    const timeVal = timeAndAmpm[0];
    const ampm = timeAndAmpm[1];
    
    const [hoursStr, minutesStr] = timeVal.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
    
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthStr.toLowerCase().slice(0, 3)];
    const day = parseInt(dayStr, 10);
    
    if (isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      return false;
    }
    
    const classEndDate = new Date(currentYear, month, day, hours, minutes);
    return new Date() > classEndDate;
  } catch (err) {
    return false;
  }
}

// GET /api/schedules — Fetch all schedules
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const list = await db.collection('schedules').find({}).sort({ createdAt: -1 }).toArray();
    
    // Dynamically check and update expired schedules to "Finished" in real time
    for (let item of list) {
      if (item.status === 'Scheduled' && isClassTimePassed(item.dateText, item.time)) {
        item.status = 'Finished';
        try {
          await db.collection('schedules').updateOne(
            { _id: item._id },
            { $set: { status: 'Finished' } }
          );
        } catch (err) {
          console.error(`Failed to auto-update schedule ${item._id} to Finished:`, err);
        }
      }
    }

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedules/:id — Fetch a single schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(req.params.id) });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules — Create a new schedule entry
router.post('/', async (req, res) => {
  try {
    const { title, subject, time, dateText, gradeClass, courseType, teacherName, teacherAvatar, status, materials, homework, questions, durationMinutes } = req.body;
    
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
      questions: questions || [],
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 30,
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
    const { title, subject, time, dateText, gradeClass, courseType, teacherName, teacherAvatar, status, materials, homework, questions, durationMinutes } = req.body;
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
    if (questions !== undefined) updateDoc.questions = questions;
    if (durationMinutes !== undefined) updateDoc.durationMinutes = Number(durationMinutes);

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

// PUT /api/schedules/:id/status — Explicitly update schedule status (e.g. to 'Finished' when joining)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

    const db = getDB();
    const result = await db.collection('schedules').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } },
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

module.exports = router;
