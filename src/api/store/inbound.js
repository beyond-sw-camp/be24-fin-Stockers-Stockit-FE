import api, { unwrap } from '@/api/axios.js'

const BASE = '/api/store/inbound'

// 입고 내역 목록 조회
export async function getStoreInboundList(params = {}) {
  const query = {}
  if (params.status) query.status = params.status
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to
  if (params.keyword) query.keyword = params.keyword
  const res = await api.get(BASE, { params: query })
  return unwrap(res)
}

// 입고 내역 상세 조회
export async function getStoreInboundDetail(inboundNo) {
  const res = await api.get(`${BASE}/${inboundNo}`)
  return unwrap(res)
}

// 입고 확정 처리
export async function confirmStoreInbound(inboundNo, reason) {
  const query = reason ? { params: { reason } } : undefined
  const res = await api.post(`${BASE}/${inboundNo}/confirm`, null, query)
  return unwrap(res)
}
