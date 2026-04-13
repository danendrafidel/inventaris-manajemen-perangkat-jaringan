import { API_BASE } from "../constants";

export async function fetchAllUsers() {
  const response = await fetch(`${API_BASE}/api/users`);
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memuat user');
  return data.data;
}

export async function createUser(userData) {
  const response = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal membuat user');
  return data.data;
}

export async function updateUser(id, userData) {
  const response = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui user');
  return data.data;
}

export async function changeUserPassword(id, password) {
  const response = await fetch(`${API_BASE}/api/users/${id}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal mengganti password');
  return data.data;
}

export async function toggleUserStatus(id) {
  const response = await fetch(`${API_BASE}/api/users/${id}/status`, {
    method: 'PATCH',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal mengubah status');
  return data.data;
}

export async function fetchProfile(id) {
  const response = await fetch(`${API_BASE}/api/profile/${id}`);
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memuat profil');
  return data.data;
}

export async function updateProfile(id, profileData) {
  const response = await fetch(`${API_BASE}/api/profile/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui profil');
  return data.data;
}
