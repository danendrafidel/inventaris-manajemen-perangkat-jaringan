import { API_BASE } from "../constants";

export async function fetchDashboardSummary(queryParams = "") {
  const url = queryParams ? `${API_BASE}/api/dashboard?${queryParams}` : `${API_BASE}/api/dashboard`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Gagal memuat dashboard");
  }
  return data.data;
}
