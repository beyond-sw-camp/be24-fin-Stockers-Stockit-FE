import api, { unwrap } from '@/api/axios.js'

export async function runStoreOrderBatchApprove(payload) {
  const res = await api.post('/api/hq/store-orders/batch-approve/run', payload)
  return unwrap(res)
}

