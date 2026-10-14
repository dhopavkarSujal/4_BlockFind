
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem('blockfind_token');

  const headers = {
    ...(options.body !== undefined
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Unable to connect to BlockFind. Check that the backend is running.',
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.details = data.errors || [];

    throw error;
  }

  return data;
}

export function checkApiHealth() {
  return apiRequest('/health');
}
