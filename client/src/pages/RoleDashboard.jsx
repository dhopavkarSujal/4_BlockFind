
import { Navigate } from 'react-router-dom';

import Dashboard from '../pages/Dashboard.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import VerifierDashboard from '../pages/VerifierDashboard.jsx';

import { readStoredUser } from '../utils/auth-session.js';

export default function RoleDashboard() {
  const user = readStoredUser();
  const role = user?.role?.toUpperCase();

  if (role === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (role === 'VERIFIER') {
    return <VerifierDashboard />;
  }

  if (role === 'USER') {
    return <Dashboard />;
  }

  return <Navigate to="/login" replace />;
}