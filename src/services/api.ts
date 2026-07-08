// ─────────────────────────────────────────────────────────────────
//  api.ts  —  Frontend API service
//  All backend calls go through here. Never call fetch() directly
//  from screens — keep API logic in one place.
// ─────────────────────────────────────────────────────────────────

// ⚙️  Change this to your server IP when testing on a real device.
//     localhost works on web and iOS simulator.
//     For Android emulator use: http://10.0.2.2:3001
//     For physical device: http://<YOUR_PC_IP>:3001
const BASE_URL = 'http://localhost:3001';

export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  
  if (!path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:image')) {
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  if (path.includes('localhost:3001') || path.includes('127.0.0.1:3001')) {
    const parts = path.split('/uploads/');
    if (parts.length > 1) {
      return `${BASE_URL}/uploads/${parts[1]}`;
    }
  }

  return path;
}


// ─── Generic fetch wrapper ────────────────────────────────────────
async function apiCall<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, any>
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

// ─── AUTH ────────────────────────────────────────────────────────

/**
 * Sends a 6-digit OTP via SMS to the given phone number.
 * In dev mode the OTP is printed to the backend console.
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; devMode?: boolean; message?: string }> {
  return apiCall('POST', '/api/auth/send-otp', { phone });
}

/**
 * Verifies the OTP. On success returns the student record.
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; student?: StudentProfile; error?: string }> {
  return apiCall('POST', '/api/auth/verify-otp', { phone, code });
}

// ─── STUDENTS ────────────────────────────────────────────────────

export interface StudentProfile {
  _id: string;
  name: string;
  phone: string;
  selectedClass: string;
  profilePhoto?: string | null;
  email?: string | null;
  altPhone?: string | null;
  board?: string | null;
  state?: string | null;
  address?: string | null;
  enrollmentType?: 'none' | 'demo' | 'master';
}

export interface Teacher {
  name: string;
  role: string;
  avatar: string;
}

export interface UpcomingClass {
  title: string;
  subject: string;
  time: string;
  teacherName: string;
  teacherAvatar: string;
}

export interface BoosterConfig {
  headerTitle: string;
  headerSubtitle: string;
  cardTitle: string;
  title: string;
  subjects: string[];
  heroChipText?: string;
  parentsBadgeText?: string;
  bullets?: string[];
  reviewSectionTitle?: string;
  review1Name?: string;
  review1Date?: string;
  review1Text?: string;
  review2Name?: string;
  review2Date?: string;
  review2Text?: string;
  score100Title?: string;
  subjectsLine?: string;
  grid1Badge?: string;
  grid1Title?: string;
  grid2Title?: string;
  grid2Subtitle?: string;
  grid3Title?: string;
  grid3Subtitle?: string;
  grid4Title?: string;
  grid4Subtitle?: string;
  liveSectionTitle?: string;
  trustMetric1Title?: string;
  trustMetric1Subtitle?: string;
  trustMetric2Title?: string;
  trustMetric2Subtitle?: string;
  trustMetric3Title?: string;
  trustMetric3Subtitle?: string;
  review1Avatar?: string;
  review2Avatar?: string;
  heroBannerImage?: string;
  teacherCardImage?: string;
  teacher1Name?: string;
  teacher1Avatar?: string;
  teacher2Avatar?: string;
  teacher3Avatar?: string;
  price: number;
  originalPrice: number;
}

export interface MasterConfig {
  headerTitle: string;
  headerSubtitle: string;
  title: string;
  bullets: string[];
  subjectsCardLabel?: string;
  subjectsCardText?: string;
  metricCourses?: string;
  metricConcepts?: string;
  metricQuizzes?: string;
  scheduleText?: string;
  subjectPillText?: string;
  outline?: string[];
  outlineSubtitle?: string;
  ratingsTitle?: string;
  ratingsCount?: string;
  ratingScore?: string;
  ratingChip1?: string;
  ratingChip2?: string;
  ratingChip3?: string;
  testimonialName?: string;
  testimonialDate?: string;
  testimonialText?: string;
  testimonialSessionTag?: string;
  testimonialTags?: string[];
  facultyTitle?: string;
  facultySubtitle?: string;
  featuredTeacherName?: string;
  featuredTeacherRole?: string;
  featuredTeacherRating?: string;
  featuredTeacherAvatar?: string;
  teamSectionTitle?: string;
  teamBadge1?: string;
  teamBadge2?: string;
  resultsSectionTitle?: string;
  resultsSectionSubtitle?: string;
  studentResult1Name?: string;
  studentResult1Pct?: string;
  studentResult1Avatar?: string;
  studentResult2Name?: string;
  studentResult2Pct?: string;
  studentResult2Avatar?: string;
  studentResult3Name?: string;
  studentResult3Pct?: string;
  studentResult3Avatar?: string;
  chatBubble1?: string;
  chatBubble2?: string;
  chatBubble3?: string;
  trustNumber?: string;
  trustLabel?: string;
  price: number;
}

export interface HomepageConfig {
  _id?: string;
  classId: string;
  bannerText: string;
  teachers: Teacher[];
  upcomingClass: UpcomingClass;
  boosterCourse: BoosterConfig;
  masterProgram: MasterConfig;
}

export async function getHomepageConfig(classId: string): Promise<{ success: boolean; data: HomepageConfig }> {
  return apiCall('GET', `/api/homepage-configs/${classId}`);
}

export async function updateHomepageConfig(classId: string, config: Partial<HomepageConfig>): Promise<{ success: boolean; data: HomepageConfig }> {
  return apiCall('PUT', `/api/homepage-configs/${classId}`, config);
}

export async function getStudentByPhone(phone: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('GET', `/api/students/phone/${phone}`);
}

export async function updateStudent(
  id: string,
  updates: Partial<StudentProfile>
): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}`, updates);
}

export async function updateStudentName(id: string, name: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}/name`, { name });
}

export async function updateStudentEmail(id: string, email: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}/email`, { email });
}

export async function updateStudentAltPhone(id: string, altPhone: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}/alt-phone`, { altPhone });
}

export async function updateStudentBoard(id: string, board: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}/board`, { board });
}

export async function updateStudentState(id: string, state: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}/state`, { state });
}

export async function updateStudentAddress(id: string, address: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}/address`, { address });
}

export async function updateStudentClass(id: string, selectedClass: string): Promise<{ success: boolean; data: StudentProfile }> {
  return apiCall('PUT', `/api/students/${id}/class`, { selectedClass });
}


export async function uploadAvatar(
  id: string,
  base64: string
): Promise<{ success: boolean; avatarUrl: string; data: StudentProfile }> {
  return apiCall('POST', `/api/students/${id}/upload-avatar`, { base64 });
}

// ─── ORDERS ──────────────────────────────────────────────────────
export interface OrderItem {
  _id: string;
  studentPhone: string;
  courseTitle: string;
  classInfo: string;
  amount: string;
  couponDiscount: string | number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export async function getOrdersByPhone(phone: string): Promise<{ success: boolean; data: OrderItem[] }> {
  return apiCall('GET', `/api/orders/${phone}`);
}

export async function createOrder(
  order: Omit<OrderItem, '_id' | 'createdAt'>
): Promise<{ success: boolean; data: OrderItem }> {
  return apiCall('POST', '/api/orders', order);
}

export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'paid'
): Promise<{ success: boolean; message: string }> {
  return apiCall('PUT', `/api/orders/${id}`, { status });
}

// ─── HEALTH ──────────────────────────────────────────────────────
export async function healthCheck(): Promise<{ status: string }> {
  return apiCall('GET', '/health');
}
