import { API_BASE } from "../constants";

async function readJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Response bukan JSON (mungkin endpoint tidak aktif). Cuplikan: ${text.slice(0, 60)}`
    );
  }
  return await response.json();
}

// AREA (Sebelumnya Kota)
export async function fetchAllAreas() {
  const response = await fetch(`${API_BASE}/api/area/areas`);
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memuat Area');
  return data.data;
}

export async function createArea(areaData) {
  const response = await fetch(`${API_BASE}/api/area/areas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(areaData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal membuat Area');
  return data.data;
}

export async function updateArea(id, areaData) {
  const response = await fetch(`${API_BASE}/api/area/areas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(areaData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui Area');
  return data.data;
}

export async function deleteArea(id) {
  const response = await fetch(`${API_BASE}/api/area/areas/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal menghapus Area');
  return data.data;
}

export async function toggleAreaStatus(id) {
  const response = await fetch(`${API_BASE}/api/area/areas/${id}/status`, {
    method: 'PATCH',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal mengubah status Area');
  return data.data;
}

// STO
export async function fetchAllStos() {
  const response = await fetch(`${API_BASE}/api/area/stos`);
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memuat STO');
  return data.data;
}

export async function toggleStoStatus(id) {
  const response = await fetch(`${API_BASE}/api/area/stos/${id}/status`, {
    method: 'PATCH',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal mengubah status STO');
  return data.data;
}

export async function createSto(stoData) {
  const response = await fetch(`${API_BASE}/api/area/stos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stoData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal membuat STO');
  return data.data;
}

export async function updateSto(id, stoData) {
  const response = await fetch(`${API_BASE}/api/area/stos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stoData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui STO');
  return data.data;
}

export async function deleteSto(id) {
  const response = await fetch(`${API_BASE}/api/area/stos/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal menghapus STO');
  return data.data;
}

// OFFICE (Kantor)
export async function fetchAllOffices() {
  const response = await fetch(`${API_BASE}/api/area/offices`);
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal mengambil data Kantor');
  return data.data;
}

export async function createOffice(payload) {
  const response = await fetch(`${API_BASE}/api/area/offices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal menambah Kantor');
  return data.data;
}

export async function updateOffice(id, payload) {
  const response = await fetch(`${API_BASE}/api/area/offices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui Kantor');
  return data.data;
}

export async function deleteOffice(id) {
  const response = await fetch(`${API_BASE}/api/area/offices/${id}`, {
    method: 'DELETE',
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal menghapus Kantor');
  return data.data;
}

export async function toggleOfficeStatus(id) {
  const response = await fetch(`${API_BASE}/api/area/offices/${id}/status`, {
    method: 'PATCH',
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal mengubah status Kantor');
  return data.data;
}
