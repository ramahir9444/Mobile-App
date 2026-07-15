import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
  AppState,
  AppStateStatus,
  ActivityIndicator,
  Animated,
  Vibration,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useApp } from '../context/AppContext';
import { API_BASE, getAvatarUrl } from '../services/api';


const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Note: Real-time state sync is handled via backend polling (/api/schedules/:id/live-state)
// The @livekit/react-native SDK requires native module prebuild and is not needed
// for the current polling-based implementation.


// ────────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'teacher' | 'student' | 'system';
  message: string;
  timestamp: number;
  isPinned?: boolean;
  isAnnouncement?: boolean;
  emoji?: string;
}

interface LiveQuizOption {
  key: string;
  text: string;
}

interface LiveQuiz {
  questionText: string;
  options: LiveQuizOption[];
  correctAnswer?: string;
  marks: number;
  timeLimitSec: number;
  chapter?: string;
  topic?: string;
}

interface StageParticipant {
  identity: string;
  name: string;
  isMuted: boolean;
  isSpeaking?: boolean;
}

// ────────────────────────────────────────────────────────────────
//  API helpers
// ────────────────────────────────────────────────────────────────
const fetchLiveToken = async (
  scheduleId: string,
  participantName: string,
  participantIdentity: string,
  isTeacher = false
) => {
  const res = await fetch(`${API_BASE}/live-classroom/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId, participantName, participantIdentity, isTeacher }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to get token');
  return json.data;
};

const fetchLiveState = async (scheduleId: string, phone = '', name = '') => {
  const res = await fetch(`${API_BASE}/schedules/${scheduleId}/live-state?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch live state');
  return json.data;
};

const StudentVideoView: React.FC<{ track: any; style?: any }> = ({ track, style }) => {
  const ref = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !track || !ref.current) return;
    track.attach(ref.current);
    return () => {
      track.detach(ref.current);
    };
  }, [track]);

  if (Platform.OS === 'web') {
    return (
      <video
        ref={ref}
        autoPlay
        playsInline
        style={style || { width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  return (
    <View style={style || { width: '100%', height: '100%', backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="videocam" size={24} color="#8B5CF6" />
    </View>
  );
};

const postAttendance = async (scheduleId: string, payload: any) => {
  try {
    await fetch(`${API_BASE}/schedules/${scheduleId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {}
};

const postQuizSubmit = async (scheduleId: string, payload: any) => {
  const res = await fetch(`${API_BASE}/schedules/${scheduleId}/quiz-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

const postLiveEvent = async (scheduleId: string, studentPhone: string, studentName: string, eventType: string, detail?: string) => {
  try {
    await fetch(`${API_BASE}/schedules/${scheduleId}/live-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentPhone, studentName, eventType, detail: detail || '' }),
    });
  } catch {}
};

const postRecordingLog = async (scheduleId: string, payload: any) => {
  try {
    await fetch(`${API_BASE}/schedules/${scheduleId}/recording-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {}
};

// ────────────────────────────────────────────────────────────────
//  Main LiveClassroomScreen
// ────────────────────────────────────────────────────────────────
export const LiveClassroomScreen: React.FC = () => {
  const { user, goBack, activeClassSchedule, navigateTo } = useApp();

  // Connection state
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string>('');
  const [roomName, setRoomName] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReplayMode, setIsReplayMode] = useState(false);

  // Room options from schedule
  const [allowChat, setAllowChat] = useState(true);
  const [allowStage, setAllowStage] = useState(true);
  const [enableQuiz, setEnableQuiz] = useState(true);
  const [hwReleased, setHwReleased] = useState(false);

  // UI panel state
  const [rightPanel, setRightPanel] = useState<'chat' | 'quiz' | 'participants'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Live quiz state
  const [activeQuiz, setActiveQuiz] = useState<LiveQuiz | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const quizTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stage participants
  const [stageParticipants, setStageParticipants] = useState<StageParticipant[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [micMode, setMicMode] = useState<'individual' | 'group'>('individual');

  // Whiteboard state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(5); // placeholder
  const [drawings, setDrawings] = useState<any[]>([]);

  // Reactions
  const [reactionQueue, setReactionQueue] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const reactionEmojis = ['❤️', '👏', '🔥', '😮', '🎉', '⭐'];

  // Mic/camera state
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  // LiveKit WebRTC Video/Audio states for Web
  const [studentLkRoom, setStudentLkRoom] = useState<any>(null);
  const [teacherVideoTrack, setTeacherVideoTrack] = useState<any>(null);
  const [teacherAudioTrack, setTeacherAudioTrack] = useState<any>(null);
  const [studentVideoTracks, setStudentVideoTracks] = useState<{ [identity: string]: any }>({});
  const studentVideoRef = useRef<any>(null);

  // Connect student to LiveKit room
  useEffect(() => {
    if (Platform.OS !== 'web' || !token || !wsUrl) return;

    let active = true;
    let roomInstance: any = null;

    async function connectStudent() {
      try {
        const { Room, RoomEvent } = require('livekit-client');
        roomInstance = new Room();
        setStudentLkRoom(roomInstance);

        roomInstance.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
          if (participant?.identity?.startsWith('teacher-')) {
            if (track.kind === 'video') {
              setTeacherVideoTrack(track);
            } else if (track.kind === 'audio') {
              setTeacherAudioTrack(track);
              const audioEl = document.createElement('audio');
              audioEl.autoplay = true;
              track.attach(audioEl);
            }
          } else {
            if (track.kind === 'video') {
              setStudentVideoTracks(prev => ({ ...prev, [participant.identity]: track }));
            } else if (track.kind === 'audio') {
              const audioEl = document.createElement('audio');
              audioEl.autoplay = true;
              track.attach(audioEl);
            }
          }
        });

        roomInstance.on(RoomEvent.TrackUnsubscribed, (track: any, publication: any, participant: any) => {
          if (participant?.identity?.startsWith('teacher-')) {
            if (track.kind === 'video') {
              setTeacherVideoTrack(null);
            } else if (track.kind === 'audio') {
              setTeacherAudioTrack(null);
            }
          } else {
            if (track.kind === 'video') {
              setStudentVideoTracks(prev => {
                const copy = { ...prev };
                delete copy[participant?.identity];
                return copy;
              });
            }
          }
        });

        console.log('Connecting student to LiveKit room:', wsUrl);
        await roomInstance.connect(wsUrl, token);
        console.log('Student connected to LiveKit room successfully!');

        // Check if teacher/students are already publishing in the room
        for (const participant of roomInstance.remoteParticipants.values()) {
          const isTeacher = participant.identity.startsWith('teacher-');
          if (isTeacher) {
            const videoPub = Array.from(participant.videoTrackPublications.values())[0] as any;
            if (videoPub && videoPub.track) {
              setTeacherVideoTrack(videoPub.track);
            }
            const audioPub = Array.from(participant.audioTrackPublications.values())[0] as any;
            if (audioPub && audioPub.track) {
              setTeacherAudioTrack(audioPub.track);
              const audioEl = document.createElement('audio');
              audioEl.autoplay = true;
              participant.audioTrackPublications.values().next().value?.track?.attach(audioEl);
            }
          } else {
            const videoPub = Array.from(participant.videoTrackPublications.values())[0] as any;
            if (videoPub && videoPub.track) {
              setStudentVideoTracks(prev => ({ ...prev, [participant.identity]: videoPub.track }));
            }
            const audioPub = Array.from(participant.audioTrackPublications.values())[0] as any;
            if (audioPub && audioPub.track) {
              const audioEl = document.createElement('audio');
              audioEl.autoplay = true;
              audioPub.track.attach(audioEl);
            }
          }
        }
      } catch (err) {
        console.error('Student LiveKit error:', err);
      }
    }

    connectStudent();

    return () => {
      active = false;
      if (roomInstance) {
        roomInstance.disconnect();
      }
      setStudentLkRoom(null);
      setTeacherVideoTrack(null);
      setTeacherAudioTrack(null);
      setStudentVideoTracks({});
    };
  }, [token, wsUrl]);

  // Bind video element
  useEffect(() => {
    if (!teacherVideoTrack || !studentVideoRef.current) return;
    teacherVideoTrack.attach(studentVideoRef.current);
    return () => {
      teacherVideoTrack.detach(studentVideoRef.current);
    };
  }, [teacherVideoTrack]);

  // Stage student publish sync hook
  useEffect(() => {
    if (!studentLkRoom || !studentLkRoom.localParticipant) return;

    const studentOnStage = stageParticipants.find((p) => p.identity === user.phone);
    const isOnStage = !!studentOnStage;
    const isMutedByTeacher = studentOnStage ? studentOnStage.isMuted : true;

    // Determine target track publish states
    const targetMic = isOnStage && isMicOn && !isMutedByTeacher;
    const targetCamera = isOnStage && isCameraOn;

    async function syncTracks() {
      try {
        console.log('[Stage Sync] Setting local mic:', targetMic, 'camera:', targetCamera);
        await studentLkRoom.localParticipant.setMicrophoneEnabled(targetMic);
        await studentLkRoom.localParticipant.setCameraEnabled(targetCamera);
      } catch (err) {
        console.warn('[Stage Sync Error] Failed to publish local tracks:', err);
      }
    }

    syncTracks();
  }, [stageParticipants, isMicOn, isCameraOn, studentLkRoom, user.phone]);

  // Attendance tracking
  const sessionStartRef = useRef<number>(Date.now());
  const foregroundStartRef = useRef<number>(Date.now());
  const totalForegroundSecRef = useRef<number>(0);
  const totalBackgroundSecRef = useRef<number>(0);
  const sessionsRef = useRef<{ joinTime: string; leaveTime?: string; durationSec?: number }[]>([]);
  const reconnectCountRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Live state polling
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchedEventTimeRef = useRef<string>(new Date(Date.now() - 30 * 60 * 1000).toISOString());

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recDotAnim = useRef(new Animated.Value(1)).current;

  // ─── Boot: Get LiveKit token ─────────────────────────────────
  useEffect(() => {
    if (!activeClassSchedule) {
      setConnectionError('No class schedule selected.');
      setIsConnecting(false);
      return;
    }

    if (activeClassSchedule.liveStatus === 'ended' || activeClassSchedule.status === 'Finished') {
      setIsReplayMode(true);
      setIsConnecting(false);
      setAllowChat(false);
      setAllowStage(false);
      return;
    }

    bootstrapRoom();
  }, []);

  useEffect(() => {
    async function lockLandscape() {
      try {
        if (Platform.OS !== 'web') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      } catch (err) {
        console.warn('Failed to lock orientation:', err);
      }
    }
    lockLandscape();
    return () => {
      async function unlockOrientation() {
        try {
          if (Platform.OS !== 'web') {
            await ScreenOrientation.unlockAsync();
          }
        } catch (err) {
          console.warn('Failed to unlock orientation:', err);
        }
      }
      unlockOrientation();
    };
  }, []);

  const bootstrapRoom = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      const identity = user.phone || `student-${Date.now()}`;
      const displayName = user.name || 'Student';

      const data = await fetchLiveToken(
        activeClassSchedule._id,
        displayName,
        identity,
        false
      );

      setToken(data.token);
      setWsUrl(data.wsUrl);
      setRoomName(data.roomName);
      setAllowChat(data.allowChat !== false);
      setAllowStage(data.allowStage !== false);
      setEnableQuiz(data.enableQuiz !== false);

      // Record session join
      sessionsRef.current.push({ joinTime: new Date().toISOString() });
      sessionStartRef.current = Date.now();
      foregroundStartRef.current = Date.now();

      // Add welcome system message
      addSystemMessage(`Welcome to ${activeClassSchedule.title || 'Live Class'}! 🎉`);
    } catch (err: any) {
      setConnectionError(err.message || 'Could not connect to class');
    } finally {
      setIsConnecting(false);
    }
  };

  // ─── AppState focus tracker for attendance ───────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev === 'active' && nextState !== 'active') {
        // Going to background — stop foreground timer
        const elapsed = (Date.now() - foregroundStartRef.current) / 1000;
        totalForegroundSecRef.current += elapsed;
      } else if (prev !== 'active' && nextState === 'active') {
        // Coming back to foreground — log background time & reset
        foregroundStartRef.current = Date.now();
        reconnectCountRef.current += 1;
      }
    });
    return () => sub.remove();
  }, []);

  // ─── Poll live state from backend every 2.5s ─────────────────
  useEffect(() => {
    if (!activeClassSchedule || isReplayMode || isConnecting) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await fetchLiveState(activeClassSchedule._id, user.phone, user.name);
        if (!data) return;

        const state = data.liveState || {};

        // Quiz state
        if (enableQuiz && state.quizActive && state.activeQuizId && !activeQuiz) {
          // Find the quiz question in schedule quizzes array
          const q = (activeClassSchedule.quizzes || []).find(
            (h: any) => h._id === state.activeQuizId || h.text === state.activeQuizId
          );
          if (q) {
            setActiveQuiz({
              questionText: q.text,
              options: ['A', 'B', 'C', 'D']
                .filter((k) => q.options?.[k])
                .map((k) => ({ key: k, text: q.options[k] })),
              correctAnswer: q.correctAnswer || q.correct,
              marks: 1,
              timeLimitSec: 30,
              chapter: q.chapter || '',
              topic: q.topic || ''
            });
            setRightPanel('quiz');
            setQuizSubmitted(false);
            setSelectedOption(null);
            setQuizTimeLeft(30);
            Vibration.vibrate([0, 200, 100, 200]);
          }
        } else if (!state.quizActive) {
          setActiveQuiz(null);
        }

        // Stage participants
        if (state.stageStudents) {
          const stage: StageParticipant[] = (state.stageStudents || []).map((phone: string) => ({
            identity: phone,
            name: phone,
            isMuted: (state.mutedStageStudents || []).includes(phone),
          }));
          setStageParticipants(stage);
          if (state.micMode) {
            setMicMode(state.micMode);
          }

          // Force local mute if teacher muted or booted the student from stage
          const onStage = (state.stageStudents || []).includes(user.phone);
          if (!onStage) {
            setIsMicOn(false);
            setIsCameraOn(false);
          } else {
            const isMutedByTeacher = (state.mutedStageStudents || []).includes(user.phone);
            if (isMutedByTeacher && isMicOn) {
              setIsMicOn(false);
            }
          }
        }

        // Page sync
        if (typeof state.activePage === 'number' && state.activePage !== currentSlide) {
          setCurrentSlide(state.activePage);
        }
        const slides = activeClassSchedule?.slides || [];
        const totalSlidesCount = slides.length || 5;
        if (totalSlidesCount !== totalSlides) {
          setTotalSlides(totalSlidesCount);
        }

        // Drawings sync
        if (state.drawings) {
          setDrawings(state.drawings);
        } else {
          setDrawings([]);
        }

        // HW Released — notify student once
        if (state.hwReleased && !hwReleased) {
          setHwReleased(true);
          setRightPanel('participants');
          Alert.alert('📝 Homework Assigned!', 'Your teacher has released homework for this class. Check the Participants tab.', [{ text: 'View Now' }]);
        }

        // Poll for new live events (chat messages, reactions)
        try {
          const eventsRes = await fetch(`${API_BASE}/schedules/${activeClassSchedule._id}/live-events?since=${lastFetchedEventTimeRef.current}`);
          const eventsJson = await eventsRes.json();
          if (eventsJson.success && eventsJson.data && eventsJson.data.length > 0) {
            const newMessages: ChatMessage[] = [];
            let latestTime = lastFetchedEventTimeRef.current;
            
            eventsJson.data.forEach((evt: any) => {
              if (evt.timestamp > latestTime) {
                latestTime = evt.timestamp;
              }
              
              if (evt.eventType === 'ChatMessage') {
                newMessages.push({
                  id: evt._id || Math.random().toString(),
                  sender: evt.studentName || 'Student',
                  message: evt.detail,
                  timestamp: evt.timestamp,
                  senderRole: evt.studentPhone === 'teacher' ? 'teacher' : 'student'
                });
              } else if (evt.eventType === 'Reaction') {
                const emoji = evt.detail;
                const x = Math.random() * (SCREEN_W * 0.4) + (SCREEN_W * 0.1);
                setReactionQueue((prev) => [...prev, { id: `${evt._id}-${Date.now()}`, emoji, x }]);
              }
            });
            
            lastFetchedEventTimeRef.current = latestTime;
            if (newMessages.length > 0) {
              setChatMessages((prev) => {
                const merged = [...prev];
                newMessages.forEach(newMsg => {
                  if (!merged.some(m => m.timestamp === newMsg.timestamp && m.sender === newMsg.sender)) {
                    merged.push(newMsg);
                  }
                });
                return merged.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              });
            }
          }
        } catch {}

        // If class ended, show ended notice
        if (data.liveStatus === 'ended') {
          handleClassEnded();
        }
      } catch {}
    }, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeClassSchedule, isConnecting, isReplayMode, activeQuiz, currentSlide, enableQuiz]);

  // ─── Quiz countdown timer ────────────────────────────────────
  useEffect(() => {
    if (activeQuiz && !quizSubmitted && quizTimeLeft > 0) {
      quizTimerRef.current = setInterval(() => {
        setQuizTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(quizTimerRef.current!);
            if (!quizSubmitted) handleQuizSubmit(null); // auto-submit as skipped
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    };
  }, [activeQuiz, quizSubmitted]);

  // ─── REC dot animation ───────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recDotAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(recDotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleClassEnded = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    submitAttendance();
    Alert.alert(
      'Class Ended',
      'The teacher has ended this live session. You will be redirected.',
      [{ text: 'OK', onPress: () => navigateTo('COURSE_DETAILS') }]
    );
  };

  const submitAttendance = useCallback(async () => {
    if (!activeClassSchedule) return;
    // Finalize foreground time
    if (appStateRef.current === 'active') {
      totalForegroundSecRef.current += (Date.now() - foregroundStartRef.current) / 1000;
    }
    const totalConnectedSec = (Date.now() - sessionStartRef.current) / 1000;
    const actualLearningSec = totalForegroundSecRef.current;
    const backgroundSec = totalConnectedSec - actualLearningSec;

    // Close last session
    if (sessionsRef.current.length > 0) {
      const last = sessionsRef.current[sessionsRef.current.length - 1];
      if (!last.leaveTime) {
        last.leaveTime = new Date().toISOString();
        last.durationSec = totalConnectedSec;
      }
    }

    await postAttendance(activeClassSchedule._id, {
      studentPhone: user.phone,
      studentName: user.name,
      sessions: sessionsRef.current,
      reconnectCount: reconnectCountRef.current,
      foregroundSec: Math.round(actualLearningSec),
      backgroundSec: Math.round(backgroundSec),
      totalConnectedSec: Math.round(totalConnectedSec),
      actualLearningSec: Math.round(actualLearningSec),
    });
  }, [activeClassSchedule, user]);

  // Submit attendance on unmount
  useEffect(() => {
    return () => {
      submitAttendance();
    };
  }, [submitAttendance]);

  // ─── Chat helpers ────────────────────────────────────────────
  const addSystemMessage = (msg: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'System',
      senderRole: 'system',
      message: msg,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: user.name || 'You',
      senderRole: 'student',
      message: chatInput.trim(),
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');
    postLiveEvent(activeClassSchedule._id, user.phone, user.name, 'ChatMessage', chatInput.trim());
  };

  // ─── Quiz helpers ────────────────────────────────────────────
  const handleQuizSubmit = async (option: string | null) => {
    if (quizSubmitted || !activeClassSchedule) return;
    setQuizSubmitted(true);
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);

    const isCorrect = option !== null && option === activeQuiz?.correctAnswer;
    const isSkipped = option === null;

    await postQuizSubmit(activeClassSchedule._id, {
      studentPhone: user.phone,
      studentName: user.name,
      subject: activeClassSchedule.subject || '',
      chapter: activeQuiz?.chapter || '',
      topic: activeQuiz?.topic || '',
      questionText: activeQuiz?.questionText || '',
      selectedOption: option || '',
      correctOption: activeQuiz?.correctAnswer || '',
      timeTakenSec: activeQuiz ? activeQuiz.timeLimitSec - quizTimeLeft : 0,
      marks: isCorrect ? (activeQuiz?.marks || 1) : 0,
      isCorrect,
      isWrong: !isCorrect && !isSkipped,
      isSkipped,
    });
  };

  // ─── Raise hand ──────────────────────────────────────────────
  const toggleRaiseHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    if (next) {
      postLiveEvent(activeClassSchedule._id, user.phone, user.name, 'RaiseHand');
    } else {
      postLiveEvent(activeClassSchedule._id, user.phone, user.name, 'LowerHand');
    }
  };

  // ─── Reactions ───────────────────────────────────────────────
  const sendReaction = (emoji: string) => {
    const id = Date.now().toString();
    const x = Math.random() * (SCREEN_W - 60);
    setReactionQueue((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setReactionQueue((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
    postLiveEvent(activeClassSchedule._id, user.phone, user.name, 'Reaction', emoji);
  };

  // ─── Back / Leave ─────────────────────────────────────────────
  const handleLeave = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to leave the live session?')) {
        submitAttendance().then(() => {
          navigateTo('COURSE_DETAILS');
        });
      }
      return;
    }

    Alert.alert('Leave Class?', 'Are you sure you want to leave the live session?', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await submitAttendance();
          navigateTo('COURSE_DETAILS');
        },
      },
    ]);
  };

  // ─── REPLAY MODE ─────────────────────────────────────────────
  if (isReplayMode) {
    return <ReplayClassScreen schedule={activeClassSchedule} onBack={() => navigateTo('COURSE_DETAILS')} user={user} />;
  }

  // ─── CONNECTION LOADING ───────────────────────────────────────
  if (isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B6A6" />
        <Text style={styles.loadingText}>Joining live class...</Text>
        <Text style={styles.loadingSubtext}>{activeClassSchedule?.title || ''}</Text>
      </View>
    );
  }

  // ─── CONNECTION ERROR ─────────────────────────────────────────
  if (connectionError) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="warning" size={48} color="#EF4444" />
        <Text style={[styles.loadingText, { color: '#EF4444', marginTop: 12 }]}>{connectionError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={bootstrapRoom}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.retryBtn, { marginTop: 8, backgroundColor: '#334155' }]} onPress={() => navigateTo('COURSE_DETAILS')}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── LIVE CLASSROOM UI ─────────────────────────────────────────
  const schedule = activeClassSchedule;

  // Helper: enter fullscreen + lock landscape on web
  const handleWebFullscreen = () => {
    if (Platform.OS === 'web') {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => {
          if ((screen as any).orientation?.lock) {
            (screen as any).orientation.lock('landscape').catch(() => {});
          }
        }).catch(() => {});
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* ── PORTRAIT WARNING OVERLAY (web only) ── */}
      {Platform.OS === 'web' && (
        <div
          style={{
            display: 'none',
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#0B1120',
            zIndex: 9999,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
          className="portrait-only-overlay"
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Rotate Your Device</div>
          <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '0 32px', marginBottom: 24 }}>
            Live class works best in landscape mode
          </div>
          <button
            onClick={handleWebFullscreen}
            style={{ background: '#00B6A6', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}
          >
            🔄 Enter Fullscreen
          </button>
          <style>{`
            @media (orientation: portrait) { .portrait-only-overlay { display: flex !important; } }
            @media (orientation: landscape) { .portrait-only-overlay { display: none !important; } }
          `}</style>
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { opacity: recDotAnim }]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{schedule?.title || 'Live Class'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerSubject}>{schedule?.subject}</Text>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={handleWebFullscreen}
              style={[styles.headerBtn, { marginLeft: 4, backgroundColor: '#334155' }]}
            >
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>⛶ Full</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleLeave} style={[styles.headerBtn, { marginLeft: 8, backgroundColor: '#EF4444' }]}>
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MAIN BODY ── */}
      <View style={styles.body}>
        {/* Left: Teaching Canvas */}
        <View style={styles.canvasArea}>
          {/* Whiteboard / Slide area */}
          <View style={styles.whiteboardArea}>
            <View style={styles.slideFrame}>
              {activeClassSchedule?.slides && activeClassSchedule.slides.length > 0 ? (
                <>
                  {(() => {
                    const slides = activeClassSchedule.slides || [];
                    const url = slides[currentSlide];
                    if (!url) {
                      return (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: 'white' }}>No slide content</Text>
                        </View>
                      );
                    }

                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) || !url.includes('.');
                    const isVideo = url.match(/\.(mp4|webm|ogg)/i);
                    const isPdf = url.match(/\.pdf/i);
                    const resolvedUrl = getAvatarUrl(url) || '';

                    if (Platform.OS === 'web') {
                      if (isPdf) {
                        return (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1E293B', overflow: 'hidden' }}>
                            {/* PDF Viewer Control Bar */}
                            <div style={{ padding: '8px 16px', backgroundColor: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', zIndex: 12 }}>
                              <span style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: 'bold' }}>📄 Slide Material (PDF)</span>
                              <a 
                                href={resolvedUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ 
                                  color: '#FFFFFF', 
                                  backgroundColor: '#00B6A6', 
                                  padding: '4px 12px', 
                                  borderRadius: '4px', 
                                  fontSize: '11px', 
                                  fontWeight: 'bold', 
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                📥 Open in New Tab
                              </a>
                            </div>
                            
                            {/* Scrollable PDF Iframe container */}
                            <div 
                              style={{ 
                                flex: 1, 
                                width: '100%', 
                                height: '100%', 
                                overflowY: 'auto', 
                                overflowX: 'hidden',
                                WebkitOverflowScrolling: 'touch',
                                position: 'relative'
                              }}
                            >
                              <iframe
                                src={`${resolvedUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  minHeight: '600px',
                                  border: 'none',
                                  pointerEvents: 'auto'
                                }}
                                title="slide pdf"
                              />
                            </div>
                          </div>
                        );
                      }
                      if (isImage) {
                        return (
                          <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
                            <img src={resolvedUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="slide content" />
                          </div>
                        );
                      }
                      if (isVideo) {
                        return <video src={resolvedUrl} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
                      }
                      return (
                        <div style={{ width: '100%', height: '100%', overflow: 'auto', backgroundColor: '#1E293B', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img src={resolvedUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="slide content" />
                        </div>
                      );
                    }

                    // Native
                    if (isImage) {
                      return <Image source={{ uri: resolvedUrl }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />;
                    }
                    return (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 13 }}>Open on a browser to view this file</Text>
                      </View>
                    );
                  })()}
                  <View style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                      Slide {currentSlide + 1} / {totalSlides}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.slideContent}>
                  <Text style={styles.slideTitle}>📘 {schedule?.subject}</Text>
                  <Text style={styles.slideSubtitle}>{schedule?.title}</Text>
                  <Text style={styles.slidePageNumber}>Slide {currentSlide + 1} / {totalSlides}</Text>

                  <View style={styles.slidePlaceholderGrid}>
                    {[...Array(6)].map((_, i) => (
                      <View key={i} style={styles.slidePlaceholderBlock} />
                    ))}
                  </View>

                  <Text style={styles.slideTip}>
                    📺 Teacher is sharing their screen. Content appears here in real-time.
                  </Text>
                </View>
              )}

              {/* Web SVG drawings overlay */}
              {Platform.OS === 'web' && drawings && drawings.length > 0 && (
                <svg
                  viewBox="0 0 800 450"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  {drawings.map((line: any, idx: number) => (
                    <path
                      key={idx}
                      d={line.path}
                      stroke={line.color || '#FF5E00'}
                      strokeWidth={line.width || 3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>
              )}
              {/* Stage Students overlay in bottom-left */}
              {stageParticipants.length > 0 && (
                <View style={{ 
                  position: 'absolute', 
                  bottom: 12, 
                  left: 110, 
                  zIndex: 100, 
                  flexDirection: 'row', 
                  gap: 8, 
                  alignItems: 'center' 
                }}>
                  {(() => {
                    const displayList = micMode === 'group' 
                      ? stageParticipants.slice(0, 6) 
                      : stageParticipants.slice(0, 1);

                    return displayList.map((p) => {
                      const hasVideo = !!studentVideoTracks[p.identity];
                      return (
                        <View key={p.identity} style={{ 
                          width: 90, 
                          height: 60, 
                          borderRadius: 8, 
                          borderWidth: 2,
                          borderColor: p.isMuted ? '#EF4444' : '#8B5CF6', 
                          backgroundColor: '#0F172A', 
                          overflow: 'hidden', 
                          position: 'relative',
                          elevation: 5,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.5,
                          shadowRadius: 2,
                        }}>
                          {Platform.OS === 'web' && hasVideo ? (
                            <StudentVideoView track={studentVideoTracks[p.identity]} style={{ width: '100%', height: '100%' }} />
                          ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B' }}>
                              <Ionicons name="person" size={16} color="#94A3B8" />
                              <Text style={{ color: '#94A3B8', fontSize: 6.5, fontWeight: 'bold', marginTop: 2 }}>NO VIDEO</Text>
                            </View>
                          )}
                          
                          <View style={{ 
                            position: 'absolute', 
                            bottom: 2, 
                            left: 2, 
                            right: 2,
                            backgroundColor: 'rgba(0,0,0,0.7)', 
                            paddingHorizontal: 4,
                            paddingVertical: 1, 
                            borderRadius: 3, 
                            flexDirection: 'row',
                            alignItems: 'center', 
                            justifyContent: 'space-between'
                          }}>
                            <Text style={{ color: 'white', fontSize: 7, fontWeight: 'bold', maxWidth: 50 }} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <Text style={{ color: 'white', fontSize: 7 }}>
                              {p.isMuted ? '🔇' : '🔊'}
                            </Text>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>
              )}
            </View>

            {/* Slide navigation (read-only for students, follows teacher) */}
            <View style={styles.slideNav}>
              <Text style={styles.slideNavText}>Slide {currentSlide + 1} / {totalSlides}</Text>
            </View>
          </View>

          {/* Redundant student stage bottom strip removed to focus on absolute overlay */}
        </View>

        {/* Right: Chat / Quiz Panel */}
        <View style={styles.rightPanel}>
          {/* Top: Video feed panel */}
          <View style={styles.feedsPanel}>
            {/* Teacher video stream */}
            <View style={styles.teacherFeedBox}>
              {Platform.OS === 'web' && teacherVideoTrack ? (
                <video
                  ref={studentVideoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B' }}>
                  <Ionicons name="person" size={24} color="#94A3B8" />
                  <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>
                    {schedule?.teacherName || 'Teacher'}
                  </Text>
                </View>
              )}
              {/* REC Badge */}
              <Animated.View style={[styles.recIndicator, { opacity: recDotAnim, top: 4, left: 4 }]}>
                <Text style={styles.recText}>● REC</Text>
              </Animated.View>
            </View>
          </View>

          {/* Panel Tab Switcher */}
          <View style={styles.panelTabs}>
            {(['chat', 'quiz', 'participants'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setRightPanel(tab)}
                style={[styles.panelTab, rightPanel === tab && styles.panelTabActive]}
              >
                <Text style={[styles.panelTabText, rightPanel === tab && styles.panelTabTextActive]}>
                  {tab === 'chat' ? '💬' : tab === 'quiz' ? '📝' : '👥'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CHAT PANEL */}
          {rightPanel === 'chat' && (
            <View style={styles.chatPanel}>
              <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id}
                style={styles.chatList}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => <ChatBubble msg={item} myName={user.name} />}
                ref={(ref) => {
                  if (ref && chatMessages.length > 0) {
                    ref.scrollToEnd({ animated: true });
                  }
                }}
                onContentSizeChange={() => {}}
              />

              {/* Emoji Reactions Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiBar}>
                {reactionEmojis.map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => sendReaction(emoji)} style={styles.emojiBtn}>
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {allowChat ? (
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Type a message..."
                    placeholderTextColor="#64748B"
                    onSubmitEditing={sendChatMessage}
                    returnKeyType="send"
                  />
                  <TouchableOpacity onPress={sendChatMessage} style={styles.sendBtn}>
                    <Ionicons name="send" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.chatInputRowMuted}>
                  <Text style={styles.chatMutedText}>🚫 Chat has been muted by the teacher</Text>
                </View>
              )}
            </View>
          )}

          {/* QUIZ PANEL */}
          {rightPanel === 'quiz' && (
            <View style={styles.quizPanel}>
              {activeQuiz ? (
                <QuizView
                  quiz={activeQuiz}
                  selectedOption={selectedOption}
                  submitted={quizSubmitted}
                  timeLeft={quizTimeLeft}
                  onSelectOption={(opt) => {
                    if (!quizSubmitted) setSelectedOption(opt);
                  }}
                  onSubmit={() => handleQuizSubmit(selectedOption)}
                />
              ) : (
                <View style={styles.quizEmpty}>
                  <Ionicons name="help-circle-outline" size={48} color="#334155" />
                  <Text style={styles.quizEmptyText}>No active quiz right now</Text>
                  <Text style={styles.quizEmptySubtext}>The teacher will launch a quiz here soon</Text>
                </View>
              )}
            </View>
          )}

          {/* PARTICIPANTS PANEL */}
          {rightPanel === 'participants' && (
            <View style={styles.participantsPanel}>
              <Text style={styles.participantsPanelTitle}>Live Participants</Text>
              <View style={styles.participantRow}>
                <Ionicons name="person-circle" size={24} color="#00B6A6" />
                <Text style={styles.participantName}>{schedule?.teacherName || 'Teacher'}</Text>
                <View style={styles.teacherBadge}><Text style={styles.teacherBadgeText}>Teacher</Text></View>
              </View>
              <View style={styles.participantRow}>
                <Ionicons name="person-circle" size={24} color="#94A3B8" />
                <Text style={styles.participantName}>{user.name || 'You'}</Text>
                <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── BOTTOM ACTION BAR ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, isMicOn && styles.bottomBtnActive]}
          onPress={() => {
            const studentOnStage = stageParticipants.some((p) => p.identity === user.phone);
            if (!studentOnStage) {
              Alert.alert('Stage Access Required', 'You must be allowed on stage by the teacher to toggle your microphone.');
              return;
            }
            const next = !isMicOn;
            setIsMicOn(next);
            postLiveEvent(activeClassSchedule._id, user.phone, user.name, next ? 'MicOn' : 'MicOff');
          }}
        >
          <Ionicons name={isMicOn ? 'mic' : 'mic-off'} size={20} color={isMicOn ? '#00B6A6' : '#94A3B8'} />
          <Text style={[styles.bottomBtnLabel, isMicOn && { color: '#00B6A6' }]}>Mic</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, isCameraOn && styles.bottomBtnActive]}
          onPress={() => {
            const studentOnStage = stageParticipants.some((p) => p.identity === user.phone);
            if (!studentOnStage) {
              Alert.alert('Stage Access Required', 'You must be allowed on stage by the teacher to toggle your camera.');
              return;
            }
            const next = !isCameraOn;
            setIsCameraOn(next);
            postLiveEvent(activeClassSchedule._id, user.phone, user.name, next ? 'CameraOn' : 'CameraOff');
          }}
        >
          <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={20} color={isCameraOn ? '#00B6A6' : '#94A3B8'} />
          <Text style={[styles.bottomBtnLabel, isCameraOn && { color: '#00B6A6' }]}>Camera</Text>
        </TouchableOpacity>

        {allowStage && (
          <TouchableOpacity
            style={[styles.bottomBtn, handRaised && styles.bottomBtnRaise]}
            onPress={toggleRaiseHand}
          >
            <Text style={{ fontSize: 22 }}>{handRaised ? '✋' : '🖐️'}</Text>
            <Text style={[styles.bottomBtnLabel, handRaised && { color: '#FBBF24' }]}>
              {handRaised ? 'Lower' : 'Raise'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => sendReaction('❤️')}
        >
          <Ionicons name="heart" size={20} color="#EC4899" />
          <Text style={styles.bottomBtnLabel}>React</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bottomBtn, { backgroundColor: '#EF4444' }]} onPress={handleLeave}>
          <Ionicons name="call" size={20} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={[styles.bottomBtnLabel, { color: 'white' }]}>End</Text>
        </TouchableOpacity>
      </View>

      {/* ── FLOATING REACTIONS ── */}
      {reactionQueue.map((r) => (
        <Animated.View key={r.id} style={[styles.floatingReaction, { left: r.x }]}>
          <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
//  Chat Bubble Component
// ────────────────────────────────────────────────────────────────
const ChatBubble: React.FC<{ msg: ChatMessage; myName: string }> = ({ msg, myName }) => {
  const isMe = msg.sender === myName;
  const isSystem = msg.senderRole === 'system';

  if (isSystem) {
    return (
      <View style={chatStyles.systemRow}>
        <Text style={chatStyles.systemText}>{msg.message}</Text>
      </View>
    );
  }

  return (
    <View style={[chatStyles.row, isMe && chatStyles.rowMe]}>
      {!isMe && (
        <View style={chatStyles.avatar}>
          <Text style={chatStyles.avatarText}>{msg.sender[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={[chatStyles.bubble, isMe ? chatStyles.bubbleMe : chatStyles.bubbleThem]}>
        {!isMe && <Text style={chatStyles.senderName}>{msg.sender}</Text>}
        <Text style={chatStyles.messageText}>{msg.message}</Text>
        <Text style={chatStyles.timeText}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
//  Quiz View Component
// ────────────────────────────────────────────────────────────────
const QuizView: React.FC<{
  quiz: LiveQuiz;
  selectedOption: string | null;
  submitted: boolean;
  timeLeft: number;
  onSelectOption: (opt: string) => void;
  onSubmit: () => void;
}> = ({ quiz, selectedOption, submitted, timeLeft, onSelectOption, onSubmit }) => {
  const timerColor = timeLeft <= 10 ? '#EF4444' : '#00B6A6';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
      {/* Timer */}
      <View style={quizStyles.timerRow}>
        <Text style={quizStyles.timerLabel}>⏱ Time left</Text>
        <Text style={[quizStyles.timerValue, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <Text style={quizStyles.questionText}>{quiz.questionText}</Text>

      {quiz.options.map((opt) => {
        const isSelected = selectedOption === opt.key;
        const isCorrect = submitted && opt.key === quiz.correctAnswer;
        const isWrong = submitted && isSelected && opt.key !== quiz.correctAnswer;

        return (
          <TouchableOpacity
            key={opt.key}
            disabled={submitted}
            onPress={() => onSelectOption(opt.key)}
            style={[
              quizStyles.optionBtn,
              isSelected && quizStyles.optionSelected,
              isCorrect && quizStyles.optionCorrect,
              isWrong && quizStyles.optionWrong,
            ]}
          >
            <Text style={[quizStyles.optionKey, isSelected && { color: 'white' }]}>{opt.key}</Text>
            <Text style={[quizStyles.optionText, (isSelected || isCorrect || isWrong) && { color: 'white' }]}>
              {opt.text}
            </Text>
            {isCorrect && <Ionicons name="checkmark-circle" size={18} color="white" />}
            {isWrong && <Ionicons name="close-circle" size={18} color="white" />}
          </TouchableOpacity>
        );
      })}

      {!submitted ? (
        <TouchableOpacity
          onPress={onSubmit}
          disabled={!selectedOption}
          style={[quizStyles.submitBtn, !selectedOption && { opacity: 0.4 }]}
        >
          <Text style={quizStyles.submitBtnText}>Submit Answer</Text>
        </TouchableOpacity>
      ) : (
        <View style={quizStyles.submittedBanner}>
          <Ionicons name="checkmark-done-circle" size={20} color="#10B981" />
          <Text style={quizStyles.submittedText}>Answer submitted!</Text>
        </View>
      )}
    </ScrollView>
  );
};

// ────────────────────────────────────────────────────────────────
//  Replay Class Screen (Ended classes)
// ────────────────────────────────────────────────────────────────
const ReplayClassScreen: React.FC<{ schedule: any; onBack: () => void; user: any }> = ({ schedule, onBack, user }) => {
  const [watchTime, setWatchTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completionPct, setCompletionPct] = useState(0);
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      // Save watch log
      if (schedule && user?.phone) {
        postRecordingLog(schedule._id, {
          studentPhone: user.phone,
          watchTimeSec: watchTime,
          completionPercentage: completionPct,
          resumePositionSec: watchTime,
          playbackSpeed: 1,
        });
      }
    };
  }, [watchTime, completionPct]);

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(watchTimerRef.current!);
    } else {
      watchTimerRef.current = setInterval(() => {
        setWatchTime((t) => {
          const next = t + 1;
          const totalDuration = (schedule?.durationMinutes || 60) * 60;
          setCompletionPct(Math.min(100, Math.round((next / totalDuration) * 100)));
          return next;
        });
      }, 1000);
    }
    setIsPlaying((p) => !p);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={replayStyles.container}>
      <View style={replayStyles.header}>
        <TouchableOpacity onPress={onBack} style={replayStyles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={replayStyles.headerTitle}>{schedule?.title || 'Class Recording'}</Text>
          <Text style={replayStyles.headerSub}>Recorded Lecture · {schedule?.subject}</Text>
        </View>
      </View>

      {/* Video Player Mock */}
      <View style={replayStyles.playerBox}>
        <View style={replayStyles.videoMock}>
          <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.4)" />
          <Text style={replayStyles.videoMockText}>
            {schedule?.recordingUrl ? 'Recording available' : 'Recording will be available shortly'}
          </Text>
        </View>

        {/* Player Controls */}
        <View style={replayStyles.playerControls}>
          <Text style={replayStyles.timeLabel}>{formatTime(watchTime)}</Text>
          <View style={replayStyles.progressBar}>
            <View style={[replayStyles.progressFill, { width: `${completionPct}%` }]} />
          </View>
          <Text style={replayStyles.timeLabel}>
            {formatTime((schedule?.durationMinutes || 60) * 60)}
          </Text>
        </View>

        <View style={replayStyles.playerBtns}>
          <TouchableOpacity style={replayStyles.playerBtn}>
            <Ionicons name="play-skip-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={replayStyles.playPauseBtn} onPress={togglePlay}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={replayStyles.playerBtn}>
            <Ionicons name="play-skip-forward" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Watch Stats */}
      <View style={replayStyles.statsRow}>
        <View style={replayStyles.statCard}>
          <Text style={replayStyles.statValue}>{completionPct}%</Text>
          <Text style={replayStyles.statLabel}>Watched</Text>
        </View>
        <View style={replayStyles.statCard}>
          <Text style={replayStyles.statValue}>{formatTime(watchTime)}</Text>
          <Text style={replayStyles.statLabel}>Watch Time</Text>
        </View>
        <View style={replayStyles.statCard}>
          <Text style={replayStyles.statValue}>{schedule?.subject || '-'}</Text>
          <Text style={replayStyles.statLabel}>Subject</Text>
        </View>
      </View>

      {/* Related Content */}
      <View style={replayStyles.relatedSection}>
        <Text style={replayStyles.relatedTitle}>📎 Class Materials</Text>
        {(schedule?.materials || []).length === 0 ? (
          <Text style={replayStyles.relatedEmpty}>No materials attached to this class</Text>
        ) : (
          (schedule?.materials || []).map((m: any, i: number) => (
            <View key={i} style={replayStyles.materialRow}>
              <Ionicons name="document" size={16} color="#00B6A6" />
              <Text style={replayStyles.materialName}>{m.title}</Text>
              <Text style={replayStyles.materialSize}>{m.size}</Text>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────
//  Styles
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1120' },
  loadingText: { color: 'white', fontSize: 18, fontWeight: '700', marginTop: 16 },
  loadingSubtext: { color: '#64748B', fontSize: 13, marginTop: 6 },
  retryBtn: { backgroundColor: '#00B6A6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 20 },
  retryBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#131D2E', paddingTop: 44, paddingBottom: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerBtn: { padding: 8, borderRadius: 8, backgroundColor: '#1E293B' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 14, fontWeight: '700', flex: 1 },
  headerSubject: { color: '#00B6A6', fontSize: 12, fontWeight: '600', marginRight: 8 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveText: { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  // Body layout
  body: { flex: 1, flexDirection: 'row' },

  // Canvas area (left ~65%)
  canvasArea: { flex: 65, backgroundColor: '#0D1829', position: 'relative' },
  teacherCameraPip: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  teacherCameraBox: { width: 90, height: 70, backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 2, borderColor: '#00B6A6', alignItems: 'center', justifyContent: 'center', gap: 4 },
  teacherLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '600' },
  recIndicator: { position: 'absolute', bottom: 4, left: 4 },
  recText: { color: '#EF4444', fontSize: 9, fontWeight: '700' },

  whiteboardArea: { flex: 1, margin: 10, marginTop: 10 },
  slideFrame: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  slideContent: { flex: 1, padding: 20, alignItems: 'center' },
  slideTitle: { fontSize: 18, fontWeight: '800', color: '#0B1120', textAlign: 'center', marginBottom: 6 },
  slideSubtitle: { fontSize: 13, color: '#475569', textAlign: 'center', marginBottom: 20 },
  slidePageNumber: { fontSize: 11, color: '#94A3B8', marginBottom: 16 },
  slidePlaceholderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  slidePlaceholderBlock: { width: 80, height: 50, backgroundColor: '#E2E8F0', borderRadius: 6 },
  slideTip: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 'auto', fontStyle: 'italic' },

  slideNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 12 },
  slideNavBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  slideNavText: { color: '#94A3B8', fontSize: 12 },

  stageStrip: { backgroundColor: '#131D2E', padding: 8, borderTopWidth: 1, borderTopColor: '#1E293B' },
  stageLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 6 },
  stageCard: { width: 64, marginRight: 8, alignItems: 'center', gap: 3 },
  stageAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', borderWidth: 2, borderColor: '#00B6A6', alignItems: 'center', justifyContent: 'center' },
  stageName: { color: '#CBD5E1', fontSize: 9, textAlign: 'center' },
  speakingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },

  // Right Panel
  rightPanel: { flex: 35, backgroundColor: '#0F1A2A', borderLeftWidth: 1, borderLeftColor: '#1E293B' },
  feedsPanel: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#1E293B', backgroundColor: '#0B132B' },
  teacherFeedBox: { width: '100%', height: 110, borderRadius: 8, borderWidth: 1, borderColor: '#00B6A6', overflow: 'hidden', position: 'relative' },
  studentFeedBox: { width: 80, height: 55, borderRadius: 6, borderWidth: 1, borderColor: '#8B5CF6', overflow: 'hidden', marginRight: 6, position: 'relative', backgroundColor: '#1E293B' },
  panelTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  panelTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  panelTabActive: { borderBottomColor: '#00B6A6' },
  panelTabText: { fontSize: 16 },
  panelTabTextActive: {},

  chatPanel: { flex: 1 },
  chatList: { flex: 1 },
  emojiBar: { maxHeight: 44, borderTopWidth: 1, borderTopColor: '#1E293B', paddingHorizontal: 8 },
  emojiBtn: { padding: 6 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#1E293B', gap: 8 },
  chatInput: { flex: 1, backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: 'white', fontSize: 13 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00B6A6', alignItems: 'center', justifyContent: 'center' },

  quizPanel: { flex: 1 },
  quizEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  quizEmptyText: { color: '#64748B', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  quizEmptySubtext: { color: '#334155', fontSize: 12, textAlign: 'center' },

  participantsPanel: { flex: 1, padding: 12 },
  participantsPanelTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  participantName: { color: 'white', fontSize: 13, fontWeight: '600', flex: 1 },
  teacherBadge: { backgroundColor: 'rgba(0,182,166,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  teacherBadgeText: { color: '#00B6A6', fontSize: 10, fontWeight: '700' },
  youBadge: { backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  youBadgeText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },

  // Bottom Bar
  bottomBar: { flexDirection: 'row', backgroundColor: '#131D2E', borderTopWidth: 1, borderTopColor: '#1E293B', paddingBottom: 24, paddingTop: 10, paddingHorizontal: 12, gap: 4, justifyContent: 'space-around' },
  bottomBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 10 },
  bottomBtnActive: { backgroundColor: 'rgba(0,182,166,0.1)' },
  bottomBtnRaise: { backgroundColor: 'rgba(251,191,36,0.1)' },
  bottomBtnLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },

  floatingReaction: { position: 'absolute', bottom: 100, zIndex: 100 },
  chatInputRowMuted: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#131D2E', borderTopWidth: 1, borderTopColor: '#1E293B' },
  chatMutedText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
});

const chatStyles = StyleSheet.create({
  systemRow: { alignItems: 'center', paddingVertical: 4 },
  systemText: { color: '#64748B', fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, marginVertical: 2 },
  rowMe: { justifyContent: 'flex-end' },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  avatarText: { color: '#00B6A6', fontSize: 10, fontWeight: '700' },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 8, gap: 2 },
  bubbleThem: { backgroundColor: '#1E293B', borderBottomLeftRadius: 2 },
  bubbleMe: { backgroundColor: '#00B6A6', borderBottomRightRadius: 2 },
  senderName: { color: '#00B6A6', fontSize: 9, fontWeight: '700' },
  messageText: { color: 'white', fontSize: 12 },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 9, alignSelf: 'flex-end' },
});

const quizStyles = StyleSheet.create({
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timerLabel: { color: '#64748B', fontSize: 12 },
  timerValue: { fontSize: 22, fontWeight: '800' },
  questionText: { color: 'white', fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 16 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  optionSelected: { backgroundColor: '#0284C7', borderColor: '#0EA5E9' },
  optionCorrect: { backgroundColor: '#10B981', borderColor: '#34D399' },
  optionWrong: { backgroundColor: '#EF4444', borderColor: '#F87171' },
  optionKey: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  optionText: { flex: 1, color: '#CBD5E1', fontSize: 13, lineHeight: 18 },
  submitBtn: { backgroundColor: '#00B6A6', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  submittedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 12, marginTop: 8 },
  submittedText: { color: '#10B981', fontSize: 14, fontWeight: '700' },
});

const replayStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#131D2E', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  backBtn: { padding: 8, borderRadius: 8, backgroundColor: '#1E293B' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  headerSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  playerBox: { backgroundColor: '#131D2E', margin: 16, borderRadius: 16, overflow: 'hidden', padding: 16 },
  videoMock: { height: 160, backgroundColor: '#0B1120', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 10 },
  videoMockText: { color: '#475569', fontSize: 12 },
  playerControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeLabel: { color: '#64748B', fontSize: 11, minWidth: 36 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00B6A6', borderRadius: 2 },
  playerBtns: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  playerBtn: { padding: 8 },
  playPauseBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#00B6A6', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#131D2E', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { color: 'white', fontSize: 16, fontWeight: '800' },
  statLabel: { color: '#64748B', fontSize: 11 },
  relatedSection: { paddingHorizontal: 16 },
  relatedTitle: { color: 'white', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  relatedEmpty: { color: '#475569', fontSize: 13 },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  materialName: { flex: 1, color: '#CBD5E1', fontSize: 13 },
  materialSize: { color: '#64748B', fontSize: 11 },
});
