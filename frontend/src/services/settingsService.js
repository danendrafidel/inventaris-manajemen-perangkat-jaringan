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

export async function fetchFuelSettings() {
  const response = await fetch(`${API_BASE}/api/settings/fuel`);
  const data = await handleResponse(response);
  if (!data.success) {
    throw new Error(data.message || "Gagal memuat pengaturan bensin");
  }
  return data.data;
}

export async function updateFuelSettings(payload) {
  const response = await fetch(`${API_BASE}/api/settings/fuel`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return await handleResponse(response);
}
