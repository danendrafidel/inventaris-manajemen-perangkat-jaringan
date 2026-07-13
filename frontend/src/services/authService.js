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

const STORAGE_KEY = "auth-user";

export async function login(identity, password) {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identity, password }),
  });

  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Username/Email atau password salah");
  }

  return data.user;
}

export function getStoredUser() {
  const fromLocal = localStorage.getItem(STORAGE_KEY);
  if (fromLocal) {
    try {
      return JSON.parse(fromLocal);
    } catch {
      return null;
    }
  }
  const fromSession = sessionStorage.getItem(STORAGE_KEY);
  if (fromSession) {
    try {
      return JSON.parse(fromSession);
    } catch {
      return null;
    }
  }
  return null;
}

export function persistUser(user, remember = true) {
  const raw = JSON.stringify(user);
  localStorage.setItem(STORAGE_KEY, raw);
  sessionStorage.removeItem(STORAGE_KEY);
  if (remember) {
    localStorage.setItem(`${STORAGE_KEY}-remember`, "1");
  } else {
    localStorage.removeItem(`${STORAGE_KEY}-remember`);
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}-remember`);
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE}/api/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  return await handleResponse(response);
}

export async function resetPassword(token, newPassword) {
  const response = await fetch(`${API_BASE}/api/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });
  return await handleResponse(response);
}
