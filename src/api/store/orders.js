import api, { unwrap } from '@/api/axios.js'

export async function createStoreOrder(payload) {
  const res = await api.post('/api/store/orders', payload)
  return unwrap(res)
}

export async function updateStoreOrder(orderNo, payload) {
  const res = await api.put(`/api/store/orders/${orderNo}`, payload)
  return unwrap(res)
}

export async function cancelStoreOrder(orderNo, payload) {
  const res = await api.patch(`/api/store/orders/${orderNo}/cancel`, payload)
  return unwrap(res)
}

export async function getStoreOrders(params = {}) {
  const res = await api.get('/api/store/orders', { params })
  return unwrap(res)
}

export async function getStoreOrderDetail(orderNo) {
  const res = await api.get(`/api/store/orders/${orderNo}`)
  return unwrap(res)
}

export async function getStoreOrderAnalytics(params = {}) {
  const res = await api.get('/api/store/orders/analytics', { params })
  return unwrap(res)
}

