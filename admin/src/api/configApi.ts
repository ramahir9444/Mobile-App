const API_BASE = window.location.port && window.location.port !== '3001' ? 'http://localhost:3001' : '';

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
  return json.url;
}

export async function uploadFile(base64: string, filename: string) {
  const res = await fetch(`${API_BASE}/api/homepage-configs/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, filename })
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Upload failed');
  return json.url;
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

export async function fetchSchedules() {
  const res = await fetch(`${API_BASE}/api/schedules`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch schedules');
  return json.data;
}

export async function createSchedule(data: any) {
  const res = await fetch(`${API_BASE}/api/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create schedule');
  return json.data;
}

export async function updateSchedule(id: string, data: any) {
  const res = await fetch(`${API_BASE}/api/schedules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update schedule');
  return json.data;
}

export async function deleteSchedule(id: string) {
  const res = await fetch(`${API_BASE}/api/schedules/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete schedule');
  return json.data;
}

export async function fetchMaterials() {
  const res = await fetch(`${API_BASE}/api/materials`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch materials');
  return json.data;
}

export async function createMaterial(data: any) {
  const res = await fetch(`${API_BASE}/api/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create material');
  return json.data;
}

export async function deleteMaterial(id: string) {
  const res = await fetch(`${API_BASE}/api/materials/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete material');
  return json.data;
}
