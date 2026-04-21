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

function toInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function fetchInventoryOptions({ role, email }) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (email) params.set("email", email);

  const response = await fetch(
    `${API_BASE}/api/inventory/options?${params.toString()}`,
  );
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to load filter options");
  }

  return data.data;
}

export async function fetchInventoryStats({ role, email, area_id }) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (email) params.set("email", email);
  if (area_id) params.set("area_id", area_id);

  const response = await fetch(
    `${API_BASE}/api/inventory/stats?${params.toString()}`,
  );
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to load inventory statistics");
  }

  return data.data;
}

export async function fetchInventoryDevices({
  role,
  email,
  search = "",
  sto_id = "",
  area_id = "",
  status = "",
  page = 1,
  limit = 8,
}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (email) params.set("email", email);
  params.set("search", search);
  if (sto_id) params.set("sto_id", sto_id);
  if (area_id) params.set("area_id", area_id);
  if (status) params.set("status", status);
  params.set("page", String(toInt(page, 1)));
  params.set("limit", String(toInt(limit, 8)));

  const response = await fetch(
    `${API_BASE}/api/inventory/devices?${params.toString()}`,
  );
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to load device list");
  }

  return data.data;
}

export async function createInventoryDevice(deviceData) {
  const response = await fetch(`${API_BASE}/api/inventory/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deviceData),
  });
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to add new device");
  }

  return data.data;
}

export async function updateInventoryDevice(id, deviceData) {
  const response = await fetch(`${API_BASE}/api/inventory/devices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deviceData),
  });
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to update device");
  }

  return data.data;
}

export async function deleteInventoryDevice(id) {
  const response = await fetch(`${API_BASE}/api/inventory/devices/${id}`, {
    method: "DELETE",
  });
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to delete device");
  }

  return data.data;
}

export async function createPmrReport(pmrData) {
  const response = await fetch(`${API_BASE}/api/pmr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pmrData),
  });
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to send PMR report");
  }

  return data.data;
}

export async function fetchPmrReports({ area_id, role, user_id } = {}) {
  const params = new URLSearchParams();
  if (area_id) params.set("area_id", area_id);
  if (role) params.set("role", role);
  if (user_id) params.set("user_id", user_id);

  const response = await fetch(`${API_BASE}/api/pmr?${params.toString()}`);
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to load PMR log");
  }

  return data.data;
}
