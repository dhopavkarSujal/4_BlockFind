import { apiRequest } from './api.js'

// Fetch recovery history for the signed-in user.
export async function getMyRecoveries({
  page = 1,
  pageSize = 10,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  const data = await apiRequest(`/recoveries/my?${params.toString()}`)

  return {
    records: Array.isArray(data.records) ? data.records : [],
    total: Number(data.total ?? 0),
    page: Number(data.page ?? page),
    pageSize: Number(data.pageSize ?? pageSize),
  }
}