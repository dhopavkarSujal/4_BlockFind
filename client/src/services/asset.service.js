import { apiRequest } from './api.js'

// Retrieve assets belonging to the signed-in user.
export async function getMyAssets() {
  const data = await apiRequest('/assets/my')

  return Array.isArray(data.assets) ? data.assets : []
}

// Register an asset for the signed-in user.
export async function registerAsset(assetData) {
  return apiRequest('/assets', {
    method: 'POST',
    body: JSON.stringify(assetData),
  })
}