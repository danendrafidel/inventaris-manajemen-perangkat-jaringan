import { API_BASE } from "../constants";

async function handleResponse(response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  } catch (e) {
    throw new Error("The server returned an unexpected response. Please try again later.");
  }
}

export async function fetchAllUsers() {
  const response = await fetch(`${API_BASE}/api/users`);
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Failed to load users');
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
  if (!data.success) throw new Error(data.message || 'Failed to create user');
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
  if (!data.success) throw new Error(data.message || 'Failed to update user');
  return data.data;
}

export async function changeUserPassword(id, password) {
  const response = await fetch(`${API_BASE}/api/users/${id}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Failed to change password');
  return data.data;
}

export async function toggleUserStatus(id) {
  const response = await fetch(`${API_BASE}/api/users/${id}/status`, {
    method: 'PATCH',
  });
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Failed to update user status');
  return data.data;
}

export async function fetchProfile(id) {
  const response = await fetch(`${API_BASE}/api/profile/${id}`);
  const data = await handleResponse(response);
  if (!data.success) throw new Error(data.message || 'Failed to load profile');
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
  if (!data.success) throw new Error(data.message || 'Failed to update profile');
  return data.data;
}
