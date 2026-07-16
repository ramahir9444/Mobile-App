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
    const parts = datePart.split(/\s+/);
    if (parts.length < 2) return false;
    const dayStr = parts[0];
    const monthStr = parts[1];
    
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
      if (item.status === 'Scheduled' && !item.isLive && item.liveStatus !== 'live' && isClassTimePassed(item.dateText, item.time)) {
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

// GET /api/schedules/teacher-schedules?teacherName=xxx — Teacher's own schedules (all, sorted by date)
router.get('/teacher-schedules', async (req, res) => {
  try {
    const { teacherName } = req.query;
    const db = getDB();
    const query = teacherName ? { teacherName: { $regex: new RegExp(teacherName, 'i') } } : {};
    const list = await db.collection('schedules').find(query).sort({ createdAt: -1 }).toArray();
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
    const { title, subject, time, dateText, gradeClass, courseType, teacherName, teacherAvatar, status, materials, homework, quizzes, questions, durationMinutes, slides } = req.body;
    
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
      quizzes: quizzes || [],
      questions: questions || [],
      slides: slides || [],
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
    const { title, subject, time, dateText, gradeClass, courseType, teacherName, teacherAvatar, status, materials, homework, quizzes, questions, durationMinutes, slides } = req.body;
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
    if (quizzes !== undefined) updateDoc.quizzes = quizzes;
    if (questions !== undefined) updateDoc.questions = questions;
    if (slides !== undefined) updateDoc.slides = slides;
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

// ─── LIVE CLASSROOM MODULE ENDPOINTS ───────────────────────────────────

// POST /api/schedules/:id/start — Teacher starts live class session
router.post('/:id/start', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    
    // Generate a unique room name
    const roomName = `room-${scheduleId}-${Date.now()}`;
    const initialLiveState = {
      activeQuizId: null,
      quizActive: false,
      chatMuted: false,
      stageStudents: [],
      mutedStageStudents: [],
      raiseHands: [],
      whiteboardDrawings: [],
      activePage: 0,
      hwReleased: false
    };

    const result = await db.collection('schedules').findOneAndUpdate(
      { _id: new ObjectId(scheduleId) },
      { 
        $set: { 
          isLive: true,
          liveStatus: 'live',
          roomName,
          liveState: initialLiveState,
          updatedAt: new Date()
        } 
      },
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

// POST /api/schedules/:id/end — Teacher ends live class session
router.post('/:id/end', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;

    // Fetch the schedule to get details
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    // Save mock recording path linked to this class
    const recordingUrl = `https://d2j1w2b3c4d5e6.cloudfront.net/recordings/${scheduleId}.mp4`;

    const result = await db.collection('schedules').findOneAndUpdate(
      { _id: new ObjectId(scheduleId) },
      { 
        $set: { 
          isLive: false,
          liveStatus: 'ended',
          status: 'Finished',
          'liveState.hwReleased': true,
          recordingUrl,
          endedAt: new Date(),
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    // Save end of class event logs
    await db.collection('live_classroom_events').insertOne({
      scheduleId,
      event: 'ClassEnded',
      timestamp: new Date()
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedules/:id/live-state — Fetch real-time classroom state
router.get('/:id/live-state', async (req, res) => {
  try {
    const db = getDB();
    const { phone, name } = req.query;
    const scheduleId = req.params.id;

    if (phone && phone !== 'teacher' && phone !== 'undefined') {
      await db.collection('live_classroom_presence').updateOne(
        { scheduleId, phone },
        { $set: { lastSeen: new Date(), name: name || 'Student' } },
        { upsert: true }
      );
    }

    const schedule = await db.collection('schedules').findOne(
      { _id: new ObjectId(scheduleId) },
      { projection: { isLive: 1, liveStatus: 1, roomName: 1, liveState: 1 } }
    );
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/schedules/:id/live-state — Update live state (chat, stage, whiteboard, quiz, hw)
router.put('/:id/live-state', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    const { 
      activeQuizId, 
      quizActive, 
      chatMuted, 
      stageStudents, 
      mutedStageStudents, 
      raiseHands, 
      whiteboardDrawings, 
      activePage,
      drawings,
      hwReleased
    } = req.body;

    const updateFields = {};
    if (activeQuizId !== undefined) updateFields['liveState.activeQuizId'] = activeQuizId;
    if (quizActive !== undefined) updateFields['liveState.quizActive'] = quizActive;
    if (chatMuted !== undefined) updateFields['liveState.chatMuted'] = chatMuted;
    if (stageStudents !== undefined) updateFields['liveState.stageStudents'] = stageStudents;
    if (mutedStageStudents !== undefined) updateFields['liveState.mutedStageStudents'] = mutedStageStudents;
    if (raiseHands !== undefined) updateFields['liveState.raiseHands'] = raiseHands;
    if (whiteboardDrawings !== undefined) updateFields['liveState.whiteboardDrawings'] = whiteboardDrawings;
    if (activePage !== undefined) updateFields['liveState.activePage'] = Number(activePage);
    if (drawings !== undefined) updateFields['liveState.drawings'] = drawings;
    if (hwReleased !== undefined) updateFields['liveState.hwReleased'] = !!hwReleased;

    const result = await db.collection('schedules').findOneAndUpdate(
      { _id: new ObjectId(scheduleId) },
      { $set: { ...updateFields, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.json({ success: true, data: result.liveState });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules/:id/attendance — Submit student attendance log
router.post('/:id/attendance', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    const {
      studentPhone,
      studentName,
      sessions, // array of { joinTime, leaveTime, durationSec }
      reconnectCount,
      foregroundSec,
      backgroundSec,
      totalConnectedSec,
      actualLearningSec
    } = req.body;

    if (!studentPhone) {
      return res.status(400).json({ success: false, error: 'studentPhone is required' });
    }

    const attendancePercentage = totalConnectedSec > 0 
      ? Math.min(100, Math.round((actualLearningSec / totalConnectedSec) * 100)) 
      : 0;

    const doc = {
      scheduleId,
      studentPhone,
      studentName: studentName || '',
      sessions: sessions || [],
      reconnectCount: Number(reconnectCount) || 0,
      foregroundSec: Number(foregroundSec) || 0,
      backgroundSec: Number(backgroundSec) || 0,
      totalConnectedSec: Number(totalConnectedSec) || 0,
      actualLearningSec: Number(actualLearningSec) || 0,
      attendancePercentage,
      submittedAt: new Date()
    };

    // Keep all attendance logs, do not overwrite (as specified by user: store multiple sessions)
    const result = await db.collection('live_classroom_attendance').insertOne(doc);
    res.status(201).json({ success: true, data: { ...doc, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules/:id/quiz-submit — Submit student quiz response
router.post('/:id/quiz-submit', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    const {
      studentPhone,
      studentName,
      subject,
      chapter,
      topic,
      questionText,
      selectedOption,
      correctOption,
      timeTakenSec,
      marks,
      isCorrect,
      isWrong,
      isSkipped
    } = req.body;

    if (!studentPhone) {
      return res.status(400).json({ success: false, error: 'studentPhone is required' });
    }

    const doc = {
      scheduleId,
      studentPhone,
      studentName: studentName || '',
      subject: subject || '',
      chapter: chapter || '',
      topic: topic || '',
      questionText: questionText || '',
      selectedOption: selectedOption || '',
      correctOption: correctOption || '',
      timeTakenSec: Number(timeTakenSec) || 0,
      marks: Number(marks) || 0,
      isCorrect: !!isCorrect,
      isWrong: !!isWrong,
      isSkipped: !!isSkipped,
      timestamp: new Date()
    };

    // Insert permanently, never overwrite
    const result = await db.collection('live_quiz_attempts').insertOne(doc);
    res.status(201).json({ success: true, data: { ...doc, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedules/:id/live-events — Retrieve live events (chat messages, reactions) for a schedule
router.get('/:id/live-events', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    // Default to last 1 hour of events to keep payload size small
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 60 * 60 * 1000);

    const events = await db.collection('live_classroom_events')
      .find({ scheduleId, timestamp: { $gt: since } })
      .sort({ timestamp: 1 })
      .toArray();

    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules/:id/live-events — Log student micro-event (e.g. Raise Hand, Mic Toggle)
router.post('/:id/live-events', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    const { studentPhone, studentName, eventType, detail } = req.body;

    if (!studentPhone || !eventType) {
      return res.status(400).json({ success: false, error: 'studentPhone and eventType are required' });
    }

    const doc = {
      scheduleId,
      studentPhone,
      studentName: studentName || '',
      eventType, // RaiseHand, Reaction, MicOn, CameraOff, WhiteboardStroke, etc.
      detail: detail || '',
      timestamp: new Date()
    };

    await db.collection('live_classroom_events').insertOne(doc);

    // Sync hand raising state in real-time in the schedule document
    if (eventType === 'RaiseHand') {
      await db.collection('schedules').updateOne(
        { _id: new ObjectId(scheduleId) },
        { $addToSet: { 'liveState.raiseHands': studentPhone } }
      );
    } else if (eventType === 'LowerHand') {
      await db.collection('schedules').updateOne(
        { _id: new ObjectId(scheduleId) },
        { $pull: { 'liveState.raiseHands': studentPhone } }
      );
    }

    res.status(201).json({ success: true, message: 'Event logged successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedules/:id/analytics — Aggregate logs to generate study report analytics for a student
router.get('/:id/analytics', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    const studentPhone = req.query.phone;

    if (!studentPhone) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }

    // 1. Fetch attendance records
    const attendanceLogs = await db.collection('live_classroom_attendance').find({ scheduleId, studentPhone }).toArray();
    let totalLearningTimeMin = 0;
    let avgAttendancePct = 0;
    let reconnectCount = 0;
    
    if (attendanceLogs.length > 0) {
      const sumLearningSec = attendanceLogs.reduce((acc, log) => acc + (log.actualLearningSec || 0), 0);
      totalLearningTimeMin = Math.round(sumLearningSec / 60);
      avgAttendancePct = Math.round(attendanceLogs.reduce((acc, log) => acc + (log.attendancePercentage || 0), 0) / attendanceLogs.length);
      reconnectCount = attendanceLogs.reduce((acc, log) => acc + (log.reconnectCount || 0), 0);
    }

    // 2. Fetch quiz attempts
    const quizAttempts = await db.collection('live_quiz_attempts').find({ scheduleId, studentPhone }).toArray();
    let totalQuizzes = quizAttempts.length;
    let correctQuizzes = quizAttempts.filter(q => q.isCorrect).length;
    let quizAccuracy = totalQuizzes > 0 ? Math.round((correctQuizzes / totalQuizzes) * 100) : 0;
    let avgResponseTime = totalQuizzes > 0 ? Math.round(quizAttempts.reduce((acc, q) => acc + (q.timeTakenSec || 0), 0) / totalQuizzes) : 0;

    // 3. Fetch micro events count
    const events = await db.collection('live_classroom_events').find({ scheduleId, studentPhone }).toArray();
    const raiseHandCount = events.filter(e => e.eventType === 'RaiseHand').length;
    const stageParticipationCount = events.filter(e => e.eventType === 'JoinStage').length;
    const reactionCount = events.filter(e => e.eventType === 'Reaction').length;

    // 4. Compute overall accuracy metrics from student's homework submissions for consistency check
    const hwSubmissions = await db.collection('homework_submissions').find({ studentPhone }).toArray();
    const hwAvg = hwSubmissions.length > 0 
      ? Math.round(hwSubmissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / hwSubmissions.length)
      : 0;

    // Math metrics
    const confidenceScore = Math.min(100, Math.round((avgAttendancePct * 0.4) + (quizAccuracy * 0.4) + (Math.min(10, raiseHandCount + stageParticipationCount) * 2)));
    const aiLearningScore = Math.min(100, Math.round((confidenceScore * 0.7) + (hwAvg * 0.3)));

    const report = {
      attendancePercentage: avgAttendancePct || 100, // fallback
      learningTimeMinutes: totalLearningTimeMin || 30, // fallback
      quizAccuracy,
      avgResponseTimeSeconds: avgResponseTime || 12,
      raiseHandCount,
      stageParticipationCount,
      reactionCount,
      reconnectCount,
      homeworkAccuracy: hwAvg || 75,
      confidenceScore,
      aiLearningScore,
      consistencyLevel: aiLearningScore >= 85 ? 'Highly Consistent' : aiLearningScore >= 70 ? 'Consistent' : 'Irregular',
      strongTopics: quizAccuracy >= 75 ? ['Fractions', 'Equations'] : ['Basics'],
      weakTopics: quizAccuracy < 70 ? ['Linear Algebra', 'Word Problems'] : ['Advanced Geometry'],
      timestamp: new Date()
    };

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules/:id/recording-logs — Log watch telemetry for ended class recordings
router.post('/:id/recording-logs', async (req, res) => {
  try {
    const db = getDB();
    const scheduleId = req.params.id;
    const { studentPhone, watchTimeSec, completionPercentage, resumePositionSec, playbackSpeed } = req.body;

    if (!studentPhone) {
      return res.status(400).json({ success: false, error: 'studentPhone is required' });
    }

    const filter = { scheduleId, studentPhone };
    const update = {
      $set: {
        completionPercentage: Number(completionPercentage) || 0,
        resumePositionSec: Number(resumePositionSec) || 0,
        playbackSpeed: Number(playbackSpeed) || 1,
        updatedAt: new Date()
      },
      $inc: {
        watchTimeSec: Number(watchTimeSec) || 0,
        rewatchCount: 1
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    };

    await db.collection('recording_play_logs').updateOne(filter, update, { upsert: true });
    res.json({ success: true, message: 'Recording log saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
