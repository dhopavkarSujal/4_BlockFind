
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
  PackagePlus,
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
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Assets', path: '/dashboard/assets', icon: Package },
    { label: 'Lost Reports', path: '/dashboard/lost-assets', icon: Search },
    { label: 'Found Items', path: '/dashboard/found-items', icon: PackageSearch },
    {
      label: 'Report Found',
      path: '/dashboard/report-found',
      icon: PackagePlus,
    },
    { label: 'My Claims', path: '/dashboard/claims', icon: ClipboardList },
    { label: 'Recoveries', path: '/dashboard/recoveries', icon: History },
  ],

  
  VERIFIER: [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Found Items', path: '/dashboard/found-items', icon: PackageSearch },
    { label: 'Report Found', path: '/dashboard/report-found', icon: PackagePlus },
    { label: 'Claim Review Queue', path: '/dashboard/review-queue', icon: ClipboardCheck },
    {
      label: 'Found Report Review', path: '/dashboard/found-report-review-queue',icon: ClipboardCheck,
    },
  ],

  
ADMIN: [
    { label: 'Admin Dashboard', path: '/dashboard/admin', icon: ShieldCheck },
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Claim Review Queue', path: '/dashboard/review-queue', icon: ClipboardCheck },
    {
      label: 'Found Report Review',
      path: '/dashboard/found-report-review-queue',
      icon: ClipboardCheck,
    },
    { label: 'Found Items', path: '/dashboard/found-items', icon: PackageSearch },
    { label: 'Report Found', path: '/dashboard/report-found', icon: PackagePlus },
  ],

};

const ROLE_DESCRIPTIONS = {
  USER: 'Manage your reports and recovery requests.',
  VERIFIER: 'Verify reports and review ownership claims.',
  ADMIN: 'Monitor platform activity and manage access.',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => readStoredUser() || {});

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function refreshUser() {
      setUser(readStoredUser() || {});
    }

    window.addEventListener(AUTH_CHANGED_EVENT, refreshUser);
    window.addEventListener('storage', refreshUser);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshUser);
      window.removeEventListener('storage', refreshUser);
    };
  }, []);

  // Close the mobile sidebar whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Never display privileged navigation for an unknown role.
  const storedRole = user.role?.toUpperCase();
  const role = NAVIGATION_BY_ROLE[storedRole] ? storedRole : 'USER';

  const navigation = NAVIGATION_BY_ROLE[role];
  const roleLabel = getRoleLabel(role);

  const displayName =
    user.name?.trim() ||
    user.fullName?.trim() ||
    user.email ||
    'BlockFind User';

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
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="blockfind-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col
          border-r border-white/10 bg-[#101B2C] text-white
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-[88px] shrink-0 items-center gap-3 border-b border-white/10 px-6">
          <Link
            to={getRoleHomePath(role)}
            className="flex min-w-0 items-center gap-3 rounded-lg"
            aria-label="BlockFind home"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#65DCCB] text-[#102B35] shadow-lg shadow-black/10">
              <PackageSearch size={24} strokeWidth={2.3} />
            </span>

            <span className="min-w-0">
              <span className="block text-xl font-bold tracking-tight text-white">
                BlockFind
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">
                Find it. Return it.
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role-specific navigation */}
        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.19em] text-slate-500">
            {roleLabel} workspace
          </p>

          <nav
            aria-label={`${roleLabel} navigation`}
            className="space-y-1.5"
          >
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#203747] text-[#77E5D4] shadow-sm ring-1 ring-inset ring-white/5'
                        : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                >
                  <Icon
                    size={19}
                    strokeWidth={1.9}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar message */}
        <div className="mt-auto px-4 pb-5">
          <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#203747] text-[#77E5D4]">
              <ShieldCheck size={19} />
            </div>
            <p className="text-sm font-semibold text-white">
              Every item matters.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Help belongings find their way home.
            </p>
          </div>

          {/* Signed-in account */}
          <div className="flex items-center gap-3 border-t border-white/10 pt-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#65DCCB]/20 bg-[#203747] text-sm font-bold text-[#77E5D4]">
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {displayName}
              </p>
              <p className="mt-1 text-xs text-slate-400">{roleLabel}</p>
            </div>

            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={handleLogout}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main application area */}
      <div className="min-h-screen lg:pl-[270px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-controls="blockfind-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                {activeItem.label}
              </p>
              <p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-44 truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="mt-1 text-xs text-slate-500">{roleLabel}</p>
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#BFEDE5] bg-[#E7F8F4] text-sm font-bold text-[#176B60]"
              role="img"
              aria-label={`Account avatar for ${displayName}`}
              title={`${displayName} - ${roleLabel}`}
            >
              {initial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}