
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyRecoveries } from '../services/recovery.service.js'

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Not available'

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function RecoveryCard({ recovery }) {
  const foundItem = recovery.foundItem
  const claim = recovery.claim
  const lostReport = claim?.lostReport
  const asset = lostReport?.asset

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            ✓
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Successfully recovered
            </p>

            <h2 className="mt-1 break-words text-lg font-bold text-slate-900">
              {asset?.title || 'Recovered belonging'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Matched with found item:{' '}
              <span className="font-medium text-slate-700">
                {foundItem?.title || 'Found item'}
              </span>
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Recovered
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your lost item
          </p>

          <p className="mt-2 font-semibold text-slate-800">
            {asset?.title || 'Not available'}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {asset?.category || 'Category not available'}
          </p>

          {lostReport?.location && (
            <p className="mt-3 break-words text-sm text-slate-600">
              <span className="font-medium">Originally lost at:</span>{' '}
              {lostReport.location}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recovered item record
          </p>

          <p className="mt-2 font-semibold text-slate-800">
            {foundItem?.title || 'Not available'}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {foundItem?.category || 'Category not available'}
          </p>

          {foundItem?.location && (
            <p className="mt-3 break-words text-sm text-slate-600">
              <span className="font-medium">Found at:</span>{' '}
              {foundItem.location}
            </p>
          )}
        </div>
      </div>

      {(foundItem?.brand || foundItem?.model) && (
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-medium text-slate-700">
            Identification:
          </span>{' '}
          {[foundItem.brand, foundItem.model]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {claim?.details && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700">
            Claim details
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {claim.details}
          </p>
        </div>
      )}

      {recovery.notes && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Recovery notes
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {recovery.notes}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-medium text-slate-700">
            Recovered on:
          </span>{' '}
          {formatDate(recovery.recoveredAt)}
        </p>

        <p>
          <span className="font-medium text-slate-700">
            Claim status:
          </span>{' '}
          {claim?.status
            ? claim.status.toLowerCase().replaceAll('_', ' ')
            : 'Not available'}
        </p>
      </div>

      <details className="mt-4 border-t border-slate-100 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-800">
          View record references
        </summary>

        <div className="mt-3 space-y-2 text-xs text-slate-500">
          <p className="break-all">
            <span className="font-medium text-slate-700">
              Recovery ID:
            </span>{' '}
            {recovery.id}
          </p>

          <p className="break-all">
            <span className="font-medium text-slate-700">
              Claim ID:
            </span>{' '}
            {claim?.id || 'Not available'}
          </p>

          <p className="break-all">
            <span className="font-medium text-slate-700">
              Found item ID:
            </span>{' '}
            {foundItem?.id || recovery.foundItemId || 'Not available'}
          </p>
        </div>
      </details>
    </article>
  )
}

function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  )
}

export default function Recoveries() {
  const navigate = useNavigate()

  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadRecoveries() {
      setLoading(true)
      setError('')

      try {
        const result = await getMyRecoveries({ page, pageSize })

        if (cancelled) return

        setRecords(result.records)
        setTotal(result.total)
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        setError(
          err.message || 'Unable to load your recovery history.'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRecoveries()

    return () => {
      cancelled = true
    }
  }, [page, pageSize, reloadVersion, navigate])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRecord = Math.min(page * pageSize, total)

  return (
    <main className="space-y-7 pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            BlockFind Workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Recoveries
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Keep track of your recovered belongings, review recovery
            details, and access the records associated with each claim.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReloadVersion((version) => version + 1)}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <span aria-hidden="true">↻</span>
          Refresh
        </button>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total recoveries"
          value={total}
          description="All recovery records associated with your claims"
        />

        <SummaryCard
          title="On this page"
          value={records.length}
          description="Recovery records currently loaded"
        />

        <SummaryCard
          title="Current page"
          value={`${page} / ${totalPages}`}
          description="Navigate through your recovery history"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recovery history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your most recently recorded recoveries appear first.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="recovery-page-size"
              className="text-sm font-medium text-slate-600"
            >
              Show
            </label>

            <select
              id="recovery-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <span className="text-sm text-slate-500">per page</span>
          </div>
        </div>

        {loading ? (
          <div role="status" className="mt-6 space-y-4">
            {[1, 2].map((number) => (
              <div
                key={number}
                className="animate-pulse rounded-2xl border border-slate-200 p-6"
              >
                <div className="h-5 w-1/3 rounded bg-slate-100" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-4 h-24 rounded bg-slate-50" />
              </div>
            ))}
          </div>
        ) : error && records.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
            <h3 className="font-semibold text-slate-800">
              Unable to load recovery history
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Check your connection to the BlockFind server and try again.
            </p>

            <button
              type="button"
              onClick={() => setReloadVersion((version) => version + 1)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl text-emerald-700">
              ✓
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No recoveries recorded yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Once a claim has been approved and a recovery record is
              created, the recovered item will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {records.map((recovery) => (
                <RecoveryCard
                  key={recovery.id}
                  recovery={recovery}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {firstRecord}–{lastRecord}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {total}
                </span>{' '}
                recoveries
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="min-w-20 text-center text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}