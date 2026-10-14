import { useCallback, useEffect, useState } from 'react';
import {
  getDashboardStats,
  listUsers,
  changeUserRole,
} from '../services/admin.service.js';

const EMPTY_STATS = {
  totals: {
    users: 0,
    assets: 0,
    lostReports: 0,
    foundItems: 0,
    claims: 0,
    recoveries: 0,
    pendingClaims: 0,
  },
  usersByRole: {},
  assetsByStatus: {},
  lostReportsByStatus: {},
  foundItemsByStatus: {},
  claimsByStatus: {},
  recentAuditEvents: [],
};

const ROLES = ['USER', 'VERIFIER', 'ADMIN'];

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString();
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        {Number(value ?? 0).toLocaleString()}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StatusBreakdown({ title, data = {} }) {
  const entries = Object.entries(data);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {title}
      </h2>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No records available.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-slate-600">
                {status.replaceAll('_', ' ')}
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedRoles, setSelectedRoles] = useState({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadStats = useCallback(async () => {
    const result = await getDashboardStats();
    setStats({ ...EMPTY_STATS, ...result });
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const result = await listUsers({
        page,
        pageSize,
        search,
        role: roleFilter,
      });

      setUsers(result.users);
      setTotalUsers(result.total);
      setSelectedRoles(
        Object.fromEntries(result.users.map((user) => [user.id, user.role])),
      );
    } finally {
      setUsersLoading(false);
    }
  }, [page, search, roleFilter]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await Promise.all([loadStats(), loadUsers()]);
    } catch (err) {
      setError(err.message || 'Unable to load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadUsers]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleRoleChange(user) {
    const newRole = selectedRoles[user.id];

    if (!newRole || newRole === user.role) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${user.name || user.email}'s role from ${user.role} to ${newRole}?`,
    );

    if (!confirmed) {
      setSelectedRoles((current) => ({
        ...current,
        [user.id]: user.role,
      }));
      return;
    }

    setError('');
    setNotice('');

    try {
      const result = await changeUserRole(user.id, newRole);

      setNotice(result.message || 'User role updated successfully.');

      await Promise.all([loadStats(), loadUsers()]);
    } catch (err) {
      setError(err.message || 'Unable to update the user role.');

      setSelectedRoles((current) => ({
        ...current,
        [user.id]: user.role,
      }));
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const totals = stats.totals || EMPTY_STATS.totals;

  if (loading) {
    return (
      <div className="p-6 text-slate-600">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              BlockFind Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Monitor platform activity, manage users and review system events.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh dashboard
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Platform Overview
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={totals.users} description="Registered accounts" />
            <StatCard label="Total Assets" value={totals.assets} description="Registered personal assets" />
            <StatCard label="Lost Reports" value={totals.lostReports} description="Items reported as lost" />
            <StatCard label="Found Items" value={totals.foundItems} description="Items reported as found" />
            <StatCard label="Total Claims" value={totals.claims} description="Claims submitted by users" />
            <StatCard label="Pending Claims" value={totals.pendingClaims} description="Claims awaiting review or in review" />
            <StatCard label="Recoveries" value={totals.recoveries} description="Recorded item recoveries" />
            <StatCard label="User Accounts" value={Object.values(stats.usersByRole || {}).reduce((sum, n) => sum + n, 0)} description="Accounts grouped by role" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Record Status
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatusBreakdown title="Users by Role" data={stats.usersByRole} />
            <StatusBreakdown title="Assets by Status" data={stats.assetsByStatus} />
            <StatusBreakdown title="Lost Reports" data={stats.lostReportsByStatus} />
            <StatusBreakdown title="Claims" data={stats.claimsByStatus} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              User Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search accounts and manage USER, VERIFIER and ADMIN roles.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              >
                <option value="">All roles</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          {usersLoading ? (
            <p className="p-6 text-sm text-slate-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No users match your search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Current Role</th>
                    <th className="px-5 py-3">Registered</th>
                    <th className="px-5 py-3">Change Role</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {user.name || 'Unnamed user'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={selectedRoles[user.id] || user.role}
                          onChange={(event) =>
                            setSelectedRoles((current) => ({
                              ...current,
                              [user.id]: event.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={
                            usersLoading ||
                            !selectedRoles[user.id] ||
                            selectedRoles[user.id] === user.role
                          }
                          onClick={() => handleRoleChange(user)}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
            <p className="text-sm text-slate-500">
              {totalUsers === 0
                ? 'Showing 0 users'
                : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalUsers)} of ${totalUsers} users`}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || usersLoading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 py-2 text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || usersLoading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Audit Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest recorded administrative and platform events.
            </p>
          </div>

          {!stats.recentAuditEvents?.length ? (
            <p className="p-5 text-sm text-slate-500">
              No audit events have been recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentAuditEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {event.action.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.entityType} · {event.entityId}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Actor: {event.actor?.name || event.actor?.email || 'System'}
                      {event.actor?.role ? ` (${event.actor.role})` : ''}
                    </p>
                  </div>

                  <time className="text-xs text-slate-500">
                    {formatDate(event.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-slate-500">
          Statistics generated at: {formatDate(stats.generatedAt)}
        </p>
      </div>
    </main>
  );
}