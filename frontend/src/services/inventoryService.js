import { API_BASE } from "../constants";

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
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal memuat opsi filter");
  }

  return data.data;
}

export async function fetchInventoryStats({ role, email, area }) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (email) params.set("email", email);
  if (area) params.set("area", area);

  const response = await fetch(
    `${API_BASE}/api/inventory/stats?${params.toString()}`,
  );
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal memuat statistik inventaris");
  }

  return data.data;
}

export async function fetchInventoryDevices({
  role,
  email,
  search = "",
  sto = "",
  area = "",
  status = "",
  page = 1,
  limit = 8,
}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (email) params.set("email", email);
  params.set("search", search);
  if (sto) params.set("sto", sto);
  if (area) params.set("area", area);
  if (status) params.set("status", status);
  params.set("page", String(toInt(page, 1)));
  params.set("limit", String(toInt(limit, 8)));

  const response = await fetch(
    `${API_BASE}/api/inventory/devices?${params.toString()}`,
  );
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal memuat daftar perangkat");
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
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal menambahkan perangkat");
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
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal memperbarui perangkat");
  }

  return data.data;
}

export async function deleteInventoryDevice(id) {
  const response = await fetch(`${API_BASE}/api/inventory/devices/${id}`, {
    method: "DELETE",
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal menghapus perangkat");
  }

  return data.data;
}
