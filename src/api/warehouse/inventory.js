import api, { unwrap } from '@/api/axios.js'

export async function getWarehouseInventories(params = {}) {
  const res = await api.get('/api/warehouse/inventories', { params })
  return unwrap(res)
}

export async function getWarehouseInventorySkus(itemCode) {
  const res = await api.get(`/api/warehouse/inventories/${itemCode}/skus`)
  return unwrap(res)
}
