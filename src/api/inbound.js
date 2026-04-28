/**
 * inbound.js — BE 연동 (WHS-005/007/008 창고 관리자 입고)
 *
 * BE 엔드포인트:
 *   GET    /api/warehouse/inbound?status=&warehouseId=&from=&to=    (입고 예정/완료 목록)
 *   GET    /api/warehouse/inbound/{code}                            (상세 — items + statusHistory)
 *   POST   /api/warehouse/inbound/{code}/confirm                    (입고 확정 SHIPPING → COMPLETED)
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출, 실패 시 throw.
 *
 * 단일 진실 원천(ADR-015) 정책 — list/detail 은 현재 `purchaseOrder` store 의 SHIPPING/COMPLETED
 * 발주를 그대로 활용하므로 store 에서 직접 호출하지 않을 수도 있음. confirm 만 핵심 사용처.
 * 인증 도입(ADR-011) 전 임시: warehouseId 는 query 파라미터로 받음 (FE 가 auth.user.storeId 전달).
 */

import { apiClient, unwrap } from './axios.js'

const BASE = '/api/warehouse/inbound'

export const inboundApi = {
  /**
   * 입고 목록 조회.
   * @param {{status?: 'SHIPPING'|'COMPLETED', warehouseId?: string, from?: string, to?: string}} params
   */
  list: (params = {}) => {
    const query = {}
    if (params.status) query.status = params.status
    if (params.warehouseId) query.warehouseId = params.warehouseId
    if (params.from) query.from = params.from
    if (params.to) query.to = params.to
    return apiClient.get(BASE, { params: query }).then(unwrap)
  },

  /** 상세 조회 (items + statusHistory 포함) */
  detail: (code) => apiClient.get(`${BASE}/${code}`).then(unwrap),

  /** 입고 확정 (SHIPPING → COMPLETED, WHS-007) */
  confirm: (code) => apiClient.post(`${BASE}/${code}/confirm`).then(unwrap),
}
