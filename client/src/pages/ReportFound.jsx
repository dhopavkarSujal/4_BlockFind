
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePlus2,
  MapPin,
  PackageSearch,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';

import {
  createFoundReport,
  getMyFoundReports,
} from '../services/found-report.service.js';

const EMPTY_FORM = {
  title: '',
  category: '',
  location: '',
  foundAt: '',
  description: '',
  brand: '',
  model: '',
};

const CATEGORIES = [
  'Electronics',
  'Bags & Wallets',
  'Keys',
  'Documents',
  'Clothing',
  'Accessories',
  'Books',
  'Other',
];

const STATUS_STYLES = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-200',
  IN_REVIEW: 'bg-blue-50 text-blue-800 ring-blue-200',
  NEEDS_INFO: 'bg-violet-50 text-violet-800 ring-violet-200',
  REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  ACCEPTED_IN_CUSTODY:
    'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50';

function formatDate(value) {
  if (!value) return 'Date not provided';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date not provided';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(value.includes?.('T')
      ? { hour: '2-digit', minute: '2-digit' }
      : {}),
  }).format(date);
}

function formatStatus(status = '') {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ReportStatus({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] ||
        'bg-slate-100 text-slate-700 ring-slate-200'
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function ReportCard({ report }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-200 hover:shadow-md sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <PackageSearch size={21} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {report.category}
          </p>
          <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
            {report.title}
          </h3>
        </div>

        <ReportStatus status={report.status} />
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <MapPin
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs text-slate-500">Found at</p>
            <p className="mt-0.5 break-words font-medium text-slate-700">
              {report.location}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <CalendarDays
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs text-slate-500">Date found</p>
            <p className="mt-0.5 font-medium text-slate-700">
              {formatDate(report.foundAt)}
            </p>
          </div>
        </div>

        {report.description && (
          <p className="border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">
            {report.description}
          </p>
        )}
      </div>

      {report.reviewNotes && (
        <div className="mt-4 rounded-xl bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-900">
            Verifier's note
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-800">
            {report.reviewNotes}
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
        Submitted {formatDate(report.createdAt)}
      </div>

      {report.status === 'ACCEPTED_IN_CUSTODY' && (
        <Link
          to="/dashboard/found-items"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          View found items
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

export default function ReportFound() {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setLoadError('');

      try {
        const result = await getMyFoundReports();

        if (!cancelled) {
          setReports(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        if (cancelled) return;

        if (err.status === 401) {
          navigate('/login', { replace: true });
          return;
        }

        setLoadError(
          err.message || 'Unable to load your found-item reports.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [navigate, reloadVersion]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
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
      };

      await createFoundReport(payload);

      setForm(EMPTY_FORM);
      setSuccess(
        'Your report was submitted successfully. A verifier will review it.',
      );
      setReloadVersion((version) => version + 1);
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const validationMessage = Array.isArray(err.details)
        ? err.details
            .map((detail) => detail.message)
            .filter(Boolean)
            .join(' ')
        : '';

      setError(
        validationMessage ||
          err.message ||
          'Unable to submit your report. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Community lost & found
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Report a found item
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Found something on campus? Tell us about it so a verifier can
            review the report and help return it to its rightful owner.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 sm:self-auto">
          <ShieldCheck size={19} aria-hidden="true" />
          Verified before listing
        </div>
      </header>

      {/* Workflow information */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            number: '01',
            title: 'Submit your report',
            description: 'Describe what you found and where.',
            icon: FilePlus2,
          },
          {
            number: '02',
            title: 'Verifier review',
            description: 'The verifier checks details and custody.',
            icon: ShieldCheck,
          },
          {
            number: '03',
            title: 'Help it find its owner',
            description: 'Accepted items can appear in Found Items.',
            icon: CheckCircle2,
          },
        ].map((step) => {
          const Icon = step.icon;

          return (
            <article
              key={step.number}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold tracking-wider text-slate-400">
                  STEP {step.number}
                </span>
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                {step.title}
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {step.description}
              </p>
            </article>
          );
        })}
      </section>

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={20} className="shrink-0" aria-hidden="true" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Found-report form */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <h2 className="text-xl font-bold text-slate-900">
              Item details
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Provide enough information for the verifier to identify the item.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
            <Field label="Item name *" htmlFor="found-report-title">
              <input
                id="found-report-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Black wireless headphones"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Category *" htmlFor="found-report-category">
              <select
                id="found-report-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
              >
                <option value="">Choose a category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Where did you find it? *" htmlFor="found-report-location">
              <input
                id="found-report-location"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={200}
                placeholder="e.g. College library, Room 204"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Date and time found" htmlFor="found-report-date">
              <input
                id="found-report-date"
                type="datetime-local"
                name="foundAt"
                value={form.foundAt}
                onChange={handleChange}
                className={INPUT_CLASS}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Brand (optional)" htmlFor="found-report-brand">
                <input
                  id="found-report-brand"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  maxLength={80}
                  placeholder="e.g. Sony"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Model (optional)" htmlFor="found-report-model">
                <input
                  id="found-report-model"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  maxLength={80}
                  placeholder="Model or variant"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <Field
              label="Description (optional)"
              htmlFor="found-report-description"
            >
              <textarea
                id="found-report-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                placeholder="Describe the item's condition or any relevant identifying details."
                className={`${INPUT_CLASS} resize-y`}
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {form.description.length}/1000
              </p>
            </Field>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-900">
                Please keep the item safe and follow your institution's
                procedure for handing it to an authorized verifier. Submitting
                this report alone does not confirm physical custody.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Submitting report...
                  </>
                ) : (
                  <>
                    <Send size={18} aria-hidden="true" />
                    Submit found report
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setError('');
                  setSuccess('');
                }}
                className="min-h-12 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        {/* User's submitted reports */}
        <section>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My found reports
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Track the verification progress of your submissions.
              </p>
            </div>

            <button
              type="button"
              aria-label="Refresh found reports"
              title="Refresh found reports"
              disabled={loading}
              onClick={() => setReloadVersion((version) => version + 1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={17} aria-hidden="true" />
            </button>
          </div>

          {loadError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <p className="text-sm leading-6 text-red-700">{loadError}</p>
              <button
                type="button"
                onClick={() => setReloadVersion((version) => version + 1)}
                className="mt-3 text-sm font-semibold text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div role="status" className="mt-5 space-y-4">
              <span className="sr-only">Loading your reports...</span>
              {[1, 2].map((number) => (
                <div
                  key={number}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-5 w-1/2 rounded bg-slate-100" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 && !loadError ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <FilePlus2 size={25} aria-hidden="true" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No reports yet
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Submit your first found-item report. You can track its review
                status here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Clock3
              size={19}
              className="mt-0.5 shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-slate-600">
              Items become available in the public catalogue only after the
              required verification and custody checks are completed.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}