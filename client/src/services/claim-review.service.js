
import { apiRequest } from './api.js'

// List claims awaiting review or currently under review.
export async function getReviewQueue(status = '') {
  const params = new URLSearchParams()

  if (status) {
    params.set('status', status)
  }

  const query = params.toString()
  const endpoint = `/claims/review-queue${query ? `?${query}` : ''}`

  const data = await apiRequest(endpoint)

  return Array.isArray(data.claims) ? data.claims : []
}

// Move a pending claim into review.
export async function startClaimReview(id) {
  return apiRequest(
    `/claims/${encodeURIComponent(id)}/start-review`,
    { method: 'POST' }
  )
}

// Approve or reject a claim already under review.
export async function decideClaim(id, decision, decisionNotes = '') {
  return apiRequest(
    `/claims/${encodeURIComponent(id)}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        decision,
        decisionNotes: decisionNotes.trim() || null,
      }),
    }
  )
}