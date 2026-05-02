/**
 * purchaseOrder.js — BE 연동 (CEN-035~040 + SYS-001)
 *
 * BE 엔드포인트:
 *   GET    /api/hq/purchase-orders?vendorCode=&status=&from=&to=    (목록, 모든 필터 optional)
 *   GET    /api/hq/purchase-orders/{code}                            (상세 — items + statusHistory 포함)
 *   POST   /api/hq/purchase-orders                                   (CEN-035 신규 발주)
 *   PATCH  /api/hq/purchase-orders/{code}                            (CEN-037 수정 — PENDING 만)
 *   POST   /api/hq/purchase-orders/{code}/complete                   (SHIPPING → COMPLETED, 창고 WHS-007)
 *   POST   /api/hq/purchase-orders/{code}/cancel                     (CEN-038 PENDING → REJECTED, with cancelReason)
 *   POST   /api/hq/purchase-orders/batch/run                         (SYS-001 강제 트리거, 시연·QA용)
 *
 * SYS-001 자동화: PENDING → APPROVED, APPROVED → SHIPPING 두 단계는 5분 주기 배치가
 *   30분 경과한 발주를 자동 전환. 본사는 작성·취소만, 단건 수동 트리거 엔드포인트 없음.
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

  /** 입고 확정 (SHIPPING → COMPLETED, 창고 WHS-007) */
  complete: (code) => apiClient.post(`${BASE}/${code}/complete`).then(unwrap),

  /**
   * SYS-001 강제 트리거 — 시연·QA·장애 대응용.
   * 30분 대기 조건을 무시하고 PENDING/APPROVED 모두 즉시 다음 단계로 자동 전환.
   * @returns {Promise<{approved: number, shipping: number}>}
   */
  runBatch: () => apiClient.post(`${BASE}/batch/run`).then(unwrap),

  /**
   * 취소 (CEN-038, PENDING → REJECTED)
   * @param {string} code
   * @param {string} cancelReason — 필수 (BE 가 빈 문자열이면 거절)
   */
  cancel: (code, cancelReason) =>
    apiClient.post(`${BASE}/${code}/cancel`, { cancelReason }).then(unwrap),

  /**
   * 새 발주 페이지 카탈로그 — vendor_product → ProductMaster → ProductSku 묶음 응답.
   * GET /api/hq/purchase-orders/catalog?vendorCode=&warehouseId=
   *
   * vendorCode 미지정: 모든 ACTIVE 거래처 펼침. 지정 시 그 거래처만.
   * warehouseCode 는 본 사이클 BE 가 사용하지 않음 (인벤토리 합류 후 stock 필터링용).
   * 응답: { masters: [{ vendorCode, vendorName, vendorProductCode, productCode, productName,
   *                     contractUnitPrice, minSkuUnitPrice, maxSkuUnitPrice,
   *                     skus: [{ skuCode, color, size, displayOption, unitPrice }] }],
   *         optionFacets: [{ name, values: [string] }] }
   */
  getCatalog: ({ vendorCode = '', warehouseCode = '' } = {}) => {
    const query = {}
    if (vendorCode) query.vendorCode = vendorCode
    // warehouseCode 는 BE 가 warehouseId(Long) 로 받지만 본 사이클은 placeholder — 보내지 않음
    void warehouseCode
    return apiClient.get(`${BASE}/catalog`, { params: query }).then(unwrap)
  },
}
