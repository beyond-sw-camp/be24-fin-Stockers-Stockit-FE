/**
 * purchaseOrder.js — BE 연동 (CEN-035~040)
 *
 * BE 엔드포인트:
 *   GET    /api/hq/purchase-orders?vendorCode=&status=&from=&to=    (목록, 모든 필터 optional)
 *   GET    /api/hq/purchase-orders/{code}                            (상세 — items + statusHistory 포함)
 *   POST   /api/hq/purchase-orders                                   (CEN-035 신규 발주)
 *   PATCH  /api/hq/purchase-orders/{code}                            (CEN-037 수정 — PENDING 만)
 *   POST   /api/hq/purchase-orders/{code}/approve                    (PENDING → APPROVED, 거래처 승인 대리)
 *   POST   /api/hq/purchase-orders/{code}/start-shipping             (APPROVED → SHIPPING, 거래처 출고 시작 대리)
 *   POST   /api/hq/purchase-orders/{code}/complete                   (SHIPPING → COMPLETED, 창고 WHS-007)
 *   POST   /api/hq/purchase-orders/{code}/cancel                     (CEN-038 PENDING → REJECTED, with cancelReason)
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출, 실패 시 throw.
 */

import { apiClient, unwrap } from './axios.js'

const BASE = '/api/hq/purchase-orders'

export const purchaseOrderApi = {
  /**
   * 목록 조회. 모든 필터 optional. server-side 필터 미사용 시 인자 없이 호출.
   * @param {{vendorCode?: string, status?: string, from?: string, to?: string}} params
   */
  list: (params = {}) => {
    const query = {}
    if (params.vendorCode) query.vendorCode = params.vendorCode
    if (params.status) query.status = params.status
    if (params.from) query.from = params.from
    if (params.to) query.to = params.to
    return apiClient.get(BASE, { params: query }).then(unwrap)
  },

  /** 상세 조회 (items + statusHistory 포함) */
  detail: (code) => apiClient.get(`${BASE}/${code}`).then(unwrap),

  /**
   * 신규 발주 (CEN-035, 036)
   * @param {{vendorCode, warehouseId, warehouseName, memberId?, memberName?, items: [{vendorProductCode, quantity}]}} req
   */
  create: (req) => apiClient.post(BASE, req).then(unwrap),

  /**
   * 수정 (CEN-037, PENDING 만)
   * @param {string} code
   * @param {{warehouseId?, warehouseName?, items: [{vendorProductCode, quantity}]}} req
   */
  update: (code, req) => apiClient.patch(`${BASE}/${code}`, req).then(unwrap),

  /** 거래처 승인 대리 (PENDING → APPROVED) */
  approve: (code) => apiClient.post(`${BASE}/${code}/approve`).then(unwrap),

  /** 거래처 출고 시작 대리 (APPROVED → SHIPPING) */
  startShipping: (code) => apiClient.post(`${BASE}/${code}/start-shipping`).then(unwrap),

  /** 입고 확정 (SHIPPING → COMPLETED, 창고 WHS-007) */
  complete: (code) => apiClient.post(`${BASE}/${code}/complete`).then(unwrap),

  /**
   * 취소 (CEN-038, PENDING → REJECTED)
   * @param {string} code
   * @param {string} cancelReason — 필수 (BE 가 빈 문자열이면 거절)
   */
  cancel: (code, cancelReason) =>
    apiClient.post(`${BASE}/${code}/cancel`, { cancelReason }).then(unwrap),
}
