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
    throw new Error(data.message || "Invalid credentials");
  }

  return data.user;
}

export function getStoredUser() {
  const fromSession = sessionStorage.getItem(STORAGE_KEY);
  if (fromSession) {
    try {
      return JSON.parse(fromSession);
    } catch {
      return null;
    }
  }
  const fromLocal = localStorage.getItem(STORAGE_KEY);
  if (fromLocal) {
    try {
      return JSON.parse(fromLocal);
    } catch {
      return null;
    }
  }
  return null;
}

export function persistUser(user, remember) {
  const raw = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(STORAGE_KEY, raw);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, raw);
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
