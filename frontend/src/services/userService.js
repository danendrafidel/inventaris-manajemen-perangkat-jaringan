import { API_BASE } from "../constants";

async function handleResponse(response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (!response.ok) throw new Error(data.message || "Permintaan gagal");
    return data;
  } catch (e) {
    throw new Error("Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.");
  }
}

export async function fetchAllUsers() {
  const response = await fetch(`${API_BASE}/api/users`);
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Gagal memuat data user');
  return data.data;
}

export async function createUser(userData) {
  // backend expects area_id instead of area
  const response = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Gagal membuat user');
  return data.data;
}

export async function updateUser(id, userData) {
  // backend expects area_id instead of area
  const response = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Gagal memperbarui user');
  return data.data;
}

export async function changeUserPassword(id, password) {
  const response = await fetch(`${API_BASE}/api/users/${id}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Gagal mengganti password');
  return data.data;
}

export async function toggleUserStatus(id) {
  const response = await fetch(`${API_BASE}/api/users/${id}/status`, {
    method: 'PATCH',
  });
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Gagal mengubah status user');
  return data.data;
}

export async function fetchProfile(id) {
  const response = await fetch(`${API_BASE}/api/profile/${id}`);
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Gagal memuat profil');
  return data.data;
}

export async function updateProfile(id, profileData) {
  // backend expects area_id instead of area
  const response = await fetch(`${API_BASE}/api/profile/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Gagal memperbarui profil');
  return data.data;
}
