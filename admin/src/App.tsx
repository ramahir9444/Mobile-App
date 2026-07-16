import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { 
  fetchHomepageConfig, 
  saveHomepageConfig, 
  uploadImage, 
  uploadFile,
  fetchOrders, 
  fetchStudents,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  fetchMaterials,
  createMaterial,
  deleteMaterial,
  fetchWelcomeTest,
  saveWelcomeTest,
  deleteWelcomeTest,
  API_BASE
} from './api/configApi';

// PDF.js Dynamic Loader
const loadPdfJS = () => {
  return new Promise<any>((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const StudentVideoView: React.FC<{ track: any }> = ({ track }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!track || !ref.current) return;
    track.attach(ref.current);
    return () => {
      track.detach(ref.current);
    };
  }, [track]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};

// Reusable Section Component
const FormSection: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  isOpenDefault?: boolean;
}> = ({ title, icon, children, isOpenDefault = true }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  return (
    <div className="card">
      <div className="card-header" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setIsOpen(!isOpen)}>
        <span className="card-icon">{icon}</span>
        <h2 style={{ flex: 1 }}>{title}</h2>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
      </div>
      {isOpen && <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>{children}</div>}
    </div>
  );
};

// Reusable Image Field Component
const ImageField: React.FC<{
  label: string;
  value: string;
  onChange: (url: string) => void;
}> = ({ label, value, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const url = await uploadImage(base64);
        onChange(url);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Convert relative url from backend, e.g. '/uploads/image.png', to a preview-friendly URL
  const getPreviewUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const API_BASE = window.location.port === '5173' || window.location.port === '5174' ? 'http://localhost:3001' : '';
    return `${API_BASE}${url}`;
  };

  const previewSrc = getPreviewUrl(value);

  return (
    <div className="image-field-container">
      <label>{label}</label>
      <div className="image-field-row">
        {previewSrc ? (
          <img src={previewSrc} alt="Preview" className="image-preview" onError={(e) => {
            (e.target as HTMLImageElement).src = ''; // Clear if invalid URL
          }} />
        ) : (
          <div className="image-preview">🖼️</div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Image URL (or upload file below)" 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="image-upload-btn-label">
              {isUploading ? 'Uploading...' : 'Upload File'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                disabled={isUploading}
              />
            </label>
            {value && (
              <button 
                type="button" 
                onClick={() => onChange('')} 
                style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer', fontWeight: 650 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getTodayDateText = () => {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`;
};

const getDefaultTimeText = () => {
  const d = new Date();
  const h = d.getHours();
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayH = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayH}:00 ${ampm}`;
  };
  return `${formatHour(h)} - ${formatHour(h + 1)}`;
};

export default function App() {
  const [selectedClass, setSelectedClass] = useState('Class 6');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'config' | 'orders' | 'students' | 'schedules' | 'materials' | 'hw_reports' | 'welcome_test' | 'test_reports' | 'teacher_desk'>('config');
  const [testSubmissions, setTestSubmissions] = useState<any[]>([]);
  const [testSubmissionsLoading, setTestSubmissionsLoading] = useState(false);
  const [testFilterClass, setTestFilterClass] = useState('all');
  const [testReportsSubTab, setTestReportsSubTab] = useState<'welcome' | 'scheduled' | 'performance'>('welcome');
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'booster' | 'master' | 'scheduled' | 'finished'>('all');
  const [ordersClassFilter, setOrdersClassFilter] = useState('all');

  // Students list states
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsSearchQuery, setStudentsSearchQuery] = useState('');
  const [studentsClassFilter, setStudentsClassFilter] = useState('all');
  const [studentsEnrollFilter, setStudentsEnrollFilter] = useState('all');

  // Schedules states
  const [schedules, setSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [newSchedule, setNewSchedule] = useState<any>({
    title: '',
    subject: 'Maths',
    time: getDefaultTimeText(),
    dateText: getTodayDateText(),
    gradeClass: 'Class 6',
    courseType: 'booster',
    teacherName: 'Ninja Mam (Priyanka)',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    status: 'Scheduled',
    isLiveClass: true,
    enableRecording: true,
    enableQuiz: true,
    allowStage: true,
    allowChat: true,
    maxStageStudents: 4,
    materials: [],
    homework: [],
    quizzes: [],
    questions: [],
    slides: [],
    durationMinutes: 30
  });
  const [tempMaterial, setTempMaterial] = useState({ title: '', size: '0.0 MB', url: '' });
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [tempHomework, setTempHomework] = useState({ text: '', optA: '', optB: '', optC: '', optD: '', correct: 'A', chapter: '', topic: '' });
  const [tempQuiz, setTempQuiz] = useState({ text: '', optA: '', optB: '', optC: '', optD: '', correct: 'A', chapter: '', topic: '' });
  const [tempSlideUrl, setTempSlideUrl] = useState('');
  const [isUploadingSlide, setIsUploadingSlide] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [studentVideoTracks, setStudentVideoTracks] = useState<{ [identity: string]: any }>({});
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Live Classroom Control states
  const [activeControlSchedule, setActiveControlSchedule] = useState<any>(null);
  const [liveRoomState, setLiveRoomState] = useState<any>(null);
  const [selectedControlQuizIdx, setSelectedControlQuizIdx] = useState<number>(0);
  const [livekitRoom, setLivekitRoom] = useState<any>(null);
  const [lkCameraEnabled, setLkCameraEnabled] = useState<boolean>(true);
  const [lkMicEnabled, setLkMicEnabled] = useState<boolean>(true);
  const [drawColor, setDrawColor] = useState<string>('#EF4444');
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');
  const [drawSize] = useState<number>(3);
  const [localDrawings, setLocalDrawings] = useState<any[]>([]); // instant local drawings (no flicker)
  const [controlTab, setControlTab] = useState<'chat' | 'quiz' | 'roster'>('chat');
  const [teacherChatInput, setTeacherChatInput] = useState<string>('');
  const [teacherChatMessages, setTeacherChatMessages] = useState<any[]>([]);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<string>('');
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Materials states
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  // HW Reports state
  const [hwReports, setHwReports] = useState<any[]>([]);
  const [hwReportsLoading, setHwReportsLoading] = useState(false);
  const [hwFilterClass, setHwFilterClass] = useState('');
  const [hwFilterSubject, setHwFilterSubject] = useState('');
  const [hwFilterMonth, setHwFilterMonth] = useState('');
  const [hwFilterYear, setHwFilterYear] = useState(new Date().getFullYear().toString());
  
  // Welcome Test panel state
  const [wtSearch, setWtSearch] = useState('');
  const [wtQuestions, setWtQuestions] = useState<any[]>([]);
  const [wtDuration, setWtDuration] = useState<number>(30);
  const [wtLoading, setWtLoading] = useState(false);
  const [wtSaving, setWtSaving] = useState(false);

  const [newMaterial, setNewMaterial] = useState({
    fileName: '',
    fileSize: '1.0M',
    gradeClass: 'Class 6',
    courseType: 'booster',
    fileUrl: '',
    chapter: '',
    topic: ''
  });

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await fetchStudents();
      setStudents(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load students list.');
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadSchedules = async () => {
    setSchedulesLoading(true);
    try {
      const data = await fetchSchedules();
      setSchedules(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load schedules.');
    } finally {
      setSchedulesLoading(false);
    }
  };

  const loadMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const data = await fetchMaterials();
      setMaterials(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load materials.');
    } finally {
      setMaterialsLoading(false);
    }
  };

  const loadWelcomeTestConfig = async (gradeClass: string) => {
    setWtLoading(true);
    try {
      const data = await fetchWelcomeTest(gradeClass);
      if (data && data.questions) {
        setWtQuestions(data.questions);
        setWtDuration(data.durationMinutes || 30);
      } else {
        // Default seed fallback
        const defaultQuestions = [
          { text: 'Solve for x: 3x + 5 = 20.', options: { A: '5', B: '4', C: '6', D: '3' }, correct: 'B' },
          { text: 'Which is a prime number?', options: { A: '4', B: '9', C: '15', D: '17' }, correct: 'D' },
          { text: 'Find the area of a rectangle with length 10 and width 5.', options: { A: '50', B: '15', C: '30', D: '25' }, correct: 'A' },
          { text: 'What is 15% of 200?', options: { A: '35', B: '30', C: '25', D: '40' }, correct: 'B' },
          { text: 'Two numbers are in the ratio 2 : 7. If the second number is 378, find the first.', options: { A: '105', B: '180', C: '108', D: '165' }, correct: 'C' },
          { text: 'Calculate the average of 10, 20, and 30.', options: { A: '15', B: '20', C: '25', D: '30' }, correct: 'B' },
          { text: 'If a triangle has angles 50° and 60°, what is the third angle?', options: { A: '70°', B: '80°', C: '90°', D: '60°' }, correct: 'A' },
          { text: 'Solve: 12 x 11 - 10.', options: { A: '122', B: '132', C: '120', D: '112' }, correct: 'A' },
          { text: 'Convert 4/5 into a percentage.', options: { A: '85%', B: '75%', C: '80%', D: '90%' }, correct: 'C' },
          { text: 'What is the square root of 225?', options: { A: '15', B: '25', C: '12', D: '20' }, correct: 'A' }
        ];
        setWtQuestions(defaultQuestions);
        setWtDuration(30);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load welcome test config.');
    } finally {
      setWtLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'students') {
      loadStudents();
    } else if (activeTab === 'schedules') {
      loadSchedules();
    } else if (activeTab === 'materials') {
      loadMaterials();
    } else if (activeTab === 'welcome_test') {
      loadStudents();
    } else if (activeTab === 'test_reports') {
      loadTestReports();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!activeControlSchedule) return;
    
    const fetchChatEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/schedules/${activeControlSchedule._id}/live-events`);
        const json = await res.json();
        if (json.success && json.data) {
          const chatEvts = json.data.filter((evt: any) => evt.eventType === 'ChatMessage');
          setTeacherChatMessages(chatEvts);
        }
      } catch (err) {
        console.error('Error fetching teacher chat events:', err);
      }
    };

    syncLiveRoomState(activeControlSchedule._id);
    fetchChatEvents();

    const interval = setInterval(() => {
      syncLiveRoomState(activeControlSchedule._id);
      fetchChatEvents();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeControlSchedule]);

  // ─── Teacher LiveKit Integration ─────────────────────────────
  useEffect(() => {
    if (!activeControlSchedule || !activeControlSchedule.roomName) {
      if (livekitRoom) {
        livekitRoom.disconnect();
        setLivekitRoom(null);
      }
      return;
    }

    let active = true;
    let roomInstance: any = null;

    async function connectToLiveKit() {
      try {
        const scheduleId = activeControlSchedule._id;
        const tokenRes = await fetch(`${API_BASE}/api/live-classroom/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId,
            participantName: activeControlSchedule.teacherName || 'Teacher',
            participantIdentity: `teacher-${scheduleId}`,
            isTeacher: true
          })
        });
        const tokenJson = await tokenRes.json();
        if (!tokenJson.success) throw new Error(tokenJson.error || 'Failed to get teacher token');

        const { token, wsUrl } = tokenJson.data;
        if (!active) return;

        showToast('🎥 Connecting to LiveKit Media server...');

        roomInstance = new Room();
        setLivekitRoom(roomInstance);

        await roomInstance.connect(wsUrl, token);
        await roomInstance.localParticipant.setCameraEnabled(lkCameraEnabled);
        await roomInstance.localParticipant.setMicrophoneEnabled(lkMicEnabled);

        showToast('✅ Video broadcasting started!');

        const attachLocalTrack = () => {
          const videoElement = document.getElementById('teacher-local-video') as HTMLVideoElement;
          if (!videoElement) return;
          for (const pub of roomInstance.localParticipant.videoTrackPublications.values()) {
            if (pub.kind === 'video' && pub.track) {
              pub.track.attach(videoElement);
              break;
            }
          }
        };

        setTimeout(attachLocalTrack, 500);
        roomInstance.on(RoomEvent.LocalTrackPublished, (pub: any) => {
          const videoElement = document.getElementById('teacher-local-video') as HTMLVideoElement;
          if (videoElement && pub.kind === 'video' && pub.track) {
            pub.track.attach(videoElement);
          }
        });

        // Listen for remote student video tracks (stage participants)
        roomInstance.on(RoomEvent.TrackSubscribed, (track: any, _publication: any, participant: any) => {
          if (!participant?.identity?.startsWith('teacher-') && track.kind === 'video') {
            setStudentVideoTracks((prev: any) => ({ ...prev, [participant.identity]: track }));
          }
        });

        roomInstance.on(RoomEvent.TrackUnsubscribed, (track: any, _publication: any, participant: any) => {
          if (!participant?.identity?.startsWith('teacher-') && track.kind === 'video') {
            setStudentVideoTracks((prev: any) => {
              const copy = { ...prev };
              delete copy[participant.identity];
              return copy;
            });
          }
        });

        // Collect existing remote tracks
        for (const p of roomInstance.remoteParticipants.values()) {
          if (!p.identity.startsWith('teacher-')) {
            const videoPub = Array.from(p.videoTrackPublications.values())[0] as any;
            if (videoPub && videoPub.track) {
              setStudentVideoTracks((prev: any) => ({ ...prev, [p.identity]: videoPub.track }));
            }
          }
        }

      } catch (err: any) {
        console.error('LiveKit connection error:', err);
        showToast('Failed to connect video: ' + err.message, 'error');
      }
    }

    connectToLiveKit();

    return () => {
      active = false;
      if (roomInstance) {
        roomInstance.disconnect();
      }
      setLivekitRoom(null);
      setStudentVideoTracks({});
    };
  }, [activeControlSchedule?.roomName, activeControlSchedule?._id]);

  const handleToggleCamera = async () => {
    const nextState = !lkCameraEnabled;
    setLkCameraEnabled(nextState);
    if (livekitRoom) {
      await livekitRoom.localParticipant.setCameraEnabled(nextState);
      showToast(nextState ? '📷 Camera Enabled' : '📷 Camera Disabled');
      if (nextState) {
        setTimeout(() => {
          const videoElement = document.getElementById('teacher-local-video') as HTMLVideoElement;
          if (videoElement) {
            for (const pub of livekitRoom.localParticipant.videoTrackPublications.values()) {
              if (pub.kind === 'video' && pub.track) {
                pub.track.attach(videoElement);
                break;
              }
            }
          }
        }, 800);
      }
    }
  };

  const handleToggleMic = async () => {
    const nextState = !lkMicEnabled;
    setLkMicEnabled(nextState);
    if (livekitRoom) {
      await livekitRoom.localParticipant.setMicrophoneEnabled(nextState);
      showToast(nextState ? '🎙️ Mic Active' : '🎙️ Mic Muted');
    }
  };

  // Fetch configs upon selection
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchHomepageConfig(selectedClass);
        setConfig(data);
      } catch (err: any) {
        console.error(err);
        showToast('Error loading configuration.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
    loadWelcomeTestConfig(selectedClass);
  }, [selectedClass]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      await saveHomepageConfig(selectedClass, config);
      showToast('Configuration saved successfully! ✨', 'success');
    } catch (err: any) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper getters/setters to keep nesting updates simple
  const setRootField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const setNestedField = (parent: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const setBulletField = (parent: string, index: number, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev[parent]?.bullets || [])];
      arr[index] = value;
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          bullets: arr
        }
      };
    });
  };

  const setOutlineField = (index: number, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev.masterProgram?.outline || [])];
      arr[index] = value;
      return {
        ...prev,
        masterProgram: {
          ...prev.masterProgram,
          outline: arr
        }
      };
    });
  };

  const setTestimonialTagField = (index: number, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev.masterProgram?.testimonialTags || [])];
      arr[index] = value;
      return {
        ...prev,
        masterProgram: {
          ...prev.masterProgram,
          testimonialTags: arr
        }
      };
    });
  };

  const setTeacherField = (index: number, key: string, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev.teachers || [])];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, teachers: arr };
    });
  };

  const renderOrdersTracker = () => {
    const filteredOrders = orders.filter((o: any) => {
      const matchesSearch = 
        (o.studentPhone && o.studentPhone.includes(searchQuery)) ||
        (o.courseTitle && o.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.classInfo && o.classInfo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesClass = ordersClassFilter === 'all' || (o.classInfo && o.classInfo.toLowerCase().includes(ordersClassFilter.toLowerCase()));
      return matchesSearch && matchesStatus && matchesClass;
    });

    const totalPaid = orders.filter((o: any) => o.status === 'paid').length;
    const totalPending = orders.filter((o: any) => o.status === 'pending').length;
    const totalAmountPaid = orders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>Live Orders &amp; Enrollments Tracker</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Track real-time student registrations, demo classes, and master program payments.
            </p>
          </div>
          <button 
            type="button" 
            onClick={loadOrders} 
            className="save-btn" 
            style={{ padding: '8px 16px', fontSize: '12px' }}
            disabled={ordersLoading}
          >
            {ordersLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </header>

        {/* Stats Metrics Dashboard Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Total Registered</div>
            <div className="stat-value">{orders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Paid Enrollments</div>
            <div className="stat-value success">{totalPaid}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Pending Payments</div>
            <div className="stat-value pending">{totalPending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value" style={{ color: '#00B6A6' }}>
              ₹ {totalAmountPaid.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="search-container">
          <div className="search-input-wrap">
            <span className="search-icon-placeholder">🔍</span>
            <input 
              type="text" 
              placeholder="Search by phone, course, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <select 
            value={ordersClassFilter} 
            onChange={(e) => setOrdersClassFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
            ))}
          </select>
          <select 
            value={statusFilter} 
            onChange={(e: any) => setStatusFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Orders Table */}
        {ordersLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#94A3B8' }}>Loading student registrations...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: '#94A3B8' }}>
            📭 No orders found matching the filter criteria.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Student Phone</th>
                  <th>Course Title</th>
                  <th>Class Info</th>
                  <th>Amount</th>
                  <th>Created At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o: any) => (
                  <tr key={o._id}>
                    <td style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '12px' }}>
                      {String(o._id).substring(Math.max(0, String(o._id).length - 6))}
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.studentPhone}</td>
                    <td>{o.courseTitle}</td>
                    <td>{o.classInfo}</td>
                    <td style={{ fontWeight: 700 }}>₹ {o.amount}</td>
                    <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${o.status === 'paid' ? 'paid' : 'pending'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderStudentsTracker = () => {
    const filteredStudents = students.filter((s: any) => {
      const matchesSearch = 
        (s.name && s.name.toLowerCase().includes(studentsSearchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(studentsSearchQuery));
      const matchesClass = studentsClassFilter === 'all' || s.selectedClass === studentsClassFilter;
      
      const enrollType = s.enrollmentType || 'none';
      const matchesEnroll = studentsEnrollFilter === 'all' || enrollType === studentsEnrollFilter;
      
      return matchesSearch && matchesClass && matchesEnroll;
    });

    const totalStudents = students.length;
    const totalMaster = students.filter((s: any) => s.enrollmentType === 'master').length;
    const totalDemo = students.filter((s: any) => s.enrollmentType === 'demo').length;
    const totalGuest = students.filter((s: any) => !s.enrollmentType || s.enrollmentType === 'none').length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>Enrolled Students &amp; Registrations</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Manage registered student profiles, view demographics, and track dynamic course enrollment states.
            </p>
          </div>
          <button 
            type="button" 
            onClick={loadStudents} 
            className="save-btn" 
            style={{ padding: '8px 16px', fontSize: '12px' }}
            disabled={studentsLoading}
          >
            {studentsLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </header>

        {/* Stats Metrics Dashboard Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Total Registered</div>
            <div className="stat-value">{totalStudents}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Master Program</div>
            <div className="stat-value success">{totalMaster}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">6-Day Demo</div>
            <div className="stat-value" style={{ color: '#38BDF8' }}>{totalDemo}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Not Enrolled / Guest</div>
            <div className="stat-value pending">{totalGuest}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="search-container">
          <div className="search-input-wrap">
            <span className="search-icon-placeholder">🔍</span>
            <input 
              type="text" 
              placeholder="Search by name or phone..."
              value={studentsSearchQuery}
              onChange={(e) => setStudentsSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <select 
            value={studentsClassFilter} 
            onChange={(e) => setStudentsClassFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
            ))}
          </select>
          <select 
            value={studentsEnrollFilter} 
            onChange={(e: any) => setStudentsEnrollFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Enrollment Types</option>
            <option value="master">Master Program</option>
            <option value="demo">6-Day Demo</option>
            <option value="none">Not Enrolled</option>
          </select>
        </div>

        {/* Students Table */}
        {studentsLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#94A3B8' }}>Loading registered student list...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: '#94A3B8' }}>
            📭 No students found matching the filter criteria.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Student Name</th>
                  <th>Phone Number</th>
                  <th>Selected Grade</th>
                  <th>Alt Phone</th>
                  <th>State &amp; Address</th>
                  <th>Last Updated</th>
                  <th>Enrollment Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s: any) => {
                  const enroll = s.enrollmentType || 'none';
                  return (
                    <tr key={s._id}>
                      <td>
                        <img 
                          src={s.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'} 
                          alt="avatar"
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name || 'Anonymous Student'}</td>
                      <td>{s.phone}</td>
                      <td>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {s.selectedClass || 'N/A'}
                        </span>
                      </td>
                      <td>{s.altPhone || '—'}</td>
                      <td style={{ fontSize: '12.5px', color: '#94A3B8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.address}>
                        {s.state ? `${s.state}${s.address ? `, ${s.address}` : ''}` : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td>
                        {enroll === 'master' ? (
                          <span className="badge paid" style={{ color: '#00B6A6', borderColor: 'rgba(0,182,166,0.3)', background: 'rgba(0,182,166,0.15)' }}>
                            Master Program
                          </span>
                        ) : enroll === 'demo' ? (
                          <span className="badge pending" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.15)' }}>
                            6-Day Demo
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
                            Not Enrolled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const syncLiveRoomState = async (scheduleId: string) => {
    try {
      const [liveStateRes, roomInfoRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/schedules/${scheduleId}/live-state`).then(r => r.json()),
        fetch(`${API_BASE}/api/live-classroom/room-info?scheduleId=${scheduleId}`).then(r => r.json()),
      ]);

      if (liveStateRes.status === 'fulfilled' && liveStateRes.value.success) {
        const serverLiveState = liveStateRes.value.data?.liveState;
        setLiveRoomState((prev: any) => ({
          ...(prev || {}),
          ...serverLiveState,
          isLive: liveStateRes.value.data?.isLive,
          liveStatus: liveStateRes.value.data?.liveStatus,
        }));
        
        // Auto select hand raised students if selectionMode is auto
        const isAutoMode = serverLiveState?.selectionMode === 'auto';
        const maxStageCount = (serverLiveState?.micMode === 'group') ? 6 : 1;
        const currentStage = serverLiveState?.stageStudents || [];
        const currentRaise = serverLiveState?.raiseHands || [];

        if (isAutoMode && currentStage.length < maxStageCount && currentRaise.length > 0) {
          const needed = maxStageCount - currentStage.length;
          const toInvite = currentRaise.slice(0, needed);
          const updatedStage = [...currentStage, ...toInvite];
          const updatedRaise = currentRaise.slice(needed);
          
          fetch(`${API_BASE}/api/schedules/${scheduleId}/live-state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stageStudents: updatedStage,
              raiseHands: updatedRaise
            }),
          }).then(() => {
            fetch(`${API_BASE}/api/schedules/${scheduleId}/live-state`)
              .then(r => r.json())
              .then(json => {
                if (json.success && json.data) {
                  setLiveRoomState((prev: any) => ({
                    ...(prev || {}),
                    ...json.data.liveState
                  }));
                }
              });
          });
        }

        // Once server has confirmed drawings, clear localDrawings to avoid duplication
        if (serverLiveState?.drawings?.length !== undefined) {
          setLocalDrawings([]);
        }
      }

      if (roomInfoRes.status === 'fulfilled' && roomInfoRes.value.success) {
        const rawParticipants = roomInfoRes.value.data?.participants || [];
        // Filter out teacher identity from student count display (teacher starts with 'teacher-')
        const studentParticipants = rawParticipants.filter(
          (p: any) => !p.identity?.startsWith('teacher-')
        );
        setLiveRoomState((prev: any) => ({
          ...(prev || {}),
          participants: rawParticipants, // keep all for internal use
          studentParticipants, // students only for count display
          participantCount: studentParticipants.length,
        }));
      }
    } catch {}
  };

  const renderLiveControlCenter = () => {
    const schedule = activeControlSchedule;
    const state = liveRoomState || {};
    const isLive = state.isLive || false;
    const participants = state.participants || [];
    const studentParticipants = state.studentParticipants || participants.filter((p: any) => !p.identity?.startsWith('teacher-'));
    const raiseHands = state.raiseHands || [];
    const stageStudents = state.stageStudents || [];
    const quizActive = state.quizActive || false;
    const chatMuted = state.chatMuted || false;

    const updateState = async (updates: any) => {
      try {
        await fetch(`${API_BASE}/api/schedules/${schedule._id}/live-state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        await syncLiveRoomState(schedule._id);
      } catch (e: any) {
        showToast('Failed to update state: ' + e.message, 'error');
      }
    };

    const handleStartClass = async () => {
      try {
        showToast('🔴 Starting class and creating LiveKit room...');
        const res = await fetch(`${API_BASE}/api/live-classroom/create-room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId: schedule._id }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to start room');
        showToast(`✅ Class started! Room: ${json.data.roomName}`);
        setActiveControlSchedule({ ...schedule, isLive: true, liveStatus: 'live', roomName: json.data.roomName });
        await syncLiveRoomState(schedule._id);
        loadSchedules();
      } catch (e: any) {
        showToast('Error starting class: ' + e.message, 'error');
      }
    };

    const handleEndClass = async () => {
      if (!confirm('Are you sure you want to end this live class? All students will be disconnected.')) return;
      try {
        showToast('Ending live class...');
        const res = await fetch(`${API_BASE}/api/live-classroom/end-room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId: schedule._id }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to end room');
        showToast('✅ Class ended successfully');
        setActiveControlSchedule(null);
        loadSchedules();
      } catch (e: any) {
        showToast('Error ending class: ' + e.message, 'error');
      }
    };

    const handleInviteToStage = async (identity: string) => {
      let updated = [];
      if (stageStudents.includes(identity)) {
        updated = stageStudents.filter((s: string) => s !== identity);
      } else {
        if (stageStudents.length >= 5) {
          showToast('Stage is full! (Max 5 students). Use Rotate Stage to cycle.', 'error');
          return;
        }
        updated = [...stageStudents, identity];
      }
      await updateState({ stageStudents: updated });
    };

    const handleLaunchQuiz = async () => {
      const questions = schedule.quizzes || [];
      if (questions.length === 0) { showToast('No live quiz questions in this schedule!', 'error'); return; }
      const q = questions[selectedControlQuizIdx];
      await updateState({ quizActive: true, activeQuizId: q._id || q.text });
    };

    const handleEndQuiz = async () => {
      await updateState({ quizActive: false, activeQuizId: null });
    };

    const handleMuteParticipant = async (identity: string) => {
      try {
        await fetch(`${API_BASE}/api/live-classroom/mute-participant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId: schedule._id, participantIdentity: identity, mute: true }),
        });
        showToast('Participant muted');
      } catch {}
    };

    const handleKickParticipant = async (identity: string) => {
      if (!confirm(`Remove participant ${identity} from the room?`)) return;
      try {
        await fetch(`${API_BASE}/api/live-classroom/remove-participant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId: schedule._id, participantIdentity: identity }),
        });
        showToast('Participant removed');
      } catch {}
    };

    const isPointNearPath = (px: number, py: number, pathStr: string, threshold = 18) => {
      const matches = pathStr.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (!matches) return false;
      for (let i = 0; i < matches.length; i += 2) {
        const x = parseFloat(matches[i]);
        const y = parseFloat(matches[i+1]);
        if (!isNaN(x) && !isNaN(y)) {
          const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
          if (dist <= threshold) return true;
        }
      }
      return false;
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isLive) return;
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 800;
      const y = ((e.clientY - rect.top) / rect.height) * 450;

      isDrawingRef.current = true;

      if (drawTool === 'eraser') {
        const currentDrawings = state.drawings || [];
        const nextDrawings = currentDrawings.filter((d: any) => !isPointNearPath(x, y, d.path));
        if (nextDrawings.length !== currentDrawings.length) {
          updateState({ drawings: nextDrawings });
        }
      } else {
        lastPosRef.current = { x, y };
        currentPathRef.current = `M ${x.toFixed(1)} ${y.toFixed(1)}`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !isLive) return;
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 800;
      const y = ((e.clientY - rect.top) / rect.height) * 450;

      if (drawTool === 'eraser') {
        const currentDrawings = state.drawings || [];
        const nextDrawings = currentDrawings.filter((d: any) => !isPointNearPath(x, y, d.path));
        if (nextDrawings.length !== currentDrawings.length) {
          updateState({ drawings: nextDrawings });
        }
      } else {
        currentPathRef.current += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        lastPosRef.current = { x, y };

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
          ctx.stroke();
        }
      }
    };

    const handleCanvasMouseUpOrLeave = async (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !isLive) return;
      isDrawingRef.current = false;

      if (drawTool === 'eraser') {
        return;
      }

      const canvas = e.currentTarget;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const newPath = currentPathRef.current;
      currentPathRef.current = '';

      if (newPath) {
        const newStroke = { color: drawColor, width: drawSize, path: newPath };
        // INSTANT local update — no flicker waiting for server round-trip
        setLocalDrawings(prev => [...prev, newStroke]);
        // Async background save to DB (don't await — fire and forget)
        const nextDrawings = [...(state.drawings || []), newStroke];
        updateState({ drawings: nextDrawings });
      }
    };

    const handleClearDrawings = async () => {
      setLocalDrawings([]);
      await updateState({ drawings: [] });
    };

    const sendTeacherChatMessage = async () => {
      if (!teacherChatInput.trim()) return;
      try {
        await fetch(`${API_BASE}/api/schedules/${schedule._id}/live-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentPhone: 'teacher',
            studentName: 'Teacher (' + (schedule.teacherName || 'Mam') + ')',
            eventType: 'ChatMessage',
            detail: teacherChatInput.trim(),
          }),
        });
        setTeacherChatInput('');
        const res = await fetch(`${API_BASE}/api/schedules/${schedule._id}/live-events`);
        const json = await res.json();
        if (json.success && json.data) {
          const chatEvts = json.data.filter((evt: any) => evt.eventType === 'ChatMessage');
          setTeacherChatMessages(chatEvts);
        }
      } catch (err) {
        console.error('Error sending teacher message:', err);
      }
    };

    const handleNextSlide = async () => {
      const current = Number(state.activePage || 0);
      const maxPages = schedule.slides?.length ? schedule.slides.length - 1 : 9;
      if (current < maxPages) {
        await updateState({ activePage: current + 1, drawings: [] });
      }
    };

    const handlePrevSlide = async () => {
      const current = Number(state.activePage || 0);
      if (current > 0) {
        await updateState({ activePage: current - 1, drawings: [] });
      }
    };

    const handleRotateStage = async () => {
      if (raiseHands.length === 0) {
        showToast('No raised hands queue to rotate stage with!', 'error');
        return;
      }
      const maxStageCount = (state.micMode === 'group') ? 6 : 1;
      const nextStage = raiseHands.slice(0, maxStageCount);
      const nextRaiseHands = raiseHands.slice(maxStageCount);

      await updateState({
        stageStudents: nextStage,
        raiseHands: nextRaiseHands
      });
      showToast(`Rotated stage with ${nextStage.length} students.`);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#0B132B', padding: '16px', borderRadius: '16px', color: 'white', minHeight: '80vh' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveControlSchedule(null);
                setIsSidebarCollapsed(false);
              }}
              className="save-btn"
              style={{ background: '#1E293B', padding: '8px 14px' }}
            >
              ← Back to Desk
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="save-btn"
              style={{ background: '#334155', padding: '8px 14px', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              {isSidebarCollapsed ? '🖥️ Show Sidebar' : '🖥️ Collapse Sidebar'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800 }}>{schedule.title}</span>
                {isLive ? (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#EF4444', borderRadius: '4px', padding: '2px 6px', fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'white', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                      LIVE
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#10B981', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '750' }}>
                      🟢 {studentParticipants.length} attending
                    </span>
                  </>
                ) : (
                  <span style={{ backgroundColor: '#475569', borderRadius: '4px', padding: '2px 6px', fontSize: '9px', fontWeight: '800' }}>STANDBY</span>
                )}
                <span style={{ fontSize: '11px', color: '#00B6A6', fontWeight: '700', textTransform: 'uppercase' }}>{schedule.subject}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Class Live Stream Dashboard (Teacher Desk)</span>
            </div>
          </div>

          <div>
            {!isLive ? (
              <button
                type="button"
                onClick={handleStartClass}
                className="save-btn"
                style={{ background: '#10B981', padding: '10px 20px', fontWeight: 700, fontSize: '13px' }}
              >
                ▶ Start Class & Go Live
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEndClass}
                className="save-btn"
                style={{ background: '#EF4444', padding: '10px 20px', fontWeight: 700, fontSize: '13px' }}
              >
                ⏹️ End Class
              </button>
            )}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1C2541', borderRadius: '12px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDrawTool('pen')}
                  style={{ background: drawTool === 'pen' ? '#0EA5E9' : '#1E293B', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✏️ Pen
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool('eraser')}
                  style={{ background: drawTool === 'eraser' ? '#0EA5E9' : '#1E293B', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                >
                  🧹 Eraser
                </button>
                <button
                  type="button"
                  onClick={handleClearDrawings}
                  style={{ background: '#3A506B', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  🗑️ Clear Board
                </button>

                {/* Stage Rotation and Mic Controls */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px', marginLeft: '4px' }}>
                  
                  {/* Mic Mode Selector */}
                  <select
                    value={state.micMode || 'individual'}
                    onChange={async (e) => {
                      const newMode = e.target.value;
                      await updateState({ micMode: newMode });
                      showToast(`Mic Mode set to ${newMode === 'group' ? 'Group (6 students)' : 'Individual (1 student)'}`);
                    }}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#8B5CF6', color: 'white', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="individual">🎙️ Indiv Mic</option>
                    <option value="group">👥 Group Mic</option>
                  </select>

                  {/* Auto/Manual Mode Selector */}
                  <select
                    value={state.selectionMode || 'manual'}
                    onChange={async (e) => {
                      const newSelMode = e.target.value;
                      await updateState({ selectionMode: newSelMode, stageStudents: [] }); // reset stage on selection mode toggle for clean transition
                      showToast(`Student selection set to ${newSelMode === 'auto' ? 'Auto (Raised hands queue)' : 'Manual'}`);
                    }}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#0D9488', color: 'white', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="manual">🖐️ Manual Mode</option>
                    <option value="auto">🤖 Auto Select</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleRotateStage}
                    disabled={!isLive || raiseHands.length === 0}
                    style={{ background: '#4F46E5', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, opacity: (isLive && raiseHands.length > 0) ? 1 : 0.4 }}
                    title="Rotate stage students using raised hands queue"
                  >
                    🔄 Rotate Stage ({raiseHands.length})
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const anyUnmuted = stageStudents.some((phone: string) => !state.mutedStageStudents?.includes(phone));
                      const updatedMuted = anyUnmuted ? [...stageStudents] : [];
                      await updateState({ mutedStageStudents: updatedMuted });
                      showToast(anyUnmuted ? '🔇 Muted all stage students' : '🔊 Unmuted all stage students');
                    }}
                    disabled={!isLive || stageStudents.length === 0}
                    style={{ background: '#F59E0B', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, opacity: (isLive && stageStudents.length > 0) ? 1 : 0.4 }}
                  >
                    🎙️ {stageStudents.some((phone: string) => !state.mutedStageStudents?.includes(phone)) ? 'Mute Stage' : 'Unmute Stage'}
                  </button>

                  {/* Manual Individual Mute selector */}
                  {state.selectionMode !== 'auto' && stageStudents.length > 0 && (
                    <select
                      onChange={async (e) => {
                        const selectedPhone = e.target.value;
                        if (!selectedPhone) return;
                        const isCurrentlyMuted = state.mutedStageStudents?.includes(selectedPhone);
                        const updatedMuted = isCurrentlyMuted
                          ? (state.mutedStageStudents || []).filter((p: string) => p !== selectedPhone)
                          : [...(state.mutedStageStudents || []), selectedPhone];
                        await updateState({ mutedStageStudents: updatedMuted });
                        showToast(`${isCurrentlyMuted ? '🔊 Unmuted' : '🔇 Muted'} ${selectedPhone}`);
                        e.target.value = ''; // Reset select
                      }}
                      style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#1E293B', color: 'white', fontSize: '11.5px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="">-- Mute/Unmute Student --</option>
                      {stageStudents.map((phone: string) => {
                        const isMuted = state.mutedStageStudents?.includes(phone);
                        const participant = participants.find((p: any) => p.identity === phone);
                        const label = participant ? participant.name : phone;
                        return (
                          <option key={phone} value={phone}>
                            {label} {isMuted ? '🔇' : '🔊'}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      await updateState({ hwReleased: true });
                      showToast('📝 Homework assigned successfully!');
                    }}
                    disabled={!isLive || state.hwReleased}
                    style={{ background: state.hwReleased ? '#10B981' : '#3B82F6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, opacity: isLive ? 1 : 0.4 }}
                    title="Assign Homework to all students now"
                  >
                    {state.hwReleased ? '✅ HW Assigned' : '📝 Assign HW'}
                  </button>
                </div>
              </div>

              {drawTool === 'pen' && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8', marginRight: '4px' }}>Color:</span>
                  {[
                    { hex: '#EF4444', label: 'Red' },
                    { hex: '#3B82F6', label: 'Blue' },
                    { hex: '#10B981', label: 'Green' },
                    { hex: '#F59E0B', label: 'Yellow' },
                    { hex: '#0F172A', label: 'Black' }
                  ].map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setDrawColor(color.hex)}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: color.hex,
                        border: drawColor === color.hex ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transform: drawColor === color.hex ? 'scale(1.15)' : 'none'
                      }}
                      title={color.label}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', color: '#0B1120', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
              
              {/* Custom Slide Background Render */}
              {schedule.slides && schedule.slides.length > 0 ? (
                <>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E293B' }}>
                    {(() => {
                      const slides = schedule.slides || [];
                      const url = slides[Number(state.activePage || 0)];
                      if (!url) return <div style={{ color: 'white' }}>No slide content</div>;
                      const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) || !url.includes('.');
                      const isVideo = url.match(/\.(mp4|webm|ogg)/i);
                      const isPdf = url.match(/\.pdf/i);
                      const resolvedUrl = url.startsWith('/') && !url.startsWith('http') ? `${API_BASE}${url}` : url;
                      
                      if (isImage) {
                        return <img src={resolvedUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="slide content" />;
                      }
                      if (isVideo) {
                        return <video src={resolvedUrl} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
                      }
                      if (isPdf) {
                        return <iframe src={`${resolvedUrl}#toolbar=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="slide pdf" />;
                      }
                      return <img src={resolvedUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="slide content" />;
                    })()}
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                    SLIDE {Number(state.activePage || 0) + 1} / {schedule.slides.length}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#0B1120' }}>📘 {schedule.subject}</h2>
                  <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#475569', margin: '0 0 16px 0' }}>{schedule.title}</h4>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px', fontWeight: 600 }}>SLIDE {Number(state.activePage || 0) + 1} / 10</div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{ width: '60px', height: '40px', background: '#E2E8F0', borderRadius: '6px' }} />
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>📺 Drag mouse below to write or edit on whiteboard. Drawing is synced live.</p>
                </div>
              )}

              {(() => {
                // Merge server drawings + local drawings (deduplicate by path)
                const serverDrawings = state.drawings || [];
                const allDrawings = [
                  ...serverDrawings,
                  ...localDrawings.filter(
                    (ld: any) => !serverDrawings.some((sd: any) => sd.path === ld.path)
                  )
                ];
                return allDrawings.length > 0 ? (
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
                    {allDrawings.map((line: any, idx: number) => (
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
                ) : null;
              })()}

              <canvas
                ref={(el) => {
                  if (el) {
                    el.width = el.offsetWidth;
                    el.height = el.offsetHeight;
                  }
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUpOrLeave}
                onMouseLeave={handleCanvasMouseUpOrLeave}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 6,
                  cursor: drawTool === 'eraser' 
                    ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><circle cx=\'12\' cy=\'12\' r=\'10\' fill=\'none\' stroke=\'%233B82F6\' stroke-width=\'2\'/><circle cx=\'12\' cy=\'12\' r=\'2\' fill=\'%233B82F6\'/></svg>\") 12 12, cell'
                    : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='6' fill='${encodeURIComponent(drawColor)}' stroke='white' stroke-width='2'/></svg>") 12 12, crosshair`,
                  touchAction: 'none'
                }}
              />

              {/* Stage Students overlay in bottom-left */}
              {stageStudents.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '12px', 
                  left: (schedule.slides && schedule.slides.length > 0) ? '110px' : '12px', 
                  zIndex: 10, 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center' 
                }}>
                  {(() => {
                    const displayList = state.micMode === 'group' 
                      ? stageStudents.slice(0, 6) 
                      : stageStudents.slice(0, 1);

                    return displayList.map((phone: string) => {
                      const hasVideo = !!studentVideoTracks[phone];
                      const isMuted = state.mutedStageStudents?.includes(phone);
                      const participant = participants.find((p: any) => p.identity === phone);
                      const label = participant ? participant.name : phone;

                      return (
                        <div key={phone} style={{ 
                          width: '90px', 
                          height: '60px', 
                          borderRadius: '8px', 
                          border: isMuted ? '2px solid #EF4444' : '2px solid #8B5CF6', 
                          background: '#0F172A', 
                          overflow: 'hidden', 
                          position: 'relative',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)'
                        }}>
                          {hasVideo ? (
                            <StudentVideoView track={studentVideoTracks[phone]} />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                              <span style={{ fontSize: '14px' }}>👤</span>
                              <span style={{ fontSize: '7px', fontWeight: 'bold' }}>NO VIDEO</span>
                            </div>
                          )}
                          
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '2px', 
                            left: '2px', 
                            right: '2px',
                            background: 'rgba(0,0,0,0.7)', 
                            padding: '1px 3px', 
                            borderRadius: '3px', 
                            color: 'white', 
                            fontSize: '7.5px', 
                            fontWeight: 'bold', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55px' }}>{label}</span>
                            <span>{isMuted ? '🔇' : '🔊'}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Removed absolute floating camera PiP */}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1C2541', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleToggleMic}
                  style={{ background: lkMicEnabled ? '#10B981' : '#EF4444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {lkMicEnabled ? '🎙️ Mic Active' : '🎙️ Mic Muted'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  style={{ background: lkCameraEnabled ? '#0EA5E9' : '#475569', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {lkCameraEnabled ? '📷 Video On' : '📷 Video Off'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', marginRight: '6px' }}>Whiteboard Navigation:</span>
                <button
                  type="button"
                  disabled={!isLive || Number(state.activePage || 0) <= 0}
                  onClick={handlePrevSlide}
                  style={{ background: '#1E293B', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, opacity: (!isLive || Number(state.activePage || 0) <= 0) ? 0.4 : 1 }}
                >
                  ◀ Prev
                </button>
                <button
                  type="button"
                  disabled={!isLive || Number(state.activePage || 0) >= 9}
                  onClick={handleNextSlide}
                  style={{ background: '#0EA5E9', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, opacity: (!isLive || Number(state.activePage || 0) >= 9) ? 0.4 : 1 }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top: Video panel (Teacher only) */}
            <div style={{ background: '#1C2541', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ margin: 0, fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📹 Live Feeds (Teacher)</h5>
              
              <div style={{ 
                height: '110px', 
                borderRadius: '10px', 
                border: '2px solid #00B6A6', 
                background: '#1E293B', 
                overflow: 'hidden', 
                position: 'relative' 
              }}>
                {lkCameraEnabled ? (
                  <video id="teacher-local-video" autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', gap: '4px' }}>
                    <span style={{ fontSize: '18px' }}>📷</span>
                    <span style={{ fontSize: '9px', fontWeight: 'bold' }}>CAMERA OFF</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', color: 'white', fontSize: '9px', fontWeight: 'bold' }}>
                  Teacher ({schedule.teacherName || 'Mam'})
                </div>
              </div>
            </div>

            {/* Bottom: Tabs panel */}
            <div style={{ background: '#1C2541', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '480px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#131D2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { key: 'chat', label: '💬 Chat' },
                { key: 'quiz', label: '🎯 Quiz' },
                { key: 'roster', label: '👥 Roster' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setControlTab(tab.key as any)}
                  style={{
                    padding: '12px 6px',
                    background: controlTab === tab.key ? '#1C2541' : 'transparent',
                    border: 'none',
                    color: controlTab === tab.key ? '#00B6A6' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    borderBottom: controlTab === tab.key ? '2px solid #00B6A6' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {controlTab === 'chat' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#131D2E', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Student Messaging:</span>
                    <button
                      type="button"
                      onClick={() => updateState({ chatMuted: !chatMuted })}
                      style={{ background: chatMuted ? '#EF4444' : '#10B981', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {chatMuted ? '🔇 Chat Muted' : '💬 Chat Open'}
                    </button>
                  </div>

                  <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {teacherChatMessages.length === 0 ? (
                      <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>No chat messages yet</div>
                    ) : (
                      teacherChatMessages.map((msg: any, idx: number) => {
                        const isMe = msg.studentPhone === 'teacher';
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: isMe ? '#00B6A6' : '#94A3B8' }}>{msg.studentName}</span>
                              <span style={{ fontSize: '9px', color: '#475569' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ background: isMe ? '#00B6A6' : '#2D3748', color: 'white', padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontSize: '12px', wordBreak: 'break-word' }}>
                              {msg.detail}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ padding: '8px 12px', background: '#131D2E', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Type a message to students..."
                      value={teacherChatInput}
                      onChange={(e) => setTeacherChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendTeacherChatMessage(); }}
                      style={{ flex: 1, background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={sendTeacherChatMessage}
                      style={{ background: '#00B6A6', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {controlTab === 'quiz' && (
                <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="card" style={{ background: '#131D2E', padding: '12px', borderRadius: '10px' }}>
                    <h4 style={{ color: '#8B5CF6', fontSize: '12px', fontWeight: 700, margin: '0 0 10px 0' }}>📝 Live Quiz Launcher</h4>
                    {(schedule.quizzes || []).length === 0 ? (
                      <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>No live quiz questions added to this schedule</p>
                    ) : (
                      <>
                        <label style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', display: 'block' }}>Select Question</label>
                        <select
                           value={selectedControlQuizIdx}
                           onChange={(e) => setSelectedControlQuizIdx(Number(e.target.value))}
                           style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1E293B', color: 'white', marginBottom: '12px', fontSize: '12px', outline: 'none' }}
                        >
                          {(schedule.quizzes || []).map((q: any, i: number) => (
                            <option key={i} value={i}>Q{i + 1}: {q.text?.slice(0, 50)}...</option>
                          ))}
                        </select>
 
                        {!quizActive ? (
                          <button
                            type="button"
                            onClick={handleLaunchQuiz}
                            disabled={!isLive}
                            style={{ width: '100%', padding: '10px', background: '#8B5CF6', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: isLive ? 1 : 0.4 }}
                          >
                            🚀 Launch Quiz to Students
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleEndQuiz}
                            style={{ width: '100%', padding: '10px', background: '#EF4444', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ⏹️ End Quiz
                          </button>
                        )}
                      </>
                    )}
 
                    {quizActive && (
                      <div style={{ marginTop: '12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', padding: '10px' }}>
                        <p style={{ color: '#A78BFA', fontSize: '11px', fontWeight: 700, margin: 0, textAlign: 'center' }}>✅ Quiz is live! Students are answering...</p>
                      </div>
                    )}
                  </div>
 
                  {(schedule.quizzes || []).length > 0 && (
                    <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', background: '#131D2E' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#94A3B8' }}>ACTIVE QUESTION PREVIEW:</h5>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', fontWeight: 600 }}>{schedule.quizzes[selectedControlQuizIdx]?.text}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                        {['A', 'B', 'C', 'D'].map(key => {
                          const optionText = schedule.quizzes[selectedControlQuizIdx]?.options?.[key] || schedule.quizzes[selectedControlQuizIdx]?.[`opt${key}`];
                          const isCorrect = schedule.quizzes[selectedControlQuizIdx]?.correctAnswer === key || schedule.quizzes[selectedControlQuizIdx]?.correct === key;
                          if (!optionText) return null;
                          return (
                            <div key={key} style={{ padding: '6px 8px', background: '#1E293B', borderRadius: '6px', border: isCorrect ? '1px solid #10B981' : '1px solid transparent' }}>
                              <strong style={{ color: isCorrect ? '#10B981' : '#A78BFA' }}>{key}:</strong> {optionText}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {controlTab === 'roster' && (
                <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#131D2E', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#00B6A6' }}>{studentParticipants.length}</div>
                      <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px' }}>Students</div>
                    </div>
                    <div style={{ background: '#131D2E', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#8B5CF6' }}>{stageStudents.length}</div>
                      <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px' }}>On Stage</div>
                    </div>
                    <div style={{ background: '#131D2E', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#FBBF24' }}>{raiseHands.length}</div>
                      <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px' }}>Hands Up</div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', background: '#131D2E' }}>
                    <h4 style={{ color: '#FBBF24', fontSize: '12px', fontWeight: 700, margin: '0 0 8px 0' }}>✋ Raised Hands ({raiseHands.length})</h4>
                    {raiseHands.length === 0 ? (
                      <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>No raised hands</p>
                    ) : (
                      raiseHands.map((identity: string) => {
                        const participant = participants.find((p: any) => p.identity === identity);
                        const displayName = participant ? `${participant.name || 'Student'} (${identity})` : identity;
                        return (
                          <div key={identity} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ color: 'white', fontSize: '12px' }}>{displayName}</span>
                            <button
                              type="button"
                              onClick={() => handleInviteToStage(identity)}
                              style={{ background: '#8B5CF6', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              {stageStudents.includes(identity) ? 'Remove Stage' : 'Invite Stage'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', background: '#131D2E' }}>
                    <h4 style={{ color: '#00B6A6', fontSize: '12px', fontWeight: 700, margin: '0 0 8px 0' }}>👥 Connected Students ({studentParticipants.length})</h4>
                    {studentParticipants.length === 0 ? (
                      <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>{isLive ? 'Waiting for students to join... (students send heartbeat every 2.5s)' : 'Class not started yet'}</p>
                    ) : (
                      studentParticipants.map((p: any) => (
                        <div key={p.identity} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'white', fontSize: '11.5px', fontWeight: 600 }}>{p.name || p.identity}</span>
                            <span style={{ color: '#64748B', fontSize: '9px' }}>{p.identity}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleMuteParticipant(p.identity)}
                              style={{ background: '#F59E0B', border: 'none', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '9.5px', cursor: 'pointer' }}
                            >
                              Mute
                            </button>
                            <button
                              type="button"
                              onClick={() => handleKickParticipant(p.identity)}
                              style={{ background: '#EF4444', border: 'none', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '9.5px', cursor: 'pointer' }}
                            >
                              Kick
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  const renderTeacherDesk = () => {
    const liveClasses = schedules.filter((s: any) => s.isLiveClass !== false);

    const handleStartClassDirectly = async (schedule: any) => {
      try {
        setActiveControlSchedule(schedule);
        if (!schedule.roomName) {
          showToast('🔴 Initializing live classroom & room...');
          const res = await fetch(`${API_BASE}/api/live-classroom/create-room`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheduleId: schedule._id }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Failed to start room');
          showToast(`✅ Class started! Room: ${json.data.roomName}`);
          
          setLiveRoomState((prev: any) => ({
            ...(prev || {}),
            isLive: true,
            liveStatus: 'live',
            roomName: json.data.roomName,
          }));
          await syncLiveRoomState(schedule._id);
        } else {
          showToast(`✅ Reconnecting to live control panel`);
          await syncLiveRoomState(schedule._id);
        }
        loadSchedules();
      } catch (err: any) {
        showToast('Error starting class: ' + err.message, 'error');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>🎥 Teacher Live Desk</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Select today's scheduled lecture below to go live and manage students instantly.
            </p>
          </div>
          <button type="button" onClick={loadSchedules} className="save-btn" style={{ padding: '8px 16px', fontSize: '12px' }}>
            🔄 Refresh Classes
          </button>
        </header>

        {liveClasses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📅</span>
            No live classes scheduled. Head to the <strong>Class Scheduling</strong> tab to create one!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {liveClasses.map((item: any) => {
              const isClassFinished = item.status === 'Finished';
              
              return (
                <div key={item._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', position: 'relative', border: item.roomName ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255,255,255,0.05)', background: item.roomName ? 'rgba(139, 92, 246, 0.02)' : 'var(--card)' }}>
                  {item.roomName && (
                    <span style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '10px', color: '#EF4444', fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                      LIVE NOW
                    </span>
                  )}
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ background: '#00B6A6', color: 'white', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
                        {item.subject}
                      </span>
                      <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 500 }}>
                        {item.gradeClass}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '16px', color: 'white', margin: '0 0 10px 0', lineHeight: 1.4, fontWeight: 700 }}>
                      {item.title}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📅 Date:</span>
                        <strong style={{ color: '#CBD5E1' }}>{item.dateText}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏰ Time:</span>
                        <strong style={{ color: '#FF5E00' }}>{item.time}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👤 Instructor:</span>
                        <strong style={{ color: '#CBD5E1' }}>{item.teacherName || 'TBD'}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isClassFinished ? (
                      <div style={{ background: 'rgba(255,255,255,0.03)', color: '#64748B', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 650, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        ✓ Class Completed
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartClassDirectly(item)}
                        style={{
                          width: '100%',
                          background: item.roomName ? '#8B5CF6' : '#10B981',
                          color: 'white',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {item.roomName ? '🖥️ Open Live Control Center' : '▶ Start Class & Go Live'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSchedulesManager = () => {
    if (activeControlSchedule) {
      return renderLiveControlCenter();
    }

    const filteredSchedules = schedules.filter((s: any) => {
      const matchesSearch = 
        (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = ordersClassFilter === 'all' || s.gradeClass === ordersClassFilter;
      const matchesType = statusFilter === 'all' || s.courseType === statusFilter || (s.status || '').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesClass && matchesType;
    });

    const handleCreateOrUpdateSchedule = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingScheduleId) {
          await updateSchedule(editingScheduleId, newSchedule);
          showToast('Schedule updated successfully! 📅');
        } else {
          await createSchedule(newSchedule);
          showToast('Schedule created successfully! 📅');
        }
        setNewSchedule({
          title: '',
          subject: 'Maths',
          time: getDefaultTimeText(),
          dateText: getTodayDateText(),
          gradeClass: 'Class 6',
          courseType: 'booster',
          teacherName: 'Ninja Mam (Priyanka)',
          teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
          status: 'Scheduled',
          isLiveClass: true,
          enableRecording: true,
          enableQuiz: true,
          allowStage: true,
          allowChat: true,
          maxStageStudents: 4,
          materials: [],
          homework: [],
          quizzes: [],
          questions: [],
          slides: [],
          durationMinutes: 30
        });
        setEditingScheduleId(null);
        loadSchedules();
      } catch (err: any) {
        showToast('Failed to save schedule: ' + err.message, 'error');
      }
    };

    const handleToggleStatus = async (item: any) => {
      try {
        const nextStatus = item.status === 'Scheduled' ? 'Finished' : 'Scheduled';
        const updateData: any = { status: nextStatus };
        if (nextStatus === 'Scheduled') {
          updateData.dateText = getTodayDateText();
          updateData.time = getDefaultTimeText();
        }
        await updateSchedule(item._id, updateData);
        showToast(`Class status updated to ${nextStatus}!`);
        loadSchedules();
      } catch (err: any) {
        showToast('Failed to toggle status: ' + err.message, 'error');
      }
    };

    const handleDeleteSchedule = async (id: string) => {
      if (!confirm('Are you sure you want to delete this class schedule?')) return;
      try {
        await deleteSchedule(id);
        showToast('Schedule deleted.');
        loadSchedules();
      } catch (err: any) {
        showToast('Failed to delete: ' + err.message, 'error');
      }
    };

    const handleEditClick = (item: any) => {
      setEditingScheduleId(item._id);
      setNewSchedule({
        title: item.title,
        subject: item.subject,
        time: item.time,
        dateText: item.dateText,
        gradeClass: item.gradeClass,
        courseType: item.courseType,
        teacherName: item.teacherName || '',
        teacherAvatar: item.teacherAvatar || '',
        status: item.status,
        isLiveClass: item.isLiveClass !== undefined ? item.isLiveClass : true,
        enableRecording: item.enableRecording !== undefined ? item.enableRecording : true,
        enableQuiz: item.enableQuiz !== undefined ? item.enableQuiz : true,
        allowStage: item.allowStage !== undefined ? item.allowStage : true,
        allowChat: item.allowChat !== undefined ? item.allowChat : true,
        maxStageStudents: item.maxStageStudents || 4,
        materials: item.materials || [],
        homework: item.homework || [],
        quizzes: item.quizzes || [],
        questions: item.questions || [],
        slides: item.slides || [],
        durationMinutes: item.durationMinutes || 30
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>Live Class Scheduling</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Schedule new lectures or tests, update content, and toggle live/finished states.
            </p>
          </div>
          <button type="button" onClick={loadSchedules} className="save-btn" style={{ padding: '8px 16px', fontSize: '12px' }} disabled={schedulesLoading}>
            {schedulesLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </header>

        {/* CRUD Form */}
        <div className="card">
          <h2 style={{ fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            {editingScheduleId ? '✏️ Edit Class Schedule' : '➕ Schedule a New Live Class'}
          </h2>
          <form onSubmit={handleCreateOrUpdateSchedule} className="form-grid" style={{ gap: '15px' }}>
            <div className="form-group span-2">
              <label>Lecture Title</label>
              <input 
                type="text" 
                required
                value={newSchedule.title} 
                onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} 
                placeholder="e.g. Beyond Zero : The World of Integers with Ninja Mam!"
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select 
                value={newSchedule.subject} 
                onChange={(e) => setNewSchedule({...newSchedule, subject: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="Maths">Maths</option>
                <option value="Science">Science</option>
                <option value="PTM">PTM</option>
                <option value="Test">Test</option>
              </select>
            </div>
            <div className="form-group">
              <label>Grade Class</label>
              <select 
                value={newSchedule.gradeClass} 
                onChange={(e) => setNewSchedule({...newSchedule, gradeClass: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                  <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Course Type</label>
              <select 
                value={newSchedule.courseType} 
                onChange={(e) => setNewSchedule({...newSchedule, courseType: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="booster">Booster Course (6 Days)</option>
                <option value="master">Long-term Master Program</option>
              </select>
            </div>
            <div className="form-group">
              <label>Class Status</label>
              <select 
                value={newSchedule.status} 
                onChange={(e) => setNewSchedule({...newSchedule, status: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date (Text Display)</label>
              <input 
                type="text" 
                required
                value={newSchedule.dateText} 
                onChange={(e) => setNewSchedule({...newSchedule, dateText: e.target.value})} 
                placeholder="e.g. 6 Jul, Mon"
              />
            </div>
            <div className="form-group">
              <label>Time (Text Display)</label>
              <input 
                type="text" 
                required
                value={newSchedule.time} 
                onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})} 
                placeholder="e.g. 8:10 pm - 9:10 pm"
              />
            </div>

            <div className="form-group span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#00B6A6' }}>🌐 Live Classroom Settings</span>
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                id="isLiveClass"
                checked={newSchedule.isLiveClass !== false}
                onChange={(e) => setNewSchedule({...newSchedule, isLiveClass: e.target.checked})}
              />
              <label htmlFor="isLiveClass" style={{ cursor: 'pointer', fontSize: '13px', color: 'white' }}>Is Live Classroom Class</label>
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                id="enableRecording"
                checked={newSchedule.enableRecording !== false}
                onChange={(e) => setNewSchedule({...newSchedule, enableRecording: e.target.checked})}
              />
              <label htmlFor="enableRecording" style={{ cursor: 'pointer', fontSize: '13px', color: 'white' }}>Enable Recording</label>
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                id="enableQuiz"
                checked={newSchedule.enableQuiz !== false}
                onChange={(e) => setNewSchedule({...newSchedule, enableQuiz: e.target.checked})}
              />
              <label htmlFor="enableQuiz" style={{ cursor: 'pointer', fontSize: '13px', color: 'white' }}>Enable In-Class Quizzes</label>
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                id="allowStage"
                checked={newSchedule.allowStage !== false}
                onChange={(e) => setNewSchedule({...newSchedule, allowStage: e.target.checked})}
              />
              <label htmlFor="allowStage" style={{ cursor: 'pointer', fontSize: '13px', color: 'white' }}>Allow Student Stage Speaking</label>
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                id="allowChat"
                checked={newSchedule.allowChat !== false}
                onChange={(e) => setNewSchedule({...newSchedule, allowChat: e.target.checked})}
              />
              <label htmlFor="allowChat" style={{ cursor: 'pointer', fontSize: '13px', color: 'white' }}>Allow In-Class Chat</label>
            </div>
            <div className="form-group">
              <label>Maximum Stage Students</label>
              <input 
                type="number"
                value={newSchedule.maxStageStudents || 4}
                onChange={(e) => setNewSchedule({...newSchedule, maxStageStudents: Math.max(1, Number(e.target.value))})}
                placeholder="4"
              />
            </div>

            {newSchedule.subject === 'Test' ? (
              <>
                {/* 1. Test Duration */}
                <div className="form-group span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 650, color: '#00B6A6', marginBottom: '8px', display: 'block' }}>
                    🎯 Test Duration Settings
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Time limit:</span>
                    <input
                      type="number"
                      required
                      value={newSchedule.durationMinutes || 30}
                      onChange={(e) => setNewSchedule({ ...newSchedule, durationMinutes: Math.max(1, Number(e.target.value)) })}
                      style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0F172A', color: 'white', textAlign: 'center', fontWeight: 'bold' }}
                    />
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>minutes</span>
                  </div>
                </div>

                {/* 2. Questions Builder */}
                <div className="form-group span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 650, color: '#00B6A6', marginBottom: '8px', display: 'block' }}>
                    ✏️ Configure MCQ Questions for this Test ({ (newSchedule.questions || []).length })
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(newSchedule.questions || []).map((q: any, qIdx: number) => (
                      <div key={qIdx} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#00B6A6' }}>Question {qIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newSchedule.questions];
                              updated.splice(qIdx, 1);
                              setNewSchedule({ ...newSchedule, questions: updated });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 650, cursor: 'pointer' }}
                          >
                            🗑️ Remove Question
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Question Text</label>
                          <input
                            type="text"
                            value={q.text || ''}
                            onChange={(e) => {
                              const updated = [...newSchedule.questions];
                              updated[qIdx] = { ...updated[qIdx], text: e.target.value };
                              setNewSchedule({ ...newSchedule, questions: updated });
                            }}
                            placeholder="Enter the question text..."
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#1E293B', color: 'white', fontSize: '13px' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          {(['A', 'B', 'C', 'D'] as const).map(optKey => (
                            <div key={optKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Option {optKey}</label>
                              <input
                                type="text"
                                value={q.options?.[optKey] || ''}
                                onChange={(e) => {
                                  const updated = [...newSchedule.questions];
                                  const newOpts = { ...(updated[qIdx].options || {}) };
                                  newOpts[optKey] = e.target.value;
                                  updated[qIdx] = { ...updated[qIdx], options: newOpts };
                                  setNewSchedule({ ...newSchedule, questions: updated });
                                }}
                                placeholder={`Option ${optKey}`}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#1E293B', color: 'white', fontSize: '13px' }}
                              />
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '200px' }}>
                          <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Correct Option</label>
                          <select
                            value={q.correct || q.correctAnswer || 'A'}
                            onChange={(e) => {
                              const updated = [...newSchedule.questions];
                              updated[qIdx] = { ...updated[qIdx], correct: e.target.value };
                              setNewSchedule({ ...newSchedule, questions: updated });
                            }}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#1E293B', color: 'white', fontSize: '13px', fontWeight: 'bold' }}
                          >
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(newSchedule.questions || []), { text: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A' }];
                        setNewSchedule({ ...newSchedule, questions: updated });
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px dashed #475569',
                        background: 'transparent',
                        color: '#94A3B8',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Add MCQ Question to Test
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Teacher Name</label>
                  <input 
                    type="text" 
                    value={newSchedule.teacherName} 
                    onChange={(e) => setNewSchedule({...newSchedule, teacherName: e.target.value})} 
                    placeholder="e.g. Ninja Mam (Priyanka)"
                  />
                </div>
                <div className="form-group">
                  <ImageField 
                    label="Teacher Avatar URL" 
                    value={newSchedule.teacherAvatar} 
                    onChange={(url) => setNewSchedule({...newSchedule, teacherAvatar: url})} 
                  />
                </div>

                {/* Embedded Class Materials Upload Form Section */}
                <div className="form-group span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 650, color: '#00B6A6', marginBottom: '8px', display: 'block' }}>
                    📂 Attach Study Materials / Notes for this Class
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Material File Title (filled on upload or type manually)"
                        value={tempMaterial.title}
                        onChange={(e) => setTempMaterial({...tempMaterial, title: e.target.value})}
                        style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Size (e.g. 1.2 MB)"
                        value={tempMaterial.size}
                        onChange={(e) => setTempMaterial({...tempMaterial, size: e.target.value})}
                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <label className="image-upload-btn-label" style={{ padding: '8px 14px', background: '#475569', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'inline-block', textAlign: 'center', margin: 0 }}>
                        {isUploadingMaterial ? 'Uploading File...' : '📁 Upload Notes/Workbook File'}
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.ppt,.pptx"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingMaterial(true);
                            try {
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const base64 = (reader.result as string).split(',')[1];
                                const url = await uploadFile(base64, file.name);
                                setTempMaterial({
                                  title: file.name,
                                  size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                                  url: url
                                });
                              };
                              reader.readAsDataURL(file);
                            } catch (err: any) {
                              showToast('File upload failed: ' + err.message, 'error');
                            } finally {
                              setIsUploadingMaterial(false);
                            }
                          }}
                          style={{ display: 'none' }}
                          disabled={isUploadingMaterial}
                        />
                      </label>
                      
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!tempMaterial.title.trim()) return showToast('Type a title or upload a file first!', 'error');
                          const updated = [...(newSchedule.materials || []), { title: tempMaterial.title, size: tempMaterial.size, url: tempMaterial.url }];
                          setNewSchedule({...newSchedule, materials: updated});
                          setTempMaterial({ title: '', size: '0.0 MB', url: '' });
                        }}
                        className="save-btn" 
                        style={{ padding: '8px 16px', background: '#00B6A6', color: 'white', borderRadius: '6px' }}
                      >
                        ➕ Add to Materials List
                      </button>
                    </div>
                  </div>

                  {/* Render lists of attached materials */}
                  {newSchedule.materials && newSchedule.materials.length > 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {newSchedule.materials.map((m: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < newSchedule.materials.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                          <span style={{ fontSize: '13px', color: 'white' }}>📄 {m.title} <span style={{ color: '#94A3B8', fontSize: '11px' }}>({m.size})</span></span>
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = newSchedule.materials.filter((_: any, i: number) => i !== idx);
                              setNewSchedule({...newSchedule, materials: updated});
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ❌ Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0' }}>No materials attached. Student will see default handouts.</p>
                  )}
                </div>

                {/* Distinct Live Quiz MCQ Section */}
                <div className="form-group span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 650, color: '#10B981', marginBottom: '8px', display: 'block' }}>
                    🎙️ Attach Live Quiz Questions (For Real-time Launching During Class)
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Quiz Question text (e.g. Solve: 5 + 3 = ?)"
                      value={tempQuiz.text}
                      onChange={(e) => setTempQuiz({...tempQuiz, text: e.target.value})}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                    />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Chapter Name (e.g. Addition)"
                        value={tempQuiz.chapter || ''}
                        onChange={(e) => setTempQuiz({...tempQuiz, chapter: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Topic Name (e.g. Basic Math)"
                        value={tempQuiz.topic || ''}
                        onChange={(e) => setTempQuiz({...tempQuiz, topic: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Option A"
                        value={tempQuiz.optA}
                        onChange={(e) => setTempQuiz({...tempQuiz, optA: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Option B"
                        value={tempQuiz.optB}
                        onChange={(e) => setTempQuiz({...tempQuiz, optB: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Option C"
                        value={tempQuiz.optC}
                        onChange={(e) => setTempQuiz({...tempQuiz, optC: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Option D"
                        value={tempQuiz.optD}
                        onChange={(e) => setTempQuiz({...tempQuiz, optD: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Correct Answer:</span>
                        <select 
                          value={tempQuiz.correct}
                          onChange={(e) => setTempQuiz({...tempQuiz, correct: e.target.value})}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          if (!tempQuiz.text.trim()) return alert('Type a question text!');
                          if (!tempQuiz.optA.trim() || !tempQuiz.optB.trim()) return alert('Options A and B are required!');
                          const newQuestion = {
                            text: tempQuiz.text,
                            options: {
                              A: tempQuiz.optA,
                              B: tempQuiz.optB,
                              C: tempQuiz.optC,
                              D: tempQuiz.optD
                            },
                            correctAnswer: tempQuiz.correct,
                            chapter: tempQuiz.chapter,
                            topic: tempQuiz.topic
                          };
                          const updated = [...(newSchedule.quizzes || []), newQuestion];
                          setNewSchedule({...newSchedule, quizzes: updated});
                          setTempQuiz({ text: '', optA: '', optB: '', optC: '', optD: '', correct: 'A', chapter: '', topic: '' });
                        }}
                        className="save-btn"
                        style={{ padding: '8px 16px', background: '#10B981' }}
                      >
                        ➕ Add Live Quiz Question
                      </button>
                    </div>
                  </div>

                  {/* Render lists of attached live quiz questions */}
                  {newSchedule.quizzes && newSchedule.quizzes.length > 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newSchedule.quizzes.map((q: any, idx: number) => (
                        <div key={idx} style={{ padding: '8px 0', borderBottom: idx < newSchedule.quizzes.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{idx + 1}. {q.text}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const updated = newSchedule.quizzes.filter((_: any, i: number) => i !== idx);
                                setNewSchedule({...newSchedule, quizzes: updated});
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ❌ Remove
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                            <span>A: {q.options.A}</span>
                            <span>B: {q.options.B}</span>
                            {q.options.C ? <span>C: {q.options.C}</span> : null}
                            {q.options.D ? <span>D: {q.options.D}</span> : null}
                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>(Correct: {q.correctAnswer})</span>
                            {q.chapter ? <span style={{ color: '#00B6A6' }}>📖 {q.chapter}</span> : null}
                            {q.topic ? <span style={{ color: '#38BDF8' }}>🏷️ {q.topic}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0' }}>No live quiz questions added.</p>
                  )}
                </div>

                {/* Embedded Homework MCQ Question Editor Section */}
                <div className="form-group span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 650, color: '#FF5E00', marginBottom: '8px', display: 'block' }}>
                    📝 Attach Homework MCQ Questions for this Class
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Question text (e.g. Which number is smaller than -5?)"
                      value={tempHomework.text}
                      onChange={(e) => setTempHomework({...tempHomework, text: e.target.value})}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                    />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Chapter Name (e.g. Integers)"
                        value={tempHomework.chapter || ''}
                        onChange={(e) => setTempHomework({...tempHomework, chapter: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Topic Name (e.g. Negative Numbers)"
                        value={tempHomework.topic || ''}
                        onChange={(e) => setTempHomework({...tempHomework, topic: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Option A"
                        value={tempHomework.optA}
                        onChange={(e) => setTempHomework({...tempHomework, optA: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Option B"
                        value={tempHomework.optB}
                        onChange={(e) => setTempHomework({...tempHomework, optB: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Option C"
                        value={tempHomework.optC}
                        onChange={(e) => setTempHomework({...tempHomework, optC: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Option D"
                        value={tempHomework.optD}
                        onChange={(e) => setTempHomework({...tempHomework, optD: e.target.value})}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Correct Answer:</span>
                        <select 
                          value={tempHomework.correct}
                          onChange={(e) => setTempHomework({...tempHomework, correct: e.target.value})}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          if (!tempHomework.text.trim()) return alert('Type a question text!');
                          if (!tempHomework.optA.trim() || !tempHomework.optB.trim()) return alert('Options A and B are required!');
                          const newQuestion = {
                            text: tempHomework.text,
                            options: {
                              A: tempHomework.optA,
                              B: tempHomework.optB,
                              C: tempHomework.optC,
                              D: tempHomework.optD
                            },
                            correctAnswer: tempHomework.correct,
                            chapter: tempHomework.chapter,
                            topic: tempHomework.topic
                          };
                          const updated = [...(newSchedule.homework || []), newQuestion];
                          setNewSchedule({...newSchedule, homework: updated});
                          setTempHomework({ text: '', optA: '', optB: '', optC: '', optD: '', correct: 'A', chapter: '', topic: '' });
                        }}
                        className="save-btn"
                        style={{ padding: '8px 16px', background: '#FF5E00' }}
                      >
                        ➕ Add Question
                      </button>
                    </div>
                  </div>

                  {/* Render lists of attached homework questions */}
                  {newSchedule.homework && newSchedule.homework.length > 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newSchedule.homework.map((q: any, idx: number) => (
                        <div key={idx} style={{ padding: '8px 0', borderBottom: idx < newSchedule.homework.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{idx + 1}. {q.text}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const updated = newSchedule.homework.filter((_: any, i: number) => i !== idx);
                                const newScheduleUpdated = {...newSchedule, homework: updated};
                                setNewSchedule(newScheduleUpdated);
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ❌ Remove
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                            <span>A: {q.options.A}</span>
                            <span>B: {q.options.B}</span>
                            {q.options.C ? <span>C: {q.options.C}</span> : null}
                            {q.options.D ? <span>D: {q.options.D}</span> : null}
                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>(Correct: {q.correctAnswer})</span>
                            {q.chapter ? <span style={{ color: '#00B6A6' }}>📖 {q.chapter}</span> : null}
                            {q.topic ? <span style={{ color: '#38BDF8' }}>🏷️ {q.topic}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0' }}>No questions added. Student will see default quiz.</p>
                  )}
                </div>

                {/* Custom Slides presentation manager */}
                <div className="form-group span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 650, color: '#00B6A6', marginBottom: '8px', display: 'block' }}>
                    🖼️ Attach Lesson Slides / Material (PDF, Image, or Video URLs)
                  </label>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Slide Resource URL (e.g. image, video, or PDF)"
                      value={tempSlideUrl}
                      onChange={(e) => setTempSlideUrl(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }}
                    />
                    <label className="image-upload-btn-label" style={{ padding: '10px 14px', background: '#475569', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'inline-block', alignSelf: 'center', margin: 0 }}>
                      {isUploadingSlide ? (uploadingStatus || 'Uploading...') : '📁 Upload Slide File'}
                      <input 
                        type="file" 
                        accept="image/*,video/*,application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingSlide(true);
                          setUploadingStatus('Uploading...');
                          try {
                            if (file.type === 'application/pdf') {
                              setUploadingStatus('Loading PDF...');
                              const pdfjsLib = await loadPdfJS();
                              
                              const reader = new FileReader();
                              reader.onload = async () => {
                                try {
                                  const typedarray = new Uint8Array(reader.result as ArrayBuffer);
                                  setUploadingStatus('Splitting PDF...');
                                  const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                                  const numPages = pdf.numPages;
                                  showToast(`📚 Found ${numPages} pages in PDF.`);
                                  
                                  const newSlidesList = [...(newSchedule.slides || [])];
                                  for (let i = 1; i <= numPages; i++) {
                                    setUploadingStatus(`Page ${i}/${numPages}...`);
                                    const page = await pdf.getPage(i);
                                    const viewport = page.getViewport({ scale: 1.5 });
                                    const canvas = document.createElement('canvas');
                                    const context = canvas.getContext('2d');
                                    if (context) {
                                      canvas.height = viewport.height;
                                      canvas.width = viewport.width;
                                      await page.render({ canvasContext: context, viewport: viewport }).promise;
                                      const base64Image = canvas.toDataURL('image/png').split(',')[1];
                                      const pageUrl = await uploadFile(base64Image, `${file.name.replace('.pdf', '')}_page_${i}.png`);
                                      newSlidesList.push(pageUrl);
                                    }
                                  }
                                  setNewSchedule({...newSchedule, slides: newSlidesList});
                                  showToast(`🎉 PDF split: ${numPages} slide pages added!`);
                                } catch (err: any) {
                                  showToast('PDF split failed: ' + err.message, 'error');
                                } finally {
                                  setIsUploadingSlide(false);
                                  setUploadingStatus('');
                                }
                              };
                              reader.readAsArrayBuffer(file);
                            } else {
                              const reader = new FileReader();
                              reader.onload = async () => {
                                try {
                                  const base64 = (reader.result as string).split(',')[1];
                                  const url = await uploadFile(base64, file.name);
                                  setTempSlideUrl(url);
                                } catch (err: any) {
                                  showToast('Upload failed: ' + err.message, 'error');
                                } finally {
                                  setIsUploadingSlide(false);
                                  setUploadingStatus('');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          } catch (err: any) {
                            showToast('Upload failed: ' + err.message, 'error');
                            setIsUploadingSlide(false);
                            setUploadingStatus('');
                          }
                        }}
                        style={{ display: 'none' }}
                        disabled={isUploadingSlide}
                      />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!tempSlideUrl.trim()) return showToast('Add a slide URL or upload a file first!', 'error');
                        const updated = [...(newSchedule.slides || []), tempSlideUrl.trim()];
                        setNewSchedule({...newSchedule, slides: updated});
                        setTempSlideUrl('');
                      }}
                      className="save-btn"
                      style={{ padding: '10px 16px', background: '#00B6A6' }}
                    >
                      ➕ Add Slide
                    </button>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8', margin: '-4px 0 12px 0', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    💡 <span>Tip: Uploading a PDF will automatically slice and split all pages into high-resolution slide images. If you have a PPT, save it as a PDF first!</span>
                  </div>

                  {/* Render slides preview list */}
                  {newSchedule.slides && newSchedule.slides.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {newSchedule.slides.map((url: string, idx: number) => {
                        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) || !url.includes('.');
                        const isVideo = url.match(/\.(mp4|webm|ogg)/i);
                        const isPdf = url.match(/\.pdf/i);
                        return (
                          <div key={idx} style={{ position: 'relative', width: '100px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {isImage ? (
                              <img src={url.startsWith('/') && !url.startsWith('http') ? `http://localhost:3001${url}` : url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="slide preview" />
                            ) : isVideo ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1E293B', color: '#38BDF8', fontSize: '10px', fontWeight: 'bold' }}>📹 Video</div>
                            ) : isPdf ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1E293B', color: '#EF4444', fontSize: '10px', fontWeight: 'bold' }}>📕 PDF</div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1E293B', color: '#94A3B8', fontSize: '10px', fontWeight: 'bold' }}>📄 File</div>
                            )}
                            <button 
                              type="button" 
                              onClick={() => {
                                const updated = newSchedule.slides.filter((_: any, i: number) => i !== idx);
                                setNewSchedule({...newSchedule, slides: updated});
                              }}
                              style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#EF4444', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                            <div style={{ position: 'absolute', bottom: '2px', left: '4px', color: 'white', fontSize: '9px', background: 'rgba(0,0,0,0.6)', padding: '0 4px', borderRadius: '2px' }}>
                              #{idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0' }}>No custom slides attached. A plain chalkboard will be displayed.</p>
                  )}
                </div>
              </>
            )}

            <div className="form-group span-2" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="save-btn" style={{ flex: 1, padding: '12px' }}>
                {editingScheduleId ? '💾 Save Schedule Changes' : '➕ Create Class Schedule'}
              </button>
              {editingScheduleId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingScheduleId(null);
                    setNewSchedule({
                      title: '',
                      subject: 'Maths',
                      time: '8:10 pm - 9:10 pm',
                      dateText: '6 Jul, Mon',
                      gradeClass: 'Class 6',
                      courseType: 'booster',
                      teacherName: 'Ninja Mam (Priyanka)',
                      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
                      status: 'Scheduled',
                      isLiveClass: true,
                      enableRecording: true,
                      enableQuiz: true,
                      allowStage: true,
                      allowChat: true,
                      maxStageStudents: 4,
                      materials: [],
                      homework: [],
                      quizzes: [],
                      questions: [],
                      slides: [],
                      durationMinutes: 30
                    });
                  }} 
                  className="save-btn" 
                  style={{ padding: '12px 20px', background: '#475569' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="search-container" style={{ marginTop: '10px' }}>
          <div className="search-input-wrap">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search schedules by title, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={ordersClassFilter} 
            onChange={(e) => setOrdersClassFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
            ))}
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Types/Statuses</option>
            <option value="booster">Booster Course Only</option>
            <option value="master">Master Program Only</option>
            <option value="scheduled">Scheduled Status Only</option>
            <option value="finished">Finished Status Only</option>
          </select>
        </div>

        {/* List View */}
        <div className="table-wrap">
          {schedulesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading schedules...</div>
          ) : filteredSchedules.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No class schedules found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Class Details</th>
                  <th>Grade / Course</th>
                  <th>Date &amp; Time</th>
                  <th>Teacher</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 650, color: 'white' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: '#00B6A6', marginTop: '2px', fontWeight: 500 }}>{item.subject}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{item.gradeClass}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'capitalize' }}>{item.courseType}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{item.dateText}</div>
                      <div style={{ fontSize: '11.5px', color: '#FF5E00' }}>{item.time}</div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {item.subject?.toLowerCase() === 'test' ? (
                        <div style={{ fontSize: '12px', color: '#00B6A6', fontWeight: 600 }}>
                          ⏱️ {item.durationMinutes || 30} mins | ✏️ {(item.questions || []).length} Qs
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.teacherAvatar && (
                            <img src={item.teacherAvatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          <span style={{ fontSize: '12px' }}>{item.teacherName}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'Finished' ? 'paid' : 'pending'}`} style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 650,
                        border: '1px solid',
                        borderColor: item.status === 'Finished' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(251, 191, 36, 0.3)',
                        background: item.status === 'Finished' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        color: item.status === 'Finished' ? '#10B981' : '#FBBF24'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {item.isLiveClass && item.status !== 'Finished' && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setActiveControlSchedule(item);
                            }}
                            className="action-btn"
                            style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', fontSize: '11.5px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            🖥️ Live Control
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => handleToggleStatus(item)}
                          className="action-btn"
                          style={{ background: item.status === 'Finished' ? '#64748B' : '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', fontSize: '11.5px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {item.status === 'Finished' ? 'Mark Live' : 'Mark Finished'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleEditClick(item)}
                          className="action-btn"
                          style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', fontSize: '11.5px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteSchedule(item._id)}
                          className="action-btn"
                          style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', fontSize: '11.5px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // ─── TEST REPORTS & PERFORMANCE ANALYTICS ────────────────────────
  const loadTestReports = async () => {
    setTestSubmissionsLoading(true);
    try {
      const studData = await fetchStudents();
      setStudents(studData || []);

      const res = await fetch(`${API_BASE}/api/homework-submissions?subject=Test`);
      const json = await res.json();
      if (json.success) {
        setTestSubmissions(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load test reports:', err);
      showToast('Failed to load test reports.', 'error');
    } finally {
      setTestSubmissionsLoading(false);
    }
  };

  const renderTestReports = () => {
    const filteredStudents = students.filter((s: any) => {
      const matchesSearch = !testSearchQuery || 
        (s.name && s.name.toLowerCase().includes(testSearchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(testSearchQuery));
      const matchesClass = testFilterClass === 'all' || s.selectedClass === testFilterClass;
      return matchesSearch && matchesClass;
    });

    const completedWelcomeTests = filteredStudents.filter((s: any) => s.welcomeTestStatus === 'completed');

    const filteredSubmissions = testSubmissions.filter((r: any) => {
      const matchesSearch = !testSearchQuery || 
        (r.studentName && r.studentName.toLowerCase().includes(testSearchQuery.toLowerCase())) ||
        (r.studentPhone && r.studentPhone.includes(testSearchQuery));
      const matchesClass = testFilterClass === 'all' || r.gradeClass === testFilterClass;
      return matchesSearch && matchesClass;
    });

    const totalWelcomeCount = completedWelcomeTests.length;
    const avgWelcomeScore = totalWelcomeCount > 0
      ? Math.round(completedWelcomeTests.reduce((sum, s) => sum + ((s.welcomeTestResult?.score || 0) / (s.welcomeTestResult?.totalQuestions || 10) * 100), 0) / totalWelcomeCount)
      : 0;

    const totalScheduledCount = filteredSubmissions.length;
    const avgScheduledScore = totalScheduledCount > 0
      ? Math.round(filteredSubmissions.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalScheduledCount)
      : 0;

    const overallAverage = (totalWelcomeCount + totalScheduledCount) > 0
      ? Math.round((
          completedWelcomeTests.reduce((sum, s) => sum + ((s.welcomeTestResult?.score || 0) / (s.welcomeTestResult?.totalQuestions || 10) * 100), 0) +
          filteredSubmissions.reduce((sum, r) => sum + (r.percentage || 0), 0)
        ) / (totalWelcomeCount + totalScheduledCount))
      : 0;

    let highestPct = 0;
    completedWelcomeTests.forEach(s => {
      const pct = Math.round(((s.welcomeTestResult?.score || 0) / (s.welcomeTestResult?.totalQuestions || 10)) * 100);
      if (pct > highestPct) highestPct = pct;
    });
    filteredSubmissions.forEach(r => {
      if ((r.percentage || 0) > highestPct) highestPct = r.percentage;
    });

    let lowScoreCount = 0;
    completedWelcomeTests.forEach(s => {
      const pct = Math.round(((s.welcomeTestResult?.score || 0) / (s.welcomeTestResult?.totalQuestions || 10)) * 100);
      if (pct < 50) lowScoreCount++;
    });
    filteredSubmissions.forEach(r => {
      if ((r.percentage || 0) < 50) lowScoreCount++;
    });

    const studentPerformanceMap: Record<string, {
      name: string;
      phone: string;
      gradeClass: string;
      welcomeScore: number | null;
      welcomeTotal: number;
      scheduledCount: number;
      scheduledTotalScore: number;
      scheduledTotalQuestions: number;
      scheduledPercentages: number[];
      latestScoreDate: string | null;
      latestScorePct: number | null;
    }> = {};

    filteredStudents.forEach((s: any) => {
      const isWelcomeCompleted = s.welcomeTestStatus === 'completed';
      const welcomeScore = isWelcomeCompleted ? s.welcomeTestResult?.score : null;
      const welcomeTotal = isWelcomeCompleted ? (s.welcomeTestResult?.totalQuestions || 10) : 10;
      
      studentPerformanceMap[s.phone] = {
        name: s.name || 'Anonymous Student',
        phone: s.phone,
        gradeClass: s.selectedClass || 'N/A',
        welcomeScore: welcomeScore,
        welcomeTotal: welcomeTotal,
        scheduledCount: 0,
        scheduledTotalScore: 0,
        scheduledTotalQuestions: 0,
        scheduledPercentages: [],
        latestScoreDate: isWelcomeCompleted ? s.welcomeTestResult?.submittedAt : null,
        latestScorePct: isWelcomeCompleted ? Math.round((welcomeScore / welcomeTotal) * 100) : null
      };
    });

    filteredSubmissions.forEach((r: any) => {
      const phone = r.studentPhone;
      if (!studentPerformanceMap[phone]) {
        studentPerformanceMap[phone] = {
          name: r.studentName || 'Anonymous Student',
          phone: phone,
          gradeClass: r.gradeClass || 'N/A',
          welcomeScore: null,
          welcomeTotal: 10,
          scheduledCount: 0,
          scheduledTotalScore: 0,
          scheduledTotalQuestions: 0,
          scheduledPercentages: [],
          latestScoreDate: null,
          latestScorePct: null
        };
      }
      const entry = studentPerformanceMap[phone];
      entry.scheduledCount += 1;
      entry.scheduledTotalScore += (r.score || 0);
      entry.scheduledTotalQuestions += (r.totalQuestions || 0);
      entry.scheduledPercentages.push(r.percentage || 0);
      
      const submittedDateStr = r.submittedAt ? new Date(r.submittedAt).toISOString() : '';
      if (!entry.latestScoreDate || submittedDateStr > entry.latestScoreDate) {
        entry.latestScoreDate = submittedDateStr;
        entry.latestScorePct = r.percentage || 0;
      }
    });

    const studentPerformanceList = Object.values(studentPerformanceMap).map(entry => {
      let totalTestsWeight = 0;
      let totalPercentageSum = 0;

      if (entry.welcomeScore !== null) {
        totalTestsWeight += 1;
        totalPercentageSum += Math.round((entry.welcomeScore / entry.welcomeTotal) * 100);
      }
      if (entry.scheduledCount > 0) {
        totalTestsWeight += entry.scheduledCount;
        totalPercentageSum += entry.scheduledPercentages.reduce((s, p) => s + p, 0);
      }

      const overallAvg = totalTestsWeight > 0 ? Math.round(totalPercentageSum / totalTestsWeight) : 0;
      
      let level = 'Needs Improvement';
      let levelColor = '#EF4444';
      if (overallAvg >= 90) {
        level = 'Outstanding';
        levelColor = '#10B981';
      } else if (overallAvg >= 75) {
        level = 'Excellent';
        levelColor = '#00B6A6';
      } else if (overallAvg >= 60) {
        level = 'Average';
        levelColor = '#6366F1';
      }

      let trend = 'Steady';
      let trendColor = '#94A3B8';
      if (entry.latestScorePct !== null && totalTestsWeight > 1) {
        const diff = entry.latestScorePct - overallAvg;
        if (diff > 5) {
          trend = 'Improving 📈';
          trendColor = '#10B981';
        } else if (diff < -5) {
          trend = 'Needs Attention ⚠️';
          trendColor = '#F59E0B';
        }
      }

      return {
        ...entry,
        overallAvg,
        totalTests: totalTestsWeight,
        level,
        levelColor,
        trend,
        trendColor
      };
    }).sort((a, b) => b.overallAvg - a.overallAvg);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>📊 Test Reports &amp; Analytics</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Track student performance across diagnostic Welcome Tests and Scheduled Tests.
            </p>
          </div>
          <button 
            type="button" 
            onClick={loadTestReports} 
            className="save-btn" 
            style={{ padding: '8px 16px', fontSize: '12px' }}
            disabled={testSubmissionsLoading}
          >
            {testSubmissionsLoading ? 'Refreshing...' : '🔄 Refresh Analytics'}
          </button>
        </header>

        {/* Filters & Search */}
        <div className="search-container">
          <div className="search-input-wrap">
            <span className="search-icon-placeholder">🔍</span>
            <input 
              type="text" 
              placeholder="Search students by name or phone..."
              value={testSearchQuery}
              onChange={(e) => setTestSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <select 
            value={testFilterClass} 
            onChange={(e) => setTestFilterClass(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Metric Cards */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Test Submissions', value: totalWelcomeCount + totalScheduledCount, desc: `${totalWelcomeCount} Welcome + ${totalScheduledCount} Scheduled`, color: '#38BDF8' },
            { label: 'Overall Class Average', value: `${overallAverage}%`, desc: `Welcome Avg: ${avgWelcomeScore}% | Scheduled Avg: ${avgScheduledScore}%`, color: '#10B981' },
            { label: 'Highest Percentage', value: `${highestPct}%`, desc: 'Top mark achieved', color: '#00B6A6' },
            { label: 'Low Score Alerts (<50%)', value: lowScoreCount, desc: 'Needs academic support', color: lowScoreCount > 0 ? '#EF4444' : '#94A3B8' }
          ].map(({ label, value, desc, color }) => (
            <div key={label} style={{ flex: 1, minWidth: '200px', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginTop: '6px' }}>{label}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Sub-tab Selection Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', gap: '24px', margin: '10px 0 5px' }}>
          {[
            { id: 'welcome', label: '🎯 Welcome Diagnostic Tests' },
            { id: 'scheduled', label: '📅 Scheduled Tests' },
            { id: 'performance', label: '📈 Student Performance & Trends' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTestReportsSubTab(t.id as any)}
              style={{
                background: 'none',
                border: 'none',
                color: testReportsSubTab === t.id ? '#00B6A6' : '#94A3B8',
                paddingBottom: '12px',
                borderBottom: testReportsSubTab === t.id ? '2px solid #00B6A6' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sub-tab Contents */}
        {testSubmissionsLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#94A3B8' }}>Loading test records and analytics...</p>
          </div>
        ) : testReportsSubTab === 'welcome' ? (
          <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0F172A', color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Student Name', 'Phone Number', 'Grade Class', 'Status', 'Score', 'Percentage', 'Grade', 'Submitted At'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s: any, idx: number) => {
                    const result = s.welcomeTestResult;
                    const score = result?.score ?? null;
                    const total = result?.totalQuestions ?? 10;
                    const pct = score !== null ? Math.round((score / total) * 100) : null;
                    
                    let grade = '—';
                    if (pct !== null) {
                      if (pct >= 90) grade = 'A';
                      else if (pct >= 80) grade = 'B';
                      else if (pct >= 60) grade = 'C';
                      else if (pct >= 40) grade = 'D';
                      else grade = 'E';
                    }

                    const isDone = s.welcomeTestStatus === 'completed';
                    return (
                      <tr key={s._id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name || 'Anonymous Student'}</td>
                        <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{s.phone}</td>
                        <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{s.selectedClass || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', 
                            color: isDone ? '#10B981' : '#F59E0B', 
                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 
                          }}>
                            {isDone ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: score !== null ? '#00B6A6' : '#64748B' }}>
                          {score !== null ? `${score}/${total}` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: pct !== null ? (pct >= 50 ? '#10B981' : '#EF4444') : '#64748B' }}>
                          {pct !== null ? `${pct}%` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {pct !== null ? (
                            <span style={{
                              background: grade === 'A' || grade === 'B' ? 'rgba(16,185,129,0.15)' : grade === 'C' ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                              color: grade === 'A' || grade === 'B' ? '#10B981' : grade === 'C' ? '#6366F1' : '#EF4444',
                              padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px'
                            }}>{grade}</span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '12px' }}>
                          {result?.submittedAt ? new Date(result.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No students found matching current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : testReportsSubTab === 'scheduled' ? (
          <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0F172A', color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Student Name', 'Phone Number', 'Grade Class', 'Test Title', 'Score', 'Percentage', 'Grade', 'Submitted At'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((r: any, idx: number) => (
                    <tr key={r._id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.studentName || 'Anonymous Student'}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{r.studentPhone}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{r.gradeClass}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 500 }}>{r.scheduleTitle}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#00B6A6' }}>{r.score}/{r.totalQuestions}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: r.percentage >= 50 ? '#10B981' : '#EF4444' }}>{r.percentage}%</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: r.grade?.startsWith('A') ? 'rgba(16,185,129,0.15)' : r.grade === 'B' || r.grade === 'B+' ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                          color: r.grade?.startsWith('A') ? '#10B981' : r.grade === 'B' || r.grade === 'B+' ? '#6366F1' : '#EF4444',
                          padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px'
                        }}>{r.grade}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '12px' }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No scheduled test submissions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0F172A', color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Student Name', 'Phone Number', 'Grade', 'Welcome Score', 'Scheduled Taken', 'Overall Avg', 'Performance Level', 'Progress Tracker', 'Trend'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentPerformanceList.map((student, idx) => (
                    <tr key={student.phone || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{student.name}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{student.phone}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{student.gradeClass}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: student.welcomeScore !== null ? '#00B6A6' : '#64748B' }}>
                        {student.welcomeScore !== null ? `${student.welcomeScore}/${student.welcomeTotal}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                        {student.scheduledCount}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: student.overallAvg >= 50 ? '#10B981' : '#EF4444' }}>
                        {student.overallAvg}%
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: student.level === 'Outstanding' ? 'rgba(16,185,129,0.15)' : student.level === 'Excellent' ? 'rgba(0,182,166,0.15)' : student.level === 'Average' ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                          color: student.level === 'Outstanding' ? '#10B981' : student.level === 'Excellent' ? '#00B6A6' : student.level === 'Average' ? '#6366F1' : '#EF4444',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700
                        }}>{student.level}</span>
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ width: `${student.overallAvg}%`, height: '100%', background: student.levelColor, borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#94A3B8', width: '28px', textAlign: 'right' }}>{student.overallAvg}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: student.trendColor }}>
                        {student.trend}
                      </td>
                    </tr>
                  ))}
                  {studentPerformanceList.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No performance data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── HW REPORTS ───────────────────────────────────────────────────
  const loadHwReports = async () => {
    setHwReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (hwFilterClass) params.append('gradeClass', hwFilterClass);
      if (hwFilterSubject) params.append('subject', hwFilterSubject);
      if (hwFilterMonth) params.append('month', hwFilterMonth);
      if (hwFilterYear) params.append('year', hwFilterYear);
      const res = await fetch(`/api/homework-submissions?${params.toString()}`);
      const json = await res.json();
      if (json.success) setHwReports(json.data || []);
    } catch (err) {
      console.error('Failed to fetch HW reports:', err);
    } finally {
      setHwReportsLoading(false);
    }
  };

  const renderHwReports = () => {
    // Aggregate summary stats
    const totalSubs = hwReports.length;
    const avgPct = totalSubs > 0
      ? Math.round(hwReports.reduce((s: number, r: any) => s + (r.percentage || 0), 0) / totalSubs)
      : 0;
    const gradeCounts: Record<string, number> = {};
    hwReports.forEach((r: any) => {
      gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;
    });

    // Group by student
    const byStudent: Record<string, any[]> = {};
    hwReports.forEach((r: any) => {
      const key = `${r.studentName || r.studentPhone} (${r.studentPhone})`;
      if (!byStudent[key]) byStudent[key] = [];
      byStudent[key].push(r);
    });

    return (
      <div>
        <header>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>📊 Homework Reports</h1>
        </header>

        {/* Filters */}
        <div className="form-card" style={{ marginBottom: '20px' }}>
          <h2 style={{ color: 'white', marginBottom: '15px', fontSize: '16px' }}>🔍 Filter Reports</h2>
          <div className="form-grid" style={{ gap: '12px' }}>
            <div className="form-group">
              <label>Grade / Class</label>
              <select
                value={hwFilterClass}
                onChange={e => setHwFilterClass(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Classes</option>
                {[6,7,8,9,10,11].map(n => <option key={n} value={`Class ${n}`}>Class {n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                placeholder="e.g. Maths, Science"
                value={hwFilterSubject}
                onChange={e => setHwFilterSubject(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Month (YYYY-MM)</label>
              <input
                type="month"
                value={hwFilterMonth}
                onChange={e => setHwFilterMonth(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                placeholder="e.g. 2026"
                value={hwFilterYear}
                onChange={e => setHwFilterYear(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              className="save-btn"
              onClick={loadHwReports}
              disabled={hwReportsLoading}
            >
              {hwReportsLoading ? 'Loading...' : '🔍 Apply Filters'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {totalSubs > 0 && (
          <div className="form-grid" style={{ gap: '12px', marginBottom: '20px' }}>
            <div className="form-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#00B6A6' }}>{totalSubs}</div>
              <div style={{ color: '#94A3B8', fontSize: '13px' }}>Total Submissions</div>
            </div>
            <div className="form-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: avgPct >= 70 ? '#10B981' : '#FF6600' }}>{avgPct}%</div>
              <div style={{ color: '#94A3B8', fontSize: '13px' }}>Average Score</div>
            </div>
            <div className="form-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#6366F1' }}>{Object.keys(byStudent).length}</div>
              <div style={{ color: '#94A3B8', fontSize: '13px' }}>Students Attempted</div>
            </div>
            <div className="form-card">
              <div style={{ color: 'white', fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>Grade Distribution</div>
              {['A+','A','B+','B','C','D'].map(g => (
                <div key={g} style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px', marginBottom: '3px' }}>
                  <span>{g}</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{gradeCounts[g] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-Student Table */}
        <div className="form-card">
          <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '16px' }}>📋 Student-wise Results</h2>
          {hwReportsLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Loading reports...</div>
          ) : hwReports.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
              No submissions found. Adjust filters and click Apply.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Student', 'Phone', 'Class', 'Subject', 'Score', '%', 'Grade', 'HW Title', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#94A3B8', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hwReports.map((r: any) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 10px', color: 'white' }}>{r.studentName || '—'}</td>
                      <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{r.studentPhone}</td>
                      <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{r.gradeClass}</td>
                      <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{r.subject}</td>
                      <td style={{ padding: '8px 10px', color: 'white', fontWeight: 700 }}>{r.score}/{r.totalQuestions}</td>
                      <td style={{ padding: '8px 10px', color: r.percentage >= 70 ? '#10B981' : '#FF6600', fontWeight: 700 }}>{r.percentage}%</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          background: r.grade?.startsWith('A') ? 'rgba(16,185,129,0.15)' : r.grade === 'B' || r.grade === 'B+' ? 'rgba(99,102,241,0.15)' : 'rgba(255,102,0,0.15)',
                          color: r.grade?.startsWith('A') ? '#10B981' : r.grade === 'B' || r.grade === 'B+' ? '#6366F1' : '#FF6600',
                          padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px'
                        }}>{r.grade}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#94A3B8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.scheduleTitle}</td>
                      <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{r.submittedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMaterialsManager = () => {
    const filteredMaterials = materials.filter((m: any) => {
      const matchesSearch = m.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = ordersClassFilter === 'all' || m.gradeClass === ordersClassFilter;
      const matchesType = statusFilter === 'all' || m.courseType === statusFilter;
      return matchesSearch && matchesClass && matchesType;
    });

    const handleCreateMaterial = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createMaterial(newMaterial);
        showToast('Study Material uploaded successfully! 📚');
        setNewMaterial({
          fileName: '',
          fileSize: '1.0M',
          gradeClass: 'Class 6',
          courseType: 'booster',
          fileUrl: '',
          chapter: '',
          topic: ''
        });
        loadMaterials();
      } catch (err: any) {
        showToast('Failed to upload material: ' + err.message, 'error');
      }
    };

    const handleDeleteMaterial = async (id: string) => {
      if (!confirm('Are you sure you want to delete this study material file?')) return;
      try {
        await deleteMaterial(id);
        showToast('Material deleted.');
        loadMaterials();
      } catch (err: any) {
        showToast('Failed to delete: ' + err.message, 'error');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>Study Materials &amp; Notes CRUD</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Upload notes, homework files, and modular textbooks for students to download.
            </p>
          </div>
          <button type="button" onClick={loadMaterials} className="save-btn" style={{ padding: '8px 16px', fontSize: '12px' }} disabled={materialsLoading}>
            {materialsLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </header>

        {/* CRUD Form */}
        <div className="card">
          <h2 style={{ fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            ➕ Upload Study Material PDF / Note File
          </h2>
          <form onSubmit={handleCreateMaterial} className="form-grid" style={{ gap: '15px' }}>
            <div className="form-group">
              <label>Chapter Name / Chapter Number</label>
              <input 
                type="text" 
                required
                value={newMaterial.chapter} 
                onChange={(e) => setNewMaterial({...newMaterial, chapter: e.target.value})} 
                placeholder="e.g. Chapter 1: Integers"
              />
            </div>
            <div className="form-group">
              <label>Topic Name</label>
              <input 
                type="text" 
                required
                value={newMaterial.topic} 
                onChange={(e) => setNewMaterial({...newMaterial, topic: e.target.value})} 
                placeholder="e.g. Introduction to Negative Numbers"
              />
            </div>

            <div className="form-group span-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
              <label>Select PDF / Notes File to Upload</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label className="image-upload-btn-label" style={{ padding: '10px 20px', background: '#00B6A6', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'inline-block', textAlign: 'center', margin: 0 }}>
                  {isUploadingMaterial ? 'Uploading File...' : '📁 Select & Upload PDF/Notes File'}
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.ppt,.pptx"
                  onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingMaterial(true);
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const base64 = (reader.result as string).split(',')[1];
                          const url = await uploadFile(base64, file.name);
                          setNewMaterial(prev => ({
                            ...prev,
                            fileName: file.name,
                            fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                            fileUrl: url
                          }));
                        } catch (err: any) {
                          alert('Upload failed: ' + err.message);
                        } finally {
                          setIsUploadingMaterial(false);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    style={{ display: 'none' }}
                    disabled={isUploadingMaterial}
                  />
                </label>
                {newMaterial.fileUrl && (
                  <span style={{ fontSize: '13px', color: '#10B981', fontWeight: 600 }}>✓ File Uploaded: {newMaterial.fileName}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>File Name (Review / Edit)</label>
              <input 
                type="text" 
                required
                value={newMaterial.fileName} 
                onChange={(e) => setNewMaterial({...newMaterial, fileName: e.target.value})} 
                placeholder="e.g. [E-Module]Motion.pdf"
              />
            </div>
            <div className="form-group">
              <label>File Size (Display string)</label>
              <input 
                type="text" 
                required
                value={newMaterial.fileSize} 
                onChange={(e) => setNewMaterial({...newMaterial, fileSize: e.target.value})} 
                placeholder="e.g. 1.6M or 900K"
              />
            </div>
            <div className="form-group">
              <label>Grade Class</label>
              <select 
                value={newMaterial.gradeClass} 
                onChange={(e) => setNewMaterial({...newMaterial, gradeClass: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                  <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Course Type</label>
              <select 
                value={newMaterial.courseType} 
                onChange={(e) => setNewMaterial({...newMaterial, courseType: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="booster">Booster Course (6 Days)</option>
                <option value="master">Long-term Master Program</option>
              </select>
            </div>
            <div className="form-group span-2">
              <label>File Resource URL (Review / Edit)</label>
              <input 
                type="text" 
                value={newMaterial.fileUrl} 
                onChange={(e) => setNewMaterial({...newMaterial, fileUrl: e.target.value})} 
                placeholder="e.g. https://domain.com/notes.pdf"
              />
            </div>
            <div className="form-group span-2" style={{ marginTop: '10px' }}>
              <button type="submit" className="save-btn" style={{ width: '100%', padding: '12px' }} disabled={isUploadingMaterial}>
                {isUploadingMaterial ? 'Uploading File...' : '➕ Register Study Material PDF'}
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="search-container" style={{ marginTop: '10px' }}>
          <div className="search-input-wrap">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search materials by file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={ordersClassFilter} 
            onChange={(e) => setOrdersClassFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
            ))}
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Types</option>
            <option value="booster">Booster Course Only</option>
            <option value="master">Master Program Only</option>
          </select>
        </div>

        {/* List View */}
        <div className="table-wrap">
          {materialsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading materials...</div>
          ) : filteredMaterials.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No study materials found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Grade Class</th>
                  <th>Course Type</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 650, color: 'white' }}>{item.fileName}</td>
                    <td style={{ fontSize: '12px', color: '#FF5E00', fontWeight: 600 }}>{item.fileSize}</td>
                    <td style={{ fontSize: '12px' }}>{item.gradeClass}</td>
                    <td style={{ fontSize: '11px', textTransform: 'capitalize', color: '#00B6A6', fontWeight: 500 }}>{item.courseType}</td>
                    <td style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteMaterial(item._id)}
                        className="action-btn"
                        style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', fontSize: '11.5px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const handleSaveWelcomeTest = async () => {
    setWtSaving(true);
    try {
      await saveWelcomeTest(selectedClass, {
        questions: wtQuestions,
        durationMinutes: wtDuration
      });
      showToast('Welcome Test updated successfully! ✨', 'success');
      loadWelcomeTestConfig(selectedClass);
    } catch (err: any) {
      showToast('Failed to save welcome test: ' + err.message, 'error');
    } finally {
      setWtSaving(false);
    }
  };

  const handleDeleteWelcomeTest = async () => {
    if (!window.confirm(`Are you sure you want to delete the Welcome Test for ${selectedClass}?`)) return;
    setWtSaving(true);
    try {
      await deleteWelcomeTest(selectedClass);
      showToast('Welcome Test deleted successfully! 🗑️', 'success');
      loadWelcomeTestConfig(selectedClass);
    } catch (err: any) {
      showToast('Failed to delete welcome test: ' + err.message, 'error');
    } finally {
      setWtSaving(false);
    }
  };

  const renderWelcomeTestPanel = () => {
    const demoStudents = students.filter((s: any) =>
      s.enrollmentType === 'demo' || s.welcomeTestStatus === 'pending' || s.welcomeTestStatus === 'completed'
    );

    const filtered = demoStudents.filter((s: any) =>
      s.name?.toLowerCase().includes(wtSearch.toLowerCase()) ||
      s.phone?.includes(wtSearch) ||
      s.selectedClass?.toLowerCase().includes(wtSearch.toLowerCase())
    );

    const pendingCount = demoStudents.filter((s: any) => s.welcomeTestStatus !== 'completed').length;
    const completedCount = demoStudents.filter((s: any) => s.welcomeTestStatus === 'completed').length;

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>🎯 Welcome Test Performance Tracker</h1>
          <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
            Monitor dynamic diagnostic test results and scores for all enrolled demo class students.
          </p>
        </header>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Demo Students', value: demoStudents.length, color: '#00B6A6' },
            { label: 'Pending Completion', value: pendingCount, color: '#F59E0B' },
            { label: 'Completed Result', value: completedCount, color: '#10B981' }
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, minWidth: '140px', background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '8px' }}>
          <input
            type="text"
            placeholder="Search demo students by name, phone, or class..."
            value={wtSearch}
            onChange={(e) => setWtSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#1E293B', color: 'white', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        {studentsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading student results...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '14px' }}>No demo class student results found.</div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0F172A', color: '#94A3B8', textAlign: 'left' }}>
                  {['Student', 'Phone', 'Grade Class', 'Status', 'Score', 'Grade', 'Submitted At'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any, idx: number) => {
                  const result = s.welcomeTestResult;
                  const score = result?.score ?? null;
                  const total = result?.totalQuestions ?? 10;
                  const grade = score !== null ? (score / total >= 0.9 ? 'A' : score / total >= 0.8 ? 'B' : score / total >= 0.6 ? 'C' : score / total >= 0.4 ? 'D' : 'E') : '—';
                  const isDone = s.welcomeTestStatus === 'completed';
                  return (
                    <tr key={s._id || idx} style={{ borderTop: '1px solid #334155', color: 'white' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name || 'Unknown'}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{s.phone}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{s.selectedClass || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: isDone ? '#D1FAE5' : '#FEF3C7', color: isDone ? '#059669' : '#D97706', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                          {isDone ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: score !== null ? '#00B6A6' : '#64748B' }}>
                        {score !== null ? `${score}/${total}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E2E8F0' }}>{grade}</td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '12px' }}>
                        {result?.submittedAt ? new Date(result.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading && activeTab === 'config') {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0F172A', color: 'white' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 500 }}>Fetching grade configuration...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar" style={{ display: (isSidebarCollapsed && activeControlSchedule) ? 'none' : 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span style={{ background: '#00B6A6', color: 'white', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', fontSize: '13px' }}>ODA</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Class Manager</span>
        </div>

        {/* Sidebar Tabs Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', width: '100%' }}>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            🏠 Grade Manager
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'teacher_desk' ? 'active' : ''}`}
            onClick={() => setActiveTab('teacher_desk')}
          >
            🎥 Teacher Live Desk
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Live Orders &amp; Tracker
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👥 Enrolled Students
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'schedules' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedules')}
          >
            📅 Class Scheduling
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            📚 Study Materials
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'hw_reports' ? 'active' : ''}`}
            onClick={async () => { setActiveTab('hw_reports'); await loadHwReports(); }}
          >
            📊 HW Reports
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'welcome_test' ? 'active' : ''}`}
            onClick={() => setActiveTab('welcome_test')}
          >
            🎯 Welcome Test
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'test_reports' ? 'active' : ''}`}
            onClick={async () => { setActiveTab('test_reports'); await loadTestReports(); }}
          >
            📊 Test Reports &amp; Analytics
          </button>
        </div>

        {activeTab === 'config' && (
          <>
            <label style={{ fontSize: '10px', color: '#94A3B8' }}>Current Grade</label>
            <select 
              className="class-select-dropdown" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
                <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
              ))}
            </select>
          </>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ color: '#94A3B8', fontSize: '11px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          Oda Admin v2.0 (React)
        </div>
      </div>

      {/* Main Form content */}
      <div className="main-content">
        {activeControlSchedule ? (
          renderLiveControlCenter()
        ) : activeTab === 'teacher_desk' ? (
          renderTeacherDesk()
        ) : activeTab === 'orders' ? (
          renderOrdersTracker()
        ) : activeTab === 'students' ? (
          renderStudentsTracker()
        ) : activeTab === 'schedules' ? (
          renderSchedulesManager()
        ) : activeTab === 'materials' ? (
          renderMaterialsManager()
        ) : activeTab === 'hw_reports' ? (
          renderHwReports()
        ) : activeTab === 'welcome_test' ? (
          renderWelcomeTestPanel()
        ) : activeTab === 'test_reports' ? (
          renderTestReports()
        ) : (
          <>
            <header>
              <h1>Configure Details — {selectedClass}</h1>
              <button type="button" className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </header>

            {config && (
              <form className="editor-wrap" onSubmit={handleSave}>
            
            {/* ========================================== SECTION 1: HOME PAGE GENERAL ========================================== */}
            <FormSection title="1. Dashboard Banner & General Details" icon="🏠">
              <span className="section-label">Banner Alert</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Marketing Subtitle Banner Text</label>
                  <input 
                    type="text" 
                    value={config.bannerText || ''} 
                    onChange={(e) => setRootField('bannerText', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Upcoming Class Details</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Upcoming Lecture Title</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.title || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.subject || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'subject', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Time / Day Label</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.time || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'time', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Teacher Name</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.teacherName || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'teacherName', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <ImageField 
                    label="Teacher Photo avatar" 
                    value={config.upcomingClass?.teacherAvatar || ''} 
                    onChange={(url) => setNestedField('upcomingClass', 'teacherAvatar', url)} 
                  />
                </div>
              </div>

              <span className="section-label">Teachers Profiles (3 Cards on Home Screen)</span>
              <div>
                {(config.teachers || []).map((t: any, idx: number) => (
                  <div key={idx} className="teacher-item-block">
                    <span className="teacher-item-header">Teacher Card {idx + 1}</span>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Name</label>
                        <input 
                          type="text" 
                          value={t.name || ''} 
                          onChange={(e) => setTeacherField(idx, 'name', e.target.value)} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Expert Role Label</label>
                        <input 
                          type="text" 
                          value={t.role || ''} 
                          onChange={(e) => setTeacherField(idx, 'role', e.target.value)} 
                        />
                      </div>
                      <div className="form-group span-2">
                        <ImageField 
                          label="Avatar URL/File" 
                          value={t.avatar || ''} 
                          onChange={(url) => setTeacherField(idx, 'avatar', url)} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* ========================================== SECTION 2: BOOSTER DETAILS ========================================== */}
            <FormSection title="2. 6-Day Booster Details Page Config" icon="🚀">
              <span className="section-label">Hero Banner Info</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Header Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.headerTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'headerTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Header Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.headerSubtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'headerSubtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Card Title (Beige card overlay)</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.cardTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'cardTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Main Title Description</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Hero Chip Text</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.heroChipText || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'heroChipText', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Parents Badge Choice Label</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.parentsBadgeText || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'parentsBadgeText', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Hero Top Banner Image" 
                    value={config.boosterCourse?.heroBannerImage || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'heroBannerImage', url)} 
                  />
                </div>
              </div>

              <span className="section-label">Highlights Bullet Points</span>
              <div className="form-grid">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="form-group">
                    <label>Bullet Point Highlight {idx + 1}</label>
                    <input 
                      type="text" 
                      value={(config.boosterCourse?.bullets || [])[idx] || ''} 
                      onChange={(e) => setBulletField('boosterCourse', idx, e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              <span className="section-label">Customer Reviews Section</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Review Header Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.reviewSectionTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'reviewSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Reviewer 1 — Name</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review1Name || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review1Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Reviewer 1 — Date</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review1Date || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review1Date', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Reviewer 1 — Review content</label>
                  <textarea 
                    value={config.boosterCourse?.review1Text || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review1Text', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Reviewer 1 — Avatar Photo" 
                    value={config.boosterCourse?.review1Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'review1Avatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Reviewer 2 — Name</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review2Name || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review2Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Reviewer 2 — Date</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review2Date || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review2Date', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Reviewer 2 — Review content</label>
                  <textarea 
                    value={config.boosterCourse?.review2Text || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review2Text', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Reviewer 2 — Avatar Photo" 
                    value={config.boosterCourse?.review2Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'review2Avatar', url)} 
                  />
                </div>
              </div>

              <span className="section-label">Score 100% Score Grid</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Grid Section Header</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.score100Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'score100Title', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Grid Header Subjects Highlight Description</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.subjectsLine || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'subjectsLine', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 1 — Badge (e.g. Secret of 83%)</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid1Badge || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid1Badge', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 1 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid1Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid1Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 2 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid2Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid2Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 2 — Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid2Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid2Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 3 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid3Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid3Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 3 — Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid3Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid3Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 4 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid4Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid4Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 4 — Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid4Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid4Subtitle', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Interactive Live Section</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Live Section Main Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.liveSectionTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'liveSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Dual Teacher - Master Teacher Avatar" 
                    value={config.boosterCourse?.teacher1Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacher1Avatar', url)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Dual Teacher - Mentor Teacher Avatar" 
                    value={config.boosterCourse?.teacher2Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacher2Avatar', url)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Dual Teacher - Student avatar" 
                    value={config.boosterCourse?.teacher3Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacher3Avatar', url)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Teacher Video Box preview photo" 
                    value={config.boosterCourse?.teacherCardImage || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacherCardImage', url)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Trust Feature 1 Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric1Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric1Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 1 Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric1Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric1Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 2 Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric2Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric2Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 2 Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric2Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric2Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 3 Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric3Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric3Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 3 Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric3Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric3Subtitle', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Pricing details</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Booster Offer Price (INR)</label>
                  <input 
                    type="number" 
                    value={config.boosterCourse?.price || 0} 
                    onChange={(e) => setNestedField('boosterCourse', 'price', Number(e.target.value))} 
                  />
                </div>
                <div className="form-group">
                  <label>Booster Original Price (INR)</label>
                  <input 
                    type="number" 
                    value={config.boosterCourse?.originalPrice || 0} 
                    onChange={(e) => setNestedField('boosterCourse', 'originalPrice', Number(e.target.value))} 
                  />
                </div>
              </div>
            </FormSection>

            {/* ========================================== SECTION 3: MASTER DETAILS ========================================== */}
            <FormSection title="3. Long-term Master Program Config" icon="🎯">
              <span className="section-label">Hero Section</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Master Screen Header Title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.headerTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'headerTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Master Screen Header Subtitle</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.headerSubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'headerSubtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Program Headline Title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.title || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Beige card Subjects Label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.subjectsCardLabel || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'subjectsCardLabel', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Beige card Subjects Text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.subjectsCardText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'subjectsCardText', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Metric Course Count Text (e.g. 400+ Courses)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.metricCourses || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'metricCourses', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Metric Concepts Count Text (e.g. 200+ Concepts)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.metricConcepts || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'metricConcepts', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Metric Quiz Count Text (e.g. 5000+ Quizzes)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.metricQuizzes || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'metricQuizzes', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Schedule Text label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.scheduleText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'scheduleText', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Subject Pills Row Text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.subjectPillText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'subjectPillText', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Academic Highlights Bullet Points</span>
              <div className="form-grid">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="form-group">
                    <label>Highlight Bullet point {idx + 1}</label>
                    <input 
                      type="text" 
                      value={(config.masterProgram?.bullets || [])[idx] || ''} 
                      onChange={(e) => setBulletField('masterProgram', idx, e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              <span className="section-label">Course Outline Syllabus</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Outline Subtitle Description</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.outlineSubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'outlineSubtitle', e.target.value)} 
                  />
                </div>
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="form-group span-2">
                    <label>Outline Block {idx + 1} Title and Details</label>
                    <input 
                      type="text" 
                      value={(config.masterProgram?.outline || [])[idx] || ''} 
                      onChange={(e) => setOutlineField(idx, e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              <span className="section-label">User Ratings & Testimonial review</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ratings section header text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingsTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingsTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Total ratings count indicator</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingsCount || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingsCount', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Rating Score (e.g. 4.7)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingScore || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingScore', e.target.value)} 
                  />
                </div>
                <div className="form-group"></div>
                
                <div className="form-group">
                  <label>Rating tag chip 1 text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingChip1 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingChip1', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Rating tag chip 2 text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingChip2 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingChip2', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Rating tag chip 3 text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingChip3 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingChip3', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Testimonial Reviewer Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.testimonialName || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialName', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Testimonial Date Label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.testimonialDate || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialDate', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Testimonial Text block</label>
                  <textarea 
                    value={config.masterProgram?.testimonialText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialText', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Testimonial Course/Session topic Tag</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.testimonialSessionTag || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialSessionTag', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Testimonial Badge pill tag 1</label>
                  <input 
                    type="text" 
                    value={(config.masterProgram?.testimonialTags || [])[0] || ''} 
                    onChange={(e) => setTestimonialTagField(0, e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Testimonial Badge pill tag 2</label>
                  <input 
                    type="text" 
                    value={(config.masterProgram?.testimonialTags || [])[1] || ''} 
                    onChange={(e) => setTestimonialTagField(1, e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Testimonial Badge pill tag 3</label>
                  <input 
                    type="text" 
                    value={(config.masterProgram?.testimonialTags || [])[2] || ''} 
                    onChange={(e) => setTestimonialTagField(2, e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Faculty Spotlight & Team</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Faculty Section Header</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.facultyTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'facultyTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Faculty Subtitle description</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.facultySubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'facultySubtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Featured Teacher Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.featuredTeacherName || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'featuredTeacherName', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Featured Teacher Role Label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.featuredTeacherRole || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'featuredTeacherRole', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Featured Teacher Rating score indicator</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.featuredTeacherRating || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'featuredTeacherRating', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <ImageField 
                    label="Featured Teacher Photo" 
                    value={config.masterProgram?.featuredTeacherAvatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'featuredTeacherAvatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Team Overview section title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.teamSectionTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'teamSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group"></div>
                <div className="form-group">
                  <label>Team highlight Badge pill 1</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.teamBadge1 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'teamBadge1', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Team highlight Badge pill 2</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.teamBadge2 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'teamBadge2', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Student Success Results & Feedbacks</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Results section header title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.resultsSectionTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'resultsSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Results section subtitle description</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.resultsSectionSubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'resultsSectionSubtitle', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Success Student 1 — Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult1Name || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult1Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Success Student 1 — Score Increase percentage</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult1Pct || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult1Pct', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Success Student 1 — Photo" 
                    value={config.masterProgram?.studentResult1Avatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'studentResult1Avatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Success Student 2 — Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult2Name || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult2Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Success Student 2 — Score Increase percentage</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult2Pct || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult2Pct', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Success Student 2 — Photo" 
                    value={config.masterProgram?.studentResult2Avatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'studentResult2Avatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Success Student 3 — Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult3Name || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult3Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Success Student 3 — Score Increase percentage</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult3Pct || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult3Pct', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Success Student 3 — Photo" 
                    value={config.masterProgram?.studentResult3Avatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'studentResult3Avatar', url)} 
                  />
                </div>

                <div className="form-group span-2">
                  <label>Chat feedback text block 1</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.chatBubble1 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'chatBubble1', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Chat feedback text block 2</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.chatBubble2 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'chatBubble2', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Chat feedback text block 3</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.chatBubble3 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'chatBubble3', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Trust Count Verified metrics</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Trust Score/Number metric (e.g. 20,103,026)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.trustNumber || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'trustNumber', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Tag label text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.trustLabel || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'trustLabel', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Pricing details</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Master Program Tuition Fee (INR)</label>
                  <input 
                    type="number" 
                    value={config.masterProgram?.price || 0} 
                    onChange={(e) => setNestedField('masterProgram', 'price', Number(e.target.value))} 
                  />
                </div>
              </div>
            </FormSection>

            {/* ========================================== SECTION 4: WELCOME TEST CONFIG ========================================== */}
            <FormSection title="4. Dynamic Welcome Test Config (Class-wise)" icon="🎯" isOpenDefault={false}>
              <span className="section-label">Duration & Questions Config</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'white' }}>Test Duration</span>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>Set the duration limit of the welcome test in minutes.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={wtDuration}
                      onChange={(e) => setWtDuration(Math.max(1, Number(e.target.value)))}
                      style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0F172A', color: 'white', textAlign: 'center', fontWeight: 'bold' }}
                    />
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>mins</span>
                  </div>
                </div>

                {wtLoading ? (
                  <div style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '10px' }}>Loading Class Welcome Test...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {wtQuestions.map((q, qIdx) => (
                      <div key={qIdx} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#00B6A6' }}>Question {qIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...wtQuestions];
                              updated.splice(qIdx, 1);
                              setWtQuestions(updated);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 650, cursor: 'pointer' }}
                          >
                            🗑️ Remove Question
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Question Text</label>
                          <input
                            type="text"
                            value={q.text || ''}
                            onChange={(e) => {
                              const updated = [...wtQuestions];
                              updated[qIdx] = { ...updated[qIdx], text: e.target.value };
                              setWtQuestions(updated);
                            }}
                            placeholder="Enter the question text..."
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0F172A', color: 'white', fontSize: '13px' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          {(['A', 'B', 'C', 'D'] as const).map(optKey => (
                            <div key={optKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Option {optKey}</label>
                              <input
                                type="text"
                                value={q.options?.[optKey] || ''}
                                onChange={(e) => {
                                  const updated = [...wtQuestions];
                                  const newOpts = { ...(updated[qIdx].options || {}) };
                                  newOpts[optKey] = e.target.value;
                                  updated[qIdx] = { ...updated[qIdx], options: newOpts };
                                  setWtQuestions(updated);
                                }}
                                placeholder={`Option ${optKey}`}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0F172A', color: 'white', fontSize: '13px' }}
                              />
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '200px' }}>
                          <label style={{ fontSize: '11.5px', color: '#94A3B8' }}>Correct Option</label>
                          <select
                            value={q.correct || q.correctAnswer || 'A'}
                            onChange={(e) => {
                              const updated = [...wtQuestions];
                              updated[qIdx] = { ...updated[qIdx], correct: e.target.value };
                              setWtQuestions(updated);
                            }}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0F172A', color: 'white', fontSize: '13px', fontWeight: 'bold' }}
                          >
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setWtQuestions([
                          ...wtQuestions,
                          { text: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A' }
                        ]);
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px dashed #475569',
                        background: 'transparent',
                        color: '#94A3B8',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Add Question
                    </button>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSaveWelcomeTest}
                    disabled={wtSaving || wtLoading}
                    style={{
                      background: '#00B6A6',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {wtSaving ? 'Saving...' : '💾 Save Welcome Test Questions'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteWelcomeTest}
                    disabled={wtSaving || wtLoading}
                    style={{
                      background: 'transparent',
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Delete Welcome Test
                  </button>
                </div>
              </div>
            </FormSection>

            {/* Bottom Actions Row */}
            <div className="btn-row" style={{ marginTop: '20px', paddingBottom: '50px' }}>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving changes...' : '💾 Save All Configurations'}
              </button>
            </div>
          </form>
        )}
          </>
        )}

        {/* Global Toast component */}
        {toast && (
          <div className={`toast active ${toastType === 'error' ? 'error' : ''}`}>
            <div className="toast-dot"></div>
            <span>{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
