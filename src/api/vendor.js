/**
 * vendor.js — BE 연동 (CEN-027~031, 033)
 *
 * BE 엔드포인트:
 *   GET    /api/vendors                            (목록, 등록은 SQL 직접)
 *   GET    /api/vendors/{code}
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
   * 등록 (CEN-027)
   * @param {{vendorCode, productCode, productName, unitPrice, moq, leadTimeDays, contractStart, contractEnd}} req
   */
  createVendorProduct: (req) => apiClient.post('/api/vendor-products', req).then(unwrap),

  /**
   * 수정 (CEN-028)
   * @param {string} code
   * @param {{productName, unitPrice, moq, leadTimeDays, contractStart, contractEnd}} req
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
