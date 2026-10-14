import { apiRequest } from './api.js';

export async function getDashboardStats() {
  const data = await apiRequest('/admin/stats');
  return data.stats;
}

export async function listUsers({
  page = 1,
  pageSize = 10,
  search = '',
  role = '',
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (role) {
    params.set('role', role);
  }

  const data = await apiRequest(`/admin/users?${params.toString()}`);

  return {
    users: Array.isArray(data.users) ? data.users : [],
    total: Number(data.total ?? 0),
    page: Number(data.page ?? page),
    pageSize: Number(data.pageSize ?? pageSize),
  };
}

export async function getUserById(id) {
  const data = await apiRequest(`/admin/users/${id}`);
  return data.user;
}

export async function changeUserRole(id, role) {
  return apiRequest(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}