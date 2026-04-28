import api, { unwrap } from '@/api/axios.js'

export async function getProducts(params = {}) {
  const res = await api.get('/api/hq/products', { params })
  return unwrap(res)
}

export async function getProductDetail(productCode) {
  const res = await api.get(`/api/hq/products/${productCode}`)
  return unwrap(res)
}

export async function createProduct(payload) {
  const res = await api.post('/api/hq/products', payload)
  return unwrap(res)
}

export async function updateProduct(productCode, payload) {
  const res = await api.patch(`/api/hq/products/${productCode}`, payload)
  return unwrap(res)
}

export async function deleteProduct(productCode) {
  const res = await api.delete(`/api/hq/products/${productCode}`)
  return unwrap(res)
}

export async function getProductSkus(productCode) {
  const res = await api.get(`/api/hq/products/${productCode}/skus`)
  return unwrap(res)
}

export async function createProductSku(productCode, payload) {
  const res = await api.post(`/api/hq/products/${productCode}/skus`, payload)
  return unwrap(res)
}

export async function createProductSkusBulk(productCode, payload) {
  const res = await api.post(`/api/hq/products/${productCode}/skus/bulk`, payload)
  return unwrap(res)
}

export async function updateProductSku(skuCode, payload) {
  const res = await api.patch(`/api/hq/skus/${skuCode}`, payload)
  return unwrap(res)
}

export async function deleteProductSku(skuCode) {
  const res = await api.delete(`/api/hq/skus/${skuCode}`)
  return unwrap(res)
}
