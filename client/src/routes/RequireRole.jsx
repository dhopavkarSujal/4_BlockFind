import { Navigate, Outlet, useLocation } from 'react-router-dom';

import {
  getRoleHomePath,
  getStoredToken,
  readStoredUser,
} from '../utils/auth-session.js';

export default function RequireRole({ allowedRoles = [] }) {
  const location = useLocation();
  const token = getStoredToken();
  const user = readStoredUser();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={getRoleHomePath(user.role)}
        replace
      />
    );
  }

  return <Outlet />;
}