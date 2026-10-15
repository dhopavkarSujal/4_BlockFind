
import { Navigate, Route, Routes } from 'react-router-dom';

// Public pages
import Landing from '../pages/Landing.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';

// Dashboard pages
import RoleDashboard from '../pages/RoleDashboard.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import RegisterAsset from '../pages/RegisterAsset.jsx';
import LostAssets from '../pages/LostAssets.jsx';
import FoundItems from '../pages/FoundItems.jsx';
import ReportFound from '../pages/ReportFound.jsx';
import MyClaims from '../pages/MyClaims.jsx';
import Recoveries from '../pages/Recoveries.jsx';
import ReviewQueue from '../pages/ReviewQueue.jsx';
import FoundReportReviewQueue from '../pages/FoundReportReviewQueue.jsx';

// Shared layout and route guards
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import RequireRole from './RequireRole.jsx';

import {
  getRoleHomePath,
  getStoredToken,
  readStoredUser,
} from '../utils/auth-session.js';

// Require authentication for protected routes.
function RequireAuth({ children }) {
  if (!getStoredToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect authenticated users away from guest-only pages.
function GuestOnly({ children }) {
  if (getStoredToken()) {
    const user = readStoredUser();

    return (
      <Navigate
        to={getRoleHomePath(user?.role)}
        replace
      />
    );
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
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

      {/* Authenticated pages share one dashboard layout. */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        {/* Role-specific landing page */}
        <Route index element={<RoleDashboard />} />

        {/* Pages available to all authenticated roles */}
        <Route path="found-items" element={<FoundItems />} />
        <Route path="report-found" element={<ReportFound />} />

        {/* User-only pages */}
        <Route element={<RequireRole allowedRoles={['USER']} />}>
          <Route path="assets" element={<RegisterAsset />} />
          <Route path="lost-assets" element={<LostAssets />} />
          <Route path="claims" element={<MyClaims />} />
          <Route path="recoveries" element={<Recoveries />} />
        </Route>

        {/* Verifier and Admin pages */}
        <Route
          element={
            <RequireRole allowedRoles={['VERIFIER', 'ADMIN']} />
          }
        >
          <Route path="review-queue" element={<ReviewQueue />} />

          <Route
            path="found-report-review-queue"
            element={<FoundReportReviewQueue />}
          />
        </Route>

        {/* Admin-only pages */}
        <Route element={<RequireRole allowedRoles={['ADMIN']} />}>
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}