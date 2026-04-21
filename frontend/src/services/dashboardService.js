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

export async function fetchDashboardSummary(queryParams = "") {
  const url = queryParams ? `${API_BASE}/api/dashboard?${queryParams}` : `${API_BASE}/api/dashboard`;
  const response = await fetch(url);
  const data = await handleResponse(response);
  if (!data.success) {
    throw new Error(data.message || "Failed to load dashboard data");
  }
  return data.data;
}
