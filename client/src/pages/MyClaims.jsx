import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  cancelClaim,
  getMyClaims,
  submitClaim,
} from '../services/claim.service'

import { getMyLostReports } from '../services/lost-report.service'
import { getFoundItems } from '../services/found-item.service'

const INITIAL_FORM = {
  lostReportId: '',
  foundItemId: '',
  details: '',
}

const CLAIM_STATUSES = [
  'ALL',
  'PENDING',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]

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

function formatStatus(status = '') {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function statusStyle(status) {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    IN_REVIEW: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    REJECTED: 'bg-red-50 text-red-700 ring-red-600/20',
    CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  }

  return styles[status] || styles.CANCELLED
}

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  )
}

function ClaimCard({ claim, onCancel, cancelling }) {
  const lostAsset = claim.lostReport?.asset
  const foundItem = claim.foundItem

  const canCancel = ['PENDING', 'IN_REVIEW'].includes(claim.status)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Claim reference
          </p>

          <p className="mt-1 break-all font-mono text-xs text-slate-500">
            {claim.id}
          </p>

          <h3 className="mt-3 text-lg font-bold text-slate-900">
            {lostAsset?.title || 'Lost item'}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Matched with:{' '}
            <span className="font-medium text-slate-700">
              {foundItem?.title || 'Found item'}
            </span>
          </p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyle(claim.status)}`}
        >
          {formatStatus(claim.status)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            My lost item
          </p>
          <p className="mt-2 font-semibold text-slate-800">
            {lostAsset?.title || 'Lost item'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {lostAsset?.category || 'Category not available'}
          </p>
          {claim.lostReport?.location && (
            <p className="mt-2 text-sm text-slate-600">
              Lost at: {claim.lostReport.location}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Found item
          </p>
          <p className="mt-2 font-semibold text-slate-800">
            {foundItem?.title || 'Found item'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {foundItem?.category || 'Category not available'}
          </p>
          {foundItem?.location && (
            <p className="mt-2 text-sm text-slate-600">
              Found at: {foundItem.location}
            </p>
          )}
        </div>
      </div>

      {claim.details && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700">
            Claim details
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {claim.details}
          </p>
        </div>
      )}

      {claim.decisionNotes && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Review notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {claim.decisionNotes}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-slate-500">
          <p>Submitted: {formatDate(claim.createdAt)}</p>
          {claim.reviewedAt && (
            <p>Reviewed: {formatDate(claim.reviewedAt)}</p>
          )}
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={() => onCancel(claim)}
            disabled={cancelling}
            className="rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel claim'}
          </button>
        )}
      </div>
    </article>
  )
}

export default function MyClaims() {
  const navigate = useNavigate()

  const [claims, setClaims] = useState([])
  const [lostReports, setLostReports] = useState([])
  const [foundItems, setFoundItems] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  const [error, setError] = useState('')
  const [choiceError, setChoiceError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setError('')
      setChoiceError('')

      const results = await Promise.allSettled([
        getMyClaims(),
        getMyLostReports(),
        getFoundItems(),
      ])

      if (cancelled) return

      const authError = results.find(
        (result) =>
          result.status === 'rejected' &&
          result.reason?.status === 401
      )

      if (authError) {
        navigate('/login', { replace: true })
        return
      }

      const claimResult = results[0]
      const reportResult = results[1]
      const itemResult = results[2]

      if (claimResult.status === 'rejected') {
        setError(
          claimResult.reason?.message ||
            'Unable to load your claims.'
        )
      } else {
        setClaims(
          Array.isArray(claimResult.value) ? claimResult.value : []
        )
      }

      if (reportResult.status === 'fulfilled') {
        setLostReports(
          Array.isArray(reportResult.value) ? reportResult.value : []
        )
      }

      if (itemResult.status === 'fulfilled') {
        setFoundItems(
          Array.isArray(itemResult.value) ? itemResult.value : []
        )
      }

      if (
        reportResult.status === 'rejected' ||
        itemResult.status === 'rejected'
      ) {
        setChoiceError(
          'Your claims can still be viewed, but we could not load all options for a new claim. Refresh the page to try again.'
        )
      }

      setLoading(false)
    }

    void loadPage()

    return () => {
      cancelled = true
    }
  }, [navigate, reloadVersion])

  const eligibleLostReports = useMemo(
    () =>
      lostReports.filter(
        (report) =>
          report.status === 'OPEN' &&
          report.asset?.status === 'ACTIVE'
      ),
    [lostReports]
  )

  const eligibleFoundItems = useMemo(
    () => foundItems.filter((item) => item.status === 'IN_CUSTODY'),
    [foundItems]
  )

  const stats = useMemo(
    () => ({
      total: claims.length,
      pending: claims.filter((claim) => claim.status === 'PENDING').length,
      inReview: claims.filter((claim) => claim.status === 'IN_REVIEW').length,
      approved: claims.filter((claim) => claim.status === 'APPROVED').length,
    }),
    [claims]
  )

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase()

    return claims.filter((claim) => {
      if (statusFilter !== 'ALL' && claim.status !== statusFilter) {
        return false
      }

      if (!query) return true

      const searchableText = [
        claim.id,
        claim.status,
        claim.details,
        claim.decisionNotes,
        claim.lostReport?.asset?.title,
        claim.lostReport?.asset?.category,
        claim.lostReport?.location,
        claim.foundItem?.title,
        claim.foundItem?.category,
        claim.foundItem?.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [claims, search, statusFilter])

  function handleFormChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!form.lostReportId || !form.foundItemId) {
      setError('Select both your lost report and the matching found item.')
      return
    }

    setSubmitting(true)

    try {
      const result = await submitClaim({
        lostReportId: form.lostReportId,
        foundItemId: form.foundItemId,
        details: form.details.trim() || null,
      })

      setForm({ ...INITIAL_FORM })
      setShowForm(false)
      setNotice(result.message || 'Your claim was submitted successfully.')
      setReloadVersion((version) => version + 1)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      const validationMessage = Array.isArray(err.details)
        ? err.details.map((detail) => detail.message).join(' ')
        : ''

      setError(
        validationMessage ||
          err.message ||
          'Unable to submit your claim.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(claim) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this claim? The lost report and found item will become available again.'
    )

    if (!confirmed) return

    setError('')
    setNotice('')
    setCancellingId(claim.id)

    try {
      const result = await cancelClaim(claim.id)

      setNotice(result.message || 'Your claim was cancelled.')
      setReloadVersion((version) => version + 1)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      setError(err.message || 'Unable to cancel this claim.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <main className="space-y-7 pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            BlockFind Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Claims
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Track claims for your lost belongings, review their status,
            and manage claims that are still in progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setReloadVersion((version) => version + 1)
            setNotice('')
          }}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh claims
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

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          {notice}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total claims"
          value={stats.total}
          description="All claims you've submitted"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          description="Waiting for review"
        />
        <StatCard
          title="In review"
          value={stats.inReview}
          description="Being checked by a verifier"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          description="Claims approved by a verifier"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              LOST PROPERTY RECOVERY
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Submit a new claim
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Match one of your open lost reports with an item currently
              held in custody.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((open) => !open)
              setError('')
              setNotice('')
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span aria-hidden="true">{showForm ? '−' : '+'}</span>
            {showForm ? 'Close form' : 'Create claim'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border-t border-blue-100 bg-white p-5 sm:p-6"
          >
            <div>
              <label
                htmlFor="claim-lost-report"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Select your lost report *
              </label>
              <select
                id="claim-lost-report"
                name="lostReportId"
                value={form.lostReportId}
                onChange={handleFormChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">Choose one of your open reports</option>
                {eligibleLostReports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.asset?.title || 'Untitled asset'} —{' '}
                    {report.location}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Only reports that are open and belong to an active asset
                are eligible.
              </p>
            </div>

            <div>
              <label
                htmlFor="claim-found-item"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Select the matching found item *
              </label>
              <select
                id="claim-found-item"
                name="foundItemId"
                value={form.foundItemId}
                onChange={handleFormChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">Choose a found item</option>
                {eligibleFoundItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} — {item.category} — {item.location}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Only items currently in custody can be claimed.
              </p>
            </div>

            <div>
              <label
                htmlFor="claim-details"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Explain why the item belongs to you
              </label>
              <textarea
                id="claim-details"
                name="details"
                value={form.details}
                onChange={handleFormChange}
                maxLength={2000}
                rows={4}
                placeholder="Describe identifying features, contents, or other details that can help verify ownership."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {form.details.length}/2000
              </p>
            </div>

            {(eligibleLostReports.length === 0 ||
              eligibleFoundItems.length === 0) && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                {eligibleLostReports.length === 0
                  ? 'You do not currently have an eligible open lost report.'
                  : 'There are no found items currently in custody available for a new claim.'}
                {' '}You can still view and manage your existing claims.
              </p>
            )}

            {choiceError && (
              <p className="text-sm leading-6 text-amber-700">
                {choiceError}
              </p>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={
                  submitting ||
                  eligibleLostReports.length === 0 ||
                  eligibleFoundItems.length === 0 ||
                  Boolean(choiceError)
                }
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit claim'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowForm(false)
                  setForm({ ...INITIAL_FORM })
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
          <div>
            <label
              htmlFor="claim-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search your claims
            </label>
            <input
              id="claim-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, location, details, or reference"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="claim-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Filter by status
            </label>
            <select
              id="claim-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              {CLAIM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Your submitted claims
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track your claims and their latest available status.
            </p>
          </div>

          {!loading && (
            <span className="text-sm font-medium text-slate-500">
              {filteredClaims.length}{' '}
              {filteredClaims.length === 1 ? 'claim' : 'claims'}
            </span>
          )}
        </div>

        {loading ? (
          <div role="status" className="space-y-4">
            {[1, 2].map((number) => (
              <div
                key={number}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="h-4 w-1/4 rounded bg-slate-100" />
                <div className="mt-4 h-6 w-2/3 rounded bg-slate-100" />
                <div className="mt-4 h-20 rounded bg-slate-50" />
              </div>
            ))}
          </div>
        ) : error && claims.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
            <h3 className="font-semibold text-slate-800">
              Unable to load your claims
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Check the server connection and try again.
            </p>
            <button
              type="button"
              onClick={() => setReloadVersion((version) => version + 1)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              📋
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {claims.length === 0
                ? 'You have no claims yet'
                : 'No matching claims'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {claims.length === 0
                ? 'When you submit a claim for one of your lost belongings, its progress will appear here.'
                : 'Try different search words or select another status.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('ALL')
                }}
                className="mt-5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onCancel={handleCancel}
                cancelling={cancellingId === claim.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}