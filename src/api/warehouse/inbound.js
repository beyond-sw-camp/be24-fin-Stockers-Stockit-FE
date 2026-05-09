/**
 * inbound.js — BE 연동 (WHS-005/007/008 창고 관리자 입고)
 *
 * BE 엔드포인트:
 *   GET    /api/warehouse/inbound?status=&from=&to=    (입고 후보 목록 — READY_TO_SHIP/IN_TRANSIT/ARRIVED/COMPLETED 4상태)
 *   GET    /api/warehouse/inbound/{code}               (상세 — items + statusHistory)
 *   POST   /api/warehouse/inbound/{code}/confirm       (입고 확정 ARRIVED → COMPLETED)
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출, 실패 시 throw.
 *
 * 단일 진실 원천(ADR-015) — BE InboundService 가 PurchaseOrder + statusHistory 를 그대로 활용.
 * 자기 창고 데이터 격리는 BE 가 @AuthenticationPrincipal 의 locationCode 로 자동 처리 —
 * FE 는 warehouseId 박지 않음.
 */

import { apiClient, unwrap } from '../axios.js'

const BASE = '/api/warehouse/inbound'

export const inboundApi = {
  /**
   * 입고 후보 목록 조회.
   * @param {{status?: 'READY_TO_SHIP'|'IN_TRANSIT'|'ARRIVED'|'COMPLETED', from?: string, to?: string}} params
   */
  list: (params = {}) => {
    const query = {}
    if (params.status) query.status = params.status
    if (params.from) query.from = params.from
    if (params.to) query.to = params.to
    return apiClient.get(BASE, { params: query }).then(unwrap)
  },

  /** 상세 조회 (items + statusHistory 포함) */
  detail: (code) => apiClient.get(`${BASE}/${code}`).then(unwrap),

  /** 입고 확정 (ARRIVED → COMPLETED, WHS-007) */
  confirm: (code) => apiClient.post(`${BASE}/${code}/confirm`).then(unwrap),
}
