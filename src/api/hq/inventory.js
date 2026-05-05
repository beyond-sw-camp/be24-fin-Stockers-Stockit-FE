import api, { unwrap } from '@/api/axios.js'

export async function getCompanyWideInventories(params = {}) {
  const res = await api.get('/api/hq/inventories/company-wide', { params })
  return unwrap(res)
}

export async function getCompanyWideInventorySkus(itemCode, params = {}) {
  const res = await api.get(`/api/hq/inventories/company-wide/${itemCode}/skus`, { params })
  return unwrap(res)
}

export async function refreshCircularCandidates() {
  const res = await api.post('/api/hq/inventories/circular-candidates/refresh')
  return unwrap(res)
}

export async function getCircularCandidates() {
  const res = await api.get('/api/hq/inventories/circular-candidates')
  return unwrap(res)
}
