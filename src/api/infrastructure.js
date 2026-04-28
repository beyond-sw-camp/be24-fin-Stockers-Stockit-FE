import api, { unwrap } from '@/api/axios.js'

export async function getStores(params = {}) {
  const res = await api.get('/api/hq/infrastructure/stores', { params })
  return unwrap(res)
}

export async function createStore(payload) {
  const res = await api.post('/api/hq/infrastructure/stores', payload)
  return unwrap(res)
}

export async function updateStore(storeCode, payload) {
  const res = await api.put(`/api/hq/infrastructure/stores/${storeCode}`, payload)
  return unwrap(res)
}

export async function getWarehouses(params = {}) {
  const res = await api.get('/api/hq/infrastructure/warehouses', { params })
  return unwrap(res)
}

export async function createWarehouse(payload) {
  const res = await api.post('/api/hq/infrastructure/warehouses', payload)
  return unwrap(res)
}

export async function updateWarehouse(warehouseCode, payload) {
  const res = await api.put(`/api/hq/infrastructure/warehouses/${warehouseCode}`, payload)
  return unwrap(res)
}
