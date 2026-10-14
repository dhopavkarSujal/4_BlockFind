import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createLostReport,
  getMyAssets,
  getMyLostReports,
} from '../services/lost-report.service'

const STATUS_STYLES = {
  OPEN: 'bg-amber-50 text-amber-700 ring-amber-200',
  CLAIM_PENDING: 'bg-blue-50 text-blue-700 ring-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function formatDate(value) {
  if (!value) return 'Not provided'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'

export default function LostAssets() {
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [assets, setAssets] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    assetId: '',
    location: '',
    lostAt: '',
    description: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [reportData, assetData] = await Promise.all([
        getMyLostReports(),
        getMyAssets(),
      ])

      setReports(reportData)
      setAssets(assetData)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      setError(err.message || 'Could not load your lost assets.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const activeAssets = useMemo(() => {
    const unresolvedAssetIds = new Set(
      reports
        .filter((report) =>
          ['OPEN', 'CLAIM_PENDING'].includes(report.status),
        )
        .map((report) => report.assetId),
    )

    return assets.filter(
      (asset) =>
        asset.status === 'ACTIVE' &&
        !unresolvedAssetIds.has(asset.id),
    )
  }, [assets, reports])

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase()

    return reports.filter((report) => {
      const title = report.asset?.title || ''
      const category = report.asset?.category || ''
      const location = report.location || ''

      const matchesSearch = [title, category, location].some((value) =>
        value.toLowerCase().includes(query),
      )

      const matchesStatus =
        statusFilter === 'ALL' || report.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [reports, search, statusFilter])

  const openCount = reports.filter(
    (report) => report.status === 'OPEN',
  ).length

  const resolvedCount = reports.filter(
    (report) => report.status === 'RESOLVED',
  ).length

  function updateField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const payload = {
        assetId: form.assetId,
        location: form.location.trim(),
        description: form.description.trim() || null,
        lostAt: form.lostAt
          ? new Date(form.lostAt).toISOString()
          : null,
      }

      await createLostReport(payload)

      setForm({
        assetId: '',
        location: '',
        lostAt: '',
        description: '',
      })

      setShowForm(false)
      setSuccess('Your lost asset report was submitted successfully.')

      await loadData()
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      setError(err.message || 'Could not submit the lost report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              ASSET MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Lost assets
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage your lost item reports and keep track of their
              recovery status in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setError('')
                setSuccess('')
                setShowForm((current) => !current)
              }}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              {showForm ? 'Cancel report' : '+ Report lost item'}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {success}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Total reports',
              value: reports.length,
              description: 'All your submitted reports',
            },
            {
              label: 'Open reports',
              value: openCount,
              description: 'Awaiting further progress',
            },
            {
              label: 'Resolved reports',
              value: resolvedCount,
              description: 'Marked as resolved',
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? '—' : stat.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </article>
          ))}
        </section>

        {showForm && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Report a lost asset
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Select an asset already registered to your account.
              </p>
            </div>

            {activeAssets.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                No eligible assets are available. Register an active
                asset first, or resolve an existing open report for
                that asset.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Registered asset *">
                    <select
                      name="assetId"
                      value={form.assetId}
                      onChange={updateField}
                      required
                      className={inputClass}
                    >
                      <option value="">Select an asset</option>
                      {activeAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.title} — {asset.category}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Where was it lost? *">
                    <input
                      name="location"
                      value={form.location}
                      onChange={updateField}
                      minLength={2}
                      maxLength={200}
                      required
                      placeholder="e.g. College library, Room 204"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Date and time lost">
                    <input
                      type="datetime-local"
                      name="lostAt"
                      value={form.lostAt}
                      onChange={updateField}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={updateField}
                      maxLength={1000}
                      rows={3}
                      placeholder="Describe when you last saw the item..."
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit report'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your reports
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review your submitted lost asset reports.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assets or locations..."
                aria-label="Search lost reports"
                className={`${inputClass} sm:w-64`}
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by report status"
                className={inputClass}
              >
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLAIM_PENDING">Claim pending</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading your lost reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4M11 8v4m0 3h.01" />
                </svg>
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {reports.length === 0
                  ? 'No lost reports yet'
                  : 'No matching reports'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {reports.length === 0
                  ? 'When you lose a registered item, submit a report and it will appear here.'
                  : 'Try a different search term or status filter.'}
              </p>

              {reports.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Report your first lost item
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredReports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {report.asset?.category || 'Uncategorized'}
                      </p>

                      <h3 className="mt-2 break-words text-lg font-bold text-slate-900">
                        {report.asset?.title || 'Unknown asset'}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                        STATUS_STYLES[report.status] ||
                        'bg-slate-100 text-slate-600 ring-slate-200'
                      }`}
                    >
                      {report.status?.replaceAll('_', ' ') || 'Unknown'}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex gap-3">
                      <span className="w-20 shrink-0 text-slate-400">
                        Location
                      </span>
                      <span className="break-words font-medium text-slate-700">
                        {report.location}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-20 shrink-0 text-slate-400">
                        Lost on
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatDate(report.lostAt)}
                      </span>
                    </div>

                    {report.description && (
                      <p className="border-t border-slate-100 pt-3 leading-6 text-slate-600">
                        {report.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                    Reported {formatDate(report.createdAt)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}