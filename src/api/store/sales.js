import api, { unwrap } from '@/api/axios.js'

// 판매 등록
export async function createSale(payload) {
  const res = await api.post('/api/store/sales', payload)
  return unwrap(res)
}

// 판매 목록 조회
export async function getSales(params = {}) {
  const res = await api.get('/api/store/sales', { params })
  return unwrap(res)
}

// 판매 상세 조회
export async function getSaleDetail(saleNo) {
  const res = await api.get(`/api/store/sales/${saleNo}`)
  return unwrap(res)
}

