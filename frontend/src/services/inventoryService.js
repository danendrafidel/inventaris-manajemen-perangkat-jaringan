import { API_BASE } from "../constants";

async function handleResponse(response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  } catch (e) {
    throw new Error(
      "The server returned an unexpected response. Please try again later.",
    );
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
  connectivity_status = "",
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
  if (connectivity_status) params.set("connectivity_status", connectivity_status);
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

export async function createPmrReport(formData) {
  const data = new FormData();

  // Explicitly append all non-file fields
  const fields = [
    "user_id", "device_id", "maintenance_date", "status", "action", "notes",
    "device_type", "serial_number", "sto", "room", "ip",
    "port_capacity", "port_idle", "port_lan", "port_sfp", "port_good", "port_bad", "port_notes",
    "ping_dns", "attenuation", "ping_client", "speed_test",
    "distance", "fuel_cost"
  ];

  fields.forEach(field => {
    if (formData[field] !== undefined && formData[field] !== null) {
      data.append(field, formData[field]);
    }
  });

  // Handle files explicitly
  if (Array.isArray(formData.maintenance_photos)) {
    formData.maintenance_photos.forEach((file) => {
      data.append("maintenance_photo", file);
    });
  }
  if (formData.fuel_receipt) {
    data.append("fuel_receipt", formData.fuel_receipt);
  }

  const response = await fetch(`${API_BASE}/api/pmr`, {
    method: "POST",
    body: data,
  });
  const result = await handleResponse(response);

  if (!result.success) {
    throw new Error(result.message || "Failed to send PMR report");
  }

  return result.data;
}

export async function updatePmrReportImages(id, { maintenance_photo, fuel_receipt }) {
  const data = new FormData();

  // Handle files
  if (maintenance_photo && Array.isArray(maintenance_photo)) {
    maintenance_photo.forEach((file) => {
      data.append("maintenance_photo", file);
    });
  } else if (maintenance_photo instanceof File) {
    data.append("maintenance_photo", maintenance_photo);
  }

  if (fuel_receipt && fuel_receipt instanceof File) {
    data.append("fuel_receipt", fuel_receipt);
  }

  const response = await fetch(`${API_BASE}/api/pmr/${id}`, {
    method: "PUT",
    body: data,
  });
  const result = await handleResponse(response);

  if (!result.success) {
    throw new Error(result.message || "Failed to update images");
  }

  return result.data;
}

export async function fetchFuelRecap({ 
  month, 
  year, 
  user_id, 
  area_id, 
  sto_id,
  search, 
  start_date, 
  end_date 
} = {}) {
  const params = new URLSearchParams();
  
  if (month && year) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    params.set("start_date", startDate);
    params.set("end_date", endDate);
  } else {
    if (start_date) params.set("start_date", start_date);
    if (end_date) params.set("end_date", end_date);
  }
  
  if (user_id) params.set("user_id", user_id);
  if (area_id) params.set("area_id", area_id);
  if (sto_id) params.set("sto_id", sto_id);
  if (search) params.set("search", search);

  const response = await fetch(`${API_BASE}/api/pmr?${params.toString()}`);
  const data = await handleResponse(response);
  if (!data.success) {
    throw new Error(data.message || "Gagal memuat rekapitulasi BBM");
  }
  return data.data;
}

export async function updateFuelReport(id, payload) {
  const response = await fetch(`${API_BASE}/api/pmr/${id}/metadata`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return await handleResponse(response);
}

export async function fetchPmrReports({
  area_id,
  role,
  user_id,
  search = "",
  sto_id = "",
  status = "",
  start_date = "",
  end_date = "",
} = {}) {
  const params = new URLSearchParams();
  if (area_id) params.set("area_id", area_id);
  if (role) params.set("role", role);
  if (user_id) params.set("user_id", user_id);
  if (search) params.set("search", search);
  if (sto_id) params.set("sto_id", sto_id);
  if (status) params.set("status", status);
  if (start_date) params.set("start_date", start_date);
  if (end_date) params.set("end_date", end_date);

  const response = await fetch(`${API_BASE}/api/pmr?${params.toString()}`);
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to load PMR log");
  }

  return data.data;
}

export async function pingInventoryDevices(ips) {
  const response = await fetch(`${API_BASE}/api/inventory/ping`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ips }),
  });
  const data = await handleResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to ping devices");
  }

  return data.data;
}
