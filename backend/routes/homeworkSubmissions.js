const express = require('express');
const { getDB } = require('../db/mongo');

const router = express.Router();

// Helper: compute time dimension fields from a date
function getTimeDimensions(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  // ISO week number
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const week = String(weekNum).padStart(2, '0');

  // Quarter
  const quarter = Math.ceil((d.getMonth() + 1) / 3);

  return {
    submittedDate: `${year}-${month}-${day}`,
    submittedWeek: `${year}-W${week}`,
    submittedMonth: `${year}-${month}`,
    submittedQuarter: `${year}-Q${quarter}`,
    submittedYear: `${year}`,
  };
}

// Helper: grade from percentage
function getGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

// POST /api/homework-submissions — Submit or re-submit homework
router.post('/', async (req, res) => {
  try {
    const {
      studentPhone,
      studentName,
      scheduleId,
      scheduleTitle,
      subject,
      gradeClass,
      courseType,
      score,
      totalQuestions,
      answers
    } = req.body;

    if (!studentPhone || !scheduleId) {
      return res.status(400).json({ success: false, error: 'studentPhone and scheduleId are required' });
    }

    const now = new Date();
    const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const timeDims = getTimeDimensions(now);

    const doc = {
      studentPhone,
      studentName: studentName || '',
      scheduleId,
      scheduleTitle: scheduleTitle || '',
      subject: subject || '',
      gradeClass: gradeClass || '',
      courseType: courseType || 'master',
      score: Number(score) || 0,
      totalQuestions: Number(totalQuestions) || 0,
      percentage: pct,
      grade: getGrade(pct),
      answers: answers || [],
      submittedAt: now,
      ...timeDims,
      updatedAt: now,
    };

    const db = getDB();

    // Upsert: replace if the student already submitted this schedule's HW
    const existing = await db.collection('homework_submissions').findOne({ studentPhone, scheduleId });
    if (existing) {
      await db.collection('homework_submissions').deleteMany({ studentPhone, scheduleId });
    }

    const result = await db.collection('homework_submissions').insertOne(doc);
    const newDoc = { ...doc, _id: result.insertedId };

    // Automatically update the corresponding schedule's status to "Finished" in schedules collection
    try {
      const { ObjectId } = require('mongodb');
      if (ObjectId.isValid(scheduleId)) {
        await db.collection('schedules').updateOne(
          { _id: new ObjectId(scheduleId) },
          { $set: { status: 'Finished', updatedAt: new Date() } }
        );
      } else {
        await db.collection('schedules').updateOne(
          { _id: scheduleId },
          { $set: { status: 'Finished', updatedAt: new Date() } }
        );
      }
    } catch (err) {
      console.error(`Failed to update schedule status to Finished on HW submit for ${scheduleId}:`, err);
    }

    res.status(201).json({ success: true, data: newDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/homework-submissions?phone=xxx — Get submissions for a student
router.get('/', async (req, res) => {
  try {
    const { phone, scheduleId, gradeClass, subject, month, week, year, quarter } = req.query;

    const query = {};
    if (phone)      query.studentPhone = phone;
    if (scheduleId) query.scheduleId   = scheduleId;
    if (gradeClass) query.gradeClass   = gradeClass;
    if (subject)    query.subject      = subject;
    if (month)      query.submittedMonth   = month;
    if (week)       query.submittedWeek    = week;
    if (year)       query.submittedYear    = year;
    if (quarter)    query.submittedQuarter = quarter;

    const db = getDB();
    const list = await db.collection('homework_submissions').find(query).sort({ submittedAt: -1 }).toArray();

    res.json({ success: true, data: list, count: list.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/homework-submissions/stats?phone=xxx — Aggregate stats for a student
router.get('/stats', async (req, res) => {
  try {
    const { phone, gradeClass, month, year } = req.query;
    if (!phone) return res.status(400).json({ success: false, error: 'phone is required' });

    const db = getDB();
    const query = { studentPhone: phone };
    if (gradeClass) query.gradeClass = gradeClass;
    if (month) query.submittedMonth = month;
    if (year) query.submittedYear = year;

    const submissions = await db.collection('homework_submissions').find(query).sort({ submittedAt: -1 }).toArray();

    const totalHw = submissions.length;
    const avgPct = totalHw > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / totalHw)
      : 0;
    const bySubject = {};
    submissions.forEach(s => {
      if (!bySubject[s.subject]) bySubject[s.subject] = { count: 0, totalPct: 0 };
      bySubject[s.subject].count++;
      bySubject[s.subject].totalPct += (s.percentage || 0);
    });
    Object.keys(bySubject).forEach(sub => {
      bySubject[sub].avgPct = Math.round(bySubject[sub].totalPct / bySubject[sub].count);
    });

    res.json({
      success: true,
      data: {
        totalSubmissions: totalHw,
        averagePercentage: avgPct,
        bySubject,
        recentSubmissions: submissions.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
