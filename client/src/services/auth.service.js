
import { apiRequest } from './api.js';

export function registerUser({ name, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token) {
  return apiRequest('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
