// ─────────────────────────────────────────────────────────────────
//  Oda Class — Live Classroom Routes (LiveKit Integration)
//  POST /api/live-classroom/token       → Generate a participant token
//  POST /api/live-classroom/create-room → Admin creates/starts a room
//  POST /api/live-classroom/end-room    → Admin ends a room
//  GET  /api/live-classroom/room-info   → Fetch live room metadata
// ─────────────────────────────────────────────────────────────────
const express = require('express');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const { getDB } = require('../db/mongo');
const { ObjectId } = require('mongodb');

const router = express.Router();

const LIVEKIT_URL    = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY    = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// Build HTTP URL from wss:// for the RoomServiceClient
const getLivekitHttpUrl = () => {
  if (!LIVEKIT_URL) return '';
  return LIVEKIT_URL.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
};

/**
 * POST /api/live-classroom/token
 * Body: { scheduleId, participantName, participantIdentity, isTeacher }
 * Returns: { token, roomName, wsUrl }
 */
router.post('/token', async (req, res) => {
  try {
    const { scheduleId, participantName, participantIdentity, isTeacher } = req.body;

    if (!scheduleId || !participantName || !participantIdentity) {
      return res.status(400).json({ success: false, error: 'scheduleId, participantName, participantIdentity are required' });
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return res.status(500).json({ success: false, error: 'LiveKit credentials not configured on server' });
    }

    // Fetch schedule from DB to get the room name
    const db = getDB();
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    if (!schedule.roomName) {
      return res.json({ success: false, error: 'Room not started yet. Admin must start the class first.' });
    }

    // Build access token with appropriate permissions
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      ttl: '4h',
    });

    at.addGrant({
      roomJoin: true,
      room: schedule.roomName,
      canPublish: !!isTeacher, // only teacher can publish by default
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: !!isTeacher,
    });

    const token = await at.toJwt();

    res.json({
      success: true,
      data: {
        token,
        roomName: schedule.roomName,
        wsUrl: LIVEKIT_URL,
        scheduleTitle: schedule.title,
        isLive: schedule.isLive,
        liveStatus: schedule.liveStatus,
        allowChat: schedule.allowChat !== false,
        allowStage: schedule.allowStage !== false,
        enableQuiz: schedule.enableQuiz !== false,
        enableRecording: schedule.enableRecording !== false,
        maxStageStudents: schedule.maxStageStudents || 4,
      },
    });
  } catch (err) {
    console.error('[LiveKit Token Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-classroom/create-room
 * Body: { scheduleId }
 * Creates the LiveKit room and updates schedule.roomName in DB
 */
// Track active auto-end timers keyed by scheduleId
const autoEndTimers = {};

router.post('/create-room', async (req, res) => {
  try {
    const { scheduleId } = req.body;
    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'scheduleId is required' });
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return res.status(500).json({ success: false, error: 'LiveKit credentials not configured on server' });
    }

    const db = getDB();
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    const roomName = `oda-${scheduleId}-${Date.now()}`;

    // Create the room in LiveKit
    const roomService = new RoomServiceClient(getLivekitHttpUrl(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: 300,      // 5 minutes
      maxParticipants: 500,
    });

    // Initialize live state in DB
    const initialLiveState = {
      activeQuizId: null,
      quizActive: false,
      chatMuted: false,
      stageStudents: [],
      mutedStageStudents: [],
      raiseHands: [],
      whiteboardDrawings: [],
      activePage: 0,
      hwReleased: false,
    };

    await db.collection('schedules').updateOne(
      { _id: new ObjectId(scheduleId) },
      {
        $set: {
          roomName,
          isLive: true,
          liveStatus: 'live',
          liveState: initialLiveState,
          updatedAt: new Date(),
        },
      }
    );

    // ─── Auto-end after 2 hours ───────────────────────────────────
    // Cancel any previous timer for this schedule
    if (autoEndTimers[scheduleId]) {
      clearTimeout(autoEndTimers[scheduleId]);
    }

    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    autoEndTimers[scheduleId] = setTimeout(async () => {
      try {
        const currentSchedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });
        // Only auto-end if still live
        if (currentSchedule && currentSchedule.isLive) {
          console.log(`[AutoEnd] Auto-ending class ${scheduleId} after 2 hours`);
          // Delete LiveKit room
          try {
            await roomService.deleteRoom(roomName);
          } catch (lkErr) {
            console.warn('[AutoEnd] Could not delete LiveKit room:', lkErr.message);
          }
          // Mark as ended in DB
          const recordingUrl = `https://d2j1w2b3c4d5e6.cloudfront.net/recordings/${scheduleId}.mp4`;
          await db.collection('schedules').updateOne(
            { _id: new ObjectId(scheduleId) },
            {
              $set: {
                isLive: false,
                liveStatus: 'ended',
                status: 'Finished',
                'liveState.hwReleased': true,
                recordingUrl,
                endedAt: new Date(),
                updatedAt: new Date(),
                autoEnded: true,
              },
            }
          );
          await db.collection('live_classroom_events').insertOne({
            scheduleId,
            event: 'ClassAutoEnded',
            reason: 'Auto-ended after 2 hours',
            timestamp: new Date(),
          });
        }
        delete autoEndTimers[scheduleId];
      } catch (err) {
        console.error('[AutoEnd] Error auto-ending class:', err.message);
      }
    }, TWO_HOURS_MS);

    console.log(`[LiveKit] Class ${scheduleId} will auto-end in 2 hours`);
    // ─────────────────────────────────────────────────────────────

    res.json({
      success: true,
      data: {
        roomName,
        sid: room.sid,
        wsUrl: LIVEKIT_URL,
      },
    });
  } catch (err) {
    console.error('[LiveKit Create Room Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-classroom/end-room
 * Body: { scheduleId }
 * Deletes the LiveKit room and marks the schedule as ended
 */
router.post('/end-room', async (req, res) => {
  try {
    const { scheduleId } = req.body;
    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'scheduleId is required' });
    }

    // Cancel any pending auto-end timer for this class
    if (autoEndTimers[scheduleId]) {
      clearTimeout(autoEndTimers[scheduleId]);
      delete autoEndTimers[scheduleId];
      console.log(`[LiveKit] Auto-end timer cancelled for ${scheduleId} (teacher ended manually)`);
    }

    const db = getDB();
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    // Delete room from LiveKit if credentials are configured
    if (LIVEKIT_API_KEY && LIVEKIT_API_SECRET && schedule.roomName) {
      try {
        const roomService = new RoomServiceClient(getLivekitHttpUrl(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        await roomService.deleteRoom(schedule.roomName);
      } catch (livekitErr) {
        console.warn('[LiveKit] Could not delete room (may already be empty):', livekitErr.message);
      }
    }

    // Save a recording URL (real recording integration can replace this)
    const recordingUrl = `https://d2j1w2b3c4d5e6.cloudfront.net/recordings/${scheduleId}.mp4`;

    // Mark as ended in DB
    await db.collection('schedules').updateOne(
      { _id: new ObjectId(scheduleId) },
      {
        $set: {
          isLive: false,
          liveStatus: 'ended',
          status: 'Finished',
          recordingUrl,
          endedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Log class-ended event
    await db.collection('live_classroom_events').insertOne({
      scheduleId,
      event: 'ClassEnded',
      reason: 'Teacher ended manually',
      timestamp: new Date(),
    });

    res.json({ success: true, message: 'Room ended and schedule marked as Finished' });
  } catch (err) {
    console.error('[LiveKit End Room Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/live-classroom/room-info?scheduleId=xxx
 * Returns live participants list and room metadata from LiveKit
 */
router.get('/room-info', async (req, res) => {
  try {
    const { scheduleId } = req.query;
    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'scheduleId is required' });
    }

    const db = getDB();
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    if (!schedule.roomName || !LIVEKIT_API_KEY) {
      return res.json({
        success: true,
        data: {
          participants: [],
          participantCount: 0,
          roomName: schedule.roomName || null,
          isLive: schedule.isLive || false,
          liveState: schedule.liveState || null,
        },
      });
    }

    // Fetch participants from LiveKit
    let participants = [];
    try {
      const roomService = new RoomServiceClient(getLivekitHttpUrl(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
      const participantList = await roomService.listParticipants(schedule.roomName);
      participants = participantList.map((p) => ({
        identity: p.identity,
        name: p.name,
        isPublishing: (p.tracks || []).some((t) => t.source !== 0),
        joinedAt: p.joinedAt,
      }));
    } catch (livekitErr) {
      console.warn('[LiveKit] Could not list participants:', livekitErr.message);
    }

    // Clean up stale heartbeats older than 12 seconds
    const cutoff = new Date(Date.now() - 12000);
    await db.collection('live_classroom_presence').deleteMany({
      scheduleId: scheduleId.toString(),
      lastSeen: { $lt: cutoff }
    });

    const activeDbParticipants = await db.collection('live_classroom_presence').find({ scheduleId: scheduleId.toString() }).toArray();
    activeDbParticipants.forEach((dbP) => {
      if (!participants.some((p) => p.identity === dbP.phone)) {
        participants.push({
          identity: dbP.phone,
          name: dbP.name,
          isPublishing: false,
          joinedAt: dbP.lastSeen,
        });
      }
    });

    res.json({
      success: true,
      data: {
        participants,
        participantCount: participants.length,
        roomName: schedule.roomName,
        isLive: schedule.isLive || false,
        liveState: schedule.liveState || null,
        liveStatus: schedule.liveStatus || 'upcoming',
      },
    });
  } catch (err) {
    console.error('[LiveKit Room Info Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-classroom/mute-participant
 * Body: { scheduleId, participantIdentity, mute }
 * Remotely mutes/unmutes a participant from the teacher/admin
 */
router.post('/mute-participant', async (req, res) => {
  try {
    const { scheduleId, participantIdentity, mute } = req.body;
    if (!scheduleId || !participantIdentity) {
      return res.status(400).json({ success: false, error: 'scheduleId and participantIdentity are required' });
    }

    const db = getDB();
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });
    if (!schedule || !schedule.roomName) {
      return res.status(404).json({ success: false, error: 'Live room not found' });
    }

    if (LIVEKIT_API_KEY && LIVEKIT_API_SECRET) {
      const roomService = new RoomServiceClient(getLivekitHttpUrl(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
      await roomService.mutePublishedTrack(schedule.roomName, participantIdentity, 'microphone', !!mute);
    }

    res.json({ success: true, message: `Participant ${mute ? 'muted' : 'unmuted'} successfully` });
  } catch (err) {
    console.error('[LiveKit Mute Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-classroom/remove-participant
 * Body: { scheduleId, participantIdentity }
 * Kicks a participant from the room
 */
router.post('/remove-participant', async (req, res) => {
  try {
    const { scheduleId, participantIdentity } = req.body;
    if (!scheduleId || !participantIdentity) {
      return res.status(400).json({ success: false, error: 'scheduleId and participantIdentity are required' });
    }

    const db = getDB();
    const schedule = await db.collection('schedules').findOne({ _id: new ObjectId(scheduleId) });
    if (!schedule || !schedule.roomName) {
      return res.status(404).json({ success: false, error: 'Live room not found' });
    }

    if (LIVEKIT_API_KEY && LIVEKIT_API_SECRET) {
      const roomService = new RoomServiceClient(getLivekitHttpUrl(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
      await roomService.removeParticipant(schedule.roomName, participantIdentity);
    }

    res.json({ success: true, message: 'Participant removed from room' });
  } catch (err) {
    console.error('[LiveKit Remove Participant Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
