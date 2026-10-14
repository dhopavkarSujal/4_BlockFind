
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createFoundItem,
  getFoundItems,
} from '../services/found-item.service'

const EMPTY_FORM = {
  title: '',
  category: '',
  location: '',
  foundAt: '',
  description: '',
  brand: '',
  model: '',
}

const COMMON_CATEGORIES = [
  'Electronics',
  'Bags & Wallets',
  'Keys',
  'Documents',
  'Clothing',
  'Accessories',
  'Books',
  'Other',
]

function getStoredRole() {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem('blockfind_user') || '{}'
    )

    return String(
      stored.role ??
        stored.user?.role ??
        stored.data?.user?.role ??
        ''
    ).toUpperCase()
  } catch {
    return ''
  }
}

function formatDate(value) {
  if (!value) return 'Date not provided'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date not provided'

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getCategoryIcon(category = '') {
  const value = category.toLowerCase()

  if (value.includes('electronic')) return '💻'
  if (value.includes('bag') || value.includes('wallet')) return '🎒'
  if (value.includes('key')) return '🔑'
  if (value.includes('document')) return '📄'
  if (value.includes('cloth')) return '👕'
  if (value.includes('accessor')) return '⌚'
  if (value.includes('book')) return '📚'

  return '📦'
}

function getStatusStyle(status) {
  if (status === 'IN_CUSTODY') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  }

  if (status === 'CLAIM_PENDING') {
    return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  }

  return 'bg-slate-100 text-slate-600 ring-slate-500/20'
}

function formatStatus(status = '') {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  )
}

function FoundItemCard({ item }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
          {getCategoryIcon(item.category)}
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(item.status)}`}
        >
          {formatStatus(item.status)}
        </span>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          {item.category}
        </p>

        <h2 className="mt-2 break-words text-lg font-bold text-slate-900">
          {item.title}
        </h2>

        {(item.brand || item.model) && (
          <p className="mt-1 text-sm text-slate-500">
            {[item.brand, item.model].filter(Boolean).join(' · ')}
          </p>
        )}

        <p className="mt-3 min-h-10 text-sm leading-6 text-slate-600">
          {item.description || 'No additional description provided.'}
        </p>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-base" aria-hidden="true">
            📍
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Found at</p>
            <p className="break-words text-sm font-medium text-slate-800">
              {item.location}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-base" aria-hidden="true">
            📅
          </span>
          <div>
            <p className="text-xs text-slate-500">Date found</p>
            <p className="text-sm font-medium text-slate-800">
              {formatDate(item.foundAt)}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function FoundItems() {
  const navigate = useNavigate()

  const [role] = useState(getStoredRole)
  const canRecord = role === 'VERIFIER' || role === 'ADMIN'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reloadVersion, setReloadVersion] = useState(0)

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
  })

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: '',
    location: '',
  })

  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let cancelled = false

    async function loadItems() {
      setLoading(true)
      setError('')

      try {
        const result = await getFoundItems(appliedFilters)

        if (!cancelled) {
          setItems(Array.isArray(result) ? result : [])
        }
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        setError(
          err.message || 'Unable to load found items. Please try again.'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadItems()

    return () => {
      cancelled = true
    }
  }, [appliedFilters, reloadVersion, navigate])

  const categories = useMemo(() => {
    return [...new Set([
      ...COMMON_CATEGORIES,
      ...items.map((item) => item.category).filter(Boolean),
    ])].sort()
  }, [items])

  const stats = useMemo(() => {
    return {
      total: items.length,
      inCustody: items.filter(
        (item) => item.status === 'IN_CUSTODY'
      ).length,
      claimsPending: items.filter(
        (item) => item.status === 'CLAIM_PENDING'
      ).length,
    }
  }, [items])

  function handleFilterSubmit(event) {
    event.preventDefault()
    setNotice('')
    setAppliedFilters({
      search: filters.search.trim(),
      category: filters.category,
      location: filters.location.trim(),
    })
  }

  function handleFilterReset() {
    const emptyFilters = {
      search: '',
      category: '',
      location: '',
    }

    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setNotice('')
  }

  function handleFormChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleCreateSubmit(event) {
    event.preventDefault()

    if (!canRecord) {
      setError('Only verifiers and administrators can record found items.')
      return
    }

    setSubmitting(true)
    setError('')
    setNotice('')

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      foundAt: form.foundAt
        ? new Date(form.foundAt).toISOString()
        : null,
    }

    try {
      await createFoundItem(payload)

      setForm({ ...EMPTY_FORM })
      setShowForm(false)
      setNotice('Found item recorded successfully.')
      setReloadVersion((version) => version + 1)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (err.status === 403) {
        setError(
          'Your account does not have permission to record found items.'
        )
        return
      }

      const validationMessage = Array.isArray(err.details)
        ? err.details.map((detail) => detail.message).join(' ')
        : ''

      setError(
        validationMessage ||
          err.message ||
          'Unable to record this item. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="space-y-7 pb-8">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            BlockFind Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Found Items
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Browse recovered belongings, find items reported by others,
            and help return lost property to its rightful owner.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setReloadVersion((version) => version + 1)
            setNotice('')
          }}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <span aria-hidden="true">↻</span>
          Refresh
        </button>
      </section>

      {/* Feedback messages */}
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

      {/* Overview statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Matching items"
          value={stats.total}
          description="Items returned by your current filters"
        />
        <StatCard
          label="In custody"
          value={stats.inCustody}
          description="Items awaiting their owners"
        />
        <StatCard
          label="Claims pending"
          value={stats.claimsPending}
          description="Items with claims in progress"
        />
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Find an item
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search by item name, description, brand, category, or location.
          </p>
        </div>

        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="item-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search keywords
              </label>
              <input
                id="item-search"
                type="search"
                value={filters.search}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    search: event.target.value,
                  })
                }
                placeholder="e.g. black headphones"
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="item-category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category
              </label>
              <select
                id="item-category"
                value={filters.category}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    category: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="item-location"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Location
              </label>
              <input
                id="item-location"
                type="text"
                value={filters.location}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    location: event.target.value,
                  })
                }
                placeholder="e.g. College library"
                maxLength={200}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search items
            </button>

            <button
              type="button"
              onClick={handleFilterReset}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </form>
      </section>

      {/* Role-aware recording section */}
      {canRecord ? (
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                VERIFIER / ADMIN
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Record a found item
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Add details so the rightful owner can identify their property.
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
              {showForm ? 'Close form' : 'Report found item'}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleCreateSubmit}
              className="space-y-5 border-t border-blue-100 bg-white p-5 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="found-title"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Item name *
                  </label>
                  <input
                    id="found-title"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Black wireless headphones"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="found-category"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Category *
                  </label>
                  <input
                    id="found-category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    required
                    minLength={2}
                    maxLength={80}
                    list="found-categories"
                    placeholder="Choose or enter a category"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                  <datalist id="found-categories">
                    {COMMON_CATEGORIES.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label
                    htmlFor="found-location"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Found location *
                  </label>
                  <input
                    id="found-location"
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder="Where was the item found?"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="found-date"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Date and time found
                  </label>
                  <input
                    id="found-date"
                    name="foundAt"
                    type="datetime-local"
                    value={form.foundAt}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="found-brand"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Brand (optional)
                  </label>
                  <input
                    id="found-brand"
                    name="brand"
                    value={form.brand}
                    onChange={handleFormChange}
                    maxLength={80}
                    placeholder="e.g. Sony"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="found-model"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Model (optional)
                  </label>
                  <input
                    id="found-model"
                    name="model"
                    value={form.model}
                    onChange={handleFormChange}
                    maxLength={80}
                    placeholder="Model or identifying variant"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="found-description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="found-description"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    maxLength={1000}
                    rows={4}
                    placeholder="Add identifying details, condition, or where it was handed in."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.description.length}/1000
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Saving item...' : 'Save found item'}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowForm(false)
                    setForm({ ...EMPTY_FORM })
                    setError('')
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <span className="text-xl" aria-hidden="true">ℹ</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Item registration is restricted
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Your account can browse found items. Only authorized verifiers
              and administrators can create or edit found-item records.
            </p>
          </div>
        </section>
      )}

      {/* Items listing */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Recent found items
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse currently visible items reported to BlockFind.
            </p>
          </div>

          {!loading && (
            <span className="text-sm font-medium text-slate-500">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {loading ? (
          <div
            role="status"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                <div className="mt-5 h-4 w-1/3 rounded bg-slate-100" />
                <div className="mt-3 h-6 w-3/4 rounded bg-slate-100" />
                <div className="mt-4 h-4 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
                <div className="mt-6 h-16 rounded bg-slate-50" />
              </div>
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
            <p className="text-base font-semibold text-slate-800">
              Found items could not be loaded
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Check your backend connection and try again.
            </p>
            <button
              type="button"
              onClick={() => setReloadVersion((version) => version + 1)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              📦
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No found items to display
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are no items matching your filters. Try another search
              or clear the filters to see more results.
            </p>
            <button
              type="button"
              onClick={handleFilterReset}
              className="mt-5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <FoundItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}