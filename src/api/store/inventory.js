import api, { unwrap } from '@/api/axios.js'

const BASE = '/api/store/inventories'

// 매장 재고 마스터(품목 단위) 페이지 조회.
// params: { category?, status?, keyword?, page, size }
export async function getStoreInventories(params = {}) {
  const res = await api.get(BASE, { params })
  return unwrap(res)
}

// 매장 재고 SKU 단위 페이지 조회 (모드 토글 SKU 모드 — 마스터 무관 모든 SKU 한 표).
// params: { category?, status?, color?, skuSize?, keyword?, page, size }
// skuSize: SKU 사이즈 (M/L/XL) — Pageable size 와 충돌 방지 위해 별도 키.
export async function getStoreInventorySkus(params = {}) {
  const res = await api.get(`${BASE}/skus`, { params })
  return unwrap(res)
}

// 매장 재고 SKU 칩 필터용 facets — 거점/카테고리/검색 조건 안의 가능한 색상/사이즈 distinct.
// 응답: { colors: [...], sizes: [...] }
export async function getStoreInventorySkuFacets(params = {}) {
  const res = await api.get(`${BASE}/skus/facets`, { params })
  return unwrap(res)
}
