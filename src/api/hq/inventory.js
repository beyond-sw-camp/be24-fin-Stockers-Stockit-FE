import api, { unwrap } from '@/api/axios.js'

export async function getCompanyWideInventories(params = {}) {
  const res = await api.get('/api/hq/inventories/company-wide', { params })
  return unwrap(res)
}

// SKU 단위 페이지 조회 (모드 토글 SKU 모드 — 마스터 무관 모든 SKU 한 표).
// params: { locationType?, locationIds?, category?, status?, color?, skuSize?, keyword?, page, size }
// skuSize: SKU 사이즈 (M/L/XL) — Pageable size 와 충돌 방지 위해 별도 키.
export async function getCompanyWideInventorySkus(params = {}) {
  const res = await api.get('/api/hq/inventories/company-wide/skus', { params })
  return unwrap(res)
}

// SKU 칩 필터용 facets — 거점/카테고리/검색 조건 안의 가능한 색상/사이즈 distinct.
// 응답: { colors: [...], sizes: [...] }
export async function getCompanyWideInventorySkuFacets(params = {}) {
  const res = await api.get('/api/hq/inventories/company-wide/skus/facets', { params })
  return unwrap(res)
}

export async function refreshCircularCandidates() {
  const res = await api.post('/api/hq/inventories/circular-candidates/refresh')
  return unwrap(res)
}

export async function getCircularCandidates(params = {}) {
  const res = await api.get('/api/hq/inventories/circular-candidates', { params })
  return unwrap(res)
}

export async function getCircularInventories(params = {}) {
  const res = await api.get('/api/hq/inventories/circular', { params })
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
