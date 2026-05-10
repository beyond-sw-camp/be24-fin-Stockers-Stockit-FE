import api, { unwrap } from '@/api/axios.js'

const BASE = '/api/warehouse/outbound'

// 출고 내역 목록 조회
export async function getWarehouseOutboundList(params = {}) {
  const query = {}
  if (params.status) query.status = params.status
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to
  if (params.keyword) query.keyword = params.keyword
  const res = await api.get(BASE, { params: query })
  return unwrap(res)
}

// 출고 내역 상세 조회
export async function getWarehouseOutboundDetail(outboundNo) {
  const res = await api.get(`${BASE}/${outboundNo}`)
  return unwrap(res)
}

// 출고 확정 처리 (출고 준비 중 -> 배송 중 전환)
export async function confirmWarehouseOutbound(outboundNo, reason) {
  const body = reason ? { reason } : {}
  const res = await api.post(`${BASE}/${outboundNo}/confirm`, body)
  return unwrap(res)
}

// 배송 완료 처리 (배송 중 -> 배송 완료 전환)
export async function arriveWarehouseOutbound(outboundNo, reason) {
  const body = reason ? { reason } : {}
  const res = await api.post(`${BASE}/${outboundNo}/arrive`, body)
  return unwrap(res)
}
