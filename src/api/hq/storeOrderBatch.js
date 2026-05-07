import api, { unwrap } from '@/api/axios.js'

export async function getPendingStoreOrderBatchTargets() {
  const res = await api.get('/api/hq/store-orders/batch-approve/pending-stores')
  return unwrap(res)
}

export async function runStoreOrderBatchApprove(payload) {
  const res = await api.post('/api/hq/store-orders/batch-approve/run', payload)
  return unwrap(res)
}
