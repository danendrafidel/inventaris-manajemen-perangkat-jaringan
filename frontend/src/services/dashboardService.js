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

export async function fetchDashboardSummary(queryParams = "") {
  const url = queryParams ? `${API_BASE}/api/dashboard?${queryParams}` : `${API_BASE}/api/dashboard`;
  const response = await fetch(url);
  const data = await handleResponse(response);
  if (!data.success) {
    throw new Error(data.message || "Gagal memuat data dashboard");
  }
  return data.data;
}
