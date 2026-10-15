
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  decideFoundReport,
  getFoundReportReviewQueue,
  startFoundReportReview,
} from '../services/found-report.service.js';

function formatDate(value) {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatStatus(status = '') {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function statusClasses(status) {
  if (status === 'PENDING_REVIEW') {
    return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  }

  if (status === 'IN_REVIEW') {
    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
  }

  return 'bg-slate-100 text-slate-700 ring-slate-500/20';
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
  );
}

function FoundReportCard({
  report,
  notes,
  onNotesChange,
  confirmCustody,
  onCustodyChange,
  onStartReview,
  onDecision,
  working,
}) {
  const isPending = report.status === 'PENDING_REVIEW';
  const isInReview = report.status === 'IN_REVIEW';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Found report reference
          </p>

          <p className="mt-1 break-all font-mono text-xs text-slate-500">
            {report.id}
          </p>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            {report.title}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Submitted {formatDate(report.createdAt)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusClasses(report.status)}`}
        >
          {formatStatus(report.status)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Item details
          </p>

          <p className="mt-2 font-semibold text-slate-800">
            {report.title}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Category: {report.category}
          </p>

          {(report.brand || report.model) && (
            <p className="mt-2 text-sm text-slate-600">
              {[report.brand, report.model].filter(Boolean).join(' · ')}
            </p>
          )}

          <p className="mt-3 text-sm text-slate-600">
            Found location: {report.location}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Date found: {formatDate(report.foundAt)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reporter
          </p>

          <p className="mt-2 font-semibold text-slate-800">
            {report.reporter?.name || 'Name not available'}
          </p>

          <p className="mt-1 break-words text-sm text-slate-600">
            {report.reporter?.email || 'Email not available'}
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Report ID: {report.id}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-700">
          Description
        </p>

        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
          {report.description || 'No additional description supplied.'}
        </p>
      </div>

      {report.reviewNotes && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Previous review notes
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-amber-800">
            {report.reviewNotes}
          </p>
        </div>
      )}

      {isInReview && (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
          <div>
            <label
              htmlFor={`report-notes-${report.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Review notes
            </label>

            <textarea
              id={`report-notes-${report.id}`}
              value={notes}
              onChange={(event) =>
                onNotesChange(report.id, event.target.value)
              }
              maxLength={1000}
              rows={3}
              placeholder="Required when requesting information or rejecting a report."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {notes.length}/1000 characters
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <input
              type="checkbox"
              checked={confirmCustody}
              onChange={(event) =>
                onCustodyChange(report.id, event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-emerald-600"
            />

            <span>
              <span className="block text-sm font-semibold text-emerald-900">
                Confirm physical custody
              </span>
              <span className="mt-1 block text-sm leading-5 text-emerald-800">
                I have physically received and verified this item. I
                understand that accepting this report will publish it in
                Found Items so users can claim it.
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        {isPending && (
          <button
            type="button"
            disabled={working}
            onClick={() => onStartReview(report)}
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
              onClick={() => onDecision(report, 'ACCEPTED_IN_CUSTODY')}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working ? 'Processing...' : 'Accept and publish'}
            </button>

            <button
              type="button"
              disabled={working}
              onClick={() => onDecision(report, 'NEEDS_INFO')}
              className="rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Request information
            </button>

            <button
              type="button"
              disabled={working}
              onClick={() => onDecision(report, 'REJECTED')}
              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject report
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function FoundReportReviewQueue() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [notesByReport, setNotesByReport] = useState({});
  const [custodyByReport, setCustodyByReport] = useState({});

  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadQueue() {
      setLoading(true);
      setError('');

      try {
        const result = await getFoundReportReviewQueue(statusFilter);

        if (!cancelled) {
          setReports(result);
        }
      } catch (err) {
        if (cancelled) return;

        if (err.status === 401) {
          navigate('/login', { replace: true });
          return;
        }

        setError(
          err.status === 403
            ? 'Access denied. Only authorized verifiers and administrators can access this queue.'
            : err.message || 'Unable to load the found-report review queue.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadQueue();

    return () => {
      cancelled = true;
    };
  }, [navigate, statusFilter, reloadVersion]);

  const visibleReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return reports;

    return reports.filter((report) => {
      const searchableText = [
        report.id,
        report.title,
        report.category,
        report.location,
        report.status,
        report.brand,
        report.model,
        report.description,
        report.reporter?.name,
        report.reporter?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [reports, search]);

  const pendingCount = reports.filter(
    (report) => report.status === 'PENDING_REVIEW',
  ).length;

  const inReviewCount = reports.filter(
    (report) => report.status === 'IN_REVIEW',
  ).length;

  async function handleStartReview(report) {
    const confirmed = window.confirm(
      'Start reviewing this found report?',
    );

    if (!confirmed) return;

    setWorkingId(report.id);
    setError('');
    setNotice('');

    try {
      const result = await startFoundReportReview(report.id);

      setNotice(result.message || 'Found report moved into review.');
      setReloadVersion((version) => version + 1);
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      setError(err.message || 'Unable to start the found-report review.');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDecision(report, decision) {
    const notes = notesByReport[report.id] || '';
    const needsNotes = ['NEEDS_INFO', 'REJECTED'].includes(decision);

    if (needsNotes && !notes.trim()) {
      setError(
        decision === 'NEEDS_INFO'
          ? 'Explain what additional information the reporter must provide.'
          : 'Provide a reason before rejecting this report.',
      );
      return;
    }

    const confirmCustody =
      custodyByReport[report.id] === true;

    if (
      decision === 'ACCEPTED_IN_CUSTODY' &&
      !confirmCustody
    ) {
      setError(
        'Confirm physical custody before accepting and publishing this item.',
      );
      return;
    }

    const actionMessages = {
      ACCEPTED_IN_CUSTODY:
        'Confirm that you physically received this item. It will become visible in Found Items.',
      NEEDS_INFO:
        'Request additional information from the reporter?',
      REJECTED:
        'Reject this found report? Make sure your reason is accurate.',
    };

    if (!window.confirm(actionMessages[decision])) return;

    setWorkingId(report.id);
    setError('');
    setNotice('');

    try {
      const result = await decideFoundReport(
        report.id,
        decision,
        notes,
        confirmCustody,
      );

      setNotice(result.message || 'Found report decision saved.');

      setNotesByReport((current) => {
        const next = { ...current };
        delete next[report.id];
        return next;
      });

      setCustodyByReport((current) => {
        const next = { ...current };
        delete next[report.id];
        return next;
      });

      setReloadVersion((version) => version + 1);
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      setError(err.message || 'Unable to process the found report.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="space-y-7 pb-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          BlockFind Workspace
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Found Report Review
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Verify reported found items, review their details, and confirm
          physical custody before publishing an item for ownership claims.
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
          title="Reports in queue"
          value={reports.length}
          description="Reports returned by the selected filter"
        />
        <SummaryCard
          title="Pending review"
          value={pendingCount}
          description="Reports ready for a verifier"
        />
        <SummaryCard
          title="In review"
          value={inReviewCount}
          description="Reports awaiting a decision"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="found-report-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search reports
            </label>

            <input
              id="found-report-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Item, reporter, category, or location"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="found-report-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Review status
            </label>

            <select
              id="found-report-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All active reports</option>
              <option value="PENDING_REVIEW">Pending review</option>
              <option value="IN_REVIEW">In review</option>
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
            Reports requiring attention
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the item details and confirm custody only after the
            physical item has actually been received.
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
        ) : error && reports.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
            <h3 className="font-semibold text-slate-800">
              Found-report queue unavailable
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Check that you are signed in with a verifier or administrator
              account and that the backend is running.
            </p>
            <button
              type="button"
              onClick={() => setReloadVersion((version) => version + 1)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : visibleReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
              ✓
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {reports.length === 0
                ? 'No active found reports'
                : 'No matching reports'}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {reports.length === 0
                ? 'New reports will appear here after users submit them.'
                : 'Try another search phrase or change the status filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleReports.map((report) => (
              <FoundReportCard
                key={report.id}
                report={report}
                notes={notesByReport[report.id] || ''}
                onNotesChange={(id, value) =>
                  setNotesByReport((current) => ({
                    ...current,
                    [id]: value,
                  }))
                }
                confirmCustody={custodyByReport[report.id] === true}
                onCustodyChange={(id, value) =>
                  setCustodyByReport((current) => ({
                    ...current,
                    [id]: value,
                  }))
                }
                onStartReview={handleStartReview}
                onDecision={handleDecision}
                working={workingId === report.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}