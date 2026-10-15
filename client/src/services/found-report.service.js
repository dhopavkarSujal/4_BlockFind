
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem('blockfind_token');

  if (!token) {
    const error = new Error('Please sign in to continue.');
    error.status = 401;
    throw error;
  }

  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Cannot connect to BlockFind. Check that the backend is running.',
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || 'The request could not be completed.',
    );

    error.status = response.status;
    error.details = data.errors || [];
    throw error;
  }

  return data;
}

// Submit a new found-item report.
export async function createFoundReport(report) {
  const data = await request('/found-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });

  return data.report;
}

// Retrieve the current user's found reports.
export async function getMyFoundReports() {
  const data = await request('/found-reports/my');
  return data.reports ?? [];
}

// Resubmit a report after additional information is requested.
export async function resubmitFoundReport(id, report) {
  const data = await request(
    `/found-reports/${encodeURIComponent(id)}/resubmit`,
    {
      method: 'PATCH',
      body: JSON.stringify(report),
    },
  );

  return data.report;
}

// Retrieve the verifier/admin review queue.
export async function getFoundReportReviewQueue(status = '') {
  const params = new URLSearchParams();

  if (status) {
    params.set('status', status);
  }

  const query = params.toString();
  const endpoint = `/found-reports/review-queue${
    query ? `?${query}` : ''
  }`;

  const data = await request(endpoint);

  if (!Array.isArray(data.reports)) {
    throw new Error(
      'The server returned an unexpected found-report review queue.',
    );
  }

  return data.reports;
}

// Move a pending report into review.
export async function startFoundReportReview(id) {
  return request(
    `/found-reports/${encodeURIComponent(id)}/start-review`,
    { method: 'POST' },
  );
}

// Submit a verifier's decision.
export async function decideFoundReport(
  id,
  decision,
  reviewNotes = '',
  confirmCustody = false,
) {
  return request(
    `/found-reports/${encodeURIComponent(id)}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        decision,
        reviewNotes: reviewNotes.trim() || undefined,
        ...(decision === 'ACCEPTED_IN_CUSTODY'
          ? { confirmCustody }
          : {}),
      }),
    },
  );
}