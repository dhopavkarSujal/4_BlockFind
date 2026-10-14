import { useEffect, useState } from 'react';
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  LayoutDashboard,
  Package,
  Search,
  PackageSearch,
  ClipboardList,
  ClipboardCheck,
  History,
  ShieldCheck,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  getRoleHomePath,
  getRoleLabel,
  readStoredUser,
} from '../../utils/auth-session.js';

const NAVIGATION_BY_ROLE = {
  USER: [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Assets',
      path: '/dashboard/assets',
      icon: Package,
    },
    {
      label: 'Lost Reports',
      path: '/dashboard/lost-assets',
      icon: Search,
    },
    {
      label: 'Found Items',
      path: '/dashboard/found-items',
      icon: PackageSearch,
    },
    {
      label: 'My Claims',
      path: '/dashboard/claims',
      icon: ClipboardList,
    },
    {
      label: 'Recoveries',
      path: '/dashboard/recoveries',
      icon: History,
    },
  ],

  VERIFIER: [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Found Items',
      path: '/dashboard/found-items',
      icon: PackageSearch,
    },
    {
      label: 'Review Queue',
      path: '/dashboard/review-queue',
      icon: ClipboardCheck,
    },
  ],

  ADMIN: [
    {
      label: 'Admin Dashboard',
      path: '/dashboard/admin',
      icon: ShieldCheck,
    },
    {
      label: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Review Queue',
      path: '/dashboard/review-queue',
      icon: ClipboardCheck,
    },
    {
      label: 'Found Items',
      path: '/dashboard/found-items',
      icon: PackageSearch,
    },
  ],
};

const ROLE_DESCRIPTIONS = {
  USER: 'Manage your assets and recovery requests.',
  VERIFIER: 'Review claims and manage found items.',
  ADMIN: 'Monitor the platform and manage user access.',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => readStoredUser());

  const navigate = useNavigate();
  const location = useLocation();

  // Refresh the displayed account after login or logout.
  useEffect(() => {
    function refreshUser() {
      setUser(readStoredUser());
    }

    window.addEventListener(AUTH_CHANGED_EVENT, refreshUser);
    window.addEventListener('storage', refreshUser);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshUser);
      window.removeEventListener('storage', refreshUser);
    };
  }, []);

  // Unknown or missing roles must not receive staff/admin navigation.
  const role = NAVIGATION_BY_ROLE[user.role] ? user.role : 'USER';
  const navigation = NAVIGATION_BY_ROLE[role];

  const roleLabel = getRoleLabel(role);
  const displayName =
    user.name?.trim() || user.email || 'BlockFind User';
  const initial = displayName.charAt(0).toUpperCase() || 'B';

  const activeItem =
    navigation.find((item) => {
      if (location.pathname === item.path) {
        return true;
      }

      return (
        item.path !== '/dashboard' &&
        location.pathname.startsWith(`${item.path}/`)
      );
    }) || navigation[0];

  function handleLogout() {
    clearAuthSession();
    setSidebarOpen(false);
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <Link
            to={getRoleHomePath(role)}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
              B
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950">
                BlockFind
              </p>
              <p className="text-xs text-slate-500">
                Asset recovery platform
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role-specific navigation */}
        <div className="px-5 pt-7">
          <p className="mb-3 px-3 text-xs font-bold tracking-widest text-slate-400">
            {roleLabel.toUpperCase()} WORKSPACE
          </p>

          <nav aria-label={`${roleLabel} navigation`} className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Signed-in account */}
        <div className="mt-auto border-t border-slate-100 p-5">
          <div className="mb-4 rounded-xl bg-slate-50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {initial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {roleLabel}
                </p>
              </div>
            </div>

            {user.email && (
              <p className="mt-3 break-all text-xs text-slate-500">
                {user.email}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-72">
        {/* Top navigation bar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                {activeItem.label}
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>

              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {roleLabel}
              </span>
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700"
              aria-label={`User avatar: ${displayName}`}
              title={`${displayName} · ${roleLabel}`}
            >
              {initial}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}