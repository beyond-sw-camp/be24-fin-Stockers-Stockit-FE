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
 *   GET    /api/hq/purchase-orders/catalog?...&page&size&sort        (새 발주 카탈로그 페이지)
 *   GET    /api/hq/purchase-orders/catalog/facets?vendorCode=&keyword= (색상/사이즈 facet)
 *
 * SYS-001 자동화: PENDING → APPROVED, APPROVED → SHIPPING 두 단계는 5분 주기 배치가
 *   30분 경과한 발주를 자동 전환. 본사는 작성·취소만, 단건 수동 트리거 엔드포인트 없음.
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출, 실패 시 throw.
 */

import { apiClient, unwrap } from '../axios.js'

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
   * 멀티 공급처 장바구니 → 공급처별 자동 분할 발주 N건 생성 (atomic).
   * BE 가 vendorProductCode → Vendor 자동 매핑으로 vendor 그룹핑 → 단일 트랜잭션 안에 PO N건 생성.
   * 1건이라도 실패하면 N건 모두 롤백, FE 카트는 보존.
   * @param {{warehouseCode, memberId?, memberName?, items: [{vendorProductCode, skuCode, quantity}]}} req
   * @returns {Promise<{orders: object[], vendorCount: number, itemCount: number, totalAmount: number}>}
   */
  createBatch: (req) => apiClient.post(`${BASE}/batch`, req).then(unwrap),

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
   * 새 발주 페이지 카탈로그 — BE Page<SkuRowRes> 평탄 row.
   * GET /api/hq/purchase-orders/catalog?page&size&sort&vendorCode&keyword&color&skuSize&shortageOnly&warehouseId
   *
   * 응답: Page<{ vendorCode, vendorName, vendorProductCode, productCode, productName,
   *              skuCode, color, size, displayOption, unitPrice, contractUnitPrice, availableQty }>
   *
   * @param {{page?, size?, sort?, vendorCode?, keyword?, color?, skuSize?, shortageOnly?, warehouseId?}} params
   *   - sort: "vendorName,asc" / "productName,asc" / "unitPrice,asc|desc" / "availableQty,asc" / "id,asc"
   *   - SKU 사이즈 필터 키는 page size 와 충돌 회피 위해 caller/server 모두 `skuSize`.
   */
  getCatalog: (params = {}) => {
    const query = {}
    if (params.page !== undefined && params.page !== null) query.page = params.page
    if (params.size !== undefined && params.size !== null) query.size = params.size
    if (params.sort) query.sort = params.sort
    if (params.vendorCode) query.vendorCode = params.vendorCode
    if (params.keyword) query.keyword = params.keyword
    if (params.color) query.color = params.color
    if (params.skuSize) query.skuSize = params.skuSize
    if (params.shortageOnly) query.shortageOnly = params.shortageOnly
    if (params.warehouseId) query.warehouseId = params.warehouseId
    return apiClient.get(`${BASE}/catalog`, { params: query }).then(unwrap)
  },

  /**
   * 새 발주 카탈로그 facet — 같은 필터 조건의 색상/사이즈 distinct 옵션.
   * GET /api/hq/purchase-orders/catalog/facets?vendorCode=&keyword=
   * 응답: { colors: [string], sizes: [string] }
   */
  getCatalogFacets: ({ vendorCode = '', keyword = '' } = {}) => {
    const query = {}
    if (vendorCode) query.vendorCode = vendorCode
    if (keyword) query.keyword = keyword
    return apiClient.get(`${BASE}/catalog/facets`, { params: query }).then(unwrap)
  },
}
