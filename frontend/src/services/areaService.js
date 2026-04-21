import { API_BASE } from "../constants";

async function readJsonSafe(response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  } catch (e) {
    throw new Error("The server returned an unexpected response. Please try again later.");
  }
}

// AREA (Sebelumnya Kota)
export async function fetchAllAreas() {
  const response = await fetch(`${API_BASE}/api/area/areas`);
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to load areas");
  return data.data;
}

export async function createArea(areaData) {
  const response = await fetch(`${API_BASE}/api/area/areas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(areaData),
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to create area");
  return data.data;
}

export async function updateArea(id, areaData) {
  const response = await fetch(`${API_BASE}/api/area/areas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(areaData),
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to update area");
  return data.data;
}

export async function deleteArea(id) {
  const response = await fetch(`${API_BASE}/api/area/areas/${id}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to delete area");
  return data.data;
}

export async function toggleAreaStatus(id) {
  const response = await fetch(`${API_BASE}/api/area/areas/${id}/status`, {
    method: "PATCH",
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to update area status");
  return data.data;
}

// STO
export async function fetchAllStos() {
  const response = await fetch(`${API_BASE}/api/area/stos`);
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to load STOs");
  return data.data;
}

export async function toggleStoStatus(id) {
  const response = await fetch(`${API_BASE}/api/area/stos/${id}/status`, {
    method: "PATCH",
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to update STO status");
  return data.data;
}

export async function createSto(stoData) {
  const response = await fetch(`${API_BASE}/api/area/stos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stoData),
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to create STO");
  return data.data;
}

export async function updateSto(id, stoData) {
  const response = await fetch(`${API_BASE}/api/area/stos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stoData),
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to update STO");
  return data.data;
}

export async function deleteSto(id) {
  const response = await fetch(`${API_BASE}/api/area/stos/${id}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to delete STO");
  return data.data;
}

// OFFICE (Kantor)
export async function fetchAllOffices() {
  const response = await fetch(`${API_BASE}/api/area/offices`);
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to load offices");
  return data.data;
}

export async function createOffice(payload) {
  const response = await fetch(`${API_BASE}/api/area/offices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to create office");
  return data.data;
}

export async function updateOffice(id, payload) {
  const response = await fetch(`${API_BASE}/api/area/offices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to update office");
  return data.data;
}

export async function deleteOffice(id) {
  const response = await fetch(`${API_BASE}/api/area/offices/${id}`, {
    method: "DELETE",
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to delete office");
  return data.data;
}

export async function toggleOfficeStatus(id) {
  const response = await fetch(`${API_BASE}/api/area/offices/${id}/status`, {
    method: "PATCH",
  });
  const data = await readJsonSafe(response);
  if (!response.ok || !data.success)
    throw new Error(data.message || "Failed to update office status");
  return data.data;
}
