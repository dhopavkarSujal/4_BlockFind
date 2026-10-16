
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api'

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem('blockfind_token')

  if (!token) {
    const error = new Error('Please sign in to continue.')
    error.status = 401
    throw error
  }

  const headers = {
    Accept: 'application/json',
    ...(options.body
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error(
      'Cannot connect to the BlockFind server. Check that your backend is running.'
    )
  }

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

// Get found items with optional search and filters.
export async function getFoundItems(filters = {}) {
  const params = new URLSearchParams()

  for (const key of ['search', 'category', 'location']) {
    const value = filters[key]?.trim()

    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  const endpoint = `/found-items${query ? `?${query}` : ''}`

  const data = await request(endpoint)

  return data.items ?? []
}

// Get the details of one found item.
export async function getFoundItemById(id) {
  const data = await request(
    `/found-items/${encodeURIComponent(id)}`
  )

  return data.item
}

// Record a found item.
// The backend permits this only for VERIFIER and ADMIN roles.
export async function createFoundItem(item) {
  return request('/found-items', {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

// Update an existing found item.
export async function updateFoundItem(id, item) {
  return request(`/found-items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(item),
  })
}