import { apiRequest } from './api.js'

// Fetch claims submitted by the signed-in user.
export async function getMyClaims() {
  const data = await apiRequest('/claims/my')
  return Array.isArray(data.claims) ? data.claims : []
}

// Submit a claim for one of the user's lost reports and a found item.
export async function submitClaim(claim) {
  return apiRequest('/claims', {
    method: 'POST',
    body: JSON.stringify(claim),
  })
}

// Cancel a pending or in-review claim.
export async function cancelClaim(id) {
  return apiRequest(`/claims/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  })
}