const TOKEN_KEY = 'blockfind_token';
const USER_KEY = 'blockfind_user';

export const AUTH_CHANGED_EVENT = 'blockfind:auth-changed';

const VALID_ROLES = ['USER', 'VERIFIER', 'ADMIN'];

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function readStoredUser() {
  try {
    const value = sessionStorage.getItem(USER_KEY);
    const user = value ? JSON.parse(value) : {};

    return user && typeof user === 'object' ? user : {};
  } catch {
    return {};
  }
}

export function saveAuthSession(token, user) {
  if (!token || !user || !VALID_ROLES.includes(user.role)) {
    throw new Error(
      'The login response is missing a valid token or user role.',
    );
  }

  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getRoleHomePath(role) {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';

    case 'VERIFIER':
      return '/dashboard/review-queue';

    case 'USER':
    default:
      return '/dashboard';
  }
}

export function getRoleLabel(role) {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';

    case 'VERIFIER':
      return 'Verifier';

    case 'USER':
      return 'User';

    default:
      return 'Unknown role';
  }
}