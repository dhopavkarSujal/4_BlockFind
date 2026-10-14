import { Navigate, Route, Routes } from 'react-router-dom';

import Landing from '../pages/Landing.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';

import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';

import RegisterAsset from '../pages/RegisterAsset.jsx';
import LostAssets from '../pages/LostAssets.jsx';
import FoundItems from '../pages/FoundItems.jsx';
import MyClaims from '../pages/MyClaims.jsx';
import Recoveries from '../pages/Recoveries.jsx';
import ReviewQueue from '../pages/ReviewQueue.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';

import RequireRole from './RequireRole.jsx';

import {
  getRoleHomePath,
  getStoredToken,
  readStoredUser,
} from '../utils/auth-session.js';

// Protect pages that require login.
function RequireAuth({ children }) {
  if (!getStoredToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Prevent logged-in users from returning to login/register pages.
function GuestOnly({ children }) {
  if (getStoredToken()) {
    const user = readStoredUser();

    return (
      <Navigate
        to={getRoleHomePath(user.role)}
        replace
      />
    );
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />

      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />

      <Route
        path="/register"
        element={
          <GuestOnly>
            <Register />
          </GuestOnly>
        }
      />

      {/* Protected dashboard and shared layout */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        {/* Available to all authenticated roles */}
        <Route index element={<Dashboard />} />

        <Route
          path="found-items"
          element={<FoundItems />}
        />

        {/* USER-only pages */}
        <Route element={<RequireRole allowedRoles={['USER']} />}>
          <Route
            path="assets"
            element={<RegisterAsset />}
          />

          <Route
            path="lost-assets"
            element={<LostAssets />}
          />

          <Route
            path="claims"
            element={<MyClaims />}
          />

          <Route
            path="recoveries"
            element={<Recoveries />}
          />
        </Route>

        {/* VERIFIER and ADMIN pages */}
        <Route
          element={
            <RequireRole allowedRoles={['VERIFIER', 'ADMIN']} />
          }
        >
          <Route
            path="review-queue"
            element={<ReviewQueue />}
          />
        </Route>

        {/* ADMIN-only pages */}
        <Route
          element={<RequireRole allowedRoles={['ADMIN']} />}
        >
          <Route
            path="admin"
            element={<AdminDashboard />}
          />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}