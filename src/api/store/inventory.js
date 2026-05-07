import api, { unwrap } from '@/api/axios.js'

export async function getStoreInventories() {
  const res = await api.get('/api/store/inventories')
  return unwrap(res)
}

export async function getStoreInventorySkus(itemCode) {
  const res = await api.get(`/api/store/inventories/${itemCode}/skus`)
  return unwrap(res)
}
