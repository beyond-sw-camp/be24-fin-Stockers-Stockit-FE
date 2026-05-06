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

export async function getCircularInventories() {
  const res = await api.get('/api/hq/inventories/circular')
  return unwrap(res)
}

export async function getCircularMaterialPrices() {
  const res = await api.get('/api/hq/circular-material-prices')
  return unwrap(res)
}

export async function updateCircularMaterialPrice(materialCode, payload = {}) {
  const res = await api.put(`/api/hq/circular-material-prices/${materialCode}`, payload)
  return unwrap(res)
}

export async function convertCircularCandidates(items = []) {
  const res = await api.post('/api/hq/inventories/circular-candidates/convert', items)
  return unwrap(res)
}

export async function getWarehouseTransferImbalancedSkus() {
  const res = await api.get('/api/hq/warehouse-transfers/imbalanced-skus')
  return unwrap(res)
}

export async function executeWarehouseTransfers(payload = {}) {
  const res = await api.post('/api/hq/warehouse-transfers/execute', payload)
  return unwrap(res)
}

export async function getWarehouseTransfers(params = {}) {
  const res = await api.get('/api/hq/warehouse-transfers', { params })
  return unwrap(res)
}

export async function getWarehouseTransferDetail(transferNo) {
  const res = await api.get(`/api/hq/warehouse-transfers/${transferNo}`)
  return unwrap(res)
}

export async function getWarehouseSkuDistribution(skuCode) {
  const res = await api.get('/api/hq/warehouse-transfers/sku-distribution', {
    params: { skuCode },
  })
  return unwrap(res)
}
