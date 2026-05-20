import api, { unwrap } from '@/api/axios.js'

const BASE = '/api/hq/circular-inventory/sales'

// 순환 재고 판매
export async function createCircularSale(payload) {
  const res = await api.post(BASE, payload)
  return unwrap(res)
}

// 순환 재고 판매 내역 목록 조회
export async function getCircularSales(params = {}) {
  const res = await api.get(BASE, { params })
  return unwrap(res)
}

// 순환 재고 판매 내역 상세 조회
export async function getCircularSaleDetail(saleId) {
  const res = await api.get(`${BASE}/${saleId}`)
  return unwrap(res)
}
