import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PackagePlus,
  Package,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  Tag,
  LoaderCircle,
} from 'lucide-react'

import {
  getMyAssets,
  registerAsset,
} from '../services/asset.service.js'

const initialForm = {
  title: '',
  category: '',
  description: '',
  brand: '',
  model: '',
  serialNumber: '',
}

function formatStatus(status = 'ACTIVE') {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function RegisterAsset() {
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadAssets() {
    setLoadingAssets(true)
    setLoadError('')

    try {
      const result = await getMyAssets()
      setAssets(result)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      setLoadError(err.message || 'Unable to load your assets.')
    } finally {
      setLoadingAssets(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingAssets(true)
      setLoadError('')

      try {
        const result = await getMyAssets()

        if (!cancelled) {
          setAssets(result)
        }
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        setLoadError(err.message || 'Unable to load your assets.')
      } finally {
        if (!cancelled) {
          setLoadingAssets(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [navigate])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      serialNumber: form.serialNumber.trim() || null,
    }

    if (payload.title.length < 2) {
      setError('The asset title must contain at least 2 characters.')
      return
    }

    if (payload.category.length < 2) {
      setError('The category must contain at least 2 characters.')
      return
    }

    setSaving(true)

    try {
      const result = await registerAsset(payload)

      if (result.asset) {
        setAssets((current) => [
          result.asset,
          ...current.filter((item) => item.id !== result.asset.id),
        ])
      } else {
        // Recover the latest list if the response has no asset object.
        await loadAssets()
      }

      setForm(initialForm)
      setSuccess(result.message || 'Asset registered successfully.')
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      const validationMessages = Array.isArray(err.details)
        ? err.details.map((detail) => detail.message).filter(Boolean)
        : []

      setError(
        validationMessages.length
          ? validationMessages.join(' ')
          : err.message || 'Unable to register the asset.',
      )
    } finally {
      setSaving(false)
    }
  }

  const eligibleAssets = assets.filter(
    (asset) => asset.status === 'ACTIVE',
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <Package size={14} />
            ASSET MANAGEMENT
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Assets
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Register the belongings you own so you can report them
            lost and track their recovery through BlockFind.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <PackagePlus size={22} />
          </div>

          <div>
            <p className="text-2xl font-bold text-slate-900">
              {assets.length}
            </p>
            <p className="text-xs text-slate-500">
              Registered assets
            </p>
          </div>
        </div>
      </section>

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="font-semibold text-emerald-900">
                Registration successful
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                {success}
              </p>
            </div>
          </div>

          <Link
            to="/dashboard/lost-assets"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Report lost item
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Registration form */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <PackagePlus size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Register a new asset
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Fields marked with * are required.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="asset-title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Asset name *
              </label>

              <input
                id="asset-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Wireless headphones"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="asset-category"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Category *
              </label>

              <input
                id="asset-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={80}
                placeholder="e.g. Electronics"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="asset-brand"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Brand
              </label>

              <input
                id="asset-brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                maxLength={80}
                placeholder="e.g. Sony"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="asset-model"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Model
              </label>

              <input
                id="asset-model"
                name="model"
                value={form.model}
                onChange={handleChange}
                maxLength={80}
                placeholder="e.g. WH-1000XM5"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="asset-serial"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Serial number
              </label>

              <input
                id="asset-serial"
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
                maxLength={150}
                placeholder="Enter the serial number if available"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

              <p className="mt-2 text-xs text-slate-400">
                Optional. You can usually find it on the product label,
                box, or device settings.
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="asset-description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="asset-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={1000}
                rows={4}
                placeholder="Describe identifying features, colour, accessories, or other details."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {form.description.length}/1000
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Your asset will be registered under your account.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <PackagePlus size={17} />
                  Register asset
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Existing assets */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Your registered assets
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View the belongings registered to your account.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAssets}
            disabled={loadingAssets}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingAssets ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {loadError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {loadError}
          </div>
        )}

        {loadingAssets ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-12 text-sm text-slate-500">
            <LoaderCircle size={19} className="animate-spin" />
            Loading your assets...
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Package size={25} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No assets registered yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Register your first asset using the form above. It will
              appear here after the backend saves it successfully.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {assets.map((asset) => {
              const isActive = asset.status === 'ACTIVE'

              return (
                <article
                  key={asset.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Package size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-bold text-slate-900">
                          {asset.title}
                        </h3>

                        <span
                          className={[
                            'rounded-full px-2.5 py-1 text-xs font-semibold',
                            isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600',
                          ].join(' ')}
                        >
                          {formatStatus(asset.status)}
                        </span>
                      </div>

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <Tag size={14} />
                        {asset.category}
                      </p>

                      {(asset.brand || asset.model) && (
                        <p className="mt-3 text-sm text-slate-600">
                          {[asset.brand, asset.model]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}

                      {asset.serialNumber && (
                        <p className="mt-2 break-all text-xs text-slate-500">
                          Serial number: {asset.serialNumber}
                        </p>
                      )}

                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <CalendarDays size={14} />
                        Registered {formatDate(asset.createdAt)}
                      </p>
                    </div>
                  </div>

                  {asset.description && (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {asset.description}
                    </p>
                  )}

                  {isActive && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <Link
                        to="/dashboard/lost-assets"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                      >
                        Report this item lost
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {!loadingAssets && eligibleAssets.length > 0 && (
          <p className="text-xs text-slate-500">
            {eligibleAssets.length} active{' '}
            {eligibleAssets.length === 1 ? 'asset is' : 'assets are'}{' '}
            available for a new lost report, subject to existing reports.
          </p>
        )}
      </section>
    </div>
  )
}