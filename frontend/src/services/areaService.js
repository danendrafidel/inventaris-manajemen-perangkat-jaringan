import { API_BASE } from "../constants";

// DIVISION (Sebelumnya Witel)
export async function fetchAllDivisions() {
  const response = await fetch(`${API_BASE}/api/area/divisions`);
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memuat Divisi');
  return data.data;
}

export async function toggleDivisionStatus(id) {
  const response = await fetch(`${API_BASE}/api/area/divisions/${id}/status`, {
    method: 'PATCH',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal mengubah status Divisi');
  return data.data;
}

export async function createDivision(divisionData) {
  const response = await fetch(`${API_BASE}/api/area/divisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(divisionData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal membuat Divisi');
  return data.data;
}

export async function updateDivision(id, divisionData) {
  const response = await fetch(`${API_BASE}/api/area/divisions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(divisionData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui Divisi');
  return data.data;
}

export async function deleteDivision(id) {
  const response = await fetch(`${API_BASE}/api/area/divisions/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal menghapus Divisi');
  return data.data;
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
