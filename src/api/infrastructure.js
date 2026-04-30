import api, { unwrap } from '@/api/axios.js'

export async function getStores(params = {}) {
  const res = await api.get('/api/hq/stores', { params })
  return unwrap(res)
}

export async function getStoreByCode(code) {
  const res = await api.get(`/api/hq/stores/${code}`)
  return unwrap(res)
}

export async function createStore(payload) {
  const res = await api.post('/api/hq/stores', payload)
  return unwrap(res)
}

export async function updateStore(storeCode, payload) {
  const res = await api.patch(`/api/hq/stores/${storeCode}`, payload)
  return unwrap(res)
}

export async function getWarehouses(params = {}) {
  const res = await api.get('/api/hq/warehouses', { params })
  return unwrap(res)
}

export async function getWarehouseByCode(code) {
  const res = await api.get(`/api/hq/warehouses/${code}`)
  return unwrap(res)
}

export async function createWarehouse(payload) {
  const res = await api.post('/api/hq/warehouses', payload)
  return unwrap(res)
}

export async function updateWarehouse(warehouseCode, payload) {
  const res = await api.patch(`/api/hq/warehouses/${warehouseCode}`, payload)
  return unwrap(res)
}
