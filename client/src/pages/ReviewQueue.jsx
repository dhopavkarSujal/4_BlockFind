
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  decideClaim,
  getReviewQueue,
  startClaimReview,
} from '../services/claim-review.service.js'

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

function statusClasses(status) {
  if (status === 'PENDING') {
    return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  }

  return 'bg-blue-50 text-blue-700 ring-blue-600/20'
}

function SummaryCard({ title, value, description }) {
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

function ClaimReviewCard({
  claim,
  notes,
  onNotesChange,
  onStartReview,
  onDecision,
  working,
}) {
  const asset = claim.lostReport?.asset
  const foundItem = claim.foundItem
  const isPending = claim.status === 'PENDING'
  const isInReview = claim.status === 'IN_REVIEW'

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
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            {asset?.title || 'Lost item'}
            <span className="mx-2 text-slate-300">→</span>
            {foundItem?.title || 'Found item'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Submitted {formatDate(claim.createdAt)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusClasses(claim.status)}`}
        >
          {formatStatus(claim.status)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lost report
          </p>
          <p className="mt-2 font-semibold text-slate-800">
            {asset?.title || 'Not available'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {asset?.category || 'Category not available'}
          </p>
          {claim.lostReport?.location && (
            <p className="mt-3 break-words text-sm text-slate-600">
              Lost at: {claim.lostReport.location}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Found item
          </p>
          <p className="mt-2 font-semibold text-slate-800">
            {foundItem?.title || 'Not available'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {foundItem?.category || 'Category not available'}
          </p>
          {foundItem?.location && (
            <p className="mt-3 break-words text-sm text-slate-600">
              Found at: {foundItem.location}
            </p>
          )}
          {(foundItem?.brand || foundItem?.model) && (
            <p className="mt-2 text-sm text-slate-600">
              {[foundItem.brand, foundItem.model]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-700">
          Claimant
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {claim.claimant?.name || 'Name not available'}
          {claim.claimant?.email ? ` · ${claim.claimant.email}` : ''}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-700">
          Claimant's explanation
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
          {claim.details || 'No additional details supplied.'}
        </p>
      </div>

      {isInReview && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <label
            htmlFor={`review-notes-${claim.id}`}
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Decision notes (optional)
          </label>
          <textarea
            id={`review-notes-${claim.id}`}
            value={notes}
            onChange={(event) =>
              onNotesChange(claim.id, event.target.value)
            }
            maxLength={1000}
            rows={3}
            placeholder="Record the reason for your decision or verification observations."
            className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {notes.length}/1000
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        {isPending && (
          <button
            type="button"
            disabled={working}
            onClick={() => onStartReview(claim)}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working ? 'Updating...' : 'Start review'}
          </button>
        )}

        {isInReview && (
          <>
            <button
              type="button"
              disabled={working}
              onClick={() => onDecision(claim, 'APPROVED')}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working ? 'Processing...' : 'Approve claim'}
            </button>

            <button
              type="button"
              disabled={working}
              onClick={() => onDecision(claim, 'REJECTED')}
              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working ? 'Processing...' : 'Reject claim'}
            </button>
          </>
        )}
      </div>
    </article>
  )
}

export default function ReviewQueue() {
  const navigate = useNavigate()

  const [claims, setClaims] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [notesByClaim, setNotesByClaim] = useState({})

  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadQueue() {
      setLoading(true)
      setError('')

      try {
        const result = await getReviewQueue(statusFilter)

        if (!cancelled) {
          setClaims(result)
        }
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        setError(
          err.status === 403
            ? 'Access denied. Only authorized verifiers and administrators can access this review queue.'
            : err.message || 'Unable to load the claim review queue.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadQueue()

    return () => {
      cancelled = true
    }
  }, [navigate, statusFilter, reloadVersion])

  const visibleClaims = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return claims

    return claims.filter((claim) => {
      const text = [
        claim.id,
        claim.status,
        claim.claimant?.name,
        claim.claimant?.email,
        claim.details,
        claim.lostReport?.asset?.title,
        claim.lostReport?.location,
        claim.foundItem?.title,
        claim.foundItem?.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(query)
    })
  }, [claims, search])

  const pendingCount = claims.filter(
    (claim) => claim.status === 'PENDING'
  ).length

  const inReviewCount = claims.filter(
    (claim) => claim.status === 'IN_REVIEW'
  ).length

  async function handleStartReview(claim) {
    const confirmed = window.confirm(
      'Start reviewing this claim? It will move from Pending to In Review.'
    )

    if (!confirmed) return

    setWorkingId(claim.id)
    setError('')
    setNotice('')

    try {
      const result = await startClaimReview(claim.id)
      setNotice(result.message || 'Claim moved into review.')
      setReloadVersion((version) => version + 1)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      setError(err.message || 'Unable to start the claim review.')
    } finally {
      setWorkingId(null)
    }
  }

  async function handleDecision(claim, decision) {
    const action = decision === 'APPROVED' ? 'approve' : 'reject'

    const confirmed = window.confirm(
      decision === 'APPROVED'
        ? 'Approve this claim? The backend will mark the lost report as resolved, release the found item, and create a recovery record.'
        : 'Reject this claim? The backend will return the lost report and found item to their available statuses.'
    )

    if (!confirmed) return

    setWorkingId(claim.id)
    setError('')
    setNotice('')

    try {
      const result = await decideClaim(
        claim.id,
        decision,
        notesByClaim[claim.id] || ''
      )

      setNotice(
        result.message || `Claim ${action}d successfully.`
      )

      setNotesByClaim((current) => {
        const next = { ...current }
        delete next[claim.id]
        return next
      })

      setReloadVersion((version) => version + 1)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      setError(err.message || `Unable to ${action} this claim.`)
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <main className="space-y-7 pb-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          BlockFind Workspace
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Claim Review Queue
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Verify ownership claims, inspect the lost and found records,
          and make a decision when your review is complete.
        </p>
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Claims in this queue"
          value={claims.length}
          description="Claims returned by the backend filter"
        />
        <SummaryCard
          title="Pending"
          value={pendingCount}
          description="Claims ready to be reviewed"
        />
        <SummaryCard
          title="In review"
          value={inReviewCount}
          description="Claims awaiting a decision"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="review-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search claims
            </label>
            <input
              id="review-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Claim ID, claimant, item, or location"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="review-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Review status
            </label>
            <select
              id="review-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All active claims</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => setReloadVersion((version) => version + 1)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh queue
          </button>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Claims requiring attention
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search locally within the claims returned for the selected status.
          </p>
        </div>

        {loading ? (
          <div role="status" className="space-y-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="h-5 w-1/3 rounded bg-slate-100" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-4 h-24 rounded bg-slate-50" />
              </div>
            ))}
          </div>
        ) : error && claims.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
            <h3 className="font-semibold text-slate-800">
              Claim queue unavailable
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in with a verifier or administrator account and retry.
            </p>
            <button
              type="button"
              onClick={() => setReloadVersion((version) => version + 1)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : visibleClaims.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              ✓
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {claims.length === 0
                ? 'No active claims in this queue'
                : 'No matching claims'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {claims.length === 0
                ? 'New claims will appear here when users submit them.'
                : 'Try a different search phrase or change the status filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleClaims.map((claim) => (
              <ClaimReviewCard
                key={claim.id}
                claim={claim}
                notes={notesByClaim[claim.id] || ''}
                onNotesChange={(id, value) =>
                  setNotesByClaim((current) => ({
                    ...current,
                    [id]: value,
                  }))
                }
                onStartReview={handleStartReview}
                onDecision={handleDecision}
                working={workingId === claim.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}