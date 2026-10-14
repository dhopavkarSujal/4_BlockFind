
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem('blockfind_token')

  if (!token) {
    const error = new Error('Please sign in to continue.')
    error.status = 401
    throw error
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(
      data.message || 'The request could not be completed.'
    )
    error.status = response.status
    error.details = data.errors || []
    throw error
  }

  return data
}

export async function getMyLostReports() {
  const data = await request('/lost-reports/my')
  return data.reports ?? data.lostReports ?? data.records ?? []
}

export async function getMyAssets() {
  const data = await request('/assets/my')
  return data.assets ?? data.records ?? []
}

export async function createLostReport(report) {
  return request('/lost-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  })
}