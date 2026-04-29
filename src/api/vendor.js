/**
 * vendor.js — BE 연동 (CEN-027~031, 033)
 *
 * BE 엔드포인트:
 *   GET    /api/vendors                            (목록, 등록은 SQL 직접)
 *   GET    /api/vendors/{code}
 *   GET    /api/vendors/{code}/contracts            (E 안 — ProductMaster 매칭 + VendorProduct join)
 *   GET    /api/vendor-products?vendorCode=...     (CEN-031, 특정 거래처)
 *   GET    /api/vendor-products?status=...         (CEN-035 발주 카탈로그, 전체 거래처)
 *   GET    /api/vendor-products/{code}             (CEN-033)
 *   POST   /api/vendor-products                    (CEN-027)
 *   PATCH  /api/vendor-products/{code}             (CEN-028)
 *   PATCH  /api/vendor-products/{code}/status      (CEN-029)
 *   DELETE /api/vendor-products/{code}             (CEN-030, SOFT DELETE)
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출, 실패 시 throw.
 */

import { apiClient, unwrap } from './axios.js'

export const vendorApi = {
  // ─── 거래처 (read-only) ──────────────────────────────────────────────────
  listVendors: () => apiClient.get('/api/vendors').then(unwrap),
  getVendor: (code) => apiClient.get(`/api/vendors/${code}`).then(unwrap),

  /**
   * 거래처 계약 표 (E 안) — mainVendorCode 매칭 ProductMaster 행 + VendorProduct join.
   * 응답: ContractRow[] = { productCode, productName, categoryCode, basePrice,
   *   vendorProductCode|null, contractUnitPrice|null, moq|null, leadTimeDays|null,
   *   contractStart|null, contractEnd|null, status|null, contracted: boolean }
   */
  getContracts: (vendorCode) =>
    apiClient.get(`/api/vendors/${vendorCode}/contracts`).then(unwrap),

  // ─── 거래처별 계약 제품 ─────────────────────────────────────────────────
  listVendorProducts: (vendorCode) =>
    apiClient.get('/api/vendor-products', { params: { vendorCode } }).then(unwrap),

  /**
   * 전체 거래처 제품 일괄 조회 (CEN-035 발주 작성 카탈로그용).
   * @param {'ACTIVE'|'SUSPENDED'|'EXPIRED'|'DELETED'} [status] — 생략 시 DELETED 제외 전체
   */
  listAllVendorProducts: (status) =>
    apiClient
      .get('/api/vendor-products', { params: status ? { status } : {} })
      .then(unwrap),

  getVendorProduct: (code) => apiClient.get(`/api/vendor-products/${code}`).then(unwrap),

  /**
   * 등록 (CEN-027). productName 은 BE 가 ProductMaster.name 자동 복사 — 요청에 포함하지 마라.
   * @param {{vendorCode, productCode, unitPrice, moq, leadTimeDays, contractStart, contractEnd}} req
   */
  createVendorProduct: (req) => apiClient.post('/api/vendor-products', req).then(unwrap),

  /**
   * 수정 (CEN-028). productName 폐기 — ProductMaster 가 진실 원천이라 VendorProduct 측 변경 액션 없음.
   * @param {string} code
   * @param {{unitPrice, moq, leadTimeDays, contractStart, contractEnd}} req
   */
  updateVendorProduct: (code, req) =>
    apiClient.patch(`/api/vendor-products/${code}`, req).then(unwrap),

  /**
   * 상태 변경 (CEN-029)
   * @param {string} code
   * @param {'ACTIVE'|'SUSPENDED'|'EXPIRED'} status — BE enum 대문자
   */
  updateVendorProductStatus: (code, status) =>
    apiClient.patch(`/api/vendor-products/${code}/status`, { status }).then(unwrap),

  /** 삭제 (CEN-030, SOFT DELETE) */
  deleteVendorProduct: (code) => apiClient.delete(`/api/vendor-products/${code}`).then(unwrap),
}
