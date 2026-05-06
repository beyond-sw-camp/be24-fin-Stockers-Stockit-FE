import api, { unwrap } from '@/api/axios.js'

// 발주 요청 (생성)
export async function createStoreOrder(payload) {
  const res = await api.post('/api/store/orders', payload)
  return unwrap(res)
}

// 발주 수정
export async function updateStoreOrder(orderNo, payload) {
  const res = await api.put(`/api/store/orders/${orderNo}`, payload)
  return unwrap(res)
}

// 발주 취소
export async function cancelStoreOrder(orderNo, payload) {
  const res = await api.patch(`/api/store/orders/${orderNo}/cancel`, payload)
  return unwrap(res)
}

// 발주 목록 조회
export async function getStoreOrders(params = {}) {
  const res = await api.get('/api/store/orders', { params })
  return unwrap(res)
}

// 발주 상세 조회
export async function getStoreOrderDetail(orderNo) {
  const res = await api.get(`/api/store/orders/${orderNo}`)
  return unwrap(res)
}

// 발주 분석
export async function getStoreOrderAnalytics(params = {}) {
  const res = await api.get('/api/store/orders/analytics', { params })
  return unwrap(res)
}

