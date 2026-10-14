import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getMyLostReports } from '../services/lost-report.service'
import { getFoundItems } from '../services/found-item.service'
import { getMyClaims } from '../services/claim.service'
import { getMyRecoveries } from '../services/recovery.service'

const initialCounts = {
  lostReports: null,
  foundItems: null,
  claims: null,
  recoveries: null,
}

const statsConfig = [
  {
    key: 'lostReports',
    label: 'Lost assets',
    description: 'Your submitted lost reports',
    icon: 'L',
    color: 'bg-blue-50 text-blue-700',
    path: '/dashboard/lost-assets',
  },
  {
    key: 'foundItems',
    label: 'Found items',
    description: 'Browse reported found items',
    icon: 'F',
    color: 'bg-teal-50 text-teal-700',
    path: '/dashboard/found-items',
  },
  {
    key: 'claims',
    label: 'My claims',
    description: 'Track your ownership claims',
    icon: 'C',
    color: 'bg-violet-50 text-violet-700',
    path: '/dashboard/claims',
  },
  {
    key: 'recoveries',
    label: 'Recoveries',
    description: 'View your recovery records',
    icon: 'R',
    color: 'bg-amber-50 text-amber-700',
    path: '/dashboard/recoveries',
  },
]

const quickActions = [
  {
    title: 'Report a lost asset',
    description: 'Record an item you have lost.',
    path: '/dashboard/lost-assets',
    icon: '+',
  },
  {
    title: 'Browse found items',
    description: 'Explore items reported as found.',
    path: '/dashboard/found-items',
    icon: 'F',
  },
  {
    title: 'Review my claims',
    description: 'Check your submitted claims.',
    path: '/dashboard/claims',
    icon: 'C',
  },
]

function getList(result, keys = []) {
  if (Array.isArray(result)) return result

  for (const key of keys) {
    if (Array.isArray(result?.[key])) return result[key]
  }

  return []
}

function getRecoveryCount(result) {
  if (typeof result?.total === 'number') return result.total
  if (typeof result?.count === 'number') return result.count

  return getList(result, ['records', 'recoveries']).length
}

export default function Dashboard() {
  const [counts, setCounts] = useState(initialCounts)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  let user = {}

  try {
    user = JSON.parse(sessionStorage.getItem('blockfind_user') || '{}')
  } catch {
    user = {}
  }

  const name = user.name || user.fullName || 'there'

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setLoadError(false)

      const results = await Promise.allSettled([
        getMyLostReports(),
        getFoundItems(),
        getMyClaims(),
        getMyRecoveries({ page: 1, pageSize: 100 }),
      ])

      if (!active) return

      const [lostResult, foundResult, claimsResult, recoveriesResult] =
        results

      const nextCounts = { ...initialCounts }

      if (lostResult.status === 'fulfilled') {
        nextCounts.lostReports = getList(lostResult.value, [
          'reports',
          'lostReports',
          'records',
        ]).length
      }

      if (foundResult.status === 'fulfilled') {
        nextCounts.foundItems = getList(foundResult.value, [
          'items',
          'foundItems',
          'records',
        ]).length
      }

      if (claimsResult.status === 'fulfilled') {
        nextCounts.claims = getList(claimsResult.value, [
          'claims',
          'records',
        ]).length
      }

      if (recoveriesResult.status === 'fulfilled') {
        nextCounts.recoveries = getRecoveryCount(recoveriesResult.value)
      }

      setCounts(nextCounts)
      setLoadError(results.some((result) => result.status === 'rejected'))
      setLoading(false)
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-700">
            YOUR WORKSPACE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Welcome, {name}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Keep your lost reports, claims, and recovery activity organized
            from one place.
          </p>
        </div>

        <Link
          to="/dashboard/lost-assets"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <span aria-hidden="true">+</span>
          Report a lost asset
        </Link>
      </section>

      <section aria-labelledby="overview-heading">
        <div className="mb-4">
          <h2
            id="overview-heading"
            className="text-lg font-bold text-slate-900"
          >
            Recovery overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your personal activity at a glance.
          </p>
        </div>

        {loadError && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Some statistics could not be loaded. Check your backend and
            refresh the page to try again.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsConfig.map((stat) => (
            <Link
              key={stat.key}
              to={stat.path}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${stat.color}`}
                  aria-hidden="true"
                >
                  {stat.icon}
                </div>

                <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700">
                  →
                </span>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              <p
                className="mt-1 text-3xl font-bold text-slate-900"
                aria-live="polite"
              >
                {loading
                  ? '...'
                  : counts[stat.key] === null
                    ? '—'
                    : counts[stat.key]}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {stat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="actions-heading">
        <div className="mb-4">
          <h2
            id="actions-heading"
            className="text-lg font-bold text-slate-900"
          >
            Quick actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Jump straight to the task you need.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700"
                aria-hidden="true"
              >
                {action.icon}
              </span>

              <span>
                <span className="block font-semibold text-slate-900">
                  {action.title}
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  {action.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xl font-bold text-teal-700">
            i
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Your recovery journey starts here
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Start by reporting a lost asset or browsing found items. If you
              identify a possible match, use the claim process and follow the
              required verification steps.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}