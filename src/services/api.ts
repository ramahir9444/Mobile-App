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

// ─── HEALTH ──────────────────────────────────────────────────────
export async function healthCheck(): Promise<{ status: string }> {
  return apiCall('GET', '/health');
}
