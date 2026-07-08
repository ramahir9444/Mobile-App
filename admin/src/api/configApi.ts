const API_BASE = window.location.port === '5173' || window.location.port === '5174' ? 'http://localhost:3001' : '';

export async function fetchHomepageConfig(classId: string) {
  const res = await fetch(`${API_BASE}/api/homepage-configs/${encodeURIComponent(classId)}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch config');
  return json.data;
}

export async function saveHomepageConfig(classId: string, data: any) {
  const res = await fetch(`${API_BASE}/api/homepage-configs/${encodeURIComponent(classId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save config');
  return json.data;
}

export async function uploadImage(base64: string) {
  const res = await fetch(`${API_BASE}/api/homepage-configs/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64 })
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Upload failed');
  return json.url; // Returns e.g. '/uploads/image-xxx.png'
}

export async function fetchOrders() {
  const res = await fetch(`${API_BASE}/api/orders`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch orders');
  return json.data;
}

export async function fetchStudents() {
  const res = await fetch(`${API_BASE}/api/students`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch students');
  return json.data;
}
