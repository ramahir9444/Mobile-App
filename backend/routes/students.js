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

// POST /api/students/:phone/welcome-test — submit welcome test score
router.post('/:phone/welcome-test', async (req, res) => {
  try {
    const { score, answers, totalQuestions } = req.body;
    const db = getDB();

    const questionsCount = totalQuestions || (answers ? answers.length : 10);

    const result = await db.collection('students').findOneAndUpdate(
      { phone: req.params.phone },
      { 
        $set: { 
          welcomeTestStatus: 'completed',
          welcomeTestResult: {
            score: Number(score),
            totalQuestions: Number(questionsCount),
            answers: answers || [],
            submittedAt: new Date()
          },
          updatedAt: new Date()
        },
        $inc: { totalQuizzesAttempted: 1 }
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

// GET /api/students/:phone/analytics — Fetch aggregated study report analytics for a student
router.get('/:phone/analytics', async (req, res) => {
  try {
    const db = getDB();
    const phone = req.params.phone;
    const period = req.query.period || 'Monthly'; // Daily, Weekly, Monthly, Quarterly, Yearly

    // Calculate startDate based on period
    const now = new Date();
    let startDate = new Date();
    if (period === 'Daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'Weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'Monthly') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === 'Quarterly') {
      startDate.setDate(now.getDate() - 90);
    } else if (period === 'Yearly') {
      startDate.setDate(now.getDate() - 365);
    }

    const dateFilter = { $gte: startDate };

    // Find student
    const student = await db.collection('students').findOne({ phone });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // 1. Fetch attendance records in the period
    const attendanceLogs = await db.collection('live_classroom_attendance').find({
      studentPhone: phone,
      timestamp: dateFilter
    }).toArray();

    let totalLearningSec = 0;
    let totalExpectedLearningSec = 0;
    let avgAttendancePct = 0;
    let lecturesAttendedCount = attendanceLogs.length;

    if (lecturesAttendedCount > 0) {
      totalLearningSec = attendanceLogs.reduce((acc, log) => acc + (log.actualLearningSec || 0), 0);
      totalExpectedLearningSec = attendanceLogs.reduce((acc, log) => acc + (log.expectedLearningSec || 0), 0);
      avgAttendancePct = Math.round(attendanceLogs.reduce((acc, log) => acc + (log.attendancePercentage || 0), 0) / lecturesAttendedCount);
    }

    const learningTimeMinutes = Math.round(totalLearningSec / 60);
    const expectedLearningMinutes = Math.round(totalExpectedLearningSec / 60) || (lecturesAttendedCount * 45) || 45;

    // 2. Fetch quiz attempts in the period
    const quizAttempts = await db.collection('live_quiz_attempts').find({
      studentPhone: phone,
      timestamp: dateFilter
    }).toArray();

    const totalQuizzes = quizAttempts.length;
    const correctQuizzes = quizAttempts.filter(q => q.isCorrect).length;
    const quizAccuracy = totalQuizzes > 0 ? Math.round((correctQuizzes / totalQuizzes) * 100) : 80; // default 80% fallback

    // 3. Fetch events in the period
    const events = await db.collection('live_classroom_events').find({
      studentPhone: phone,
      timestamp: dateFilter
    }).toArray();

    const raiseHandCount = events.filter(e => e.eventType === 'RaiseHand').length;
    const stageParticipationCount = events.filter(e => e.eventType === 'JoinStage').length;
    const reactionCount = events.filter(e => e.eventType === 'Reaction').length;
    const chatCount = events.filter(e => e.eventType === 'ChatComment').length;
    const interactionTimes = raiseHandCount + stageParticipationCount + reactionCount + chatCount;

    // 4. Fetch homework submissions in the period
    const hwSubmissions = await db.collection('homework_submissions').find({
      studentPhone: phone,
      submittedAt: dateFilter
    }).toArray();

    const homeworkAccuracy = hwSubmissions.length > 0
      ? Math.round(hwSubmissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / hwSubmissions.length)
      : 85; // default 85% fallback

    // 5. Dynamic Calculations
    // Coins logic
    const correctQuizCoins = correctQuizzes * 10;
    const raiseHandCoins = raiseHandCount * 5;
    const stageCoins = stageParticipationCount * 15;
    const homeworkCoins = hwSubmissions.length * 20;
    const baseCoins = period === 'Daily' ? 50 : period === 'Weekly' ? 250 : period === 'Monthly' ? 1000 : period === 'Quarterly' ? 3000 : 12000;
    const totalCoins = baseCoins + correctQuizCoins + raiseHandCoins + stageCoins + homeworkCoins;

    // Badges logic
    const badges = [];
    if (avgAttendancePct >= 90 || (lecturesAttendedCount > 0 && avgAttendancePct >= 80)) {
      badges.push('Focus Master');
    }
    if (quizAccuracy >= 85) {
      badges.push('Quiz Champ');
    }
    if (raiseHandCount + stageParticipationCount >= 3) {
      badges.push('Interactive Learner');
    }
    if (homeworkAccuracy >= 80 && hwSubmissions.length > 0) {
      badges.push('Homework Hero');
    }
    // ensure at least 1 badge for gamification if base period is monthly/quarterly/yearly
    if (badges.length === 0) {
      badges.push('Curious Learner');
    }

    // Study outcomes topics
    let strongTopics = ['Fractions', 'Decimals'];
    let weakTopics = ['Equations', 'Geometry'];

    if (quizAccuracy >= 80) {
      strongTopics = ['Fractions', 'Decimals', 'Equations'];
      weakTopics = ['Advanced Word Problems'];
    } else if (quizAccuracy < 60) {
      strongTopics = ['Basic Fractions'];
      weakTopics = ['Decimals', 'Equations', 'Division Word Problems'];
    }

    // Total expected lectures based on student's class
    const studentClass = student.selectedClass || 'Class 5';
    const schedulesCount = await db.collection('schedules').countDocuments({
      gradeClass: studentClass,
      status: 'Finished'
    });
    const totalExpectedLectures = Math.max(lecturesAttendedCount, schedulesCount || (period === 'Daily' ? 1 : period === 'Weekly' ? 3 : period === 'Monthly' ? 12 : period === 'Quarterly' ? 36 : 144));

    const confidenceScore = Math.min(100, Math.round((avgAttendancePct * 0.4) + (quizAccuracy * 0.4) + (Math.min(10, raiseHandCount + stageParticipationCount) * 2))) || 80;
    const aiLearningScore = Math.min(100, Math.round((confidenceScore * 0.7) + (homeworkAccuracy * 0.3))) || 82;
    const consistencyLevel = aiLearningScore >= 85 ? 'Highly Consistent' : aiLearningScore >= 70 ? 'Consistent' : 'Irregular';

    const report = {
      attendancePercentage: avgAttendancePct || 100,
      learningTimeMinutes,
      expectedLearningMinutes,
      lecturesAttended: lecturesAttendedCount,
      totalExpectedLectures,
      quizAccuracy,
      homeworkAccuracy,
      totalCoins,
      badgeWinnerCount: badges.length,
      badges,
      teacherPraisedCount: stageParticipationCount,
      interactionTimes,
      strongTopics,
      weakTopics,
      aiLearningScore,
      consistencyLevel
    };

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
